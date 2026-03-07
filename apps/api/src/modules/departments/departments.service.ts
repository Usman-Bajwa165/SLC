import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateFeeStructureDto,
} from "./dto/department.dto";

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.department.findMany({
      where: { isDeleted: false },
      include: {
        feeStructures: true,
        _count: { select: { students: true, sessions: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: number) {
    const dept = await this.prisma.department.findFirst({
      where: { id, isDeleted: false },
      include: {
        feeStructures: { orderBy: { createdAt: "desc" } },
        sessions: { orderBy: { startYear: "desc" } },
        _count: { select: { students: true } },
      },
    });
    if (!dept) throw new NotFoundException(`Department #${id} not found`);
    return dept;
  }

  async create(dto: CreateDepartmentDto) {
    this.validateDepartmentConfig(dto);

    const { feeStructures, ...data } = dto;

    if (data.code) {
      const existing = await this.prisma.department.findFirst({
        where: { code: data.code },
      });
      if (existing)
        throw new ConflictException(
          `Department code '${data.code}' already exists`,
        );
    }

    const dept = await this.prisma.department.create({
      data: {
        ...data,
        feeStructures:
          feeStructures && feeStructures.length > 0
            ? { create: feeStructures }
            : undefined,
      },
      include: { feeStructures: true },
    });
    await this.audit.log("department", dept.id, "create", null, dept);
    return dept;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const existing = await this.findOne(id);
    const { feeStructures, ...data } = dto;

    // Check if changing config affects enrolled students
    const configChanged =
      (data.offersSem !== undefined && data.offersSem !== existing.offersSem) ||
      (data.offersAnn !== undefined && data.offersAnn !== existing.offersAnn) ||
      (data.semsPerYear !== undefined &&
        data.semsPerYear !== existing.semsPerYear) ||
      (data.yearsDuration !== undefined &&
        data.yearsDuration !== existing.yearsDuration);

    if (configChanged) {
      const activeStudents = await this.prisma.student.count({
        where: { departmentId: id, isDeleted: false, status: "active" },
      });
      if (activeStudents > 0) {
        // Return migration warning info — client will show the migration modal
        return {
          requiresMigration: true,
          affectedStudents: activeStudents,
          proposed: dto,
          message: `This change affects ${activeStudents} active student(s). Use the migration endpoint to apply.`,
        };
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update department
      await tx.department.update({
        where: { id },
        data,
      });

      // Update fee structures if provided
      if (feeStructures && feeStructures.length > 0) {
        // Delete existing fee structures
        await tx.feeStructure.deleteMany({ where: { departmentId: id } });
        // Create new ones
        await tx.feeStructure.createMany({
          data: feeStructures.map((f: any) => ({ ...f, departmentId: id })),
        });
      }

      return tx.department.findFirst({
        where: { id },
        include: { feeStructures: true },
      });
    });

    if (updated) {
      await this.audit.log("department", id, "update", existing, updated);
      return updated;
    }
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    const studentCount = await this.prisma.student.count({
      where: { departmentId: id, isDeleted: false },
    });
    if (studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete department with ${studentCount} enrolled student(s).`,
      );
    }
    const sessionCount = await this.prisma.session.count({
      where: { departmentId: id },
    });
    if (sessionCount > 0) {
      throw new BadRequestException(
        `Cannot delete department with ${sessionCount} linked session(s). Delete sessions first.`,
      );
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.audit.log("department", id, "delete", existing, null);
    return updated;
  }

  // ── Fee Structures ──────────────────────────────────────────────────────────

  async getFeeStructures(departmentId: number) {
    await this.findOne(departmentId);
    return this.prisma.feeStructure.findMany({
      where: { departmentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createFeeStructure(dto: CreateFeeStructureDto) {
    await this.findOne(dto.departmentId);
    const fs = await this.prisma.feeStructure.create({ data: dto });
    await this.audit.log("fee_structure", fs.id, "create", null, fs);
    return fs;
  }

  async getActiveFeeStructure(departmentId: number, programMode: string) {
    const now = new Date();
    return this.prisma.feeStructure.findFirst({
      where: {
        departmentId,
        programMode,
        OR: [
          { effectiveFrom: null, effectiveTo: null },
          { effectiveFrom: { lte: now }, effectiveTo: null },
          { effectiveFrom: null, effectiveTo: { gte: now } },
          { effectiveFrom: { lte: now }, effectiveTo: { gte: now } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async getMigrationPreview(id: number) {
    const dept = await this.findOne(id);
    const students = await this.prisma.student.findMany({
      where: { departmentId: id, isDeleted: false },
      select: {
        id: true,
        name: true,
        registrationNo: true,
        programMode: true,
        currentSemester: true,
        status: true,
      },
    });
    return { department: dept, affectedStudents: students };
  }

  private validateDepartmentConfig(
    dto: CreateDepartmentDto | UpdateDepartmentDto,
  ) {
    if ("offersSem" in dto && dto.offersSem) {
      if (!dto.semsPerYear)
        throw new BadRequestException(
          "semsPerYear is required when offersSem is true",
        );
      if (!dto.yearsDuration)
        throw new BadRequestException(
          "yearsDuration is required when offersSem is true",
        );
    }
    if ("offersAnn" in dto && dto.offersAnn) {
      if (!dto.yearsDuration)
        throw new BadRequestException(
          "yearsDuration is required when offersAnn is true",
        );
    }
    if ("offersSem" in dto && "offersAnn" in dto) {
      if (!dto.offersSem && !dto.offersAnn) {
        throw new BadRequestException(
          "Department must offer at least one program mode (semester or annual)",
        );
      }
    }
  }
}
