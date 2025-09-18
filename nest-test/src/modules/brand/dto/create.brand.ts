import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    type: String,
    maxLength: 191,
    required: true,
    description: 'Tên thương hiệu',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  name: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    maxLength: 1200,
    description: 'Mô tả về thương hiệu',
  })
  @IsOptional()
  @IsString()
  @Expose()
  @MaxLength(1200, {
    message: 'Nội dung không được vượt quá 1200 ký tự',
  })
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Logo của thương hiệu',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    // Bỏ qua các giá trị không phải chuỗi (như đối tượng tệp) và trả về null
    if (
      typeof value !== 'string' ||
      value === '' ||
      value === undefined ||
      value === null
    ) {
      return null;
    }
    return value; // Trả về giá trị nếu là chuỗi hợp lệ
  })
  logo?: string;

  @ApiProperty({
    type: String,
    maxLength: 191,
    required: true,
    description: 'Xuất xứ của thương hiệu',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  country: string;
}
