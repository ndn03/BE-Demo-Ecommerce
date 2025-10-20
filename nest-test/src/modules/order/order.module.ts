import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrdersEntity } from '@src/entities/order.entity';
import { OrderItemsEntity } from '@src/entities/order.items.entity';
import { VoucherEntity } from '@src/entities/voucher.entity';
import { ProductsEntity } from '@src/entities/products.entity';
import { CartEntity } from '@src/entities/cart.entity';
import { ProductModule } from '@src/modules/product/product.module';
import { CartModule } from '@src/modules/cart/cart.module';
import { VoucherModule } from '@src/modules/voucher/voucher.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdersEntity,
      OrderItemsEntity,
      VoucherEntity,
      ProductsEntity,
      CartEntity,
    ]),

    ProductModule,
    CartModule,
    forwardRef(() => VoucherModule),
  ],

  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
