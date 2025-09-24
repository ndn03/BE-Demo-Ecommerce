import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartEntity } from 'src/entities/cart.entity';
import { ProductService } from '../product/product.service';
import { CartItemEntity } from '@src/entities/cart-item.entity';
import { UserService } from '../user/user.service';
import { ProductModule } from '../product/product.module';
import { User } from '@src/entities/user.entity';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity, CartItemEntity, User]),
    ProductModule,
    UserModule,
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
