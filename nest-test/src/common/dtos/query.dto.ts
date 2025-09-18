import {
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Comparison } from 'src/common/decorators/comparison.decorator';
import { EOrder, EOrderBy } from '../type.common';

export class QuerySortDto {
  @ApiPropertyOptional({ type: String, enum: EOrder, default: EOrder.DESC })
  @IsOptional()
  @IsString()
  @IsEnum(EOrder)
  @Expose()
  order: EOrder;

  @ApiPropertyOptional({ type: String, enum: EOrderBy, default: EOrderBy.ID })
  @IsOptional()
  @IsString()
  @IsEnum(EOrderBy)
  @Transform(({ value }) => {
    // Only allow valid EOrderBy values, fallback to EOrderBy.ID if not matched
    return value === EOrderBy.ID ? EOrderBy.ID : EOrderBy.ID;
  })
  @Expose()
  orderBy: EOrderBy;
}

export class QueryPaginateDto {
  @ApiPropertyOptional({
    type: String,
    default: '',
    description: 'Default ""',
  })
  @IsOptional()
  @IsString()
  @Expose()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined)) // string to number
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Expose()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    maximum: 100,
    minimum: 0,
    example: 10,
    description: 'Number of page',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined)) // string to number
  @IsNumber()
  @Max(100)
  @Type(() => Number)
  @Min(0)
  @Expose()
  limit?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Pagination flag, 1 for true, 0 for false',
  })
  @IsOptional()
  @IsNumber()
  @Comparison<number>([0, 1], 'in')
  @Type(() => Number)
  @Expose()
  isPagination?: number;
}

export class QueryDto extends IntersectionType(
  PartialType(QueryPaginateDto),
  PartialType(QuerySortDto),
) {
  // @ApiPropertyOptional({ name: 's', type: String })
  // @IsOptional()
  // @IsString()
  // @Expose()
  // @Transform(({ value }) => {
  //   if (typeof value === 'string') return value.trim();
  //   return value as string;
  // })
  // s: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    const strArr = Array.isArray(value) ? value : [value];
    return strArr.map((str) => +str);
  })
  @Expose()
  'inIds[]': number[]; //  inIds: string[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    const strArr = Array.isArray(value) ? value : [value];
    return strArr.map((str) => +str);
  })
  @Expose()
  'notInIds[]': number[]; // notInIds: string[];

  // notInIds: string[];
}

export class QueryWithDeleteDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'isDelete must be 0 | 1',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  @Comparison<number>([0, 1], 'in')
  isDeleted: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'isDelete must be 0 | 1',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  @Comparison<number>([0, 1], 'in')
  withDeleted: number;
}
