import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Decimal } from "decimal.js";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { DepartmentsService } from "../departments/departments.service";
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
} from "./dto/student.dto";
import {
  paginate,
  paginatedResponse,
} from "../../common/pagination/pagination.helper";

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private departments: DepartmentsService,
  ) {}

  async findAll(query: StudentQueryDto) {
    const { page = 1, limit = 20, department, session, status, q } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = { isDeleted: false };
    if (department) where.departmentId = parseInt(department);
    if (session) where.sessionId = parseInt(session);
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { registrationNo: { contains: q, mode: "insensitive" } },
      ];
    }

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          department: { select: { id: true, name: true, code: true } },
          session: { select: { id: true, label: true } },
          financeRecords: {
            where: { isSnapshot: false },
            select: { remaining: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.student.count({ where }),
    ]);

    return paginatedResponse(students, total, page, limit);
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findFirst({
      where: { id, isDeleted: false },
      include: {
        department: true,
        session: true,
        financeRecords: { orderBy: { createdAt: "asc" } },
        payments: {
          include: { method: true, account: true, allocations: true },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!student) throw new NotFoundException(`Student #${id} not found`);
    return student;
  }

  async create(dto: CreateStudentDto) {
    // Validate department
    const dept = await this.departments.findOne(dto.departmentId);

    // ── Uniqueness Checks ──
    const checkUnique = async (
      field: "cnic" | "registrationNo" | "rollNo",
      label: string,
    ) => {
      if (!dto[field]) return;
      const existing = await this.prisma.student.findFirst({
        where: { [field]: dto[field] },
        include: { department: true },
      });
      if (existing) {
        throw new ConflictException(
          `Student ${existing.name} from ${existing.department.code || existing.department.name} has same ${label} - ${dto[field]}`,
        );
      }
    };
    await checkUnique("cnic", "cnic");
    await checkUnique("registrationNo", "registration no.");
    await checkUnique("rollNo", "roll no.");

    // Validate Receipt No
    if (dto.receiptNo) {
      const existingReceipt = await this.prisma.payment.findUnique({
        where: { receiptNo: dto.receiptNo },
        include: { student: { include: { department: true } } },
      });
      if (existingReceipt) {
        throw new ConflictException(
          `Student ${existingReceipt.student.name} from ${existingReceipt.student.department.code || existingReceipt.student.department.name} has same receipt no. - ${dto.receiptNo}`,
        );
      }
    }

    // Validate programMode against department offerings
    if (dto.programMode === "semester" && !dept.offersSem) {
      throw new BadRequestException(
        `Department '${dept.name}' does not offer semester mode`,
      );
    }
    if (dto.programMode === "annual" && !dept.offersAnn) {
      throw new BadRequestException(
        `Department '${dept.name}' does not offer annual mode`,
      );
    }

    // Validate currentSemester
    if (dto.programMode === "semester" && dto.currentSemester) {
      const totalSems = (dept.yearsDuration || 0) * (dept.semsPerYear || 0);
      if (dto.currentSemester > totalSems) {
        throw new BadRequestException(
          `currentSemester (${dto.currentSemester}) cannot exceed totalSemesters (${totalSems})`,
        );
      }
    }

    // Get applicable fee structure
    const feeStructure = await this.departments.getActiveFeeStructure(
      dto.departmentId,
      dto.programMode,
    );
    const feeDue = dto.initialFeeAmount
      ? new Decimal(dto.initialFeeAmount)
      : feeStructure
        ? new Decimal(feeStructure.feeAmount.toString())
        : new Decimal(0);

    const advancePaid = dto.advancePaid
      ? new Decimal(dto.advancePaid)
      : new Decimal(0);
    const remaining = feeDue.minus(advancePaid);

    if (advancePaid.greaterThan(0)) {
      if (!dto.paymentMethodId) {
        throw new BadRequestException(
          "paymentMethodId is required when advance payment is made",
        );
      }
      if (!dto.receiptNo) {
        throw new BadRequestException(
          "receiptNo is required when advance payment is made",
        );
      }
    }

    // Build term label
    const termLabel = this.buildTermLabel(dto.programMode, dto.currentSemester);

    const {
      initialFeeAmount,
      advancePaid: _adv,
      paymentMethodId,
      accountId,
      receiptNo,
      senderName,
      paymentDate,
      ...studentData
    } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          ...studentData,
          enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
        },
      });

      // Create initial finance record
      const finance = await tx.studentFinance.create({
        data: {
          studentId: student.id,
          termLabel,
          termType: dto.programMode,
          feeDue,
          feePaid: advancePaid,
          advanceTaken: advancePaid,
          carryOver: new Decimal(0),
          remaining,
        },
      });

      // Process payment if advance was paid
      if (advancePaid.greaterThan(0) && paymentMethodId && receiptNo) {
        const payment = await tx.payment.create({
          data: {
            studentId: student.id,
            amount: advancePaid,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            methodId: paymentMethodId,
            accountId: accountId || null,
            receiptNo,
            notes: senderName ? `Sender: ${senderName}` : "Enrollment Advance",
          },
        });

        // Allocate payment to finance term
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            studentFinanceId: finance.id,
            allocatedAmount: advancePaid,
          },
        });

        // Update target account balance
        if (accountId) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: { increment: advancePaid } },
          });
        }
      }

      return student;
    });

    await this.audit.log("student", result.id, "create", null, result);
    return this.findOne(result.id);
  }

  async update(id: number, dto: UpdateStudentDto) {
    const existing = await this.findOne(id);

    // Optimistic concurrency check
    if (dto.version !== undefined && dto.version !== existing.version) {
      throw new ConflictException(
        "Record has been modified by another user. Please refresh and try again.",
      );
    }

    const {
      version,
      initialFeeAmount,
      advancePaid: _adv,
      paymentMethodId,
      accountId,
      receiptNo,
      senderName,
      paymentDate,
      ...updateData
    } = dto;

    const advancePaid = _adv ? new Decimal(_adv) : new Decimal(0);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: { ...updateData, version: { increment: 1 } },
      });

      // If there is an advance payment provided during update,
      // log it against the student's active StudentFinance record.
      if (advancePaid.greaterThan(0)) {
        if (!paymentMethodId) {
          throw new BadRequestException(
            "paymentMethodId is required when making a payment",
          );
        }
        if (!receiptNo) {
          throw new BadRequestException(
            "receiptNo is required when making a payment",
          );
        }

        // Find the active student finance
        const activeFinance = await tx.studentFinance.findFirst({
          where: { studentId: id, isSnapshot: false },
          orderBy: { createdAt: "desc" },
        });

        const payment = await tx.payment.create({
          data: {
            studentId: id,
            amount: advancePaid,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            methodId: paymentMethodId,
            accountId: accountId || null,
            receiptNo,
            notes: senderName
              ? `Sender: ${senderName}`
              : "Payment from Profile Update",
          },
        });

        if (activeFinance) {
          // Update the finance record by applying the payment
          await tx.studentFinance.update({
            where: { id: activeFinance.id },
            data: {
              feePaid: { increment: advancePaid },
              advanceTaken: { increment: advancePaid },
              remaining: { decrement: advancePaid },
            },
          });

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              studentFinanceId: activeFinance.id,
              allocatedAmount: advancePaid,
            },
          });
        }

        // Update target account balance
        if (accountId) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: { increment: advancePaid } },
          });
        }
      }

      return updated;
    });

    await this.audit.log("student", id, "update", existing, result);
    return result;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.prisma.student.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.audit.log("student", id, "delete", existing, null);
    return { deleted: true };
  }

  // ── Promotion ───────────────────────────────────────────────────────────────
  async promote(id: number) {
    const student = await this.findOne(id);
    const dept = await this.departments.findOne(student.departmentId);

    const totalTerms =
      student.programMode === "semester"
        ? (dept.yearsDuration || 0) * (dept.semsPerYear || 0)
        : dept.yearsDuration || 0;

    const currentTerm = student.currentSemester || 0;
    const nextTerm = currentTerm + 1;

    if (nextTerm > totalTerms) {
      throw new BadRequestException(
        `Cannot promote: student is already at term ${currentTerm} of ${totalTerms}. Consider marking as Graduated.`,
      );
    }

    // Compute carryover from all non-snapshot finance records
    const activeFinance = await this.prisma.studentFinance.findMany({
      where: { studentId: id, isSnapshot: false },
    });

    const totalRemaining = activeFinance.reduce(
      (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
      new Decimal(0),
    );

    // Get new fee from fee structure
    const feeStructure = await this.departments.getActiveFeeStructure(
      student.departmentId,
      student.programMode,
    );
    const baseFee = feeStructure
      ? new Decimal(feeStructure.feeAmount.toString())
      : new Decimal(0);
    const newFeeDue = baseFee;
    const totalRemainingForTerm = baseFee.plus(totalRemaining);
    const termLabel = this.buildTermLabel(student.programMode, nextTerm);

    const result = await this.prisma.$transaction(async (tx) => {
      // Mark existing finance records as snapshots
      await tx.studentFinance.updateMany({
        where: { studentId: id, isSnapshot: false },
        data: { isSnapshot: true },
      });

      // Create new term finance
      const newFinance = await tx.studentFinance.create({
        data: {
          studentId: id,
          termLabel,
          termType: student.programMode,
          feeDue: newFeeDue,
          feePaid: new Decimal(0),
          advanceTaken: new Decimal(0), // Advance resets
          carryOver: totalRemaining, // Past dues added here
          remaining: totalRemainingForTerm,
        },
      });

      // Update student semester
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          currentSemester: nextTerm,
          status: nextTerm === totalTerms ? "promoted" : "active",
          version: { increment: 1 },
        },
      });

      return { student: updatedStudent, newFinance };
    });

    await this.audit.log(
      "student",
      id,
      "promote",
      { currentSemester: currentTerm },
      { currentSemester: nextTerm, carryOver: totalRemaining.toString() },
    );
    return result;
  }

  private buildTermLabel(programMode: string, semester?: number): string {
    const year = new Date().getFullYear();
    if (programMode === "semester") {
      return `${year}-Sem-${semester || 1}`;
    }
    return `${year}-Annual`;
  }
}
