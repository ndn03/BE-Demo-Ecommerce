import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EStatusOrder } from '@src/common/type.common';
import { Transform } from 'class-transformer';

export class GetOrdersQueryDto {
  @ApiPropertyOptional({
    type: Number,
    required: false,
    description: 'Số trang',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    required: false,
    description: 'Số lượng items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: EStatusOrder,
    required: false,
    description: 'Lọc theo trạng thái đơn hàng',
    example: EStatusOrder.PENDING,
  })
  @IsOptional()
  @IsEnum(EStatusOrder)
  status?: EStatusOrder;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Từ ngày (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Đến ngày (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class OrderStatsQueryDto {
  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Từ ngày (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Đến ngày (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Nhóm theo: day, week, month, year',
    example: 'day',
    enum: ['day', 'week', 'month', 'year'],
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'year' = 'day';
}
