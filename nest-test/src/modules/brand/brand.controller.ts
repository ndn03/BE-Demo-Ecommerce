import {
  Controller,
  Param,
  Patch,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { BrandsService } from './brand.service';
import { FastifyFileInterceptor } from 'src/modules/upload/interceptors/fastify-file.interceptor';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { CreateBrandDto } from './dto/create.brand';
import { UpdateBrandDto } from './dto/update.brand';
import { User } from '@src/entities/user.entity';
import { FileUploadHelper } from 'src/modules/upload/helpers/file-upload';
import { ERole } from '@src/configs/role.config';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import { ALLOWED_MIME_TYPES_FOR_IMAGE } from '@src/configs/const.config';
import { QueryBrandDto } from './dto/query.brand';
import { MediaService } from '../upload/media.service';

@Controller('v1/brand')
export class BrandsController {
  constructor(
    private BrandsService: BrandsService,
    private mediaService: MediaService,
  ) {}

  @Post('create')
  @Auth(ERole.ADMINISTRATOR)
  @UseInterceptors(
    FastifyFileInterceptor('logo', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        FileUploadHelper.fileFilter(
          req,
          file,
          cb,
          ALLOWED_MIME_TYPES_FOR_IMAGE,
        );
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create brand' })
  @HttpCode(HttpStatus.OK)
  async createBrand(
    @Body() body: CreateBrandDto,
    @AuthUser() user: User,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const newBrand = await this.BrandsService.createBrand(body, user, logo);
    return { message: 'Brand created successfully', data: newBrand };
  }

  @Get('list-brands')
  @ApiOperation({ summary: 'List brands' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List brands' })
  async listBrands(@Query() query: QueryBrandDto) {
    const { data, total } = await this.BrandsService.findAll(query);
    return {
      message: 'Brands retrieved successfully',
      data,
      total,
      // limit: query.limit || 10,
      // page: query.page || 1,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @HttpCode(HttpStatus.OK)
  async getBrandById(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.BrandsService.findOne(id, false);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return { message: 'Brand retrieved successfully', data: brand };
  }

  @Patch(':id')
  @UseInterceptors(
    FastifyFileInterceptor('logo', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        FileUploadHelper.fileFilter(
          req,
          file,
          cb,
          ALLOWED_MIME_TYPES_FOR_IMAGE,
        );
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update a brand with optional logo' })
  @HttpCode(HttpStatus.OK)
  async updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBrandDto,
    @AuthUser() user: User,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const updated = await this.BrandsService.update(id, body, user, logo);
    return { message: 'Brand updated successfully', data: updated };
  }

  @Delete('soft-remove/:id')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Soft remove brand by ID' })
  @HttpCode(HttpStatus.OK)
  async softRemoveBrand(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    const brand = await this.BrandsService.findOne(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.BrandsService.update(id, {}, user);
    await this.BrandsService.softDelete(+id);
    return { message: 'Brand soft removed successfully' };
  }

  @Patch('restore/:id')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Restore brand by ID' })
  @HttpCode(HttpStatus.OK)
  async restoreBrand(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: User,
  ) {
    const brand = await this.BrandsService.findOne(id, true); // ✅ withDeleted = true
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (!brand.deletedAt) {
      throw new NotFoundException('Brand is not deleted');
    }
    await this.BrandsService.restore(+id);
    await this.BrandsService.update(id, {}, user);
    return { message: 'Brand restored successfully' };
  }

  @Delete('remove/:id')
  @Auth(ERole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Hard remove brand by ID' })
  @HttpCode(HttpStatus.OK)
  async hardRemoveBrand(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.BrandsService.findOne(id, true); // ✅ withDeleted = true
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (brand.logo) {
      //lấy UUID từ URL nếu có dạng CDN (Uploadcare). Nếu logo đã là UUID thì dùng trực tiếp.
      const fileId = (() => {
        if (!brand.logo) return null;
        // Nếu là URL -> tách phần giống UUID
        if (brand.logo.includes('/')) {
          const parts = brand.logo.split('/');
          const found = parts.find(
            (p) => p && p.includes('-') && p.length >= 32,
          );
          return found ?? parts.filter(Boolean).pop() ?? null;
        }
        // Nếu không phải URL trả về chuỗi gốc (có thể là UUID)
        return brand.logo;
      })();
      await this.mediaService.deleteFile(fileId);
    }
    await this.BrandsService.delete(+id);
    return { message: 'Brand hard removed successfully' };
  }

}
