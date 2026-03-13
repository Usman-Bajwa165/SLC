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
import { WhatsappService } from "../whatsapp/whatsapp.service";
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
    private whatsapp: WhatsappService,
  ) {}

  async findAll(query: StudentQueryDto) {
    const {
      page = 1,
      limit = 20,
      department,
      session,
      status,
      q,
      startDate,
      endDate,
      currentSemester,
    } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = { isDeleted: false };

    const depId = department ? parseInt(department) : NaN;
    if (!isNaN(depId)) {
      where.departmentId = depId;
    }

    const sessId = session ? parseInt(session) : NaN;
    if (!isNaN(sessId)) {
      where.sessionId = sessId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const sem = currentSemester ? parseInt(currentSemester) : NaN;
    if (!isNaN(sem)) {
      where.currentSemester = sem;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const search = q?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { registrationNo: { contains: search, mode: "insensitive" } },
        { rollNo: { contains: search, mode: "insensitive" } },
        { cnic: { contains: search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          session: { select: { id: true, label: true } },
          financeRecords: {
            where: { isSnapshot: false },
            select: { feePaid: true, feeDue: true, remaining: true },
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
        where: { [field]: dto[field], isDeleted: false },
        include: { department: true },
      });
      if (existing) {
        throw new ConflictException(
          `Student ${existing.name} from ${existing.department.code || existing.department.name} has same ${label} - ${dto[field]}`,
        );
      }

      // Cross-entity CNIC check
      if (field === "cnic") {
        const existingStaff = await this.prisma.staff.findFirst({
          where: { cnic: dto.cnic, isDeleted: false },
        });
        if (existingStaff) {
          throw new ConflictException(
            `Staff member ${existingStaff.name} has same CNIC - ${dto.cnic}`,
          );
        }
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
      receiverName,
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
      let paymentCreated = null;
      if (advancePaid.greaterThan(0) && paymentMethodId && receiptNo) {
        const payment = await tx.payment.create({
          data: {
            studentId: student.id,
            amount: advancePaid,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            methodId: paymentMethodId,
            accountId: accountId || null,
            receiptNo,
            senderName: senderName || null,
            receiverName: receiverName || null,
            notes: senderName
              ? `Sender: ${senderName} | Enrollment Advance`
              : receiverName
                ? `Receiver: ${receiverName} | Enrollment Advance`
                : "Enrollment Advance",
          },
        });
        paymentCreated = payment;

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

      return { student, payment: paymentCreated };
    });

    await this.audit.log("student", result.student.id, "create", null, result.student);
    
    // Send enrollment notification
    await this.whatsapp.sendSystemNotification(
      'enrollment',
      `📚 *NEW STUDENT ENROLLED*\n\nName: ${result.student.name}\nReg No: ${result.student.registrationNo}\nDepartment: ${dept.name}\nProgram: ${dto.programMode}\nFee Due: Rs. ${feeDue.toLocaleString()}\nAdvance Paid: Rs. ${advancePaid.toLocaleString()}\nRemaining: Rs. ${remaining.toLocaleString()}`
    );
    
    // Send student fee payment notification if payment was made
    if (result.payment && advancePaid.greaterThan(0)) {
      const method = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await this.whatsapp.sendSystemNotification(
        'student',
        `🎓 *STUDENT PAYMENT RECEIVED*\n\nStudent: ${result.student.name} (${result.student.registrationNo})\nAmount: Rs. ${advancePaid.toLocaleString()}\nMethod: ${method?.name || 'N/A'}\nReceipt: ${receiptNo}\nDate: ${dateStr}`
      );
    }
    
    return this.findOne(result.student.id);
  }

  async update(id: number, dto: UpdateStudentDto) {
    const existing = await this.findOne(id);

    // Optimistic concurrency check
    if (dto.version !== undefined && dto.version !== existing.version) {
      throw new ConflictException(
        "Record has been modified by another user. Please refresh and try again.",
      );
    }

    // Uniqueness checks for CNIC, Reg No, Roll No
    const checkUpdateUnique = async (
      field: "cnic" | "registrationNo" | "rollNo",
      label: string,
    ) => {
      if (!dto[field] || dto[field] === existing[field]) return;

      const duplicate = await this.prisma.student.findFirst({
        where: { [field]: dto[field], id: { not: id }, isDeleted: false },
        include: { department: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `Another student ${duplicate.name} from ${duplicate.department.code || duplicate.department.name} has same ${label} - ${dto[field]}`,
        );
      }

      if (field === "cnic") {
        const existingStaff = await this.prisma.staff.findFirst({
          where: { cnic: dto.cnic, isDeleted: false },
        });
        if (existingStaff) {
          throw new ConflictException(
            `Staff member ${existingStaff.name} has same CNIC - ${dto.cnic}`,
          );
        }
      }
    };

    await checkUpdateUnique("cnic", "cnic");
    await checkUpdateUnique("registrationNo", "registration no.");
    await checkUpdateUnique("rollNo", "roll no.");

    const {
      version,
      initialFeeAmount,
      advancePaid: _adv,
      paymentMethodId,
      accountId,
      receiptNo,
      senderName,
      receiverName,
      paymentDate,
      currentSemester,
      enrolledAt,
      ...updateData
    } = dto;

    const advancePaid = _adv ? new Decimal(_adv) : new Decimal(0);

    // Validate Receipt No if payment is made
    if (advancePaid.greaterThan(0) && receiptNo) {
      const existingReceipt = await this.prisma.payment.findUnique({
        where: { receiptNo: receiptNo },
        include: { student: { include: { department: true } } },
      });
      if (existingReceipt) {
        throw new ConflictException(
          `A payment with this receipt no. (${receiptNo}) already exists for student ${existingReceipt.student.name} from ${existingReceipt.student.department.code || existingReceipt.student.department.name}`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Handle semester/year change
      if (
        currentSemester !== undefined &&
        currentSemester !== existing.currentSemester
      ) {
        const activeFinance = await tx.studentFinance.findFirst({
          where: { studentId: id, isSnapshot: false },
          orderBy: { createdAt: "desc" },
        });

        if (activeFinance) {
          const oldTerm = existing.currentSemester || 0;
          const newTerm = currentSemester;
          const currentFeeDue = new Decimal(activeFinance.feeDue.toString());
          const currentPaid = new Decimal(activeFinance.feePaid.toString());
          const currentCarryOver = new Decimal(
            activeFinance.carryOver.toString(),
          );
          const currentRemaining = new Decimal(
            activeFinance.remaining.toString(),
          );

          if (newTerm > oldTerm) {
            // Promoted forward - keep fee, add remaining to carryover
            await tx.studentFinance.update({
              where: { id: activeFinance.id },
              data: {
                carryOver: currentCarryOver.plus(currentRemaining),
                remaining: currentFeeDue
                  .plus(currentCarryOver)
                  .plus(currentRemaining)
                  .minus(currentPaid),
              },
            });
          } else if (newTerm < oldTerm) {
            // Demoted backward - keep fee, subtract one term fee from remaining
            const newRemaining = currentRemaining.minus(currentFeeDue);
            await tx.studentFinance.update({
              where: { id: activeFinance.id },
              data: {
                remaining: newRemaining.greaterThan(0)
                  ? newRemaining
                  : new Decimal(0),
              },
            });
          }
        }
      }

      const updated = await tx.student.update({
        where: { id },
        data: {
          ...updateData,
          currentSemester,
          ...(enrolledAt && { enrolledAt: new Date(enrolledAt) }),
          version: { increment: 1 },
        },
      });

      // Find the active student finance
      const activeFinance = await tx.studentFinance.findFirst({
        where: { studentId: id, isSnapshot: false },
        orderBy: { createdAt: "desc" },
      });

      // Update fee if initialFeeAmount is provided
      if (initialFeeAmount && activeFinance) {
        const newFeeDue = new Decimal(initialFeeAmount);
        const currentPaid = new Decimal(activeFinance.feePaid.toString());
        const currentCarryOver = new Decimal(
          activeFinance.carryOver.toString(),
        );
        const newRemaining = newFeeDue
          .plus(currentCarryOver)
          .minus(currentPaid);

        await tx.studentFinance.update({
          where: { id: activeFinance.id },
          data: {
            feeDue: newFeeDue,
            remaining: newRemaining,
          },
        });
      }

      // If there is an advance payment provided during update,
      // log it against the student's active StudentFinance record.
      let paymentCreated = null;
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

        if (!activeFinance) {
          throw new BadRequestException(
            "No active finance record found for this student",
          );
        }

        const payment = await tx.payment.create({
          data: {
            studentId: id,
            amount: advancePaid,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            methodId: paymentMethodId,
            accountId: accountId || null,
            receiptNo,
            senderName: senderName || null,
            receiverName: receiverName || null,
            notes: senderName
              ? `Sender: ${senderName}`
              : receiverName
                ? `Receiver: ${receiverName}`
                : "Payment from Profile Update",
          },
        });
        paymentCreated = payment;

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

        // Update target account balance
        if (accountId) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: { increment: advancePaid } },
          });
        }
      }

      return { updated, payment: paymentCreated };
    });

    await this.audit.log("student", id, "update", existing, result.updated);
    
    // Send student fee payment notification if payment was made
    if (result.payment && advancePaid.greaterThan(0)) {
      const method = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await this.whatsapp.sendSystemNotification(
        'student',
        `🎓 *STUDENT PAYMENT RECEIVED*\n\nStudent: ${existing.name} (${existing.registrationNo})\nAmount: Rs. ${advancePaid.toLocaleString()}\nMethod: ${method?.name || 'N/A'}\nReceipt: ${receiptNo}\nDate: ${dateStr}`
      );
    }
    
    return result.updated;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.prisma.student.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.audit.log("student", id, "delete", existing, null);
    
    // Send deactivation notification
    await this.whatsapp.sendSystemNotification(
      'deactivation',
      `🚫 *STUDENT DEACTIVATED*\n\nName: ${existing.name}\nReg No: ${existing.registrationNo}\nDepartment: ${existing.department.name}\nStatus: Deactivated`
    );
    
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

    // Check if student is at last term - should graduate instead
    if (nextTerm > totalTerms) {
      // Check for outstanding dues
      const activeFinance = await this.prisma.studentFinance.findMany({
        where: { studentId: id, isSnapshot: false },
      });

      const totalRemaining = activeFinance.reduce(
        (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
        new Decimal(0),
      );

      if (totalRemaining.greaterThan(0)) {
        throw new BadRequestException(
          `Cannot graduate: student has outstanding dues of PKR ${totalRemaining.toString()}. Please clear all dues before graduation.`,
        );
      }

      // Mark as graduated
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.studentFinance.updateMany({
          where: { studentId: id, isSnapshot: false },
          data: { isSnapshot: true },
        });

        const updatedStudent = await tx.student.update({
          where: { id },
          data: {
            status: "graduated",
            version: { increment: 1 },
          },
        });

        return updatedStudent;
      });

      await this.audit.log(
        "student",
        id,
        "graduate",
        { status: student.status },
        { status: "graduated" },
      );
      return result;
    }

    // Compute carryover from all non-snapshot finance records
    const activeFinance = await this.prisma.studentFinance.findMany({
      where: { studentId: id, isSnapshot: false },
      orderBy: { createdAt: "desc" },
    });

    const totalRemaining = activeFinance.reduce(
      (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
      new Decimal(0),
    );

    // Use previous term's fee as base fee for new term
    const previousTermFee =
      activeFinance.length > 0
        ? new Decimal(activeFinance[0].feeDue.toString())
        : new Decimal(0);

    // If no previous fee, get from fee structure
    let baseFee = previousTermFee;
    if (baseFee.isZero()) {
      const feeStructure = await this.departments.getActiveFeeStructure(
        student.departmentId,
        student.programMode,
      );
      baseFee = feeStructure
        ? new Decimal(feeStructure.feeAmount.toString())
        : new Decimal(0);
    }

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

  async notifyStudent(id: number) {
    const student = await this.findOne(id);
    
    // Calculate outstanding
    const activeFinance = await this.prisma.studentFinance.findMany({
      where: { studentId: id, isSnapshot: false },
    });

    const outstanding = activeFinance.reduce(
      (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
      new Decimal(0),
    );

    if (outstanding.lte(0)) {
      throw new BadRequestException('Student has no outstanding dues');
    }

    if (!student.contact || student.contact.length < 10) {
      throw new BadRequestException('Student has no valid contact number');
    }

    // Send WhatsApp message directly to student
    const message = `🎓 *FEE REMINDER - STARS LAW COLLEGE*\n\nDear ${student.name},\n\nThis is a reminder regarding your outstanding fee dues.\n\n📋 Details:\nReg No: ${student.registrationNo}\nDepartment: ${student.department.name}\nOutstanding Amount: Rs. ${outstanding.toLocaleString()}\n\n⚠️ Please clear your dues at the earliest to avoid any inconvenience.\n\nThank you!`;
    
    const sent = await this.whatsapp.sendMessage(student.contact, message);
    
    if (!sent) {
      throw new BadRequestException('Failed to send WhatsApp message. Please check if WhatsApp is connected.');
    }

    return { success: true, message: 'Notification sent successfully' };
  }

  async notifyAll(studentIds: number[]) {
    if (!studentIds || studentIds.length === 0) {
      throw new BadRequestException('No students selected');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of studentIds) {
      try {
        const student = await this.prisma.student.findFirst({
          where: { id, isDeleted: false },
          include: {
            department: true,
            financeRecords: { where: { isSnapshot: false } },
          },
        });

        if (!student) {
          results.failed++;
          results.errors.push(`Student #${id} not found`);
          continue;
        }

        const outstanding = student.financeRecords.reduce(
          (sum, f) => sum.plus(new Decimal(f.remaining.toString())),
          new Decimal(0),
        );

        if (outstanding.lte(0)) {
          results.failed++;
          results.errors.push(`${student.name}: No outstanding dues`);
          continue;
        }

        if (!student.contact || student.contact.length < 10) {
          results.failed++;
          results.errors.push(`${student.name}: No valid contact number`);
          continue;
        }

        const message = `🎓 *FEE REMINDER - STARS LAW COLLEGE*\n\nDear ${student.name},\n\nThis is a reminder regarding your outstanding fee dues.\n\n📋 Details:\nReg No: ${student.registrationNo}\nDepartment: ${student.department.name}\nOutstanding Amount: Rs. ${outstanding.toLocaleString()}\n\n⚠️ Please clear your dues at the earliest to avoid any inconvenience.\n\nThank you!`;
        
        const sent = await this.whatsapp.sendMessage(student.contact, message);
        
        if (sent) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${student.name}: Failed to send message`);
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push(`Student #${id}: ${error.message}`);
      }
    }

    return results;
  }
}
