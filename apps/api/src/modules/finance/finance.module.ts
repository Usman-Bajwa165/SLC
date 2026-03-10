import { Module } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { OtherFinanceService } from "./other-finance.service";
import { OtherFinanceController } from "./other-finance.controller";
import { WhatsappModule } from "../whatsapp/whatsapp.module";

@Module({
  imports: [WhatsappModule],
  controllers: [OtherFinanceController],
  providers: [FinanceService, OtherFinanceService],
  exports: [FinanceService, OtherFinanceService],
})
export class FinanceModule {}
