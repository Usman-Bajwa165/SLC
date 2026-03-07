import { Module } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { OtherFinanceService } from "./other-finance.service";
import { OtherFinanceController } from "./other-finance.controller";

@Module({
  controllers: [OtherFinanceController],
  providers: [FinanceService, OtherFinanceService],
  exports: [FinanceService, OtherFinanceService],
})
export class FinanceModule {}
