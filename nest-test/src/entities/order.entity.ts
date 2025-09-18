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
// import { EStatusOrder } from 'src/common/type.common';
// import { SubImgProductEntity } from './sub-img-product.entity';
// @Entity('orders')
// export class OrdersEntity extends PersonWithTrackingEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   orderNumber: string;

//   @ManyToOne(() => UsersEntity, (user) => user.orders)
//   user: UsersEntity;

//   @OneToMany(() => OrderItemsEntity, (item) => item.order)
//   items: OrderItemsEntity[];

//   @Column()
//   status: EStatusOrder;

//   @Column()
//   total: number;
// }
