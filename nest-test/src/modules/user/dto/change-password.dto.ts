import { ApiProperty } from '@nestjs/swagger';
import { Comparison } from 'src/common/decorators/comparison.decorator';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { regexAlphaNumSpecial } from 'src/common/utils/regex.util';
export class ChangePasswordDto {
  @ApiProperty({ type: String, example: '123456', required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  currentPassword: string;

  @ApiProperty({
    type: String,
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(6)
  @Expose()
  @Matches(regexAlphaNumSpecial, {
    message:
      'Password must contain only letters, numbers, or special characters.',
  })
  newPassword: string;

  @ApiProperty({
    type: String,
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(6)
  @Comparison<ChangePasswordDto>('newPassword', 'eq')
  @Expose()
  confirmPassword: string;
}

export class MyChangePasswordDto extends ChangePasswordDto {
  @ApiProperty({ type: String, example: '123456', required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  password: string;
}
