import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { BrandsEntity } from './brands.entity';
import { CategoryEntity } from './categories.entity';
import { ETypeDiscount, EStatusProduct } from 'src/common/type.common';
import { SubImgProductEntity } from './sub-img-product.entity';
import { OrderItemsEntity } from './order.items.entity';
import { CartEntity } from './cart.entity';
import { CartItemEntity } from './cart-item.entity';
import { VoucherEntity } from './voucher.entity';
import { VoucherProductEntity } from './voucher.products.entity';
@Entity('products')
export class ProductsEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the product

  @Column({ type: 'varchar', length: 191 })
  name: string; // Name of the product

  @Column({ type: 'text', nullable: true })
  description: string; // Description of the product

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  price: number; // Price of the product

  @Column({ type: 'int' })
  stock: number; // Stock quantity of the product

  @Column({ type: 'decimal', precision: 5, scale: 3, default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: ETypeDiscount,
    default: ETypeDiscount.PERCENTAGE,
  })
  typeDiscount: ETypeDiscount;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  final_price: number; // Price of the product after discount

  @Column({ type: 'enum', enum: EStatusProduct, nullable: true })
  status: EStatusProduct; // Status of the product (e.g., 'available', 'out of stock')

  // @Column({ type: 'varchar', nullable: true })
  // sku: string; // Stock Keeping Unit

  @Column({ type: 'varchar', length: 191, nullable: true })
  image: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  soldCount: number;

  @OneToMany(() => SubImgProductEntity, (subImage) => subImage.product, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true, // Enable cascade operations
  })
  subImages: SubImgProductEntity[];

  @ManyToOne(() => BrandsEntity, (brand) => brand.products, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  brand: BrandsEntity;

  @ManyToMany(() => CategoryEntity, (category) => category.product, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  categoryIds: CategoryEntity[];

  @OneToMany(() => OrderItemsEntity, (orderItem) => orderItem.product)
  orderItems: OrderItemsEntity[];

  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.product)
  cartItems: CartItemEntity[];

  @OneToMany(() => VoucherProductEntity, (n) => n.product, {
    cascade: ['insert', 'remove'],
  })
  voucherProducts: VoucherProductEntity[];
}
