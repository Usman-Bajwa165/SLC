import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { Decimal } from "decimal.js";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreatePaymentMethodDto, CreateAccountDto } from "./dto/account.dto";

@Injectable()
export class AccountsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async onModuleInit() {
    const methods = [
      { name: "Cash", type: "cash" },
      { name: "Bank Transfer", type: "bank" },
      { name: "Online Payment", type: "online" },
    ];

    for (const method of methods) {
      await this.prisma.paymentMethod.upsert({
        where: { name: method.name },
        update: {},
        create: {
          name: method.name,
          type: method.type,
          isActive: true,
        },
      });
    }
  }

  async findAllMethods() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: { accounts: { where: { isActive: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createMethod(dto: CreatePaymentMethodDto) {
    const method = await this.prisma.paymentMethod.create({ data: dto });
    await this.audit.log("payment_method", method.id, "create", null, method);
    return method;
  }

  async findAllAccounts() {
    return this.prisma.account.findMany({
      where: { isActive: true },
      include: {
        paymentMethod: { select: { id: true, name: true, type: true } },
      },
      orderBy: { label: "asc" },
    });
  }

  async findOneAccount(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { paymentMethod: true },
    });
    if (!account) throw new NotFoundException(`Account #${id} not found`);
    return account;
  }

  async createAccount(dto: CreateAccountDto) {
    const opening = new Decimal(dto.openingBalance || "0");
    const account = await this.prisma.account.create({
      data: {
        paymentMethodId: dto.paymentMethodId,
        label: dto.label,
        accountNumber: dto.accountNumber,
        branch: dto.branch,
        openingBalance: opening,
        currentBalance: opening,
      },
    });
    await this.audit.log("account", account.id, "create", null, account);
    return account;
  }

  async updateAccount(id: number, dto: Partial<CreateAccountDto>) {
    const existing = await this.findOneAccount(id);
    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        label: dto.label,
        accountNumber: dto.accountNumber,
        branch: dto.branch,
        paymentMethodId: dto.paymentMethodId,
        isActive: dto.isActive,
      },
    });
    await this.audit.log("account", id, "update", existing, updated);
    return updated;
  }

  async getAccountLedger(accountId: number, from?: string, to?: string) {
    const account = await this.findOneAccount(accountId);
    const dateQuery: any = {};
    if (from || to) {
      if (from) dateQuery.gte = new Date(from);
      if (to) dateQuery.lte = new Date(to + "T23:59:59Z");
    }

    const [payments, otherItems] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          accountId,
          ...(Object.keys(dateQuery).length ? { date: dateQuery } : {}),
        },
        include: { student: { select: { name: true } }, method: true },
        orderBy: { date: "desc" },
      }),
      (this.prisma as any).otherTransaction.findMany({
        where: {
          accountId,
          ...(Object.keys(dateQuery).length ? { date: dateQuery } : {}),
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const logs = [
      ...payments.map((p) => ({
        id: `p-${p.id}`,
        date: p.date,
        type: "credit",
        category: "Student Fee",
        description: `Payment from ${p.student?.name || "Unknown Student"}`,
        amount: p.amount,
        reference: p.receiptNo,
      })),
      ...otherItems.map((t: any) => ({
        id: `t-${t.id}`,
        date: t.date,
        type: t.type === "income" ? "credit" : "debit",
        category: t.category,
        description: t.notes || "No description",
        amount: t.amount,
        reference: null,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { account, logs, totalCount: logs.length };
  }

  async remove(id: number) {
    const account = await this.findOneAccount(id);
    if (!new Decimal(account.currentBalance.toString()).isZero()) {
      throw new BadRequestException(
        "Account must have zero balance to be deleted",
      );
    }
    const updated = await this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.log("account", id, "delete", account, null);
    return updated;
  }
}
