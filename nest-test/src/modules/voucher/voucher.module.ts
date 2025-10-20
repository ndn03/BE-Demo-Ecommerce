import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { ProductModule } from '../product/product.module';
import { BrandsModule } from '../brand/brand.module';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';

import { VoucherEntity } from 'src/entities/voucher.entity';
import { VoucherRecipient } from 'src/entities/voucher.user.entity';
import { VoucherProductEntity } from 'src/entities/voucher.products.entity';
import { VoucherHistory } from 'src/entities/voucher.history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherEntity,
      VoucherRecipient,
      VoucherProductEntity,
      VoucherHistory,
    ]),
    ProductModule,
    BrandsModule,
    CategoryModule,
    UserModule,
  ],
  providers: [VoucherService],
  controllers: [VoucherController],
  exports: [VoucherService],
})
export class VoucherModule {}
