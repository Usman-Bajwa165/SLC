import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { Decimal } from "decimal.js";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { WhatsappService } from "../whatsapp/whatsapp.service";
import { CreatePaymentMethodDto, CreateAccountDto } from "./dto/account.dto";

@Injectable()
export class AccountsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private whatsapp: WhatsappService,
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

  async updateAccount(
    id: number,
    dto: Partial<CreateAccountDto> & { currentBalance?: number },
  ) {
    const existing = await this.findOneAccount(id);
    let updatedData: any = {
      label: dto.label,
      accountNumber: dto.accountNumber,
      branch: dto.branch,
      paymentMethodId: dto.paymentMethodId,
      isActive: dto.isActive,
    };

    if (dto.currentBalance !== undefined) {
      const existingBalance = new Decimal(existing.currentBalance.toString());
      const newBalance = new Decimal(dto.currentBalance.toString());
      if (!newBalance.equals(existingBalance)) {
        updatedData.currentBalance = newBalance;
        const diff = newBalance.minus(existingBalance);

        await (this.prisma as any).otherTransaction.create({
          data: {
            type: diff.greaterThan(0) ? "income" : "expense",
            category: "Balance Adjustment",
            amount: diff.abs(),
            notes: `Manual balance adjustment. Previous: ${existingBalance.toFixed(2)}, New: ${newBalance.toFixed(2)}`,
            accountId: id,
            date: new Date(),
          },
        });
      }
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: updatedData,
    });
    await this.audit.log("account", id, "update", existing, updated);

    // If balance was adjusted, trigger notification
    if (dto.currentBalance !== undefined) {
      const existingBalance = new Decimal(existing.currentBalance.toString());
      const newBalance = new Decimal(dto.currentBalance.toString());
      if (!newBalance.equals(existingBalance)) {
        const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const typeStr = newBalance.greaterThan(existingBalance) ? 'INCREASED' : 'DECREASED';
        const diffAbs = newBalance.minus(existingBalance).abs().toNumber().toLocaleString();
        
        const accountInfo = existing.accountNumber ? `${existing.label} - ${existing.accountNumber}` : existing.label;
        const msg = `🏦 *ACCOUNT BALANCE ${typeStr}*\n\nAccount: ${accountInfo}\nPrevious Balance: Rs. ${existingBalance.toNumber().toLocaleString()}\nAdjusted By: Rs. ${diffAbs}\nNew Balance: Rs. ${newBalance.toNumber().toLocaleString()}\nDate: ${dateStr}`;
        await this.whatsapp.sendSystemNotification('account', msg);
      }
    }

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

  async adjustCashBalance(newBalance: number) {
    // Calculate current cash balance
    const [studentPayments, staffPayments, otherIncome, otherExpense] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { accountId: null },
        _sum: { amount: true },
      }),
      this.prisma.staffPayment.aggregate({
        where: { accountId: null },
        _sum: { amount: true },
      }),
      (this.prisma as any).otherTransaction.aggregate({
        where: { accountId: null, type: 'income' },
        _sum: { amount: true },
      }),
      (this.prisma as any).otherTransaction.aggregate({
        where: { accountId: null, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const currentCash = new Decimal(studentPayments._sum.amount || 0)
      .plus(otherIncome._sum.amount || 0)
      .minus(staffPayments._sum.amount || 0)
      .minus(otherExpense._sum.amount || 0);

    const newBalanceDecimal = new Decimal(newBalance);
    const diff = newBalanceDecimal.minus(currentCash);

    if (!diff.isZero()) {
      // Create adjustment transaction
      // If diff is positive, we need to ADD income to increase balance
      // If diff is negative, we need to ADD expense to decrease balance
      await (this.prisma as any).otherTransaction.create({
        data: {
          type: diff.greaterThan(0) ? 'income' : 'expense',
          category: 'Balance Adjustment',
          amount: diff.abs(),
          notes: `Cash balance manually adjusted from PKR ${currentCash.toFixed(2)} to PKR ${newBalanceDecimal.toFixed(2)}`,
          date: new Date(),
          accountId: null,
        },
      });

      // Send notification
      const dateStr = new Date().toLocaleDateString('en-PK', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      const typeStr = diff.greaterThan(0) ? 'INCREASED' : 'DECREASED';
      const msg = `💰 *CASH BALANCE ${typeStr}*\n\nPrevious Balance: Rs. ${currentCash.toNumber().toLocaleString()}\nAdjusted By: Rs. ${diff.abs().toNumber().toLocaleString()}\nNew Balance: Rs. ${newBalanceDecimal.toNumber().toLocaleString()}\nDate: ${dateStr}`;
      await this.whatsapp.sendSystemNotification('account', msg);
    }

    return { 
      success: true, 
      adjustment: diff.toNumber(),
      oldBalance: currentCash.toNumber(),
      newBalance: newBalanceDecimal.toNumber()
    };
  }
}
