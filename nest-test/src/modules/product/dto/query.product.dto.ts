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
import { EProduct } from '../product.interface';
import { ETypeDiscount } from '@src/common/type.common';

export class QueryProductDto extends PartialType(
  IntersectionType(
    OmitType(QueryDto, ['orderBy'] as const),
    QueryWithDeleteDto,
  ),
) {
  @ApiPropertyOptional({
    type: String,
    enum: EProduct,
    default: EProduct.name,
  })
  @IsOptional()
  @Expose()
  @IsEnum(EProduct)
  orderBy?: EProduct;

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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  price?: number;

  @ApiPropertyOptional({
    type: String,
    enum: ETypeDiscount,
    default: ETypeDiscount.PERCENTAGE,
  })
  @IsOptional()
  @IsEnum(ETypeDiscount)
  @Expose()
  typeDiscount?: ETypeDiscount;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  price_discount?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Expose()
  stock?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Expose()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Number, description: 'Creator id' })
  @IsOptional()
  @IsNumber()
  @Expose()
  creatorId?: number;

  @ApiPropertyOptional({ type: Date, description: 'From date' })
  @IsOptional()
  @IsDate()
  @Expose()
  from: Date;

  @ApiPropertyOptional({ type: Date, description: 'To date' })
  @IsOptional()
  @IsDate()
  @Expose()
  to: Date;

  @ApiPropertyOptional({ type: Number, description: 'price range' })
  @IsOptional()
  @IsNumber({ allowNaN: false })
  @Expose()
  priceRangeFrom: number;

  @ApiPropertyOptional({ type: Number, description: 'price range' })
  @IsOptional()
  @IsNumber({ allowNaN: false })
  @Expose()
  priceRangeTo: number;

  @ApiPropertyOptional({ type: [Number], description: 'Category ids' })
  @IsOptional()
  @IsNumber({ allowNaN: false }, { each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    const strArr = Array.isArray(value) ? value : [value];
    return strArr.map((str) => +str);
  })
  @Expose()
  'categoryIds[]'?: string[];
}
