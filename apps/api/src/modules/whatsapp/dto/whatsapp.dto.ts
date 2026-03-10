import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class WhatsappSettingsDto {
  @IsString()
  @IsOptional()
  toNumber?: string;

  @IsBoolean()
  @IsOptional()
  notifyStudentPayments?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyStaffPayments?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyFinance?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccounts?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyEnrollment?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyDeactivation?: boolean;
}
