import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Decimal } from "decimal.js";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { FinanceService } from "../finance/finance.service";
import { StorageService } from "../../common/storage/storage.service";
import { CreatePaymentDto, PaymentQueryDto } from "./dto/payment.dto";
import {
  paginate,
  paginatedResponse,
} from "../../common/pagination/pagination.helper";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private finance: FinanceService,
    private storage: StorageService,
    @InjectQueue("receipts") private receiptQueue: Queue,
  ) {}

  async findAll(query: PaymentQueryDto) {
    const {
      page = 1,
      limit = 20,
      studentId,
      accountId,
      methodId,
      dateFrom,
      dateTo,
      q,
      source = "all",
    } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (accountId) where.accountId = parseInt(accountId);
    if (methodId) where.methodId = parseInt(methodId);
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59Z");
    }
    if (q) {
      where.OR = [
        { receiptNo: { contains: q, mode: "insensitive" } },
        { student: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const staffWhere: any = {};
    if (accountId) staffWhere.accountId = parseInt(accountId);
    if (methodId) staffWhere.methodId = parseInt(methodId);
    if (dateFrom || dateTo) {
      staffWhere.date = {};
      if (dateFrom) staffWhere.date.gte = new Date(dateFrom);
      if (dateTo) staffWhere.date.lte = new Date(dateTo + "T23:59:59Z");
    }
    if (q) {
      staffWhere.OR = [
        { staff: { name: { contains: q, mode: "insensitive" } } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    if (source === "student") {
      const [payments, total] = await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where,
          skip,
          take,
          include: {
            student: {
              select: { name: true, rollNo: true, registrationNo: true },
            },
            method: { select: { name: true } },
            account: { select: { label: true, accountNumber: true } },
          },
          orderBy: { date: "desc" },
        }),
        this.prisma.payment.count({ where }),
      ]);
      return paginatedResponse(
        payments.map((p) => ({
          ...p,
          source: "student",
          label: p.student.name,
          reference: p.receiptNo,
          type: "Student Fee",
        })),
        total,
        page,
        limit,
      );
    }

    if (source === "staff") {
      const [payments, total] = await this.prisma.$transaction([
        this.prisma.staffPayment.findMany({
          where: staffWhere,
          skip,
          take,
          include: {
            staff: { select: { name: true } },
            method: { select: { name: true } },
            account: { select: { label: true, accountNumber: true } },
          },
          orderBy: { date: "desc" },
        }),
        this.prisma.staffPayment.count({ where: staffWhere }),
      ]);
      return paginatedResponse(
        payments.map((p) => ({
          ...p,
          source: "staff",
          label: p.staff.name,
          reference: p.month,
          type: `Staff ${p.type.charAt(0).toUpperCase() + p.type.slice(1)}`,
        })),
        total,
        page,
        limit,
      );
    }

    // Default: 'all'
    const [allStudents, allStaff, totalStudent, totalStaff] =
      await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where,
          include: {
            student: {
              select: { name: true, rollNo: true, registrationNo: true },
            },
            method: { select: { name: true } },
            account: { select: { label: true, accountNumber: true } },
          },
          orderBy: { date: "desc" },
          take: skip + take, // Fetch enough to cover current page
        }),
        this.prisma.staffPayment.findMany({
          where: staffWhere,
          include: {
            staff: { select: { name: true } },
            method: { select: { name: true } },
            account: { select: { label: true, accountNumber: true } },
          },
          orderBy: { date: "desc" },
          take: skip + take, // Fetch enough to cover current page
        }),
        this.prisma.payment.count({ where }),
        this.prisma.staffPayment.count({ where: staffWhere }),
      ]);

    const merged = [
      ...allStudents.map((p) => ({
        ...p,
        source: "student",
        label: p.student.name,
        reference: p.receiptNo,
        type: "Student Fee",
      })),
      ...allStaff.map((p) => ({
        ...p,
        source: "staff",
        label: p.staff.name,
        reference: p.month,
        type: `Staff ${p.type.charAt(0).toUpperCase() + p.type.slice(1)}`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(skip, skip + take);

    return paginatedResponse(merged, totalStudent + totalStaff, page, limit);
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
        method: true,
        account: true,
        allocations: { include: { payment: false } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async create(dto: CreatePaymentDto) {
    const amount = new Decimal(dto.amount);
    if (amount.lte(0))
      throw new BadRequestException("Payment amount must be greater than 0");

    // Validate student
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, isDeleted: false },
    });
    if (!student)
      throw new NotFoundException(`Student #${dto.studentId} not found`);

    // Validate payment method
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: dto.methodId },
    });
    if (!method)
      throw new NotFoundException(`Payment method #${dto.methodId} not found`);

    // Validate account if provided
    if (dto.accountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: dto.accountId },
      });
      if (!account)
        throw new NotFoundException(`Account #${dto.accountId} not found`);
    }

    // Generate receipt number (atomic via DB sequence)
    const receiptNo = await this.prisma.nextReceiptNo();

    // === ATOMIC TRANSACTION ===
    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const newPayment = await tx.payment.create({
        data: {
          studentId: dto.studentId,
          amount,
          date: this.prisma.getPakistaniDate(dto.date),
          methodId: dto.methodId,
          accountId: dto.accountId,
          receiptNo,
          notes: dto.notes,
          senderName: dto.senderName,
          receiverName: dto.receiverName,
        },
      });

      // 2. Allocate payment to finance records
      await this.finance.applyPaymentAllocations(
        tx,
        dto.studentId,
        newPayment.id,
        amount,
        dto.allocations,
      );

      // 3. Update account balance
      if (dto.accountId) {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { currentBalance: { increment: amount.toFixed(2) } },
        });
      }

      return newPayment;
    });

    // 4. Audit log
    await this.audit.log("payment", payment.id, "payment", null, {
      studentId: dto.studentId,
      amount: amount.toFixed(2),
      receiptNo,
      method: method.name,
    });

    // 5. Enqueue receipt PDF generation (async)
    try {
      await this.receiptQueue.add(
        "generate-receipt",
        { paymentId: payment.id },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      );
    } catch (e) {
      // Queue unavailable — non-fatal, receipt can be regenerated
    }

    return this.findOne(payment.id);
  }

  async getReceiptUrl(id: number) {
    const payment = await this.findOne(id);
    if (!payment.receiptPath) {
      return {
        receiptNo: payment.receiptNo,
        url: null,
        message: "Receipt PDF not yet generated",
      };
    }
    const url = await this.storage.getPresignedUrl(payment.receiptPath);
    return { receiptNo: payment.receiptNo, url };
  }
}
