import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EStatusOrder } from '@src/common/type.common';

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    enum: EStatusOrder,
    required: true,
    description: 'Trạng thái mới của đơn hàng',
    example: EStatusOrder.PROCESSING,
  })
  @IsEnum(EStatusOrder)
  status: EStatusOrder;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Lý do thay đổi trạng thái',
    example: 'Đơn hàng đã được xác nhận và chuẩn bị',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateOrderFromCartDto {
  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Mã voucher áp dụng',
    example: 'DISCOUNT20',
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng giờ hành chính',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Địa chỉ giao hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;
}
