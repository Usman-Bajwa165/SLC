import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/session.dto';

@Controller()
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('departments/:deptId/sessions')
  findByDepartment(@Param('deptId', ParseIntPipe) deptId: number) {
    return this.service.findByDepartment(deptId);
  }

  @Post('departments/:deptId/sessions')
  create(@Param('deptId', ParseIntPipe) deptId: number, @Body() dto: CreateSessionDto) {
    return this.service.create({ ...dto, departmentId: deptId });
  }

  @Put('sessions/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateSessionDto>) {
    return this.service.update(id, dto);
  }

  @Delete('sessions/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
