import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AddCartDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'ID sản phẩm',
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  productIds?: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Số lượng sản phẩm',
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  quantity: number;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    description: 'ID voucher',
  })
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  voucher?: number;
}
