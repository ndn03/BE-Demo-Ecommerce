import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { PersonWithTrackingEntity } from '@src/common/entities/common';
import { ProductsEntity } from './products.entity';
import { VoucherEntity } from './voucher.entity';
@Entity('categories')
export class CategoryEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 191 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
  //slug
  // @Column({ type: 'varchar', length: 191, unique: true })
  // slug: string;

  @ManyToMany(() => ProductsEntity, (product) => product.categoryIds)
  product: ProductsEntity[];

  @ManyToMany(() => VoucherEntity, (voucher) => voucher.categoriesIds, {})
  vouchers: VoucherEntity[];
}
