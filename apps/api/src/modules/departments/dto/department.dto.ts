import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsNotEmpty,
  MaxLength,
} from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsBoolean()
  @IsOptional()
  offersSem?: boolean = false;

  @IsBoolean()
  @IsOptional()
  offersAnn?: boolean = false;

  @IsInt()
  @Min(1)
  @IsOptional()
  semsPerYear?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  yearsDuration?: number;

  @IsOptional()
  feeStructures?: any[];
}

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  offersSem?: boolean;

  @IsBoolean()
  @IsOptional()
  offersAnn?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  semsPerYear?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  totalSemesters?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  yearsDuration?: number;
}

export class CreateFeeStructureDto {
  @IsInt()
  departmentId: number;

  @IsString()
  @IsNotEmpty()
  programMode: string; // 'semester' | 'annual'

  @IsNotEmpty()
  feeAmount: string; // Decimal as string to avoid float issues

  @IsOptional()
  effectiveFrom?: string;

  @IsOptional()
  effectiveTo?: string;
}
