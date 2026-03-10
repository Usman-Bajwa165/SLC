import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './common/prisma/prisma.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StudentsModule } from './modules/students/students.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './common/storage/storage.module';
import { StaffModule } from './modules/staff/staff.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { BackupModule } from './modules/backup/backup.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    StorageModule,
    AuditModule,
    DepartmentsModule,
    SessionsModule,
    StudentsModule,
    StaffModule,
    FinanceModule,
    PaymentsModule,
    AccountsModule,
    ReportsModule,
    ImportExportModule,
    WhatsappModule,
    BackupModule,
  ],
})
export class AppModule {}
