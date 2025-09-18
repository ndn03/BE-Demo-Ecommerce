import { QueryDto, QueryWithDeleteDto } from 'src/common/dtos/query.dto';
import {
  PartialType,
  IntersectionType,
  OmitType,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Comparison } from '@src/common/decorators/comparison.decorator';
import { Expose } from 'class-transformer';
import { EBrand } from '../brand.interface';

export class QueryBrandDto extends PartialType(
  IntersectionType(
    OmitType(QueryDto, ['orderBy'] as const),
    QueryWithDeleteDto,
  ),
) {
  @ApiPropertyOptional({
    type: String,
    enum: EBrand,
    default: EBrand.name,
  })
  @IsOptional()
  @Expose()
  @IsEnum(EBrand)
  orderBy?: EBrand;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  country?: string;

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
}
