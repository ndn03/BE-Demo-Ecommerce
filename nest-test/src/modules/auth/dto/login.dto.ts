import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'example123', type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  username: string;

  @ApiProperty({ example: '123456', type: String, required: true })
  @IsNotEmpty()
  @Expose()
  password: string;
}
