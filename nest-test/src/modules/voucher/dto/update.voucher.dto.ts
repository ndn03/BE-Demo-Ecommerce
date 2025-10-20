import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDto } from './create.voucher.dto';
import { IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Danh sách ID sản phẩm áp dụng voucher',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  products?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description:
      'Danh sách ID người dùng nhận voucher (cho targetReceiverGroup cụ thể)',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  recipients?: number[];
}
