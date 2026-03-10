import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { WhatsappService } from "../whatsapp/whatsapp.service";
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  CreateStaffPaymentDto,
} from "./dto/staff.dto";
import {
  paginate,
  paginatedResponse,
} from "../../common/pagination/pagination.helper";

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private whatsapp: WhatsappService,
  ) {}

  private async getSalaryAt(tx: any, staffId: number, month: string) {
    const history = await tx.staffSalaryHistory.findFirst({
      where: {
        staffId,
        effectiveMonth: { lte: month },
      },
      orderBy: { effectiveMonth: "desc" },
    });
    return history ? new Prisma.Decimal(history.salary.toString()) : null;
  }

  async list(query: StaffQueryDto) {
    const { role, isActive, month, q, page = 1, limit = 50 } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = { isDeleted: false };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { cnic: { contains: q } },
        { contact: { contains: q } },
      ];
    }

    const targetMonth =
      month || this.prisma.getPakistaniDate().toISOString().slice(0, 7);

    const [data, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          financeRecords: {
            where: { month: targetMonth },
            take: 1,
          },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    // Enhance records without finance records for the target month
    const enhancedData = await Promise.all(
      data.map(async (s: any) => {
        if (s.financeRecords.length === 0) {
          const histSalary = await this.getSalaryAt(
            this.prisma,
            s.id,
            targetMonth,
          );
          if (histSalary) {
            s.financeRecords = [
              {
                month: targetMonth,
                salaryDue: histSalary,
                salaryPaid: new Prisma.Decimal(0),
                advanceTaken: new Prisma.Decimal(0),
                loanTaken: new Prisma.Decimal(0),
                remaining: histSalary,
              },
            ];
          }
        }
        return s;
      }),
    );

    return paginatedResponse(enhancedData, total, page, limit);
  }

  async findOne(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        financeRecords: { orderBy: { month: "desc" } },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { method: true, account: true },
        },
      },
    });

    if (!staff || staff.isDeleted) {
      throw new NotFoundException("Staff member not found");
    }

    return staff;
  }

  async create(dto: CreateStaffDto) {
    const salary = new Prisma.Decimal(dto.salary);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const result = await this.prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          name: dto.name,
          cnic: dto.cnic,
          contact: dto.contact,
          role: dto.role,
          subject: dto.subject,
          address: dto.address,
          joinedDate: new Date(dto.joinedDate),
          salary,
        },
      });

      // Initial salary history
      await tx.staffSalaryHistory.create({
        data: {
          staffId: staff.id,
          salary,
          effectiveMonth: currentMonth,
        },
      });

      await tx.staffFinance.create({
        data: {
          staffId: staff.id,
          month: currentMonth,
          salaryDue: new Prisma.Decimal(salary.toString()),
          remaining: new Prisma.Decimal(salary.toString()),
        },
      });

      return staff;
    });

    await this.audit.log("staff", result.id, "create", null, result);
    
    // Send enrollment notification
    await this.whatsapp.sendSystemNotification(
      'enrollment',
      `👔 *NEW STAFF HIRED*\n\nName: ${result.name}\nRole: ${dto.role}\nSalary: PKR ${salary.toString()}\nJoined: ${new Date(dto.joinedDate).toLocaleDateString('en-PK')}`
    );
    
    return this.findOne(result.id);
  }

  async update(id: number, dto: UpdateStaffDto) {
    const existing = await this.findOne(id);

    if (dto.version !== undefined && dto.version !== existing.version) {
      throw new ConflictException(
        "Record has been modified by another user. Please refresh and try again.",
      );
    }

    const { version, salary, effectiveMonth, ...updateData } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.staff.update({
        where: { id },
        data: {
          ...updateData,
          ...(salary && { salary: new Prisma.Decimal(salary) }),
          version: { increment: 1 },
        },
      });

      // If salary changed, update current and future months' finance records and history
      if (salary) {
        const currentMonth = effectiveMonth || new Date().toISOString().slice(0, 7);
        const newSalary = new Prisma.Decimal(salary);

        // Update/Create Salary History for effective month
        await tx.staffSalaryHistory.upsert({
          where: {
            staffId_effectiveMonth: {
              staffId: id,
              effectiveMonth: currentMonth,
            },
          },
          update: { salary: newSalary },
          create: {
            staffId: id,
            effectiveMonth: currentMonth,
            salary: newSalary,
          },
        });

        // Propagate to ALL finance records from the effective month onwards
        const financeRecords = await tx.staffFinance.findMany({
          where: {
            staffId: id,
            month: { gte: currentMonth },
          },
        });

        for (const finance of financeRecords) {
          const paid = new Prisma.Decimal(finance.salaryPaid.toString());
          const advance = new Prisma.Decimal(finance.advanceTaken.toString());
          const loan = new Prisma.Decimal(finance.loanTaken.toString());

          await tx.staffFinance.update({
            where: { id: finance.id },
            data: {
              salaryDue: newSalary,
              remaining: newSalary.minus(paid),
            },
          });
        }
      }

      return updated;
    });

    await this.audit.log("staff", id, "update", existing, result);
    return this.findOne(id);
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.prisma.staff.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.audit.log("staff", id, "delete", existing, null);
    
    // Send deactivation notification
    await this.whatsapp.sendSystemNotification(
      'deactivation',
      `🚫 *STAFF DEACTIVATED*\n\nName: ${existing.name}\nRole: ${existing.role}\nStatus: Deactivated`
    );
    
    return { deleted: true };
  }

  async createPayment(dto: CreateStaffPaymentDto) {
    const staff = await this.findOne(dto.staffId);
    const amount = new Prisma.Decimal(dto.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure finance record exists for the month
      let finance = await tx.staffFinance.findUnique({
        where: {
          staffId_month: { staffId: dto.staffId, month: dto.month },
        },
      });

      if (!finance) {
        // Look up historical salary for this month
        const staffSalary =
          (await this.getSalaryAt(tx, dto.staffId, dto.month)) ||
          new Prisma.Decimal(staff.salary.toString());

        finance = await tx.staffFinance.create({
          data: {
            staffId: dto.staffId,
            month: dto.month,
            salaryDue: staffSalary,
            remaining: staffSalary,
          },
        });
      }

      // Create payment
      const payment = await tx.staffPayment.create({
        data: {
          staffId: dto.staffId,
          amount,
          type: dto.type,
          month: dto.month,
          methodId: dto.methodId,
          accountId: dto.accountId,
          date: this.prisma.getPakistaniDate(dto.date),
          payerName: dto.payerName,
          receiverName: dto.receiverName,
          notes: dto.notes,
        },
      });

      // Update finance record
      const currentPaid = new Prisma.Decimal(finance.salaryPaid.toString());
      const currentAdvance = new Prisma.Decimal(
        finance.advanceTaken.toString(),
      );
      const currentLoan = new Prisma.Decimal(finance.loanTaken.toString());
      const currentRemaining = new Prisma.Decimal(finance.remaining.toString());

      let updateData: any = {};

      if (dto.type === "salary") {
        updateData = {
          salaryPaid: currentPaid.plus(amount),
          remaining: currentRemaining.minus(amount),
        };
      } else if (dto.type === "advance") {
        updateData = {
          advanceTaken: currentAdvance.plus(amount),
          salaryPaid: currentPaid.plus(amount),
          remaining: currentRemaining.minus(amount),
        };
      } else if (dto.type === "loan") {
        updateData = {
          loanTaken: currentLoan.plus(amount),
          salaryPaid: currentPaid.plus(amount),
          remaining: currentRemaining.minus(amount),
        };
      }

      await tx.staffFinance.update({
        where: { id: finance.id },
        data: updateData,
      });

      // Update account balance if account payment
      if (dto.accountId) {
        await tx.account.update({
          where: { id: dto.accountId },
          data: {
            currentBalance: { decrement: amount },
          },
        });
      }

      return payment;
    });

    await this.audit.log("staff", dto.staffId, "payment", null, result);

    // Send WhatsApp Notification
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const method = await this.prisma.paymentMethod.findUnique({ where: { id: dto.methodId } });
    const capitalizedType = dto.type.charAt(0).toUpperCase() + dto.type.slice(1);
    const msg = `👔 *STAFF ${capitalizedType.toUpperCase()} PROCESSED*\n\nStaff: ${staff.name} (${staff.role})\nAmount: Rs. ${amount.toLocaleString()}\nMethod: ${method?.name || 'N/A'}\nMonth: ${dto.month}\nDate: ${dateStr}`;
    await this.whatsapp.sendSystemNotification('staff', msg);

    return result;
  }

  async getStaffLedger(id: number) {
    const staff = await this.findOne(id);
    const payments = await this.prisma.staffPayment.findMany({
      where: { staffId: id },
      orderBy: { date: "desc" },
      include: { method: true, account: true },
    });

    const finance = await this.prisma.staffFinance.findMany({
      where: { staffId: id },
      orderBy: { month: "desc" },
    });

    const totalPaid = finance.reduce(
      (sum, f) => sum.plus(new Prisma.Decimal(f.salaryPaid.toString())),
      new Prisma.Decimal(0),
    );
    const totalAdvance = finance.reduce(
      (sum, f) => sum.plus(new Prisma.Decimal(f.advanceTaken.toString())),
      new Prisma.Decimal(0),
    );
    const totalLoan = finance.reduce(
      (sum, f) => sum.plus(new Prisma.Decimal(f.loanTaken.toString())),
      new Prisma.Decimal(0),
    );
    const totalRemaining = finance.reduce(
      (sum, f) => sum.plus(new Prisma.Decimal(f.remaining.toString())),
      new Prisma.Decimal(0),
    );

    return {
      staff,
      payments,
      finance,
      totalPaid: totalPaid.toString(),
      totalAdvance: totalAdvance.toString(),
      totalLoan: totalLoan.toString(),
      totalRemaining: totalRemaining.toString(),
    };
  }
}
