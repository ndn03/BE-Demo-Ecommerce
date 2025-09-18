import { ApiProperty } from '@nestjs/swagger';
import { Comparison } from 'src/common/decorators/comparison.decorator';
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  // IsEnum,
} from 'class-validator';
import { regexAlphaNumSpecial } from 'src/common/utils/regex.util';
// import { ERole } from 'src/configs/role.config';
export class UserRegistrationDto {
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

  @ApiProperty({
    type: String,
    example: 'employee123',
    required: true,
    maxLength: 191,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(191)
  @Expose()
  username: string;

  @ApiProperty({
    type: String,
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @Matches(regexAlphaNumSpecial, {
    message:
      'Password must contain only letters, numbers, or special characters.',
  })
  @Expose()
  password: string;

  @ApiProperty({ type: String, example: '123456', required: true })
  @IsNotEmpty()
  @Comparison('password', 'eq')
  @Expose()
  confirmPassword: string;

  // @ApiProperty({ enum: ERole, type: String, default: ERole.CUSTOMER })
  // @IsString()
  // @IsEnum(ERole)
  // @Expose()
  // role: ERole;
}
