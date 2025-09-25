import {
  Controller,
  HttpCode,
  Post,
  HttpStatus,
  Body,
  Get,
  Param,
  Query,
  Patch,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ERole } from '@src/configs/role.config';
import { CreateVoucherDto } from './dto/create.voucher.dto';
import { User } from '@src/entities/user.entity';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
@ApiTags('voucher')
@Controller('v1/vouchers')
export class VoucherController {
  constructor(private service: VoucherService) {}

  @Post('create-voucher')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create voucher' })
  @HttpCode(HttpStatus.OK)
  async createVoucher(@AuthUser() user: User, @Body() body: CreateVoucherDto) {
    const newVoucher = await this.service.createVoucher(user, body);
    return { message: 'Voucher created successfully', data: newVoucher };
  }
}
