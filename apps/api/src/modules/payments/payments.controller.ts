import {
  Controller, Get, Post, Body, Param, Query, ParseIntPipe, Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentQueryDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly service: PaymentsService) {}

  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    this.logger.log('🔵 POST /payments endpoint hit');
    this.logger.log(`Payment data: ${JSON.stringify(dto)}`);
    const result = await this.service.create(dto);
    this.logger.log('✅ Payment created and returned');
    return result;
  }

  @Get(':id/receipt')
  getReceipt(@Param('id', ParseIntPipe) id: number) {
    return this.service.getReceiptUrl(id);
  }
}
