import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentMethodDto, CreateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAllMethods() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: { accounts: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createMethod(dto: CreatePaymentMethodDto) {
    const method = await this.prisma.paymentMethod.create({ data: dto });
    await this.audit.log('payment_method', method.id, 'create', null, method);
    return method;
  }

  async findAllAccounts() {
    return this.prisma.account.findMany({
      where: { isActive: true },
      include: { paymentMethod: { select: { id: true, name: true, type: true } } },
      orderBy: { label: 'asc' },
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
    const opening = new Decimal(dto.openingBalance || '0');
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
    await this.audit.log('account', account.id, 'create', null, account);
    return account;
  }

  async updateAccount(id: number, dto: Partial<CreateAccountDto>) {
    const existing = await this.findOneAccount(id);
    const updated = await this.prisma.account.update({ where: { id }, data: dto });
    await this.audit.log('account', id, 'update', existing, updated);
    return updated;
  }

  async getAccountLedger(accountId: number, from?: string, to?: string) {
    const account = await this.findOneAccount(accountId);
    const where: any = { accountId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to + 'T23:59:59Z');
    }
    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        student: { select: { name: true, registrationNo: true } },
        method: { select: { name: true, type: true } },
      },
      orderBy: { date: 'asc' },
    });

    const total = payments.reduce((s, p) => s.plus(new Decimal(p.amount.toString())), new Decimal(0));
    return { account, payments, totalReceived: total.toFixed(2) };
  }
}
