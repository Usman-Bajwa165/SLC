import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PdfGeneratorService } from './pdf-generator.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private backupDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {
    // Determine the Docs/Home directory robustly for Windows/Mac
    const homeDir = os.homedir();
    const docsDir = path.join(homeDir, 'Documents');
    
    // Try Documents first, fallback to Home
    if (fs.existsSync(docsDir)) {
      this.backupDir = path.join(docsDir, 'SLC');
    } else {
      this.backupDir = path.join(homeDir, 'SLC');
    }
  }

  async onModuleInit() {
    this.ensureBackupFolder();
    await this.checkMissedBackup();
  }

  private ensureBackupFolder() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory at: ${this.backupDir}`);
    }
  }

  /**
   * Checks if the daily backup was missed (i.e. app was off at midnight).
   * It checks the modified date of the primary slc_db.sql file.
   */
  private async checkMissedBackup() {
    const primarySqlPath = path.join(this.backupDir, 'slc_db.sql');
    if (!fs.existsSync(primarySqlPath)) {
      this.logger.log('No existing backup found. Running initial backup now...');
      await this.runFullBackupSequence(false); // First time
      return;
    }

    const stats = fs.statSync(primarySqlPath);
    const lastModDate = new Date(stats.mtime);
    const today = new Date();
    
    // Check if it was modified today
    const isSameDay = 
      lastModDate.getDate() === today.getDate() &&
      lastModDate.getMonth() === today.getMonth() &&
      lastModDate.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      this.logger.log('Missed midnight backup detected. Running catch-up backup now...');
      await this.runFullBackupSequence(true);
    } else {
      this.logger.log('Daily backup is already up to date.');
    }
  }

  /**
   * Runs exactly at Midnight every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMidnightBackup() {
    this.logger.log('Executing midnight CRON backup...');
    await this.runFullBackupSequence(true);
  }

  /**
   * Main backup sequence orchestrator
   * Each step runs independently — failure of one won't block the others.
   */
  async runFullBackupSequence(notify: boolean = true) {
    const results: { sql?: string; pdf?: string; errors: string[] } = { errors: [] };
    
    try {
      this.ensureBackupFolder();
      
      const isFirstOfMonth = new Date().getDate() === 1;
      const dbUrl = process.env.DATABASE_URL || 'postgresql://slc_user:slc_pass@localhost:5432/slc_db';
      
      // 1. Generate SQL Backup — runs independently
      try {
        const sqlPath = await this.generateSqlBackup(dbUrl, 'slc_db.sql');
        results.sql = sqlPath;
        if (isFirstOfMonth) {
          const monthName = new Date().toLocaleString('default', { month: 'long' });
          const year = new Date().getFullYear();
          fs.copyFileSync(sqlPath, path.join(this.backupDir, `slc_${monthName}-${year}_db.sql`));
        }
      } catch (e) {
        this.logger.error('SQL backup step failed (PDF will still run):', e);
        results.errors.push('SQL: ' + e.message);
      }

      // 2. Generate PDF Report — runs independently
      try {
        const pdfPath = await this.generatePdfReport('slc.pdf');
        results.pdf = pdfPath;
        if (isFirstOfMonth) {
          const monthName = new Date().toLocaleString('default', { month: 'long' });
          const year = new Date().getFullYear();
          fs.copyFileSync(pdfPath, path.join(this.backupDir, `slc_${monthName}-${year}.pdf`));
        }
      } catch (e) {
        this.logger.error('PDF backup step failed:', e);
        results.errors.push('PDF: ' + e.message);
      }

      // 3. Send to WhatsApp if connected and at least one file was generated
      if (notify) {
        const files = [results.sql, results.pdf].filter((f): f is string => !!f && fs.existsSync(f));
        await this.sendBackupNotifications(files);
      }

      this.logger.log(`Backup sequence done. SQL: ${results.sql ? 'OK' : 'FAILED'}, PDF: ${results.pdf ? 'OK' : 'FAILED'}`);
      return { success: results.errors.length === 0, folder: this.backupDir, errors: results.errors };
    } catch (e) {
      this.logger.error('Backup sequence completely failed', e);
      return { success: false, error: e.message };
    }
  }

  private async generateSqlBackup(dbUrl: string, filename: string): Promise<string> {
    const outputPath = path.join(this.backupDir, filename);
    
    // Try pg_dump first (captures stdout — avoids shell redirect issues on Windows)
    try {
      const { stdout, stderr } = await execAsync(`pg_dump "${dbUrl}"`, { maxBuffer: 100 * 1024 * 1024 });
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      if (!stdout || stdout.trim().length < 10) {
        throw new Error('pg_dump produced empty output');
      }
      fs.writeFileSync(outputPath, stdout, 'utf8');
      this.logger.log(`pg_dump SQL backup saved at ${outputPath} (${(stdout.length / 1024).toFixed(1)} KB)`);
      return outputPath;
    } catch (pgDumpError) {
      this.logger.warn(`pg_dump failed or unavailable: ${pgDumpError.message}. Falling back to Prisma JSON export.`);
    }

    // Fallback: Prisma-based SQL INSERT export — fully restorable via Adminer
    try {
      const [
        departments, sessions, feeStructures, students, studentFinances,
        paymentMethods, accounts, payments, paymentAllocations,
        otherTransactions, staff, staffFinances, staffPayments, staffSalaryHistory,
        whatsappSettings,
      ] = await Promise.all([
        this.prisma.department.findMany(),
        this.prisma.session.findMany(),
        this.prisma.feeStructure.findMany(),
        this.prisma.student.findMany(),
        this.prisma.studentFinance.findMany(),
        this.prisma.paymentMethod.findMany(),
        this.prisma.account.findMany(),
        this.prisma.payment.findMany(),
        this.prisma.paymentAllocation.findMany(),
        this.prisma.otherTransaction.findMany(),
        this.prisma.staff.findMany(),
        this.prisma.staffFinance.findMany(),
        this.prisma.staffPayment.findMany(),
        this.prisma.staffSalaryHistory.findMany(),
        this.prisma.whatsappSettings.findMany(),
      ]);

      const e = (v: any): string => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return String(v);
        if (v instanceof Date) return `'${v.toISOString()}'`;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      };

      const ins = (table: string, rows: any[], cols: string[]) => {
        if (!rows.length) return `-- No data in ${table}\n`;
        return rows.map(r =>
          `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${cols.map(c => e(r[c])).join(', ')}) ON CONFLICT DO NOTHING;`
        ).join('\n') + '\n';
      };

      const lines: string[] = [];
      lines.push(`-- ============================================================`);
      lines.push(`-- Stars Law College — Full Database Backup`);
      lines.push(`-- Generated: ${new Date().toISOString()}`);
      lines.push(`-- Restore: Open Adminer → Import → select this file → Execute`);
      lines.push(`-- ============================================================`);
      lines.push(`SET session_replication_role = replica; -- disable FK checks during import`);
      lines.push('');

      // Truncate all tables in reverse-dependency order
      const tables = [
        'payment_allocations','staff_salary_history','staff_payments','staff_finance',
        'other_transactions','payments','student_finance','fee_structures',
        'sessions','students','accounts','payment_methods','staff','departments','whatsapp_settings'
      ];
      lines.push('-- TRUNCATE all tables');
      lines.push(`TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`);
      lines.push('');

      lines.push('-- departments');
      lines.push(ins('departments', departments, ['id','name','code','description','offersSem','offersAnn','semsPerYear','yearsDuration','isDeleted','createdAt','updatedAt']));

      lines.push('-- sessions');
      lines.push(ins('sessions', sessions, ['id','departmentId','startYear','endYear','label','createdAt']));

      lines.push('-- fee_structures');
      lines.push(ins('fee_structures', feeStructures, ['id','departmentId','programMode','feeAmount','effectiveFrom','effectiveTo','createdAt']));

      lines.push('-- students');
      lines.push(ins('students', students, ['id','name','parentGuardian','cnic','contact','registrationNo','rollNo','departmentId','sessionId','programMode','currentSemester','enrolledAt','cgpa','sgpa','obtainedMarks','totalMarks','status','version','isDeleted','createdAt','updatedAt']));

      lines.push('-- student_finance');
      lines.push(ins('student_finance', studentFinances, ['id','studentId','termLabel','termType','feeDue','feePaid','advanceTaken','carryOver','remaining','isSnapshot','createdAt','updatedAt']));

      lines.push('-- payment_methods');
      lines.push(ins('payment_methods', paymentMethods, ['id','name','type','meta','isActive','createdAt']));

      lines.push('-- accounts');
      lines.push(ins('accounts', accounts, ['id','paymentMethodId','label','accountNumber','branch','currentBalance','openingBalance','isActive','createdAt','updatedAt']));

      lines.push('-- payments');
      lines.push(ins('payments', payments, ['id','studentId','amount','date','methodId','accountId','receiptNo','senderName','receiverName','notes','receiptPath','createdAt']));

      lines.push('-- payment_allocations');
      lines.push(ins('payment_allocations', paymentAllocations, ['id','paymentId','studentFinanceId','allocatedAmount','createdAt']));

      lines.push('-- other_transactions');
      lines.push(ins('other_transactions', otherTransactions, ['id','type','category','amount','date','accountId','notes','senderName','receiverName','createdAt']));

      lines.push('-- staff');
      lines.push(ins('staff', staff, ['id','name','cnic','contact','role','subject','address','joinedDate','salary','isActive','isDeleted','version','createdAt','updatedAt']));

      lines.push('-- staff_finance');
      lines.push(ins('staff_finance', staffFinances, ['id','staffId','month','salaryDue','salaryPaid','advanceTaken','loanTaken','remaining','createdAt','updatedAt']));

      lines.push('-- staff_payments');
      lines.push(ins('staff_payments', staffPayments, ['id','staffId','amount','date','type','month','methodId','accountId','payerName','receiverName','notes','createdAt']));

      lines.push('-- staff_salary_history');
      lines.push(ins('staff_salary_history', staffSalaryHistory, ['id','staffId','salary','effectiveMonth','createdAt']));

      lines.push('-- whatsapp_settings');
      lines.push(ins('whatsapp_settings', whatsappSettings, ['id','toNumber','notifyStudentPayments','notifyStaffPayments','notifyFinance','notifyAccounts','notifyEnrollment','notifyDeactivation','createdAt','updatedAt']));

      lines.push('SET session_replication_role = DEFAULT; -- re-enable FK checks');
      lines.push('-- Backup complete.');

      fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
      this.logger.log(`Prisma SQL INSERT backup saved at ${outputPath} — fully restorable via Adminer`);
      return outputPath;
    } catch (prismaError) {
      this.logger.error('Prisma SQL fallback failed:', prismaError);
      throw new Error('Both pg_dump and Prisma SQL export failed: ' + prismaError.message);
    }
  }

  private async generatePdfReport(filename: string): Promise<string> {
    const outputPath = path.join(this.backupDir, filename);
    // Delete existing file first to avoid Windows EBUSY resource lock
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch (_) {}
    }
    await this.pdfGenerator.generate(outputPath);
    return outputPath;
  }

  private async sendBackupNotifications(files: string[]) {
    const settings = await this.whatsapp.getSettings();
    if (settings && settings.toNumber && settings.toNumber.length > 5) {
      const dateStr = new Date().toLocaleDateString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const msg = `🚨 *SLC SYSTEM BACKUP*\n\nAutomated backup successfully completed on ${dateStr}.\nFiles are safely stored in your system's Documents folder. Sending copies now.`;
      await this.whatsapp.sendSystemNotification('backup', msg);

      for (const file of files) {
        if (fs.existsSync(file)) {
          await this.whatsapp.sendFile(settings.toNumber, file);
        }
      }
    }
  }

  // --- API Access Methods ---
  
  getBackupInfo() {
    this.ensureBackupFolder();
    const files = fs.readdirSync(this.backupDir).map(file => {
      const stats = fs.statSync(path.join(this.backupDir, file));
      return {
        name: file,
        size: stats.size,
        modifiedAt: stats.mtime,
      };
    }).sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return {
      folderPath: this.backupDir,
      files,
    };
  }
}
