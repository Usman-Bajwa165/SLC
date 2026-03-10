import { Controller, Get, Post } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  getBackupInfo() {
    return this.backupService.getBackupInfo();
  }

  @Post('trigger')
  async triggerBackup() {
    return this.backupService.runFullBackupSequence(true);
  }
}
