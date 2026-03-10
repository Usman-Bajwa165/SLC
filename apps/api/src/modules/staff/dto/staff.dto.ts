import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export const STAFF_ROLES = [
  "principal",
  "president",
  "manager",
  "admin",
  "teacher",
  "peon",
  "guard",
  "others",
] as const;

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\D/g, ""))
  @Matches(/^\d{13}$/, { message: "CNIC must be exactly 13 digits" })
  cnic: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  contact: string;

  @IsEnum(STAFF_ROLES)
  role: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsDateString()
  joinedDate: string;

  @IsNotEmpty()
  salary: string; // Decimal as string
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.replace(/\D/g, ""))
  @Matches(/^\d{13}$/, { message: "CNIC must be exactly 13 digits" })
  cnic?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsEnum(STAFF_ROLES)
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  effectiveMonth?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  version?: number;
}

export class StaffQueryDto {
  @IsOptional()
  role?: string;

  @IsOptional()
  isActive?: string;

  @IsOptional()
  month?: string;

  @IsOptional()
  q?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 50;
}

export class CreateStaffPaymentDto {
  @IsInt()
  staffId: number;

  @IsNotEmpty()
  amount: string;

  @IsEnum(["salary", "advance", "loan"])
  type: string;

  @IsString()
  @IsNotEmpty()
  month: string; // YYYY-MM format

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
  payerName?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
