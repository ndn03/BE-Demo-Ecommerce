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

  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingAddress?: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => OrderItemsEntity, (item) => item.order)
  items: OrderItemsEntity[];

  @Column()
  status: EStatusOrder;

  @Column({ type: 'text', nullable: true })
  reason?: string; // Lý do cập nhật trạng thái (hủy đơn, trả hàng, etc.)

  @Column({ type: 'text', nullable: true })
  note?: string; // Ghi chú thêm cho đơn hàng

  @Column()
  total: number;
}
