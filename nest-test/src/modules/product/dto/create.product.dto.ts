import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { EStatusProduct, ETypeDiscount } from '@src/common/type.common';
export class CreateProductDto {
  @ApiProperty({
    type: String,
    maxLength: 191,
    required: true,
    description: 'Tên sản phẩm',
    example: 'iPhone 14 Pro Max',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  name: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    maxLength: 1200,
    description: 'Mô tả về sản phẩm',
    example: 'Sản phẩm chính hãng, mới 100%, nguyên seal',
  })
  @IsOptional()
  @IsString()
  @Expose()
  @MaxLength(1200, {
    message: 'Nội dung không được vượt quá 1200 ký tự',
  })
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  description?: string;

  @ApiProperty({ example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  price: number;

  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  stock: number;

  @ApiPropertyOptional({
    type: String,
    enum: ETypeDiscount,
    description: 'Loại giảm giá',
    default: ETypeDiscount.NO_DISCOUNT,
  })
  @IsOptional()
  @IsEnum(ETypeDiscount)
  @Expose()
  typeDiscount?: ETypeDiscount;

  @ApiPropertyOptional({
    type: Number,
    description: 'Is active or not (must be 0 | 1)',
    enum: [0, 1],
    default: 1,
  })
  @IsOptional()
  @IsEnum([0, 1])
  @IsNumber()
  @Transform(({ value }) =>
    value == null ? undefined : Number(value) === 1 ? 1 : 0,
  )
  @Expose()
  isActive?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  price_discount?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Phần trăm, số tiền được giảm giá',
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  discount?: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Hình ảnh chính của sản phẩm',
  })
  @IsOptional()
  image?: any; // Allow any type here, we'll handle it in the controller

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Danh sách hình ảnh phụ của sản phẩm',
  })
  @IsOptional()
  @Transform(() => {
    // Return undefined to exclude this property from validation
    return undefined;
  })
  subImages?: any; // Allow any type here, we'll handle it in the controller

  @ApiPropertyOptional({
    type: String,
    enum: EStatusProduct,
    default: EStatusProduct.INACTIVE,
    description: 'Trạng thái của sản phẩm',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Expose()
  // @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  status?: EStatusProduct;

  @ApiProperty({ example: 1, description: 'ID thương hiệu sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  brand: number;

  @ApiProperty({
    type: [Number],
    description: 'Danh sách ID danh mục sản phẩm',
    example: [2, 3],
  })
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Expose()
  @Transform(({ value }) => {
    if (value === '' || value == null) return [];
    if (Array.isArray(value)) {
      return value.map((v) => Number(v)).filter((v) => !isNaN(v) && v >= 0);
    }
    if (typeof value === 'string') {
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          return (JSON.parse(value) as string[])
            .map((v) => Number(v))
            .filter((v) => !isNaN(v) && v >= 0);
        } catch {
          return [];
        }
      }
      return value
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => !isNaN(v) && v >= 0);
    }
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      return [value];
    }
    return [];
  })
  categoryIds: number[];
}
