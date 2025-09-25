import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { ETypeDiscount, EVoucherStatus } from '@src/common/type.common';
import { ERole, ROLE_GROUPS } from '@src/configs/role.config';
import { ALLOWED_VOUCHER_DISCOUNTS } from '../voucher.interface';

export class CreateVoucherDto {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  @MaxLength(100)
  @Expose()
  code: string;

  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Expose()
  discount: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    type: String,
    enum: ETypeDiscount,
    example: ETypeDiscount.PERCENTAGE,
    description: 'Loại giảm giá: PERCENTAGE, AMOUNT, NO_DISCOUNT',
  })
  @IsNotEmpty({ message: 'discount_type should not be empty' })
  @IsEnum(ETypeDiscount, {
    message:
      'discount_type must be one of the following values: PERCENTAGE, AMOUNT, NO_DISCOUNT',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value;
  })
  @Expose()
  discount_type: ETypeDiscount;

  @ApiProperty({
    description: 'Danh sách role có thể sử dụng voucher',
    example: [ERole.CUSTOMER, ERole.CUSTOMER_VIP1],
    required: false,
  })
  @IsOptional() // cho phép bỏ trống → hiểu là áp dụng cho tất cả
  @IsArray()
  @IsEnum(ERole, { each: true })
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "CUSTOMER, CUSTOMER_VIP1"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((role: string) => role.trim())
        .filter(Boolean);
    }

    //Nếu gửi dạng mảng: ['CUSTOMER', 'CUSTOMER_VIP1'] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }

    // 3️⃣ Nếu không gửi gì → hiểu là ALL
    return null;
  })
  @Expose()
  applicableRoles: ERole[] | null;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID thương hiệu áp dụng voucher',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "1, 2, 3"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter(Boolean);
    }

    // Nếu gửi dạng mảng: [1, 2, 3] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }

    // Nếu không gửi gì → hiểu là ALL
    if (value === undefined || value === null || value === '') {
      return null;
    }
  })
  userIds?: number[];

  @ApiProperty({
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Expose()
  startDate: Date;

  @ApiProperty({
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Expose()
  expirationDate: Date;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Expose()
  min_order_value?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giới hạn số lần sử dụng',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  usage_limit?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số lần đã được sử dụng',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  used_count?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giới hạn số lần sử dụng cho mỗi người dùng',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  per_user_limit?: number | null;

  @ApiPropertyOptional({
    type: String,
    enum: EVoucherStatus,
    default: EVoucherStatus.ACTIVE,
    description: 'Trạng thái của sản phẩm',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  @Expose()
  status?: EVoucherStatus;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID thương hiệu áp dụng voucher',
    example: [1, 4, 5],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "1, 2, 3"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter(Boolean);
    }

    // Nếu gửi dạng mảng: [1, 2, 3] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }

    // Nếu không gửi gì → hiểu là ALL
    if (value === undefined || value === null || value === '') {
      return null;
    }
  })
  brandsIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID danh mục áp dụng voucher',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "1, 2, 3"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter(Boolean);
    }

    // Nếu gửi dạng mảng: [1, 2, 3] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }

    // Nếu không gửi gì → hiểu là ALL
    if (value === undefined || value === null || value === '') {
      return null;
    }
  })
  categoriesIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID sản phẩm áp dụng voucher',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  @Transform(({ value }) => {
    // Nếu frontend gửi dạng chuỗi: "1, 2, 3"
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter(Boolean);
    }

    // Nếu gửi dạng mảng: [1, 2, 3] → giữ nguyên
    if (Array.isArray(value)) {
      return value;
    }

    // Nếu không gửi gì → hiểu là ALL
    if (value === undefined || value === null || value === '') {
      return null;
    }
  })
  @Expose()
  productsIds?: number[];
}
