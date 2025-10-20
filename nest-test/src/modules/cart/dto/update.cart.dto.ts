import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateCartDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID của cart item cần update',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  itemId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Số lượng mới (nếu = 0 thì sẽ xóa item)',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Expose()
  quantity: number;
}
