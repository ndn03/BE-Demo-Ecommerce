import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as dayjs from 'dayjs';

import {
  VoucherScheduleEntity,
  EScheduleStatus,
} from '../../entities/voucher.schedule.entity';
import {
  VoucherGenerationLogEntity,
  EGenerationStatus,
} from '../../entities/voucher.generation-log.entity';
import { VoucherTemplate } from '../../entities/voucher.template.entity';

interface CreateScheduleDto {
  templateId: number;
  name: string;
  cronExpression?: string;
  specificDate?: Date;
  daysBefore?: number;
  targetCriteria?: {
    birthdayToday?: boolean;
    registeredDaysAgo?: number;
    userRoles?: string[];
    minOrderValue?: number;
    lastOrderDaysAgo?: number;
  };
  isActive?: boolean;
}

interface UpdateScheduleDto extends Partial<CreateScheduleDto> {
  status?: EScheduleStatus;
}

/**
 * Service quản lý Schedule cho việc tự động tạo voucher
 * Tối ưu để tận dụng hệ thống có sẵn
 */
@Injectable()
export class VoucherScheduleService {
  private readonly logger = new Logger(VoucherScheduleService.name);

  constructor(
    @InjectRepository(VoucherScheduleEntity)
    private scheduleRepository: Repository<VoucherScheduleEntity>,

    @InjectRepository(VoucherGenerationLogEntity)
    private logRepository: Repository<VoucherGenerationLogEntity>,

    @InjectRepository(VoucherTemplate)
    private templateRepository: Repository<VoucherTemplate>,

    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Tạo schedule mới
   */
  async createSchedule(
    data: CreateScheduleDto,
  ): Promise<VoucherScheduleEntity> {
    // Validate template exists
    const template = await this.templateRepository.findOne({
      where: { id: data.templateId, isActive: true },
    });

    if (!template) {
      throw new Error(
        `Template ${data.templateId} không tồn tại hoặc không active`,
      );
    }

    const schedule = new VoucherScheduleEntity();
    schedule.templateId = data.templateId;
    schedule.name = data.name;
    schedule.cronExpression = data.cronExpression;
    schedule.specificDate = data.specificDate;
    schedule.daysBefore = data.daysBefore || 0;
    schedule.targetCriteria = data.targetCriteria;
    schedule.status =
      data.isActive !== false ? EScheduleStatus.ACTIVE : EScheduleStatus.PAUSED;

    // Calculate next run time
    schedule.nextRunAt = this.calculateNextRun(schedule);

    const saved = await this.scheduleRepository.save(schedule);

    // Register cron job if has cron expression
    if (schedule.cronExpression && schedule.status === EScheduleStatus.ACTIVE) {
      this.registerCronJob(saved);
    }

    this.logger.log(`✅ Created schedule ${saved.id}: ${saved.name}`);
    return saved;
  }

  /**
   * Cập nhật schedule
   */
  async updateSchedule(
    id: number,
    data: UpdateScheduleDto,
  ): Promise<VoucherScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new Error(`Schedule ${id} không tồn tại`);
    }

    // Remove old cron job
    if (schedule.cronExpression) {
      this.unregisterCronJob(schedule.id);
    }

    // Update properties
    Object.assign(schedule, data);

    // Recalculate next run
    if (data.cronExpression || data.specificDate) {
      schedule.nextRunAt = this.calculateNextRun(schedule);
    }

    const saved = await this.scheduleRepository.save(schedule);

    // Register new cron job if needed
    if (saved.cronExpression && saved.status === EScheduleStatus.ACTIVE) {
      this.registerCronJob(saved);
    }

    this.logger.log(`🔄 Updated schedule ${saved.id}`);
    return saved;
  }

  /**
   * Pause/Resume schedule
   */
  async toggleScheduleStatus(id: number): Promise<VoucherScheduleEntity> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new Error(`Schedule ${id} không tồn tại`);
    }

    const newStatus =
      schedule.status === EScheduleStatus.ACTIVE
        ? EScheduleStatus.PAUSED
        : EScheduleStatus.ACTIVE;

    schedule.status = newStatus;
    const saved = await this.scheduleRepository.save(schedule);

    if (schedule.cronExpression) {
      if (newStatus === EScheduleStatus.ACTIVE) {
        this.registerCronJob(saved);
      } else {
        this.unregisterCronJob(saved.id);
      }
    }

    this.logger.log(`🔄 Toggled schedule ${id} to ${newStatus}`);
    return saved;
  }

  /**
   * Xóa schedule
   */
  async deleteSchedule(id: number): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new Error(`Schedule ${id} không tồn tại`);
    }

    // Remove cron job
    if (schedule.cronExpression) {
      this.unregisterCronJob(schedule.id);
    }

    await this.scheduleRepository.delete(id);
    this.logger.log(`🗑️ Deleted schedule ${id}`);
  }

  /**
   * Lấy schedules với pagination và filters
   */
  async getSchedules(options?: {
    templateId?: number;
    status?: EScheduleStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    schedules: VoucherScheduleEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { templateId, status, page = 1, limit = 10 } = options || {};

    const qb = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.template', 'template')
      .leftJoinAndSelect('schedule.logs', 'logs')
      .orderBy('schedule.createdAt', 'DESC');

    if (templateId) {
      qb.andWhere('schedule.templateId = :templateId', { templateId });
    }

    if (status) {
      qb.andWhere('schedule.status = :status', { status });
    }

    const [schedules, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      schedules,
      total,
      page,
      limit,
    };
  }

  /**
   * Lấy schedules sẵn sàng chạy
   */
  async getReadySchedules(): Promise<VoucherScheduleEntity[]> {
    return this.scheduleRepository.find({
      where: {
        status: EScheduleStatus.ACTIVE,
        nextRunAt: LessThan(new Date()),
      },
      relations: ['template'],
    });
  }

  /**
   * Lấy execution logs cho schedule
   */
  async getScheduleLogs(
    scheduleId: number,
    options?: { page?: number; limit?: number },
  ): Promise<{
    logs: VoucherGenerationLogEntity[];
    total: number;
  }> {
    const { page = 1, limit = 10 } = options || {};

    const [logs, total] = await this.logRepository.findAndCount({
      where: { scheduleId },
      order: { executionTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs, total };
  }

  /**
   * Lấy statistics cho schedule
   */
  async getScheduleStats(scheduleId: number): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalVouchersGenerated: number;
    lastExecutionTime?: Date;
    nextExecutionTime?: Date;
    averageExecutionTime?: number;
  }> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    const logs = await this.logRepository.find({
      where: { scheduleId },
      order: { executionTime: 'DESC' },
    });

    const totalExecutions = logs.length;
    const successfulExecutions = logs.filter(
      (l) => l.status === EGenerationStatus.SUCCESS,
    ).length;
    const failedExecutions = logs.filter(
      (l) => l.status === EGenerationStatus.FAILED,
    ).length;
    const totalVouchersGenerated = logs.reduce(
      (sum, l) => sum + (l.successCount || 0),
      0,
    );

    const executionTimes = logs
      .map((l) => l.executionDetails?.totalExecutionTime)
      .filter((t) => t !== undefined) as number[];

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
        : undefined;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      totalVouchersGenerated,
      lastExecutionTime: logs[0]?.executionTime,
      nextExecutionTime: schedule?.nextRunAt,
      averageExecutionTime,
    };
  }

  /**
   * Register cron job cho schedule
   */
  private registerCronJob(schedule: VoucherScheduleEntity): void {
    if (!schedule.cronExpression) return;

    const jobName = `voucher-schedule-${schedule.id}`;

    try {
      // Remove existing job if exists
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        this.schedulerRegistry.deleteCronJob(jobName);
      }

      const job = new CronJob(schedule.cronExpression, async () => {
        this.logger.log(`🚀 Executing scheduled job: ${schedule.name}`);
        // This will be handled by VoucherAutoGenerationService
      });

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();

      this.logger.log(
        `📅 Registered cron job: ${jobName} with expression: ${schedule.cronExpression}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to register cron job for schedule ${schedule.id}:`,
        error,
      );
    }
  }

  /**
   * Unregister cron job
   */
  private unregisterCronJob(scheduleId: number): void {
    const jobName = `voucher-schedule-${scheduleId}`;

    try {
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        this.schedulerRegistry.deleteCronJob(jobName);
        this.logger.log(`🗑️ Unregistered cron job: ${jobName}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to unregister cron job ${jobName}:`, error);
    }
  }

  /**
   * Tính toán thời gian chạy tiếp theo
   */
  private calculateNextRun(schedule: VoucherScheduleEntity): Date {
    if (schedule.cronExpression) {
      try {
        // Simple daily calculation - can be enhanced with proper cron parser
        return dayjs().add(1, 'day').startOf('day').toDate();
      } catch (error) {
        this.logger.warn(`Invalid cron expression: ${schedule.cronExpression}`);
        return dayjs().add(1, 'day').toDate();
      }
    }

    if (schedule.specificDate) {
      const targetDate = dayjs(schedule.specificDate);
      if (schedule.daysBefore && schedule.daysBefore > 0) {
        return targetDate.subtract(schedule.daysBefore, 'day').toDate();
      }
      return targetDate.toDate();
    }

    // Default: next day
    return dayjs().add(1, 'day').toDate();
  }

  /**
   * Bulk operations
   */
  async bulkUpdateSchedules(
    scheduleIds: number[],
    updates: Partial<VoucherScheduleEntity>,
  ): Promise<void> {
    await this.scheduleRepository.update(scheduleIds, updates);

    // Handle cron jobs if status changed
    if (updates.status !== undefined) {
      const schedules = await this.scheduleRepository.find({
        where: { id: In(scheduleIds) },
      });

      for (const schedule of schedules) {
        if (schedule.cronExpression) {
          if (updates.status === EScheduleStatus.ACTIVE) {
            this.registerCronJob(schedule);
          } else {
            this.unregisterCronJob(schedule.id);
          }
        }
      }
    }

    this.logger.log(`🔄 Bulk updated ${scheduleIds.length} schedules`);
  }

  /**
   * Duplicate schedule
   */
  async duplicateSchedule(
    scheduleId: number,
    newName: string,
  ): Promise<VoucherScheduleEntity> {
    const original = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!original) {
      throw new Error(`Schedule ${scheduleId} không tồn tại`);
    }

    const duplicate = new VoucherScheduleEntity();
    Object.assign(duplicate, original);

    // Reset properties for new schedule
    delete duplicate.id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;
    delete duplicate.lastRunAt;

    duplicate.name = newName;
    duplicate.status = EScheduleStatus.PAUSED; // Start as paused
    duplicate.nextRunAt = this.calculateNextRun(duplicate);

    return this.scheduleRepository.save(duplicate);
  }
}
