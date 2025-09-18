// import {
//   Column,
//   Entity,
//   PrimaryGeneratedColumn,
//   ManyToMany,
//   ManyToOne,
//   OneToMany,
//   JoinTable,
// } from 'typeorm';
// import { PersonWithTrackingEntity } from 'src/common/entities/common';
// import { BrandsEntity } from './brands.entity';
// import { CategoryEntity } from './categories.entity';
// import { ETypeDiscount, EStatusProduct } from 'src/common/type.common';
// import { ProductsEntity } from './products.entity';
// import { OrdersEntity } from './order.entity';
// @Entity('order_items')
// export class OrderItemsEntity extends PersonWithTrackingEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => OrdersEntity, (order) => order.items)
//   order: OrdersEntity;

//   @ManyToOne(() => ProductsEntity, (product) => product.orderItems)
//   product: ProductsEntity;

//   @Column()
//   quantity: number;

//   @Column()
//   price: number;

//   @Column()
//   discountType: ETypeDiscount;

//   @Column()
//   discountValue: number;

//   @Column()
//   status: EStatusProduct;

//   @Column()
//   voucherCode: string;

//   @Column()
//   totalPrice: number;
// }
