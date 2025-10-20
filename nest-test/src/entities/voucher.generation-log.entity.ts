import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { VoucherScheduleEntity } from './voucher.schedule.entity';

export enum EGenerationStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  RUNNING = 'RUNNING',
}

/**
 * Entity lưu lịch sử tạo voucher tự động
 * Tích hợp với VoucherSchedule để tracking
 */
@Entity('voucher_generation_logs')
export class VoucherGenerationLogEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  scheduleId: number;

  @Column({ type: 'datetime' })
  executionTime: Date;

  @Column({
    type: 'enum',
    enum: EGenerationStatus,
    default: EGenerationStatus.RUNNING,
  })
  status: EGenerationStatus;

  @Column({ type: 'int', default: 0 })
  targetUsersCount: number; // Số users được target

  @Column({ type: 'int', default: 0 })
  successCount: number; // Số voucher tạo thành công

  @Column({ type: 'int', default: 0 })
  failedCount: number; // Số voucher tạo thất bại

  @Column({ type: 'json', nullable: true })
  generatedVoucherIds: number[]; // IDs của vouchers đã tạo

  @Column({ type: 'json', nullable: true })
  failedUserIds: number[]; // IDs của users tạo voucher thất bại

  @Column({ type: 'text', nullable: true })
  errorMessage: string; // Chi tiết lỗi nếu có

  @Column({ type: 'json', nullable: true })
  executionDetails: {
    totalExecutionTime?: number; // ms
    averageTimePerVoucher?: number; // ms
    memoryUsage?: number; // MB
    queriesCount?: number;
  };

  // Relationships
  @ManyToOne(() => VoucherScheduleEntity, (schedule) => schedule.logs)
  @JoinColumn({ name: 'scheduleId' })
  schedule: VoucherScheduleEntity;
}
