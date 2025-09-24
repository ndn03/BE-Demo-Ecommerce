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
import { User } from './user.entity';
import { EStatusOrder } from 'src/common/type.common';
import { SubImgProductEntity } from './sub-img-product.entity';
import { OrderItemsEntity } from './order.items.entity';
@Entity('orders')
export class OrdersEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => OrderItemsEntity, (item) => item.order)
  items: OrderItemsEntity[];

  @Column()
  status: EStatusOrder;

  @Column()
  total: number;
}
