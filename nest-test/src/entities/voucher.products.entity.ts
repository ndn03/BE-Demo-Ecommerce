import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { VoucherEntity } from './voucher.entity';
import { ProductsEntity } from './products.entity';

@Entity('voucher_products')
export class VoucherProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.voucherProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: VoucherEntity;

  @ManyToOne(() => ProductsEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductsEntity;
}
