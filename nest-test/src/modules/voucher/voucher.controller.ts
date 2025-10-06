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
import { User } from '@src/entities/user.entity';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';

@ApiTags('Voucher Management')
@Controller('api/v1/vouchers')
@ApiBearerAuth()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Tạo voucher mới (Admin only)
   */
  @Post()
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  @ApiOperation({
    summary: 'Tạo voucher mới',
    description: 'Tạo voucher mới với các thông tin chi tiết (chỉ Admin/HR)',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo voucher thành công',
    schema: {
      example: {
        success: true,
        message: 'Voucher đã được tạo thành công',
        data: {
          id: 1,
          code: 'SUMMER2024',
          discount_type: 'PERCENTAGE',
          value_discount: 20,
          // ... other fields
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
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
  @Get()
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy danh sách tất cả voucher',
    description: 'Lấy danh sách tất cả voucher trong hệ thống',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng tối đa (mặc định: 50)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getAllVouchers(@Query('limit') limit: number = 50) {
    // Sử dụng trực tiếp repository với VoucherService
    // Vì VoucherService kế thừa BaseService và có access to repository
    const vouchers = await this.voucherService['repository'].find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['campaign'],
    });

    return {
      success: true,
      message: 'Lấy danh sách voucher thành công',
      data: vouchers,
    };
  }

  /**
   * Lấy chi tiết voucher theo ID (Admin)
   */
  @Get(':id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy chi tiết voucher theo ID',
    description: 'Lấy thông tin chi tiết của voucher',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của voucher' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy voucher' })
  async getVoucherById(@Param('id', ParseIntPipe) id: number) {
    const voucher = await this.voucherService['repository'].findOne({
      where: { id },
      relations: ['campaign'],
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    return {
      success: true,
      message: 'Lấy thông tin voucher thành công',
      data: voucher,
    };
  }

  /**
   * Lấy voucher theo code
   */
  @Get('code/:code')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy voucher theo code',
    description: 'Tìm voucher bằng mã code',
  })
  @ApiParam({ name: 'code', type: String, description: 'Mã voucher' })
  @ApiResponse({ status: 200, description: 'Tìm thấy voucher' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy voucher' })
  async getVoucherByCode(@Param('code') code: string) {
    const voucher = await this.voucherService['repository'].findOne({
      where: { code: code.toUpperCase() },
      relations: ['campaign'],
    });

    if (!voucher) {
      throw new NotFoundException(`Không tìm thấy voucher với code: ${code}`);
    }

    return {
      success: true,
      message: 'Tìm thấy voucher',
      data: voucher,
    };
  }

  /**
   * Vô hiệu hóa voucher (Soft delete)
   */
  @Delete(':id')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Vô hiệu hóa voucher',
    description: 'Soft delete voucher (vô hiệu hóa) thay vì xóa hoàn toàn',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của voucher' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  async softDeleteVoucher(@Param('id', ParseIntPipe) id: number) {
    // Kiểm tra voucher có tồn tại không
    const voucher = await this.voucherService['repository'].findOne({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    // Sử dụng method softDelete từ BaseService
    await this.voucherService.softDelete(id);

    return {
      success: true,
      message: 'Voucher đã được vô hiệu hóa',
    };
  }

  // ==================== FUTURE ENDPOINTS (COMMENTED OUT) ====================

  /*
  // Các endpoint này cần implement các method tương ứng trong service
  
  @Put(':id')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async updateVoucher(...) {
    // TODO: Implement updateVoucher method in service
  }

  @Delete(':id') 
  @Auth(ERole.ADMINISTRATOR)
  async deleteVoucher(...) {
    // TODO: Implement softDeleteVoucher method in service
  }

  @Get('public')
  async getPublicVouchers(...) {
    // TODO: Implement findPublicVouchers method in service
  }

  @Get('validate/:code')
  @Auth(ERole.CUSTOMER, ERole.CUSTOMER_VIP1, ERole.CUSTOMER_VIP2, ERole.CUSTOMER_VIP3)
  async validateVoucherCode(...) {
    // TODO: Implement validateVoucherForUser method in service
  }

  @Get('my-vouchers')
  @Auth(ERole.CUSTOMER, ERole.CUSTOMER_VIP1, ERole.CUSTOMER_VIP2, ERole.CUSTOMER_VIP3)
  async getMyVouchers(...) {
    // TODO: Implement getUserVouchers method in service
  }

  @Post('claim/:code')
  @Auth(ERole.CUSTOMER, ERole.CUSTOMER_VIP1, ERole.CUSTOMER_VIP2, ERole.CUSTOMER_VIP3)
  async claimVoucher(...) {
    // TODO: Implement claimVoucherForUser method in service
  }

  @Get('analytics/stats')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async getVoucherStats(...) {
    // TODO: Implement getVoucherAnalytics method in service
  }

  @Get('analytics/top-used')
  @Auth(ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES)
  async getTopUsedVouchers(...) {
    // TODO: Implement getTopUsedVouchers method in service
  }
  */
}
