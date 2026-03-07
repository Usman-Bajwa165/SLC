import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateSessionDto } from "./dto/session.dto";

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.session.findMany({
      include: {
        department: true,
        _count: { select: { students: true } },
      },
      orderBy: { startYear: "desc" },
    });
  }

  async findByDepartment(departmentId: number) {
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, isDeleted: false },
    });
    if (!dept)
      throw new NotFoundException(`Department #${departmentId} not found`);
    return this.prisma.session.findMany({
      where: { departmentId },
      include: { _count: { select: { students: true } } },
      orderBy: { startYear: "desc" },
    });
  }

  async findOne(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { department: true, _count: { select: { students: true } } },
    });
    if (!session) throw new NotFoundException(`Session #${id} not found`);
    return session;
  }

  async create(dto: CreateSessionDto) {
    if (dto.endYear <= dto.startYear) {
      throw new BadRequestException("endYear must be greater than startYear");
    }
    const session = await this.prisma.session.create({ data: dto });
    await this.audit.log("session", session.id, "create", null, session);
    return session;
  }

  async update(id: number, dto: Partial<CreateSessionDto>) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.session.update({
      where: { id },
      data: dto,
    });
    await this.audit.log("session", id, "update", existing, updated);
    return updated;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    const studentCount = await this.prisma.student.count({
      where: { sessionId: id, isDeleted: false },
    });
    if (studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete session with ${studentCount} enrolled student(s).`,
      );
    }
    await this.prisma.session.delete({ where: { id } });
    await this.audit.log("session", id, "delete", existing, null);
    return { deleted: true };
  }
}
