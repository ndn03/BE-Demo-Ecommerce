import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from './user.entity';
import { VoucherEntity } from './voucher.entity';
import { EVoucherStatus } from '@src/common/type.common';

@Entity('voucher-recipient')
export class VoucherRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  voucherId: number; // id của voucher
  @ManyToOne(() => VoucherEntity, (v) => v.voucherRecipients, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: VoucherEntity; // Many-to-one relationship with Voucher entity

  @Column({ type: 'int' })
  userId: number; // id của người nhận voucher
  @ManyToOne(() => User, (u) => u.voucherRecipients, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User; // Many-to-one relationship with User entity

  @Column({ type: 'int', default: 1 })
  quantity: number; // Số lượng voucher đã nhận

  @Column({ type: 'int', default: 0 })
  usedCount: number; // số lần user đã dùng voucher

  @Column({ type: 'int', nullable: true })
  maxUsages: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  receiveAt: Date; // thời gian nhận voucher

  @Column({
    type: 'enum',
    enum: EVoucherStatus,
    default: EVoucherStatus.ACTIVE,
  })
  status: EVoucherStatus;

  @Column({ type: 'timestamp', nullable: true })
  firstUsedAt: Date; // Lần đầu tiên sử dụng

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date; // Lần cuối sử dụng

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalDiscountApplied: number; // Tổng số tiền đã giảm

  @Column({ type: 'json', nullable: true })
  usageHistory: {
    orderId?: number;
    usedAt: Date;
    discountAmount: number;
  }[]; // Lịch sử sử dụng chi tiết

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string; // Nguồn nhận voucher: 'admin_assign', 'auto_birthday', 'referral', 'claim_public'

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Thời gian hết hạn riêng cho user này (ghi đè voucher.validTo)
}
