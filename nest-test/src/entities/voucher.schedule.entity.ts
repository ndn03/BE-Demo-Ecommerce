import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { VoucherTemplate } from './voucher.template.entity';
import { VoucherGenerationLogEntity } from './voucher.generation-log.entity';

export enum EScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

/**
 * Entity quản lý lịch trình tự động tạo voucher
 * Tận dụng VoucherTemplate làm blueprint
 */
@Entity('voucher_schedules')
export class VoucherScheduleEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  templateId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // "Birthday 2024", "Christmas Campaign"

  @Column({ type: 'varchar', length: 50, nullable: true })
  cronExpression: string; // "0 0 * * *" for daily at midnight

  @Column({ type: 'date', nullable: true })
  specificDate: Date; // Cho ngày lễ cụ thể (Christmas: 2024-12-25)

  @Column({ type: 'int', nullable: true })
  daysBefore: number; // Tạo voucher trước X ngày

  @Column({
    type: 'enum',
    enum: EScheduleStatus,
    default: EScheduleStatus.ACTIVE,
  })
  status: EScheduleStatus;

  @Column({ type: 'datetime', nullable: true })
  lastRunAt: Date;

  @Column({ type: 'datetime', nullable: true })
  nextRunAt: Date;

  @Column({ type: 'json', nullable: true })
  targetCriteria: {
    birthdayToday?: boolean; // Sinh nhật hôm nay
    registeredDaysAgo?: number; // Đăng ký X ngày trước
    lastOrderDaysAgo?: number; // Đặt hàng lần cuối X ngày trước
    totalSpentMin?: number; // Tổng chi tiêu tối thiểu
    userRoles?: string[]; // Roles cụ thể
    excludeRecentVoucher?: boolean; // Loại trừ users có voucher gần đây
  };

  // Relationships
  @ManyToOne(() => VoucherTemplate, { eager: true })
  @JoinColumn({ name: 'templateId' })
  template: VoucherTemplate;

  @OneToMany(() => VoucherGenerationLogEntity, (log) => log.schedule)
  logs: VoucherGenerationLogEntity[];
}
