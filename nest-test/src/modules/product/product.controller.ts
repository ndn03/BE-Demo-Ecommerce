import { Controller, NotFoundException, Patch } from '@nestjs/common';
import { ProductService } from './product.service';
import { MediaService } from '../upload/media.service';
import { ERole } from '@src/configs/role.config';
import { Auth, AuthUser } from 'src/modules/auth/auth.decorator';
import {
  Post,
  UseInterceptors,
  // UploadedFile,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  Body,
  // UsePipes,
  // NotFoundException,
  ParseIntPipe,
  Get,
  Query,
  Param,
  Delete,
  // Req,
} from '@nestjs/common';
import { ProductsEntity } from '../../entities/products.entity';
import { CreateProductDto } from './dto/create.product.dto';
import { User } from '@src/entities/user.entity';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileUploadHelper } from '../upload/helpers/file-upload';
import { ALLOWED_MIME_TYPES_FOR_IMAGE } from '@src/configs/const.config';
import { FastifyFilesMultipleFieldInterceptor } from '../upload/interceptors/fastify-files-multiple-field-name.interceptor';
import { QueryProductDto } from './dto/query.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';

@Controller('v1/product')
export class ProductController {
  constructor(
    private ProductService: ProductService,
    private mediaService: MediaService,
  ) {}

  @Post('create')
  @Auth(ERole.ADMINISTRATOR)
  @UseInterceptors(
    FastifyFilesMultipleFieldInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      {
        fileFilter: (req, file, cb) => {
          FileUploadHelper.fileFilter(
            req,
            file,
            cb,
            ALLOWED_MIME_TYPES_FOR_IMAGE,
          );
        },
        limits: { fileSize: 10 * 1024 * 1024 }, // giới hạn 10MB
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create product' })
  @HttpCode(HttpStatus.OK)
  async createProduct(
    @AuthUser() user: User,
    @UploadedFiles()
    files: Record<string, Express.Multer.File[]>,
    @Body() body: CreateProductDto,
  ): Promise<ProductsEntity> {
    const newProduct = await this.ProductService.create(
      user,
      body,
      files?.image?.[0],
      files?.subImages,
    );
    return newProduct;
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @HttpCode(HttpStatus.OK)
  async getAllProducts(@Query() query: QueryProductDto) {
    const products = await this.ProductService.findAll(query);
    return products;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @HttpCode(HttpStatus.OK)
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    const product = await this.ProductService.findOne(id, false, true);

    return { message: 'Product retrieved successfully', data: product };
  }

  @Patch('update/:id')
  @Auth(ERole.ADMINISTRATOR)
  @UseInterceptors(
    FastifyFilesMultipleFieldInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      {
        fileFilter: (req, file, cb) => {
          FileUploadHelper.fileFilter(
            req,
            file,
            cb,
            ALLOWED_MIME_TYPES_FOR_IMAGE,
          );
        },
        limits: { fileSize: 10 * 1024 * 1024 }, // giới hạn 10MB
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update product' })
  @HttpCode(HttpStatus.OK)
  async updateProduct(
    @AuthUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: Record<string, Express.Multer.File[]>,
    @Body() body: UpdateProductDto,
  ): Promise<{ message: string; data: ProductsEntity }> {
    const updatedProduct = await this.ProductService.update(
      id,
      body,
      user,
      files?.image?.[0],
      files?.subImages,
    );
    return { message: 'Product updated successfully', data: updatedProduct };
  }

  @Delete('softDelete/:id')
  @ApiOperation({ summary: 'Soft delete product by ID' })
  @HttpCode(HttpStatus.OK)
  async softDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    const data = await this.ProductService.softDelete(id);
    return { message: 'Product soft deleted successfully', data: data };
  }

  @Patch('restore/:id')
  @ApiOperation({ summary: 'Restore soft deleted product by ID' })
  @HttpCode(HttpStatus.OK)
  async restoreProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.ProductService.findOne(id, true); // withDeleted = true
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.deletedAt) {
      throw new NotFoundException('Product is not deleted');
    }
    await this.ProductService.restore(id);
    return { message: 'Product restored successfully' };
  }

  @Delete('remove/:id')
  @ApiOperation({ summary: 'Hard delete product by ID' })
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.ProductService.findOne(id, true);
    if (!product) {
      return { message: 'Product not found or already deleted' };
    }
    // Xóa file ảnh chính và ảnh phụ nếu có
    const fileIdsToDelete: string[] = [];
    // Xóa ảnh chính
    if (product.image) {
      // Giả sử URL dạng https://ucarecdn.com/<fileId>/...
      const imageUrl: string = product.image;
      const imageId = imageUrl.split('/').filter(Boolean).pop();
      if (imageId) {
        fileIdsToDelete.push(imageId);
      }
    }
    // Xóa ảnh phụ
    if (product.subImages && Array.isArray(product.subImages)) {
      for (const subImageUrl of product.subImages) {
        if (typeof subImageUrl === 'string') {
          const subImageId = (subImageUrl as string)
            .split('/')
            .filter(Boolean)
            .pop();
          if (typeof subImageId === 'string' && subImageId) {
            fileIdsToDelete.push(subImageId);
          }
        }
      }
    }
    if (fileIdsToDelete.length > 0) {
      await this.mediaService.deleteMultipleFiles(fileIdsToDelete);
    }
    await this.ProductService.delete(id);
    return { message: 'Product hard deleted successfully' };
  }
}
