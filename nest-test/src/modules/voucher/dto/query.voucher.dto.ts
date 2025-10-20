import { QueryDto, QueryWithDeleteDto } from 'src/common/dtos/query.dto';
import {
  PartialType,
  IntersectionType,
  OmitType,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { EVoucher } from '../voucher.interface';
import {
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
} from '@src/common/type.common';
import { Comparison } from '@src/common/decorators/comparison.decorator';

export class QueryVoucherDto extends PartialType(
  IntersectionType(
    OmitType(QueryDto, ['orderBy'] as const),
    QueryWithDeleteDto,
  ),
) {
  @ApiPropertyOptional({
    type: String,
    enum: EVoucher,
    default: EVoucher.code,
  })
  @IsOptional()
  @Expose()
  @IsEnum(EVoucher)
  orderBy?: EVoucher;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  code?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  value_discount?: number;

  @ApiPropertyOptional({ type: String, enum: ETypeDiscount })
  @IsOptional()
  @IsEnum(ETypeDiscount)
  @Expose()
  discount_type?: ETypeDiscount;

  @ApiPropertyOptional({ type: String, enum: EtargetType })
  @IsOptional()
  @IsEnum(EtargetType)
  @Expose()
  targetType?: EtargetType;

  @ApiPropertyOptional({ type: String, enum: ETargetReceiverGroup })
  @IsOptional()
  @IsEnum(ETargetReceiverGroup)
  @Expose()
  targetReceiverGroup?: ETargetReceiverGroup;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @Expose()
  validFrom?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @Expose()
  validTo?: Date;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  min_order_value?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  max_discount_value?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  usage_limit?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  per_user_limit?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  used_count?: number;

  @ApiPropertyOptional({ type: Number, description: 'Must be 0 | 1' })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Comparison<number>([0, 1], 'in')
  isActive?: number;

  @ApiPropertyOptional({ type: Number, description: 'Creator id' })
  @IsOptional()
  @IsNumber()
  @Expose()
  creatorId?: number;

  @ApiPropertyOptional({ type: [Number], description: 'Category ids' })
  @IsOptional()
  @IsNumber({ allowNaN: false }, { each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    const strArr = Array.isArray(value) ? value : [value];
    return strArr.map((str) => +str);
  })
  @Expose()
  'list_targetType[]'?: string[];
}
