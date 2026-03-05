import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Generate the next receipt number in format SLC-YYYY-XXXXX
   * Uses a PostgreSQL sequence for atomicity
   */
  async nextReceiptNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = process.env.RECEIPT_PREFIX || 'SLC';
    const result = await this.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('receipt_seq')
    `;
    const seq = result[0].nextval.toString().padStart(5, '0');
    return `${prefix}-${year}-${seq}`;
  }
}
