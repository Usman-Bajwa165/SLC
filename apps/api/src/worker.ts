/**
 * Background worker entrypoint.
 * Runs BullMQ processors for receipt generation and scheduled reports.
 */
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { ReceiptProcessor } from './common/workers/receipt.processor';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    BullModule.forRoot({ redis: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') } }),
    BullModule.registerQueue({ name: 'receipts' }),
    PrismaModule,
    StorageModule,
  ],
  providers: [ReceiptProcessor],
})
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
  await app.init();
  console.log('🔧 SLC Worker running — processing receipt queue');
}

bootstrap();
