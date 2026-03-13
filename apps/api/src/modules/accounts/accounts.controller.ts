import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { CreatePaymentMethodDto, CreateAccountDto } from "./dto/account.dto";

@Controller()
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get("payment-methods")
  findAllMethods() {
    return this.service.findAllMethods();
  }

  @Post("payment-methods")
  createMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.service.createMethod(dto);
  }

  @Get("accounts")
  findAllAccounts() {
    return this.service.findAllAccounts();
  }

  @Get("accounts/:id")
  findOneAccount(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOneAccount(id);
  }

  @Post("accounts")
  createAccount(@Body() dto: CreateAccountDto) {
    return this.service.createAccount(dto);
  }

  @Put("accounts/:id")
  updateAccount(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAccountDto>,
  ) {
    return this.service.updateAccount(id, dto);
  }

  @Delete("accounts/:id")
  removeAccount(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get("accounts/:id/ledger")
  getAccountLedger(
    @Param("id", ParseIntPipe) id: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getAccountLedger(id, from, to);
  }

  @Post("cash/adjust")
  adjustCashBalance(@Body() dto: { currentBalance: number }) {
    return this.service.adjustCashBalance(dto.currentBalance);
  }
}
