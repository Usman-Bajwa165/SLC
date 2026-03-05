import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getStudentFinance(studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, isDeleted: false },
    });
    if (!student) throw new NotFoundException(`Student #${studentId} not found`);

    const records = await this.prisma.studentFinance.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
    });

    const totalDue = records.reduce((s, r) => s.plus(new Decimal(r.feeDue.toString())), new Decimal(0));
    const totalPaid = records.reduce((s, r) => s.plus(new Decimal(r.feePaid.toString())), new Decimal(0));
    const totalRemaining = records
      .filter((r) => !r.isSnapshot)
      .reduce((s, r) => s.plus(new Decimal(r.remaining.toString())), new Decimal(0));

    return {
      studentId,
      records,
      summary: {
        totalDue: totalDue.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalRemaining: totalRemaining.toFixed(2),
      },
    };
  }

  async getOutstandingRecords(studentId: number) {
    return this.prisma.studentFinance.findMany({
      where: {
        studentId,
        isSnapshot: false,
        remaining: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' }, // FIFO order
    });
  }

  async createTerm(studentId: number, dto: any) {
    const feeDue = new Decimal(dto.feeDue.toString());
    const record = await this.prisma.studentFinance.create({
      data: {
        studentId,
        termLabel: dto.termLabel,
        termType: dto.termType,
        feeDue,
        feePaid: new Decimal(0),
        advanceTaken: new Decimal(0),
        carryOver: new Decimal(dto.carryOver || 0),
        remaining: feeDue,
      },
    });
    return record;
  }

  async applyPaymentAllocations(
    tx: any,
    studentId: number,
    paymentId: number,
    amount: Decimal,
    manualAllocations?: { financeId: number; amount: string }[],
  ) {
    if (manualAllocations && manualAllocations.length > 0) {
      await this.applyManualAllocations(tx, paymentId, manualAllocations);
    } else {
      await this.applyFifoAllocations(tx, studentId, paymentId, amount);
    }
  }

  private async applyFifoAllocations(tx: any, studentId: number, paymentId: number, amount: Decimal) {
    const outstanding = await tx.studentFinance.findMany({
      where: { studentId, isSnapshot: false, remaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    let remainingPayment = amount;

    for (const record of outstanding) {
      if (remainingPayment.lte(0)) break;

      const recordRemaining = new Decimal(record.remaining.toString());
      const allocate = Decimal.min(remainingPayment, recordRemaining);

      await tx.studentFinance.update({
        where: { id: record.id },
        data: {
          feePaid: { increment: allocate.toFixed(2) },
          remaining: { decrement: allocate.toFixed(2) },
        },
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId,
          studentFinanceId: record.id,
          allocatedAmount: allocate,
        },
      });

      remainingPayment = remainingPayment.minus(allocate);
    }

    // If overpayment (advance), record it on the latest term
    if (remainingPayment.gt(0)) {
      const latest = outstanding[outstanding.length - 1];
      if (latest) {
        await tx.studentFinance.update({
          where: { id: latest.id },
          data: { advanceTaken: { increment: remainingPayment.toFixed(2) } },
        });
      }
    }
  }

  private async applyManualAllocations(tx: any, paymentId: number, allocations: { financeId: number; amount: string }[]) {
    for (const alloc of allocations) {
      const allocAmount = new Decimal(alloc.amount);
      await tx.studentFinance.update({
        where: { id: alloc.financeId },
        data: {
          feePaid: { increment: allocAmount.toFixed(2) },
          remaining: { decrement: allocAmount.toFixed(2) },
        },
      });
      await tx.paymentAllocation.create({
        data: { paymentId, studentFinanceId: alloc.financeId, allocatedAmount: allocAmount },
      });
    }
  }
}
