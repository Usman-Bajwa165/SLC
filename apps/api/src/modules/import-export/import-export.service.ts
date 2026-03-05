import { Injectable, BadRequestException } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { Decimal } from "decimal.js";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

@Injectable()
export class ImportExportService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ── IMPORT STUDENTS ─────────────────────────────────────────────────────────
  async importStudents(csvBuffer: Buffer, dryRun = true) {
    const records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const errors: ImportError[] = [];
    const valid: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // header is row 1
      const rowErrors: ImportError[] = [];

      // Required field validation
      if (!row.registrationNo)
        rowErrors.push({
          row: rowNum,
          field: "registrationNo",
          message: "Required",
        });
      if (!row.name)
        rowErrors.push({ row: rowNum, field: "name", message: "Required" });
      if (!row.parentGuardian)
        rowErrors.push({
          row: rowNum,
          field: "parentGuardian",
          message: "Required",
        });
      if (!row.cnic)
        rowErrors.push({ row: rowNum, field: "cnic", message: "Required" });
      if (!row.departmentCode)
        rowErrors.push({
          row: rowNum,
          field: "departmentCode",
          message: "Required",
        });
      if (
        !row.programMode ||
        !["semester", "annual"].includes(row.programMode)
      ) {
        rowErrors.push({
          row: rowNum,
          field: "programMode",
          message: 'Must be "semester" or "annual"',
        });
      }

      // CNIC validation
      const cnic = row.cnic?.replace(/\D/g, "");
      if (cnic && cnic.length !== 13) {
        rowErrors.push({
          row: rowNum,
          field: "cnic",
          message: "CNIC must be 13 digits after normalisation",
        });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      // Department lookup
      const dept = await this.prisma.department.findFirst({
        where: { code: row.departmentCode, isDeleted: false },
      });
      if (!dept) {
        errors.push({
          row: rowNum,
          field: "departmentCode",
          message: `Department code '${row.departmentCode}' not found`,
        });
        continue;
      }

      // Session lookup (optional)
      let sessionId: number | null = null;
      if (row.sessionLabel) {
        const session = await this.prisma.session.findFirst({
          where: { label: row.sessionLabel, departmentId: dept.id },
        });
        if (!session) {
          errors.push({
            row: rowNum,
            field: "sessionLabel",
            message: `Session '${row.sessionLabel}' not found in department`,
          });
          continue;
        }
        sessionId = session.id;
      }

      // Duplicate check
      const existing = await this.prisma.student.findFirst({
        where: { registrationNo: row.registrationNo },
      });
      if (existing) {
        errors.push({
          row: rowNum,
          field: "registrationNo",
          message: `Registration number '${row.registrationNo}' already exists`,
        });
        continue;
      }

      valid.push({
        registrationNo: row.registrationNo,
        name: row.name,
        parentGuardian: row.parentGuardian,
        cnic,
        rollNo: row.rollNo || null,
        departmentId: dept.id,
        sessionId,
        programMode: row.programMode,
        currentSemester: row.currentSemester
          ? parseInt(row.currentSemester)
          : null,
        enrolledAt: row.enrolledAt ? new Date(row.enrolledAt) : new Date(),
        cgpa: row.cgpa ? parseFloat(row.cgpa) : null,
      });
    }

    if (dryRun) {
      return {
        dryRun: true,
        total: records.length,
        valid: valid.length,
        errorCount: errors.length,
        errors,
      };
    }

    // Actual import
    let imported = 0;
    for (const studentData of valid) {
      await this.prisma.student.create({ data: studentData });
      imported++;
    }

    await this.audit.log("import", null, "import", null, {
      type: "students",
      imported,
    });
    return {
      dryRun: false,
      total: records.length,
      imported,
      errorCount: errors.length,
      errors,
    };
  }

  // ── IMPORT PAYMENTS ─────────────────────────────────────────────────────────
  async importPayments(csvBuffer: Buffer, dryRun = true) {
    const records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const errors: ImportError[] = [];
    const valid: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.registrationNo) {
        errors.push({
          row: rowNum,
          field: "registrationNo",
          message: "Required",
        });
        continue;
      }
      if (!row.date) {
        errors.push({
          row: rowNum,
          field: "date",
          message: "Required (YYYY-MM-DD)",
        });
        continue;
      }
      if (
        !row.amount ||
        isNaN(parseFloat(row.amount)) ||
        parseFloat(row.amount) <= 0
      ) {
        errors.push({
          row: rowNum,
          field: "amount",
          message: "Must be a positive number",
        });
        continue;
      }
      if (!row.methodName) {
        errors.push({ row: rowNum, field: "methodName", message: "Required" });
        continue;
      }

      const student = await this.prisma.student.findFirst({
        where: { registrationNo: row.registrationNo, isDeleted: false },
      });
      if (!student) {
        errors.push({
          row: rowNum,
          field: "registrationNo",
          message: `Student '${row.registrationNo}' not found`,
        });
        continue;
      }

      const method = await this.prisma.paymentMethod.findFirst({
        where: { name: row.methodName },
      });
      if (!method) {
        errors.push({
          row: rowNum,
          field: "methodName",
          message: `Payment method '${row.methodName}' not found`,
        });
        continue;
      }

      let accountId: number | null = null;
      if (row.accountLabel) {
        const account = await this.prisma.account.findFirst({
          where: { label: row.accountLabel },
        });
        if (!account) {
          errors.push({
            row: rowNum,
            field: "accountLabel",
            message: `Account '${row.accountLabel}' not found`,
          });
          continue;
        }
        accountId = account.id;
      }

      valid.push({
        studentId: student.id,
        amount: row.amount,
        methodId: method.id,
        accountId,
        date: new Date(row.date),
        notes: row.notes || null,
      });
    }

    if (dryRun) {
      return {
        dryRun: true,
        total: records.length,
        valid: valid.length,
        errorCount: errors.length,
        errors,
      };
    }

    let imported = 0;
    for (const p of valid) {
      const receiptNo = await this.prisma.nextReceiptNo();
      await this.prisma.payment.create({ data: { ...p, receiptNo } });
      imported++;
    }
    await this.audit.log("import", null, "import", null, {
      type: "payments",
      imported,
    });
    return {
      dryRun: false,
      total: records.length,
      imported,
      errorCount: errors.length,
      errors,
    };
  }

  // ── EXPORT STUDENTS ─────────────────────────────────────────────────────────
  async exportStudents(departmentId?: number) {
    const students = await this.prisma.student.findMany({
      where: { isDeleted: false, ...(departmentId && { departmentId }) },
      include: { department: true, session: true },
      orderBy: { registrationNo: "asc" },
    });
    const rows = students.map((s) => ({
      registrationNo: s.registrationNo,
      name: s.name,
      parentGuardian: s.parentGuardian,
      cnic: s.cnic,
      rollNo: s.rollNo || "",
      departmentCode: s.department.code,
      sessionLabel: s.session?.label || "",
      programMode: s.programMode,
      currentSemester: s.currentSemester || "",
      enrolledAt: s.enrolledAt?.toISOString().split("T")[0] || "",
      cgpa: s.cgpa || "",
      status: s.status,
    }));
    return stringify(rows, { header: true });
  }

  // ── EXPORT PAYMENTS ─────────────────────────────────────────────────────────
  async exportPayments(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to + "T23:59:59Z");
    }
    const payments = await this.prisma.payment.findMany({
      where,
      include: { student: true, method: true, account: true },
      orderBy: { date: "asc" },
    });
    const rows = payments.map((p) => ({
      receiptNo: p.receiptNo,
      registrationNo: p.student.registrationNo,
      date: p.date.toISOString().split("T")[0],
      amount: p.amount.toString(),
      methodName: p.method.name,
      accountLabel: p.account?.label || "",
      notes: p.notes || "",
    }));
    return stringify(rows, { header: true });
  }

  // ── CSV TEMPLATES ────────────────────────────────────────────────────────────
  getStudentTemplate(): string {
    return stringify([
      [
        "registrationNo",
        "name",
        "parentGuardian",
        "cnic",
        "rollNo",
        "departmentCode",
        "sessionLabel",
        "programMode",
        "currentSemester",
        "enrolledAt",
        "cgpa",
      ],
      [
        "REG-001",
        "Ali Khan",
        "Ahmed Khan",
        "4210123456789",
        "R-101",
        "LAW-UG",
        "2024-2026",
        "semester",
        "2",
        "2024-09-01",
        "3.12",
      ],
    ]);
  }

  getPaymentTemplate(): string {
    return stringify([
      [
        "receiptNo",
        "registrationNo",
        "date",
        "amount",
        "methodName",
        "accountLabel",
        "notes",
      ],
      [
        "SLC-2026-00001",
        "REG-001",
        "2026-01-15",
        "12500.00",
        "Bank",
        "UBL - Main Account",
        "Sem 2 fee",
      ],
    ]);
  }
}
