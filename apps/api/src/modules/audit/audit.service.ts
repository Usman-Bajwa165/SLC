import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    entity: string,
    entityId: number | null,
    action: string,
    before: any,
    after: any,
    actor = 'system',
  ) {
    return this.prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        before: before ? JSON.parse(JSON.stringify(before, (_, v) => typeof v === 'bigint' ? v.toString() : v)) : null,
        after: after ? JSON.parse(JSON.stringify(after, (_, v) => typeof v === 'bigint' ? v.toString() : v)) : null,
        actor,
      },
    });
  }

  async findMany(filters: { entity?: string; entityId?: number; limit?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.entityId && { entityId: filters.entityId }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }
}
