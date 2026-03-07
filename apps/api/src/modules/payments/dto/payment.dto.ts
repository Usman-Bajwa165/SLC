import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
} from "class-validator";

export class CreatePaymentDto {
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  amount: string; // Decimal as string

  @IsInt()
  methodId: number;

  @IsInt()
  @IsOptional()
  accountId?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Optional manual allocation overrides (skip for FIFO default)
  @IsArray()
  @IsOptional()
  allocations?: { financeId: number; amount: string }[];
}

export class PaymentQueryDto {
  @IsOptional()
  studentId?: string;

  @IsOptional()
  accountId?: string;

  @IsOptional()
  methodId?: string;

  @IsOptional()
  dateFrom?: string;

  @IsOptional()
  dateTo?: string;

  @IsOptional()
  q?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
