import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { CartEntity } from './cart.entity';
import { ProductsEntity } from './products.entity';

@Entity('cart_items')
export class CartItemEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: CartEntity;

  @ManyToOne(() => ProductsEntity, (product) => product.cartItems, {
    eager: true, // khi query CartItem tự load product
    onDelete: 'CASCADE',
  })
  product: ProductsEntity;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // giá tại thời điểm thêm vào giỏ
}
