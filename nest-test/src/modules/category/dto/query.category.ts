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
import { ECategory } from '../category.interface';

export class QueryCategoryDto extends PartialType(
  IntersectionType(
    OmitType(QueryDto, ['orderBy'] as const),
    QueryWithDeleteDto,
  ),
) {
  @ApiPropertyOptional({
    type: String,
    enum: ECategory,
    default: ECategory.name,
  })
  @IsOptional()
  @Expose()
  @IsEnum(ECategory)
  orderBy?: ECategory;

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
