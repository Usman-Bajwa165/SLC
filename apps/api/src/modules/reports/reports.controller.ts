import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ReportsService } from "./reports.service";
import { stringify } from "csv-stringify/sync";

@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get("dashboard")
  dashboard() {
    return this.service.dashboardSummary();
  }

  @Get("outstanding")
  outstanding(
    @Query("departmentId") departmentId?: string,
    @Query("sessionId") sessionId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    return this.service.outstanding({
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
      startDate,
      endDate,
      search,
    });
  }

  @Get("daily-receipts")
  dailyReceipts(
    @Query("date") date?: string,
    @Query("methodId") methodId?: string,
    @Query("accountId") accountId?: string,
    @Query("departmentId") departmentId?: string,
    @Query("sessionId") sessionId?: string,
  ) {
    return this.service.dailyReceipts({
      date,
      methodId: methodId ? parseInt(methodId) : undefined,
      accountId: accountId ? parseInt(accountId) : undefined,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
    });
  }

  @Get("student-ledger/:id")
  studentLedger(
    @Param("id", ParseIntPipe) id: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.studentLedger(id, from, to);
  }

  @Get("account-ledger/:id")
  accountLedger(
    @Param("id", ParseIntPipe) id: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("type") type?: string,
  ) {
    return this.service.accountLedger(id, from, to, type);
  }

  @Get("staff-ledger/:id")
  staffLedger(
    @Param("id", ParseIntPipe) id: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.staffLedger(id, from, to);
  }

  // ── CSV Exports ─────────────────────────────────────────────────────────────

  @Get("outstanding/export")
  async exportOutstanding(
    @Res() res: Response,
    @Query("departmentId") deptId?: string,
    @Query("sessionId") sessionId?: string,
  ) {
    const report = await this.service.outstanding({
      departmentId: deptId ? parseInt(deptId) : undefined,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
    });
    const csv = stringify(report.rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="outstanding-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Get("daily-receipts/export")
  async exportDailyReceipts(
    @Res() res: Response,
    @Query("date") date?: string,
    @Query("methodId") methodId?: string,
    @Query("accountId") accountId?: string,
    @Query("departmentId") departmentId?: string,
    @Query("sessionId") sessionId?: string,
  ) {
    const d = date || new Date().toISOString().split("T")[0];
    const report = await this.service.dailyReceipts({
      date: d,
      methodId: methodId ? parseInt(methodId) : undefined,
      accountId: accountId ? parseInt(accountId) : undefined,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
    });
    const rows = report.payments.map((p: any) => ({
      receiptNo: p.receiptNo,
      date: p.date,
      studentName: p.student.name,
      registrationNo: p.student.registrationNo,
      amount: p.amount,
      method: p.method.name,
      account: (p as any).account?.label || "",
      notes: p.notes || "",
    }));
    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipts-${d}.csv"`,
    );
    res.send(csv);
  }
}
