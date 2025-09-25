import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { CartEntity } from './cart.entity';
import { ERole, ROLE_GROUPS } from '@src/configs/role.config';
import { ProductsEntity } from './products.entity';
import { CategoryEntity } from './categories.entity';
import { BrandsEntity } from './brands.entity';
import { User } from './user.entity';
import { ETypeDiscount, EVoucherStatus } from '@src/common/type.common';
@Entity('vouchers')
export class VoucherEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'decimal', precision: 5, scale: 3, default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: ETypeDiscount,
  })
  discount_type: ETypeDiscount;

  @Column({ type: 'timestamp', nullable: false })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: false })
  expirationDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string; // Description of the product

  @Column({ type: 'simple-array', nullable: true })
  applicableRoles: ERole[];

  @ManyToMany(() => BrandsEntity, (brands) => brands.vouchers, {
    cascade: true,
  })
  @JoinTable({
    name: 'voucher_brands',
    joinColumn: { name: 'voucher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'brand_id', referencedColumnName: 'id' },
  })
  brandsIds: BrandsEntity[];

  @ManyToMany(() => CategoryEntity, (category) => category.vouchers, {
    cascade: true,
  })
  @JoinTable({
    name: 'voucher_categories',
    joinColumn: { name: 'voucher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categoriesIds: CategoryEntity[];

  @ManyToMany(() => ProductsEntity, (product) => product.vouchers, {
    cascade: true,
  })
  @JoinTable({
    name: 'voucher_products',
    joinColumn: { name: 'voucher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  productsIds: ProductsEntity[];

  @ManyToMany(() => ProductsEntity, (product) => product.vouchers, {
    cascade: true,
  })
  @JoinTable({
    name: 'voucher_users',
    joinColumn: { name: 'voucher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  userIds: User[];
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  min_order_value: number | null; // Giá trị đơn hàng tối thiểu để áp dụng voucher

  @Column({ type: 'int', nullable: true }) // Giới hạn số lần sử dụng
  usage_limit: number | null;

  @Column({ type: 'int', default: 0 }) // Số lần đã được sử dụng
  used_count: number;

  @Column({ type: 'int', default: 1 }) // Giới hạn số lần sử dụng cho mỗi người dùng
  per_user_limit: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: EVoucherStatus,
    default: EVoucherStatus.ACTIVE,
  })
  status: EVoucherStatus;

  @OneToMany(() => CartEntity, (cart) => cart.voucher)
  cart: CartEntity[];
}
