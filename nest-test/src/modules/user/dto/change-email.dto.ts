import { ApiProperty } from '@nestjs/swagger';
// import { Comparison } from 'src/common/decorators/comparison.decorator';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ type: String, example: 'example@gmail.com', required: true })
  @IsNotEmpty()
  @IsString()
  @Expose()
  currentEmail: string;

  //confirmEmail is not needed here, as we are not confirming the current email
  @ApiProperty({
    type: String,
    example: 'confirmEmail@example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  confirmEmail: string;

  @ApiProperty({
    type: String,
    example: 'new@example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  newEmail: string;
}

export class ChangeEmailDtoForUser extends ChangeEmailDto {}
