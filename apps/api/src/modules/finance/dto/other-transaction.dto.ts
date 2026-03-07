import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";

export class CreateOtherTransactionDto {
  @IsEnum(["income", "expense"])
  type: "income" | "expense";

  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  accountId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class OtherTransactionQueryDto {
  @IsOptional()
  @IsEnum(["income", "expense"])
  type?: "income" | "expense";

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
