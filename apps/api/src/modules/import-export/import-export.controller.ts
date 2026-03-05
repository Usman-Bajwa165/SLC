import {
  Controller, Post, Get, Query, UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';

@Controller()
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  @Post('import/students')
  @UseInterceptors(FileInterceptor('file'))
  importStudents(
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun = 'true',
  ) {
    return this.service.importStudents(file.buffer, dryRun !== 'false');
  }

  @Post('import/payments')
  @UseInterceptors(FileInterceptor('file'))
  importPayments(
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun = 'true',
  ) {
    return this.service.importPayments(file.buffer, dryRun !== 'false');
  }

  @Get('export/students')
  async exportStudents(@Res() res: Response, @Query('department') dept?: string) {
    const csv = await this.service.exportStudents(dept ? parseInt(dept) : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('export/payments')
  async exportPayments(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.service.exportPayments(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('templates/students')
  async studentTemplate(@Res() res: Response) {
    const csv = this.service.getStudentTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students-template.csv"');
    res.send(csv);
  }

  @Get('templates/payments')
  async paymentTemplate(@Res() res: Response) {
    const csv = this.service.getPaymentTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments-template.csv"');
    res.send(csv);
  }
}
