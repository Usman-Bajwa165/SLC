// ── dto/session.dto.ts ────────────────────────────────────────────────────────
import { IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  departmentId: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  startYear: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  endYear: number;

  @IsString()
  @IsNotEmpty()
  label: string;
}
