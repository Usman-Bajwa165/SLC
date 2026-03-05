import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DepartmentsService } from '../departments/departments.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { paginate, paginatedResponse } from '../../common/pagination/pagination.helper';

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
        { name: { contains: q, mode: 'insensitive' } },
        { registrationNo: { contains: q, mode: 'insensitive' } },
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
        orderBy: { createdAt: 'desc' },
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
        financeRecords: { orderBy: { createdAt: 'asc' } },
        payments: {
          include: { method: true, account: true, allocations: true },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException(`Student #${id} not found`);
    return student;
  }

  async create(dto: CreateStudentDto) {
    // Validate department
    const dept = await this.departments.findOne(dto.departmentId);

    // Check registration uniqueness
    const existing = await this.prisma.student.findFirst({ where: { registrationNo: dto.registrationNo } });
    if (existing) throw new ConflictException(`Registration number '${dto.registrationNo}' already exists`);

    // Validate programMode against department offerings
    if (dto.programMode === 'semester' && !dept.offersSem) {
      throw new BadRequestException(`Department '${dept.name}' does not offer semester mode`);
    }
    if (dto.programMode === 'annual' && !dept.offersAnn) {
      throw new BadRequestException(`Department '${dept.name}' does not offer annual mode`);
    }

    // Validate currentSemester
    if (dto.programMode === 'semester' && dto.currentSemester) {
      const totalSems = (dept.yearsDuration || 0) * (dept.semsPerYear || 0);
      if (dto.currentSemester > totalSems) {
        throw new BadRequestException(`currentSemester (${dto.currentSemester}) cannot exceed totalSemesters (${totalSems})`);
      }
    }

    // Get applicable fee structure
    const feeStructure = await this.departments.getActiveFeeStructure(dto.departmentId, dto.programMode);
    const feeDue = dto.initialFeeAmount
      ? new Decimal(dto.initialFeeAmount)
      : feeStructure
      ? new Decimal(feeStructure.feeAmount.toString())
      : new Decimal(0);

    // Build term label
    const termLabel = this.buildTermLabel(dto.programMode, dto.currentSemester);

    const { initialFeeAmount, ...studentData } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          ...studentData,
          enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
        },
      });

      // Create initial finance record
      await tx.studentFinance.create({
        data: {
          studentId: student.id,
          termLabel,
          termType: dto.programMode,
          feeDue,
          feePaid: new Decimal(0),
          advanceTaken: new Decimal(0),
          carryOver: new Decimal(0),
          remaining: feeDue,
        },
      });

      return student;
    });

    await this.audit.log('student', result.id, 'create', null, result);
    return this.findOne(result.id);
  }

  async update(id: number, dto: UpdateStudentDto) {
    const existing = await this.findOne(id);

    // Optimistic concurrency check
    if (dto.version !== undefined && dto.version !== existing.version) {
      throw new ConflictException('Record has been modified by another user. Please refresh and try again.');
    }

    const { version, ...updateData } = dto;
    const updated = await this.prisma.student.update({
      where: { id },
      data: { ...updateData, version: { increment: 1 } },
    });
    await this.audit.log('student', id, 'update', existing, updated);
    return updated;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.prisma.student.update({ where: { id }, data: { isDeleted: true } });
    await this.audit.log('student', id, 'delete', existing, null);
    return { deleted: true };
  }

  // ── Promotion ───────────────────────────────────────────────────────────────
  async promote(id: number) {
    const student = await this.findOne(id);
    const dept = await this.departments.findOne(student.departmentId);

    if (student.programMode !== 'semester') {
      throw new BadRequestException('Promotion (semester increment) is only for semester-mode students');
    }

    const totalSems = (dept.yearsDuration || 0) * (dept.semsPerYear || 0);
    const nextSem = (student.currentSemester || 0) + 1;

    if (nextSem > totalSems) {
      throw new BadRequestException(
        `Cannot promote: student is already at semester ${student.currentSemester} of ${totalSems}. Consider marking as Graduated.`,
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

    // Mark existing finance records as snapshots
    await this.prisma.studentFinance.updateMany({
      where: { studentId: id, isSnapshot: false },
      data: { isSnapshot: true },
    });

    // Get new fee from fee structure
    const feeStructure = await this.departments.getActiveFeeStructure(student.departmentId, 'semester');
    const baseFee = feeStructure ? new Decimal(feeStructure.feeAmount.toString()) : new Decimal(0);
    const newFeeDue = baseFee.plus(totalRemaining);
    const termLabel = this.buildTermLabel('semester', nextSem);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create new term finance
      const newFinance = await tx.studentFinance.create({
        data: {
          studentId: id,
          termLabel,
          termType: 'semester',
          feeDue: newFeeDue,
          feePaid: new Decimal(0),
          advanceTaken: new Decimal(0),
          carryOver: totalRemaining,
          remaining: newFeeDue,
        },
      });

      // Update student semester
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          currentSemester: nextSem,
          status: nextSem === totalSems ? 'promoted' : 'active',
          version: { increment: 1 },
        },
      });

      return { student: updatedStudent, newFinance };
    });

    await this.audit.log('student', id, 'promote', { currentSemester: student.currentSemester }, { currentSemester: nextSem, carryOver: totalRemaining.toString() });
    return result;
  }

  private buildTermLabel(programMode: string, semester?: number): string {
    const year = new Date().getFullYear();
    if (programMode === 'semester') {
      return `${year}-Sem-${semester || 1}`;
    }
    return `${year}-Annual`;
  }
}
