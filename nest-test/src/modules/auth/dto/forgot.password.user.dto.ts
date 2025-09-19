import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
export class ForgotPasswordDto {
  @ApiProperty({
    type: String,
    example: 'example@gmail.com',
    required: true,
    maxLength: 191,
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(191)
  @Expose()
  email: string;
}
