import { Comparison } from 'src/common/decorators/comparison.decorator';
import {
  QueryDto,
  QueryWithDeleteDto,
  // QueryPaginateDto,
} from 'src/common/dtos/query.dto';
import { ERole } from 'src/configs/role.config';
import {
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { EEmployeeType, EGender } from 'src/common/type.common';
import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EOrderByUser, EOrderByUserRegistration } from '../user.interface';

export class QueryUserDto extends PartialType(
  IntersectionType(
    OmitType(QueryDto, ['orderBy'] as const),
    QueryWithDeleteDto,
  ),
) {
  @ApiPropertyOptional({
    type: String,
    enum: EOrderByUser,
    default: EOrderByUser.ID,
  })
  @IsOptional()
  @IsEnum(EOrderByUser)
  @Expose()
  orderBy?: EOrderByUser;

  @ApiPropertyOptional({ type: Number, description: 'Must be 0 | 1' })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Comparison<number>([0, 1], 'in')
  isActive?: number;

  @ApiPropertyOptional({ type: String, enum: ERole })
  @IsOptional()
  @IsEnum(ERole)
  @Expose()
  role?: ERole;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  code: string;
}

export class QueryUserRegistrationDto extends PartialType(
  OmitType(QueryDto, ['orderBy'] as const),
) {
  @ApiPropertyOptional({
    type: String,
    enum: EOrderByUserRegistration,
    default: EOrderByUserRegistration.ID,
  })
  @IsOptional()
  @IsEnum(EOrderByUserRegistration)
  @Expose()
  orderBy?: EOrderByUserRegistration;

  @ApiPropertyOptional({
    type: String,
    enum: EEmployeeType,
    example: EEmployeeType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(EEmployeeType)
  @Expose()
  employeeType?: EEmployeeType;

  @ApiPropertyOptional({ type: String, enum: EGender, example: EGender.FEMALE })
  @IsOptional()
  @IsEnum(EGender)
  @Expose()
  gender?: EGender;
}
