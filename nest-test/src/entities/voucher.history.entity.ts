import { TrackingWithoutSoftDeleteEntity } from '@src/common/entities/common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VoucherEntity } from './voucher.entity';
import { User } from './user.entity';
/**
 * 📜 **VoucherHistory - Voucher instance và usage tracking**
 *
 * **Purpose:** Track individual voucher instances per user
 *
 * **Use Cases:**
 * - Personal voucher instances với custom validity
 * - Individual usage tracking per user
 * - Personalized voucher campaigns
 * - A/B testing với different expiration periods
 */
@Entity('voucher-history')
export class VoucherHistory extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  voucherId: number;

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: VoucherEntity;

  // 👤 **User who received this voucher instance**
  @Column({ type: 'int', nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 📅 **Instance-specific validity (can override template)**
  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date; // Instance start date (when user can start using)

  @Column({ type: 'timestamp', nullable: true })
  validTo: Date; // Instance end date (when expires for this user)

  // 🔢 **Instance-specific usage tracking**
  @Column({ type: 'int', default: 1 })
  instanceUsageLimit: number; // số lần sử dụng tối đa cho instance này

  @Column({ type: 'int', default: 0 })
  instanceUsedCount: number; // số lần đã sử dụng instance này

  // Legacy fields (renamed for clarity)
  @Column({ type: 'timestamp', nullable: true })
  sentDate: Date; // When this voucher instance was sent/assigned to user

  @Column({ type: 'timestamp', nullable: true })
  lastUsedDate: Date; // When this instance was last used
}
