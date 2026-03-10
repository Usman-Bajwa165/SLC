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
import { StaffService } from "./staff.service";
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  CreateStaffPaymentDto,
} from "./dto/staff.dto";

@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list(@Query() query: StaffQueryDto) {
    return this.staffService.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }

  @Post("payments")
  createPayment(@Body() dto: CreateStaffPaymentDto) {
    return this.staffService.createPayment(dto);
  }

  @Get(":id/ledger")
  getStaffLedger(@Param("id", ParseIntPipe) id: number) {
    return this.staffService.getStaffLedger(id);
  }
}
