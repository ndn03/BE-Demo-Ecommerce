import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { VoucherEntity } from './voucher.entity';

export enum ECampaignType {
  PROMOTIONAL = 'PROMOTIONAL',
  SEASONAL = 'SEASONAL',
  LOYALTY = 'LOYALTY',
  REFERRAL = 'REFERRAL',
  ABANDONED_CART = 'ABANDONED_CART',
  REACTIVATION = 'REACTIVATION',
}

export enum ECampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('voucher_campaigns')
export class VoucherCampaign extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string; // Mã campaign duy nhất

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ECampaignType,
    default: ECampaignType.PROMOTIONAL,
  })
  type: ECampaignType;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ECampaignStatus,
    default: ECampaignStatus.DRAFT,
  })
  status: ECampaignStatus;

  @Column({ type: 'int', nullable: true })
  budget: number; // Ngân sách campaign (tổng giá trị giảm giá tối đa)

  @Column({ type: 'int', default: 0 })
  totalBudgetUsed: number; // Tổng ngân sách đã sử dụng

  @Column({ type: 'int', nullable: true })
  targetUsers: number; // Số lượng user mục tiêu

  @Column({ type: 'int', default: 0 })
  vouchersSent: number; // Số voucher đã gửi

  @Column({ type: 'int', default: 0 })
  vouchersUsed: number; // Số voucher đã sử dụng

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  totalRevenue: number; // Tổng doanh thu từ campaign

  @Column({ type: 'json', nullable: true })
  targetCriteria: {
    userGroups?: string[];
    registrationDateRange?: { from: Date; to: Date };
    lastOrderDateRange?: { from: Date; to: Date };
    totalSpentRange?: { min: number; max: number };
    locationIds?: number[];
    excludeUserIds?: number[];
  }; // Tiêu chí target user

  @Column({ type: 'json', nullable: true })
  settings: {
    autoStart?: boolean;
    autoEnd?: boolean;
    sendNotification?: boolean;
    trackingEnabled?: boolean;
    allowMultipleVouchers?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  analytics: {
    clickThroughRate?: number;
    conversionRate?: number;
    averageOrderValue?: number;
    returnOnInvestment?: number;
  }; // Thống kê campaign

  @OneToMany(() => VoucherEntity, (voucher) => voucher.campaign)
  vouchers: VoucherEntity[];
}
