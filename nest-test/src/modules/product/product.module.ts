import { BrandsService } from './../brand/brand.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductsEntity } from '../../entities/products.entity';
import { SubImgProductEntity } from '../../entities/sub-img-product.entity';
import { MediaModule } from '../upload/media.module';
import { CategoriesService } from '../category/category.service';
import { CategoryEntity } from 'src/entities/categories.entity';
import { BrandsEntity } from 'src/entities/brands.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductsEntity,
      SubImgProductEntity,
      CategoryEntity,
      BrandsEntity,
    ]),
    MediaModule,
  ],
  providers: [ProductService, CategoriesService, BrandsService],
  controllers: [ProductController],
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}
