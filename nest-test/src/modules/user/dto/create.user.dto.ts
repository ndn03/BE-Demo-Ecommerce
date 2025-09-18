import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comparison } from 'src/common/decorators/comparison.decorator';
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsDate,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { regexAlphaNumSpecial } from 'src/common/utils/regex.util';
import { ERole } from 'src/configs/role.config';
import {
  EAccountType,
  EEmployeeType,
  EGender,
  EWorkShift,
  EPosition,
} from 'src/common/type.common';
export class CreateUserDto {
  @ApiProperty({
    type: String,
    example: 'example@gmail.com',
    required: true,
    maxLength: 191,
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(191)
  @Expose()
  email: string;

  @ApiProperty({
    type: String,
    example: 'employee123',
    required: true,
    maxLength: 191,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  username: string;

  @ApiProperty({
    type: String,
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(6)
  @Matches(regexAlphaNumSpecial, {
    message:
      'Password must contain only letters, numbers, or special characters.',
  })
  @Expose()
  password: string;

  @ApiProperty({ type: String, example: '123456', required: true })
  @IsNotEmpty()
  @Comparison('password', 'eq')
  @Expose()
  confirmPassword: string;

  @ApiProperty({ type: String, required: true, maxLength: 191 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  fullName: string;

  @ApiProperty({ enum: ERole, type: String, example: ERole.CUSTOMER })
  @IsString()
  @IsEnum(ERole)
  @Expose()
  role: ERole;

  @ApiProperty({
    type: String,
    default: EAccountType.ACCOUNT_ISSUED,
    required: true,
    enum: EAccountType,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  registrationType: EAccountType;

  @ApiPropertyOptional({
    type: String,
    default: EWorkShift.MORNING,
    required: true,
    enum: EWorkShift,
  })
  @IsNotEmpty()
  @IsEnum(EWorkShift)
  @IsString()
  @Expose()
  workShift: EWorkShift;

  @ApiPropertyOptional({
    type: String,
    default: EPosition.INTERN,
    required: true,
    enum: EPosition,
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @IsEnum(EPosition)
  @Expose()
  position?: EPosition;

  @ApiPropertyOptional({
    type: String,
    default: EEmployeeType.FULL_TIME,
    required: true,
    enum: EEmployeeType,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(EEmployeeType)
  @Expose()
  employmentType: EEmployeeType;

  @ApiProperty({
    type: Number,
    description: 'IsActive must be 0 | 1',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Comparison<number>([0, 1], 'in')
  isActive: number;
}

export class CreateProfile {
  @ApiProperty({
    type: String,
    example: 'EP-001',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  code: string;

  @ApiProperty({
    type: String,
    example: 'Nguyen Van A',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  fullName: string;

  @ApiProperty({
    type: String,
    example: 'ABC',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  subName: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Hà Nội',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  fullAddress: string;

  @ApiPropertyOptional({ type: String, default: null, maxLength: 191 })
  @IsOptional()
  @MaxLength(191)
  @IsString()
  @Expose()
  phone: string;

  @ApiPropertyOptional({ type: Date, example: new Date() })
  @IsOptional()
  @IsDate()
  @Expose()
  birthDay: Date;

  @ApiPropertyOptional({
    type: String,
    default: EEmployeeType.FULL_TIME,
    required: true,
    enum: EEmployeeType,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(EEmployeeType)
  @Expose()
  employmentType: EEmployeeType;

  @ApiPropertyOptional({
    type: String,
    default: EWorkShift.MORNING,
    required: true,
    enum: EWorkShift,
  })
  @IsNotEmpty()
  @IsEnum(EWorkShift)
  @IsString()
  @Expose()
  workShift: EWorkShift;

  @ApiPropertyOptional({
    type: String,
    default: EPosition.INTERN,
    required: true,
    enum: EPosition,
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @IsEnum(EPosition)
  @Expose()
  position?: EPosition;

  @ApiPropertyOptional({
    type: String,
    example: EGender.MALE,
    required: true,
    enum: EGender,
  })
  @IsNotEmpty()
  @IsEnum(EGender)
  @IsString()
  @Expose()
  gender: string;
}
