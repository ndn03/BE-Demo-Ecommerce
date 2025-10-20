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
  Put,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ERole } from '@src/configs/role.config';
import { CreateVoucherDto } from './dto/create.voucher.dto';
import { UpdateVoucherDto } from './dto/update.voucher.dto';
import { User } from '@src/entities/user.entity';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import { QueryVoucherDto } from './dto/query.voucher.dto';

@ApiTags('Voucher Management')
@Controller('api/v1/vouchers')
@ApiBearerAuth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({
    summary: 'Tạo voucher mới',
    description: 'Tạo voucher mới với các thông tin chi tiết (chỉ Admin/HR)',
  })
  @HttpCode(HttpStatus.CREATED)
  async createVoucher(
    @AuthUser() user: User,
    @Body() createVoucherDto: CreateVoucherDto,
  ) {
    const voucher = await this.voucherService.createVoucher(
      user,
      createVoucherDto,
    );
    return {
      success: true,
      message: 'Voucher đã được tạo thành công',
      data: voucher,
    };
  }

  /**
   * Lấy danh sách tất cả voucher (Admin only)
   */
  @Get('list-categories')
  @ApiOperation({ summary: 'List categories' })
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @HttpCode(HttpStatus.OK)
  async listCategories(@Query() query: QueryVoucherDto) {
    const { data, total } = await this.voucherService.findAll(query);
    return {
      message: 'Categories retrieved successfully',
      data,
      total,
      // limit: query.limit || 10,
      // page: query.page || 1,
    };
  }

  /**
   * 🔍 Lấy chi tiết voucher theo ID
   */
  @Get(':id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy chi tiết voucher theo ID',
    description: 'Lấy thông tin chi tiết của voucher với đầy đủ relations',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của voucher' })
  async getVoucherById(
    @Param('id', ParseIntPipe) id: number,
    @Query('withDeleted') withDeleted: boolean = false,
    @Query('withRelations') withRelations: boolean = true,
  ) {
    const voucher = await this.voucherService.findOne(id, {
      withDeleted,
      withRelations,
    });

    return {
      success: true,
      message: 'Lấy thông tin voucher thành công',
      data: voucher,
    };
  }

  /**
   * 🔄 Cập nhật voucher
   */
  @Patch(':id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({
    summary: 'Cập nhật voucher',
    description:
      'Cập nhật thông tin voucher với validation đầy đủ (chỉ Admin/HR)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của voucher' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy voucher' })
  @HttpCode(HttpStatus.OK)
  async updateVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @AuthUser() user: User,
  ) {
    const updatedVoucher = await this.voucherService.update(
      id,
      updateVoucherDto,
      user,
    );

    return {
      success: true,
      message: 'Cập nhật voucher thành công',
      data: updatedVoucher,
    };
  }
}
