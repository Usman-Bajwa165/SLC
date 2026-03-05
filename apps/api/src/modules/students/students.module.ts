import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { DepartmentsModule } from '../departments/departments.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [DepartmentsModule, FinanceModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
