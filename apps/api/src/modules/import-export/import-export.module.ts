import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';

@Module({
  imports: [MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } })],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
