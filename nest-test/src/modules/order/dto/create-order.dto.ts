import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID của sản phẩm',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  productId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Số lượng sản phẩm',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @Expose()
  quantity: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Giá sản phẩm tại thời điểm đặt hàng',
    example: 100000,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Expose()
  price: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Mã voucher (nếu có)',
    example: 'DISCOUNT20',
  })
  @IsOptional()
  @IsString()
  @Expose()
  voucherCode?: string;

  @ApiProperty({
    type: [OrderItemDto],
    required: true,
    description: 'Danh sách sản phẩm trong đơn hàng',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  @Expose()
  items: OrderItemDto[];

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng giờ hành chính',
  })
  @IsOptional()
  @IsString()
  @Expose()
  note?: string;

  @ApiPropertyOptional({
    type: String,
    required: true,
    description: 'Địa chỉ giao hàng (nếu khác địa chỉ mặc định)',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Expose()
  shippingAddress: string;
}
