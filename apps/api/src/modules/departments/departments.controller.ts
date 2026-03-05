import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateFeeStructureDto } from './dto/department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ── Fee Structures ──────────────────────────────────────────────────────────

  @Get(':id/fee-structures')
  getFeeStructures(@Param('id', ParseIntPipe) id: number) {
    return this.service.getFeeStructures(id);
  }

  @Post('fee-structures')
  createFeeStructure(@Body() dto: CreateFeeStructureDto) {
    return this.service.createFeeStructure(dto);
  }

  @Get(':id/migration-preview')
  getMigrationPreview(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMigrationPreview(id);
  }
}
