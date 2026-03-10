import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["warn", "error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Ensure the receipt sequence exists
    await this.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS receipt_seq START 1`,
    );
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
    const prefix = process.env.RECEIPT_PREFIX || "SLC";
    const result = await this.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('receipt_seq')
    `;
    const seq = result[0].nextval.toString().padStart(5, "0");
    return `${prefix}-${year}-${seq}`;
  }

  /**
   * Returns a Date object in Pakistani Timezone (UTC+5)
   * If input is provided (YYYY-MM-DD), it combines it with current time to preserve the recording second.
   */
  getPakistaniDate(input?: string): Date {
    const tz = "Asia/Karachi";
    const now = dayjs().tz(tz);

    if (input) {
      // If input is YYYY-MM-DD, merge with current HH:mm:ss.SSS
      return dayjs(input)
        .set("hour", now.hour())
        .set("minute", now.minute())
        .set("second", now.second())
        .set("millisecond", now.millisecond())
        .toDate();
    }

    return now.toDate();
  }
}
