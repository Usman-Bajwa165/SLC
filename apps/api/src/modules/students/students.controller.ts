import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { FinanceService } from '../finance/finance.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly service: StudentsService,
    private readonly finance: FinanceService,
  ) {}

  @Get()
  findAll(@Query() query: StudentQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id/finance')
  getFinance(@Param('id', ParseIntPipe) id: number) {
    return this.finance.getStudentFinance(id);
  }

  @Post(':id/finance')
  createFinanceTerm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.finance.createTerm(id, dto);
  }

  @Post(':id/promote')
  promote(@Param('id', ParseIntPipe) id: number) {
    return this.service.promote(id);
  }

  @Post(':id/notify')
  notifyStudent(@Param('id', ParseIntPipe) id: number) {
    return this.service.notifyStudent(id);
  }

  @Post('notify-all')
  notifyAll(@Body() dto: { studentIds: number[] }) {
    return this.service.notifyAll(dto.studentIds);
  }
}
