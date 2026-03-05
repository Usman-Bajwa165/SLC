import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString,
  IsNumber, Min, Max, MaxLength, Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const PROGRAM_MODES = ['semester', 'annual'] as const;
export const STUDENT_STATUSES = ['active', 'promoted', 'graduated', 'left'] as const;

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  parentGuardian: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\D/g, '')) // strip non-digits
  @Matches(/^\d{13}$/, { message: 'CNIC must be exactly 13 digits' })
  cnic: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNo: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  rollNo?: string;

  @IsInt()
  departmentId: number;

  @IsInt()
  @IsOptional()
  sessionId?: number;

  @IsEnum(PROGRAM_MODES)
  programMode: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  currentSemester?: number;

  @IsDateString()
  @IsOptional()
  enrolledAt?: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  cgpa?: number;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  sgpa?: number;

  // Initial finance — fee amount can be passed at registration time
  @IsOptional()
  initialFeeAmount?: string;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  parentGuardian?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.replace(/\D/g, ''))
  @Matches(/^\d{13}$/, { message: 'CNIC must be exactly 13 digits' })
  cnic?: string;

  @IsString()
  @IsOptional()
  rollNo?: string;

  @IsEnum(STUDENT_STATUSES)
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  cgpa?: number;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  sgpa?: number;

  @IsInt()
  @IsOptional()
  version?: number; // for optimistic concurrency
}

export class StudentQueryDto {
  @IsOptional()
  department?: string; // departmentId

  @IsOptional()
  session?: string; // sessionId

  @IsOptional()
  status?: string;

  @IsOptional()
  q?: string; // name or registrationNo search

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
