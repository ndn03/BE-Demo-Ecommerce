import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import {
  ETargetReceiverGroup,
  EtargetType,
  ETypeDiscount,
} from '@src/common/type.common';

export enum EVoucherTemplateType {
  BIRTHDAY = 'BIRTHDAY',
  WELCOME = 'WELCOME',
  LOYALTY = 'LOYALTY',
  SEASONAL = 'SEASONAL',
  REFERRAL = 'REFERRAL',
  CUSTOM = 'CUSTOM',
}

export enum EAutoTriggerEvent {
  BIRTHDAY = 'birthday',
  REGISTRATION = 'registration',
  FIRST_ORDER = 'first_order',
  ORDER_MILESTONE = 'order_milestone',
  INACTIVE_PERIOD = 'inactive_period',
}

@Entity('voucher_templates')
export class VoucherTemplate extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // Tên template

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EVoucherTemplateType,
    default: EVoucherTemplateType.CUSTOM,
  })
  type: EVoucherTemplateType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codePrefix: string; // Prefix cho voucher code (VD: "BIRTH", "WELCOME")

  @Column({ type: 'decimal', precision: 5, scale: 3 })
  discountValue: number;

  @Column({
    type: 'enum',
    enum: ETypeDiscount,
  })
  discountType: ETypeDiscount;

  @Column({
    type: 'enum',
    enum: ETargetReceiverGroup,
    default: ETargetReceiverGroup.ALL_CUSTOMER,
  })
  targetReceiverGroup: ETargetReceiverGroup;

  @Column({ type: 'enum', enum: EtargetType })
  targetType: EtargetType;

  @Column({ type: 'json', nullable: true })
  productIds: number[];

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  minOrderValue: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  maxDiscountValue: number | null;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', default: 1 })
  perUserLimit: number;

  @Column({ type: 'int', default: 30 })
  validityDays: number; // Số ngày có hiệu lực từ khi tạo

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  autoTriggerRules: {
    event: EAutoTriggerEvent;
    conditions?: {
      daysBefore?: number; // Số ngày trước sinh nhật
      orderCount?: number; // Số đơn hàng đạt được
      inactiveDays?: number; // Số ngày không hoạt động
      totalSpent?: number; // Tổng chi tiêu
    };
  }; // Quy tắc tự động kích hoạt

  @Column({ type: 'json', nullable: true })
  scheduledSend: {
    enabled: boolean;
    cronExpression?: string; // Cron job expression
    sendDate?: Date; // Ngày gửi cụ thể
    timeZone?: string;
  }; // Lên lịch gửi tự động
}
