import { Controller, Get, Query, Param, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { stringify } from 'csv-stringify/sync';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboardSummary();
  }

  @Get('outstanding')
  outstanding(
    @Query('department') department?: string,
    @Query('session') session?: string,
  ) {
    return this.service.outstanding(
      department ? parseInt(department) : undefined,
      session ? parseInt(session) : undefined,
    );
  }

  @Get('daily-receipts')
  dailyReceipts(@Query('date') date?: string) {
    const d = date || new Date().toISOString().split('T')[0];
    return this.service.dailyReceipts(d);
  }

  @Get('student-ledger')
  studentLedger(@Query('studentId') studentId: string) {
    return this.service.studentLedger(parseInt(studentId));
  }

  @Get('advance-summary')
  advanceSummary(@Query('department') department?: string) {
    return this.service.advanceSummary(department ? parseInt(department) : undefined);
  }

  // ── CSV Exports ─────────────────────────────────────────────────────────────

  @Get('outstanding/export')
  async exportOutstanding(@Res() res: Response, @Query('department') dept?: string) {
    const report = await this.service.outstanding(dept ? parseInt(dept) : undefined);
    const csv = stringify(report.rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="outstanding-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('daily-receipts/export')
  async exportDailyReceipts(@Res() res: Response, @Query('date') date?: string) {
    const d = date || new Date().toISOString().split('T')[0];
    const report = await this.service.dailyReceipts(d);
    const rows = report.payments.map((p: any) => ({
      receiptNo: p.receiptNo,
      date: p.date,
      studentName: p.student.name,
      registrationNo: p.student.registrationNo,
      amount: p.amount,
      method: p.method.name,
      account: p.account?.label || '',
      notes: p.notes || '',
    }));
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="receipts-${d}.csv"`);
    res.send(csv);
  }
}
