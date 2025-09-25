import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { ProductModule } from '../product/product.module';
import { BrandsModule } from '../brand/brand.module';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';
import { CartModule } from '../cart/cart.module';
import { CategoriesService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { BrandsService } from '../brand/brand.service';
import { ProductService } from '../product/product.service';
import { VoucherEntity } from 'src/entities/voucher.entity';
import { BrandsEntity } from 'src/entities/brands.entity';
import { CategoryEntity } from 'src/entities/categories.entity';
import { ProductsEntity } from 'src/entities/products.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherEntity,
      BrandsEntity,
      CategoryEntity,
      ProductsEntity,
      User,
    ]),
    ProductModule,
    BrandsModule,
    CategoryModule,
    UserModule,
    CartModule,
  ],
  providers: [VoucherService],
  controllers: [VoucherController],
  exports: [VoucherService],
})
export class VoucherModule {}
