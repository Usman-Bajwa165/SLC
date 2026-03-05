import {
  Controller, Get, Post, Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentQueryDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
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
  create(@Body() dto: CreatePaymentDto) {
    return this.service.create(dto);
  }

  @Get(':id/receipt')
  getReceipt(@Param('id', ParseIntPipe) id: number) {
    return this.service.getReceiptUrl(id);
  }
}
