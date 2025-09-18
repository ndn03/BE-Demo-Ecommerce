import {
  // ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  // OmitType,
  PartialType,
  // PickType,
} from '@nestjs/swagger';
import {
  // IsArray,
  IsDate,
  IsEnum,
  // IsInt,
  // IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  // Min,
  // ValidateNested,
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
// import { IsUniqueFieldInArray } from 'src/common/validators/unique-field-in-array.validator';
import { Comparison } from 'src/common/decorators/comparison.decorator';
import { ERole } from 'src/configs/role.config';
import {
  EPosition,
  EGender,
  EWorkShift,
  EEmployeeType,
} from 'src/common/type.common';
export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ERole, type: String, default: ERole.EMPLOYEE })
  @IsOptional()
  @IsEnum(ERole)
  @Expose()
  role: ERole;

  @ApiPropertyOptional({
    type: Number,
    description: 'IsActive must be 0 | 1',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Expose()
  @Comparison<number>([0, 1], 'in')
  isActive: number;
}

export class CreateOrUpdateUserProfileDto {
  @ApiPropertyOptional({ type: String, required: true, maxLength: 191 })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Expose()
  fullName: string;

  @ApiPropertyOptional({
    type: String,
    description: 'subName of the user',
    example: 'abc123',
  })
  @IsOptional()
  @IsString()
  @Expose()
  @MaxLength(191)
  subName: string;

  @ApiPropertyOptional({
    type: String,
    default: null,
    maxLength: 191,
    example: '1234567890',
  })
  @IsOptional()
  @MaxLength(191)
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
      : value !== undefined && value !== null
        ? String(value)
        : undefined,
  )
  @Expose()
  phone: string;

  @ApiPropertyOptional({
    type: String,
    default: null,
    maxLength: 191,
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @MaxLength(191)
  @IsString()
  @Type(() => String)
  @Expose()
  fullAddress?: string;

  @ApiPropertyOptional({ type: Date, example: new Date() })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Expose()
  birthDay: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Work shift of the user',
    example: EWorkShift.MORNING,
  })
  @IsOptional()
  @Type(() => String)
  @Expose()
  @IsEnum(EWorkShift)
  workShift: EWorkShift;

  @ApiPropertyOptional({
    type: String,
    description: 'Position of the user',
    example: EPosition.INTERN,
  })
  @IsOptional()
  @Type(() => String)
  @Expose()
  @IsEnum(EPosition)
  position: EPosition;

  @ApiPropertyOptional({
    type: String,
    description: 'Gender of the user',
    example: EGender.MALE,
  })
  @IsOptional()
  @Type(() => String)
  @Expose()
  @IsEnum(EGender)
  gender: EGender;

  @ApiPropertyOptional({
    type: String,
    description: 'Employee type of the user',
    example: EEmployeeType.FULL_TIME,
  })
  @IsOptional()
  @Type(() => String)
  @Expose()
  @IsEnum(EEmployeeType)
  employmentType: EEmployeeType;

  // Add other profile fields as needed
}

export class UpdateUserHasProfileDto extends IntersectionType(
  PartialType(UpdateUserDto),
  PartialType(CreateOrUpdateUserProfileDto),
) {}

export class UpdateAccountUserDto extends UpdateUserDto {}
