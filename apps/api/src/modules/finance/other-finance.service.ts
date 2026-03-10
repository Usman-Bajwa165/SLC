import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateOtherTransactionDto,
  OtherTransactionQueryDto,
} from "./dto/other-transaction.dto";
import { Decimal } from "decimal.js";
import { WhatsappService } from "../whatsapp/whatsapp.service";
import { paginate } from "../../common/pagination/pagination.helper";

@Injectable()
export class OtherFinanceService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  async create(dto: CreateOtherTransactionDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.otherTransaction.create({
        data: {
          type: dto.type,
          category: dto.category,
          amount: new Decimal(dto.amount),
          accountId: dto.accountId,
          notes: dto.notes,
          date: this.prisma.getPakistaniDate(dto.date),
          senderName: dto.senderName,
          receiverName: dto.receiverName,
        },
      });

      if (dto.accountId) {
        const amount = new Decimal(dto.amount);
        const updateData =
          dto.type === "income"
            ? { currentBalance: { increment: amount } }
            : { currentBalance: { decrement: amount } };

        await tx.account.update({
          where: { id: dto.accountId },
          data: updateData,
        });
      }

      return transaction;
    });

    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const capitalizedType = dto.type === 'income' ? 'INCOME RECEIVED' : 'EXPENSE RECORDED';
    const msg = `💰 *FINANCE: ${capitalizedType}*\n\nCategory: ${dto.category}\nAmount: Rs. ${Number(dto.amount).toLocaleString()}\nParty: ${dto.receiverName || dto.senderName || 'N/A'}\nDate: ${dateStr}`;
    await this.whatsapp.sendSystemNotification('finance', msg);

    return result;
  }

  async findAll(query: OtherTransactionQueryDto) {
    const { page = 1, limit = 50, type, category, dateFrom, dateTo } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59Z");
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.otherTransaction.findMany({
        where,
        skip,
        take,
        include: {
          account: { select: { id: true, label: true, accountNumber: true } },
        },
        orderBy: { date: "desc" },
      }),
      this.prisma.otherTransaction.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getCategories() {
    const categories = await this.prisma.otherTransaction.groupBy({
      by: ["category"],
      _count: true,
    });
    return categories.map((c) => c.category).filter((c) => c !== "Salary");
  }
}
