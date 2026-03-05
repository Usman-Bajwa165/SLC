import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ── Outstanding Balances ────────────────────────────────────────────────────
  async outstanding(departmentId?: number, sessionId?: number) {
    const where: any = { isDeleted: false };
    if (departmentId) where.departmentId = departmentId;
    if (sessionId) where.sessionId = sessionId;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        session: { select: { label: true } },
        financeRecords: { where: { isSnapshot: false, remaining: { gt: 0 } } },
      },
    });

    const rows = students
      .filter((s) => s.financeRecords.length > 0)
      .map((s) => {
        const totalOutstanding = s.financeRecords.reduce(
          (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
          new Decimal(0),
        );
        return {
          studentId: s.id,
          registrationNo: s.registrationNo,
          name: s.name,
          department: s.department.name,
          session: s.session?.label || 'N/A',
          status: s.status,
          outstandingTerms: s.financeRecords.length,
          totalOutstanding: totalOutstanding.toFixed(2),
        };
      })
      .sort((a, b) => parseFloat(b.totalOutstanding) - parseFloat(a.totalOutstanding));

    const grandTotal = rows.reduce(
      (s, r) => s.plus(new Decimal(r.totalOutstanding)),
      new Decimal(0),
    );

    return { rows, grandTotal: grandTotal.toFixed(2), generatedAt: new Date().toISOString() };
  }

  // ── Daily Receipts ──────────────────────────────────────────────────────────
  async dailyReceipts(date: string) {
    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).endOf('day').toDate();

    const payments = await this.prisma.payment.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: { select: { name: true, registrationNo: true } },
        method: { select: { name: true, type: true } },
        account: { select: { label: true } },
      },
      orderBy: { date: 'asc' },
    });

    const total = payments.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );

    const byMethod: Record<string, string> = {};
    for (const p of payments) {
      const key = p.method.name;
      byMethod[key] = new Decimal(byMethod[key] || 0).plus(new Decimal(p.amount.toString())).toFixed(2);
    }

    return { date, payments, total: total.toFixed(2), byMethod, generatedAt: new Date().toISOString() };
  }

  // ── Student Ledger ──────────────────────────────────────────────────────────
  async studentLedger(studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, isDeleted: false },
      include: {
        department: true,
        session: true,
        financeRecords: { orderBy: { createdAt: 'asc' } },
        payments: {
          include: {
            method: { select: { name: true } },
            account: { select: { label: true } },
            allocations: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    });
    if (!student) return null;

    const totalPaid = student.payments.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );
    const totalRemaining = student.financeRecords
      .filter((f) => !f.isSnapshot)
      .reduce((s, f) => s.plus(new Decimal(f.remaining.toString())), new Decimal(0));

    return { student, totalPaid: totalPaid.toFixed(2), totalRemaining: totalRemaining.toFixed(2), generatedAt: new Date().toISOString() };
  }

  // ── Advance Summary ─────────────────────────────────────────────────────────
  async advanceSummary(departmentId?: number) {
    const where: any = { isDeleted: false };
    if (departmentId) where.departmentId = departmentId;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        department: { select: { name: true } },
        financeRecords: { where: { isSnapshot: false, advanceTaken: { gt: 0 } } },
      },
    });

    const rows = students
      .filter((s) => s.financeRecords.length > 0)
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        registrationNo: s.registrationNo,
        department: s.department.name,
        totalAdvance: s.financeRecords
          .reduce((sum, f) => sum.plus(new Decimal(f.advanceTaken.toString())), new Decimal(0))
          .toFixed(2),
      }));

    return { rows, generatedAt: new Date().toISOString() };
  }

  // ── Dashboard Summary ───────────────────────────────────────────────────────
  async dashboardSummary() {
    const today = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const [totalStudents, todayPayments, outstandingFinance, accounts] = await this.prisma.$transaction([
      this.prisma.student.count({ where: { isDeleted: false, status: 'active' } }),
      this.prisma.payment.findMany({ where: { date: { gte: today, lte: todayEnd } } }),
      this.prisma.studentFinance.findMany({ where: { isSnapshot: false, remaining: { gt: 0 } } }),
      this.prisma.account.findMany({ where: { isActive: true }, select: { label: true, currentBalance: true } }),
    ]);

    const todayTotal = todayPayments.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())), new Decimal(0),
    );
    const totalOutstanding = outstandingFinance.reduce(
      (s, f) => s.plus(new Decimal(f.remaining.toString())), new Decimal(0),
    );

    return {
      totalActiveStudents: totalStudents,
      todayReceived: todayTotal.toFixed(2),
      todayPaymentCount: todayPayments.length,
      totalOutstanding: totalOutstanding.toFixed(2),
      accounts: accounts.map((a) => ({ label: a.label, balance: a.currentBalance.toString() })),
    };
  }
}
