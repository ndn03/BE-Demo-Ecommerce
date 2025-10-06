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
@Entity('voucher-history')
export class VoucherHistory extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the send history record

  @Column({ type: 'int' })
  voucherId: number;
  @ManyToOne(() => VoucherEntity, (voucher) => voucher.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: VoucherEntity; // Many-to-one relationship with VoucherEntity

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date; // Timestamp indicating when the notification was sent

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: Date; // set expiration time
}
