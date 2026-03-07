import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { OtherFinanceService } from "./other-finance.service";
import {
  CreateOtherTransactionDto,
  OtherTransactionQueryDto,
} from "./dto/other-transaction.dto";

@Controller("finance/other")
export class OtherFinanceController {
  constructor(private readonly service: OtherFinanceService) {}

  @Post()
  create(@Body() dto: CreateOtherTransactionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: OtherTransactionQueryDto) {
    return this.service.findAll(query);
  }

  @Get("categories")
  getCategories() {
    return this.service.getCategories();
  }
}
