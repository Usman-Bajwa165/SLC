import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    FinanceModule,
    BullModule.registerQueue({ name: 'receipts' }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
