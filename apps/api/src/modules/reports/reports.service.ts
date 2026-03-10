import { Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import * as dayjs from "dayjs";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ── Outstanding Balances ────────────────────────────────────────────────────

  // ── Outstanding Balances (Students) ──────────────────────────────────────────
  async outstanding(params: {
    departmentId?: number;
    sessionId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const { departmentId, sessionId, startDate, endDate, search } = params;
    const where: any = { isDeleted: false };
    if (departmentId) where.departmentId = departmentId;
    if (sessionId) where.sessionId = sessionId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { registrationNo: { contains: search, mode: "insensitive" } },
        { rollNo: { contains: search, mode: "insensitive" } },
        { cnic: { contains: search, mode: "insensitive" } },
      ];
    }

    const students = await this.prisma.student.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        session: { select: { label: true } },
        financeRecords: { where: { isSnapshot: false } },
        payments: { select: { amount: true } },
      },
    });

    const rows = students
      .map((s) => {
        const totalPayable = (s as any).financeRecords.reduce(
          (sum: any, f: any) => sum.plus(new Decimal(f.feeDue.toString())),
          new Decimal(0),
        );
        const totalPaid = (s as any).payments.reduce(
          (sum: any, p: any) => sum.plus(new Decimal(p.amount.toString())),
          new Decimal(0),
        );
        const totalOutstanding = (s as any).financeRecords.reduce(
          (sum: any, f: any) => sum.plus(new Decimal(f.remaining.toString())),
          new Decimal(0),
        );
        return {
          studentId: s.id,
          registrationNo: s.registrationNo,
          name: s.name,
          cnic: s.cnic,
          rollNo: s.rollNo,
          department: (s as any).department.name,
          session: (s as any).session?.label || "N/A",
          currentSemester: s.currentSemester,
          programMode: s.programMode,
          status: s.status,
          totalMarks: s.totalMarks,
          obtainedMarks: s.obtainedMarks,
          cgpa: s.cgpa,
          sgpa: s.sgpa,
          outstandingTerms: (s as any).financeRecords.filter((f: any) =>
            new Decimal(f.remaining.toString()).gt(0),
          ).length,
          totalPayable: totalPayable.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
        };
      })
      .filter((r) => parseFloat(r.totalOutstanding) > 0)
      .sort(
        (a, b) =>
          parseFloat(b.totalOutstanding) - parseFloat(a.totalOutstanding),
      );

    const grandTotalPayable = rows.reduce(
      (s, r) => s.plus(new Decimal(r.totalPayable)),
      new Decimal(0),
    );
    const grandTotalPaid = rows.reduce(
      (s, r) => s.plus(new Decimal(r.totalPaid)),
      new Decimal(0),
    );
    const grandTotalOutstanding = rows.reduce(
      (s, r) => s.plus(new Decimal(r.totalOutstanding)),
      new Decimal(0),
    );

    return {
      rows,
      grandTotalPayable: grandTotalPayable.toFixed(2),
      grandTotalPaid: grandTotalPaid.toFixed(2),
      grandTotalOutstanding: grandTotalOutstanding.toFixed(2),
      totalCount: rows.length,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Daily Receipts ──────────────────────────────────────────────────────────
  async dailyReceipts(params: {
    date?: string;
    methodId?: number;
    accountId?: number;
    departmentId?: number;
    sessionId?: number;
  }) {
    const {
      date = dayjs().format("YYYY-MM-DD"),
      methodId,
      accountId,
      departmentId,
      sessionId,
    } = params;
    const start = dayjs(date).startOf("day").toDate();
    const end = dayjs(date).endOf("day").toDate();

    const where: any = { date: { gte: start, lte: end } };
    if (methodId) where.methodId = methodId;
    if (accountId) where.accountId = accountId;
    if (departmentId || sessionId) {
      where.student = {};
      if (departmentId) where.student.departmentId = departmentId;
      if (sessionId) where.student.sessionId = sessionId;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            registrationNo: true,
            cnic: true,
            rollNo: true,
            currentSemester: true,
            programMode: true,
            department: { select: { name: true } },
            session: { select: { label: true } },
            financeRecords: {
              where: { isSnapshot: false },
              select: { remaining: true },
            },
          },
        },
        method: { select: { name: true, type: true } },
        account: { select: { label: true } },
      },
      orderBy: { date: "asc" },
    });

    const rows = payments.map((p) => {
      const remainingForStudent =
        p.student?.financeRecords.reduce(
          (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
          new Decimal(0),
        ) || new Decimal(0);

      return {
        ...p,
        totalRemaining: remainingForStudent.toFixed(2),
      };
    });

    const total = rows.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );

    return {
      date,
      payments: rows,
      total: total.toFixed(2),
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Ledgers ────────────────────────────────────────────────────────────────

  async studentLedger(studentId: number, from?: string, to?: string) {
    const dateQuery: any = {};
    if (from) dateQuery.gte = new Date(from);
    if (to) dateQuery.lte = new Date(to);

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, isDeleted: false },
      include: {
        department: true,
        session: true,
        financeRecords: { orderBy: { createdAt: "asc" } },
        payments: {
          where: Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {},
          include: {
            method: { select: { name: true, type: true } },
            account: { select: { label: true } },
          },
          orderBy: { date: "asc" },
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
      .reduce(
        (s, f) => s.plus(new Decimal(f.remaining.toString())),
        new Decimal(0),
      );

    return {
      student,
      logs: student.payments.map((p) => ({
        type: "payment",
        date: p.date,
        amount: p.amount,
        method: p.method.name,
        methodType: p.method.type,
        account: (p as any).account?.label || "Cash",
        notes: p.notes,
        receiptNo: p.receiptNo,
        semester: student.currentSemester,
      })),
      totalPaid: totalPaid.toFixed(2),
      totalRemaining: totalRemaining.toFixed(2),
      generatedAt: new Date().toISOString(),
    };
  }

  async accountLedger(
    accountId: number,
    from?: string,
    to?: string,
    type?: string,
  ) {
    const dateQuery: any = {};
    if (from) dateQuery.gte = new Date(from);
    if (to) dateQuery.lte = new Date(to);

    const hasDate = Object.keys(dateQuery).length > 0;

    const [payments, otherItems, staffPayments] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          accountId,
          ...(hasDate ? { date: dateQuery } : {}),
        },
        include: {
          student: { select: { name: true, registrationNo: true } },
          method: true,
        },
        orderBy: { date: "desc" },
      }),
      (this.prisma as any).otherTransaction.findMany({
        where: {
          accountId,
          ...(hasDate ? { date: dateQuery } : {}),
          ...(type === "incoming"
            ? { type: "income" }
            : type === "outgoing"
              ? { type: "expense" }
              : {}),
        },
        orderBy: { date: "desc" },
      }),
      this.prisma.staffPayment.findMany({
        where: {
          accountId,
          ...(hasDate ? { date: dateQuery } : {}),
        },
        include: {
          staff: { select: { name: true } },
          method: true,
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const logs = [
      ...(type === "outgoing"
        ? []
        : payments.map((p) => ({
            id: `p-${p.id}`,
            date: p.date,
            type: "credit",
            category: "Student Fee",
            description: `Payment from ${p.student?.name || "Unknown Student"} - ${(p.student as any)?.registrationNo || "N/A"}`,
            amount: p.amount,
            reference: p.receiptNo,
            senderName: p.senderName || p.receiverName,
          }))),
      ...otherItems.map((t) => ({
        id: `t-${t.id}`,
        date: t.date,
        type: t.type === "income" ? "credit" : "debit",
        category: t.category,
        description: t.notes || "No description",
        amount: t.amount,
        reference: null,
        senderName: t.type === "income" ? t.senderName : t.receiverName,
      })),
      ...(type === "incoming"
        ? []
        : staffPayments.map((sp) => ({
            id: `sp-${sp.id}`,
            date: sp.date,
            type: "debit",
            category: "Staff Salary",
            description: `Staff payment to ${sp.staff?.name || "Unknown Staff"} (${sp.type})`,
            amount: sp.amount,
            reference: sp.month,
            senderName: sp.receiverName,
          }))),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      accountId,
      logs,
      totalCount: logs.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async staffLedger(staffId: number, from?: string, to?: string) {
    const dateQuery: any = {};
    if (from) dateQuery.gte = new Date(from);
    if (to) dateQuery.lte = new Date(to);

    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, isDeleted: false },
      include: {
        financeRecords: { orderBy: { month: "desc" } },
        payments: {
          where: Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {},
          include: {
            method: { select: { name: true, type: true } },
            account: { select: { label: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!staff) return null;

    const totalPaid = staff.payments.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );
    const totalAdvance = staff.financeRecords.reduce(
      (s, f) => s.plus(new Decimal(f.advanceTaken.toString())),
      new Decimal(0),
    );
    const totalLoan = staff.financeRecords.reduce(
      (s, f) => s.plus(new Decimal(f.loanTaken.toString())),
      new Decimal(0),
    );
    const totalRemaining = staff.financeRecords.reduce(
      (s, f) => s.plus(new Decimal(f.remaining.toString())),
      new Decimal(0),
    );

    return {
      staff,
      logs: staff.payments.map((p) => ({
        type: p.type,
        date: p.date,
        amount: p.amount,
        method: p.method.name,
        account: (p as any).account?.label || "Cash",
        notes: p.notes,
        month: p.month,
        payerName: p.payerName,
        receiverName: p.receiverName,
      })),
      totalPaid: totalPaid.toFixed(2),
      totalAdvance: totalAdvance.toFixed(2),
      totalLoan: totalLoan.toFixed(2),
      totalRemaining: totalRemaining.toFixed(2),
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Advance Summary ─────────────────────────────────────────────────────────
  async advanceSummary(departmentId?: number) {
    const where: any = { isDeleted: false };
    if (departmentId) where.departmentId = departmentId;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        department: { select: { name: true } },
        financeRecords: {
          where: { isSnapshot: false, advanceTaken: { gt: 0 } },
        },
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
          .reduce(
            (sum, f) => sum.plus(new Decimal(f.advanceTaken.toString())),
            new Decimal(0),
          )
          .toFixed(2),
      }));

    return { rows, generatedAt: new Date().toISOString() };
  }

  // ── Dashboard Summary ───────────────────────────────────────────────────────
  async dashboardSummary() {
    const today = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const last7Days = dayjs().subtract(6, "days").startOf("day").toDate();

    const [
      totalStudents,
      todayPayments,
      outstandingFinance,
      accounts,
      cashMethods,
      undepositedPayments,
      undepositedIncome,
      undepositedExpense,
      trendPayments,
    ] = await this.prisma.$transaction([
      this.prisma.student.count({
        where: { isDeleted: false, status: "active" },
      }),
      this.prisma.payment.findMany({
        where: { date: { gte: today, lte: todayEnd } },
      }),
      this.prisma.studentFinance.findMany({
        where: { isSnapshot: false, remaining: { gt: 0 } },
      }),
      this.prisma.account.findMany({
        where: { isActive: true },
        select: {
          label: true,
          currentBalance: true,
          paymentMethod: { select: { type: true } },
        },
      }),
      this.prisma.paymentMethod.findMany({
        where: { type: "cash" },
      }),
      // Undeposited Cash Payments (Student Fees)
      this.prisma.payment.aggregate({
        where: { method: { type: "cash" }, accountId: null },
        _sum: { amount: true },
      }),
      // Undeposited Cash Income (Other)
      this.prisma.otherTransaction.aggregate({
        where: { type: "income", accountId: null },
        _sum: { amount: true },
      }),
      // Undeposited Cash Expense (Other)
      this.prisma.otherTransaction.aggregate({
        where: { type: "expense", accountId: null },
        _sum: { amount: true },
      }),
      // Trend Payments (last 7 days)
      this.prisma.payment.findMany({
        where: { date: { gte: last7Days } },
        select: { date: true, amount: true },
      }),
    ]);

    const todayTotal = todayPayments.reduce(
      (s, p) => s.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );
    const totalOutstanding = outstandingFinance.reduce(
      (s, f) => s.plus(new Decimal(f.remaining.toString())),
      new Decimal(0),
    );

    // Calculate Cash vs Bank vs Online
    let cashBalance = new Decimal(0);
    let bankBalance = new Decimal(0);
    let onlineBalance = new Decimal(0);

    accounts.forEach((acc) => {
      const bal = new Decimal(acc.currentBalance.toString());
      if (acc.paymentMethod.type === "cash") {
        cashBalance = cashBalance.plus(bal);
      } else if (acc.paymentMethod.type === "bank") {
        bankBalance = bankBalance.plus(bal);
      } else if (acc.paymentMethod.type === "online") {
        onlineBalance = onlineBalance.plus(bal);
      }
    });

    // Add Undeposited Cash
    const unDepPayments = new Decimal(
      undepositedPayments._sum.amount?.toString() || "0",
    );
    const unDepIncome = new Decimal(
      undepositedIncome._sum.amount?.toString() || "0",
    );
    const unDepExpense = new Decimal(
      undepositedExpense._sum.amount?.toString() || "0",
    );

    cashBalance = cashBalance
      .plus(unDepPayments)
      .plus(unDepIncome)
      .minus(unDepExpense);

    // Calculate Trend
    const trendMap = new Map<string, Decimal>();
    for (let i = 0; i < 7; i++) {
      const d = dayjs().subtract(i, "days").format("MMM DD");
      trendMap.set(d, new Decimal(0));
    }

    trendPayments.forEach((p) => {
      const d = dayjs(p.date).format("MMM DD");
      if (trendMap.has(d)) {
        trendMap.set(
          d,
          trendMap.get(d)!.plus(new Decimal(p.amount.toString())),
        );
      }
    });

    const revenueTrend = Array.from(trendMap.entries())
      .map(([name, amount]) => ({
        name,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .reverse();

    return {
      totalActiveStudents: totalStudents,
      todayReceived: todayTotal.toFixed(2),
      todayPaymentCount: todayPayments.length,
      totalOutstanding: totalOutstanding.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
      bankBalance: bankBalance.toFixed(2),
      onlineBalance: onlineBalance.toFixed(2),
      revenueTrend,
      accounts: accounts.map((a) => ({
        label: a.label,
        balance: a.currentBalance.toString(),
      })),
    };
  }
}
