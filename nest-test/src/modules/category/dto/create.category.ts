import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}
