import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { User } from './user.entity';
import { CartItemEntity } from './cart-item.entity';
import { VoucherEntity } from './voucher.entity';

@Entity('cart')
export class CartEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.cart, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => CartItemEntity, (item) => item.cart, {
    cascade: true,
    eager: true, // tự động load items khi query Cart
  })
  items: CartItemEntity[];

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.cart, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  voucher: VoucherEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;
}
