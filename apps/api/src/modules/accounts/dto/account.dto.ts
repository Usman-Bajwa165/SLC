import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreatePaymentMethodDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() type: string; // 'cash'|'bank'|'online'
  @IsOptional() meta?: any;
}

export class CreateAccountDto {
  @IsInt() paymentMethodId: number;
  @IsString() @IsNotEmpty() label: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() branch?: string;
  @IsOptional() openingBalance?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsOptional() currentBalance?: number;
}
