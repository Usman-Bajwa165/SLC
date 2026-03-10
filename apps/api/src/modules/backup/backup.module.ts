import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WhatsappModule,
  ],
  providers: [BackupService, PdfGeneratorService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
