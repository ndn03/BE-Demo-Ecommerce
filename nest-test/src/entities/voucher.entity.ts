import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { CartEntity } from './cart.entity';
import { VoucherProductEntity } from './voucher.products.entity';
import {
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
  EVoucherStatus,
} from '@src/common/type.common';
import { VoucherRecipient } from './voucher.user.entity';
import { VoucherHistory } from './voucher.history.entity';
import { VoucherCampaign } from './voucher.campaign.entity';
@Entity('vouchers')
export class VoucherEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'int', nullable: true })
  campaignId: number; // ID của campaign chứa voucher này

  @ManyToOne(() => VoucherCampaign, (campaign) => campaign.vouchers, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: VoucherCampaign; // Mối quan hệ với campaign

  @Column({ type: 'decimal', precision: 5, scale: 3, default: 0 })
  value_discount: number;

  @Column({
    type: 'enum',
    enum: ETypeDiscount,
  })
  discount_type: ETypeDiscount;

  @Column({ type: 'text', nullable: true })
  description: string; // Description of the product

  @Column({
    type: 'enum',
    enum: ETargetReceiverGroup,
    default: ETargetReceiverGroup.ALL_CUSTOMER,
  })
  targetReceiverGroup: ETargetReceiverGroup;

  // NOTE: receiverIds và voucher_productIds đã được thay thế bằng relationship tables
  // Sử dụng VoucherRecipient và VoucherProductEntity thay thế
  // @Column({ type: 'json', nullable: true })
  // receiverIds: number[]; // list id receivers

  @Column({ type: 'enum', enum: EtargetType })
  targetType: EtargetType;

  // @Column({ type: 'json', nullable: true })
  // voucher_productIds: number[]; // list id products

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  min_order_value: number | null; // Giá trị đơn hàng tối thiểu để áp dụng voucher

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  max_discount_value: number | null; // Giá trị giảm giá tối đa

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

  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validTo: Date;

  @OneToMany(() => CartEntity, (cart) => cart.voucher)
  cart: CartEntity[];

  @OneToMany(() => VoucherRecipient, (recipient) => recipient.voucher, {
    cascade: ['insert', 'remove'],
  })
  voucherRecipients: VoucherRecipient[];

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @OneToMany(() => VoucherHistory, (history) => history.voucher, {
    lazy: true,
  })
  sendHistories: Promise<VoucherHistory[]>;

  @OneToMany(() => VoucherProductEntity, (vp) => vp.voucher, {
    cascade: true,
  })
  voucherProducts: VoucherProductEntity[];
}
