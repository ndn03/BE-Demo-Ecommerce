import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

import {
  VoucherScheduleEntity,
  EScheduleStatus,
} from '../../entities/voucher.schedule.entity';
import {
  VoucherGenerationLogEntity,
  EGenerationStatus,
} from '../../entities/voucher.generation-log.entity';
import {
  VoucherTemplate,
  EVoucherTemplateType,
  EAutoTriggerEvent,
} from '../../entities/voucher.template.entity';
import { User } from '../../entities/user.entity';
import { VoucherService } from '../voucher/voucher.service';
import { CreateVoucherDto } from '../voucher/dto/create.voucher.dto';
import { ETargetReceiverGroup } from '@src/common/type.common';

/**
 * Service tối ưu cho tự động tạo voucher
 * Tận dụng tối đa VoucherTemplate và VoucherCampaign có sẵn
 */
@Injectable()
export class VoucherAutoGenerationService {
  private readonly logger = new Logger(VoucherAutoGenerationService.name);

  constructor(
    @InjectRepository(VoucherScheduleEntity)
    private scheduleRepository: Repository<VoucherScheduleEntity>,

    @InjectRepository(VoucherGenerationLogEntity)
    private logRepository: Repository<VoucherGenerationLogEntity>,

    @InjectRepository(VoucherTemplate)
    private templateRepository: Repository<VoucherTemplate>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private voucherService: VoucherService,
  ) {}

  /**
   * Cron job chạy hàng ngày để xử lý sinh nhật
   * Tận dụng VoucherTemplate.autoTriggerRules
   */
  @Cron('0 0 * * *') // Every day at midnight
  async processBirthdayVouchers(): Promise<void> {
    this.logger.log('🎂 Bắt đầu xử lý voucher sinh nhật...');

    // Lấy templates có autoTriggerRules.event = 'birthday'
    const birthdayTemplates = await this.templateRepository.find({
      where: {
        type: EVoucherTemplateType.BIRTHDAY,
        isActive: true,
      },
    });

    const today = dayjs().tz('Asia/Ho_Chi_Minh');

    for (const template of birthdayTemplates) {
      // Check autoTriggerRules
      const triggerRules = template.autoTriggerRules;
      if (!triggerRules || triggerRules.event !== EAutoTriggerEvent.BIRTHDAY) {
        continue;
      }

      const daysBefore = triggerRules.conditions?.daysBefore || 0;
      const targetDate = today.add(daysBefore, 'day');

      // Get birthday users
      const birthdayUsers = await this.getBirthdayUsers(targetDate);

      if (birthdayUsers.length > 0) {
        await this.generateVouchersFromTemplate(
          template,
          birthdayUsers,
          'BIRTHDAY',
        );
      }
    }
  }

  /**
   * Cron job cho ngày lễ và sự kiện đặc biệt
   * Tận dụng VoucherTemplate.scheduledSend
   */
  @Cron('0 1 * * *') // Every day at 1 AM
  async processScheduledVouchers(): Promise<void> {
    this.logger.log('🎄 Bắt đầu xử lý voucher theo lịch...');

    // Lấy schedules active cho hôm nay
    const activeSchedules = await this.scheduleRepository.find({
      where: {
        status: EScheduleStatus.ACTIVE,
        nextRunAt: LessThan(new Date()),
      },
      relations: ['template'],
    });

    for (const schedule of activeSchedules) {
      await this.executeSchedule(schedule);
    }
  }

  /**
   * Tạo voucher từ template cho danh sách users
   * Tận dụng hoàn toàn VoucherTemplate configuration
   */
  private async generateVouchersFromTemplate(
    template: VoucherTemplate,
    users: User[],
    reason: string,
  ): Promise<VoucherGenerationLogEntity> {
    const startTime = Date.now();

    // Tạo log tracking
    const log = new VoucherGenerationLogEntity();
    log.scheduleId = 0; // Sẽ update sau nếu có schedule
    log.executionTime = new Date();
    log.status = EGenerationStatus.RUNNING;
    log.targetUsersCount = users.length;

    const savedLog = await this.logRepository.save(log);

    const generatedVoucherIds: number[] = [];
    const failedUserIds: number[] = [];
    let totalTime = 0;

    for (const user of users) {
      try {
        const voucherStartTime = Date.now();

        // Chuyển đổi Template → CreateVoucherDto
        const voucherDto = this.templateToVoucherDto(template, user);

        // Sử dụng VoucherService có sẵn
        const voucher = await this.voucherService.createVoucher(
          user,
          voucherDto,
        );

        generatedVoucherIds.push(voucher.id);
        savedLog.successCount++;

        totalTime += Date.now() - voucherStartTime;

        this.logger.debug(`✅ Tạo voucher ${voucher.code} cho user ${user.id}`);
      } catch (error) {
        failedUserIds.push(user.id);
        savedLog.failedCount++;

        this.logger.error(
          `❌ Lỗi tạo voucher cho user ${user.id}:`,
          error.message,
        );
      }
    }

    // Update log với kết quả
    const executionTime = Date.now() - startTime;

    savedLog.status =
      failedUserIds.length === 0
        ? EGenerationStatus.SUCCESS
        : EGenerationStatus.PARTIAL;
    savedLog.generatedVoucherIds = generatedVoucherIds;
    savedLog.failedUserIds = failedUserIds;
    savedLog.executionDetails = {
      totalExecutionTime: executionTime,
      averageTimePerVoucher: users.length > 0 ? totalTime / users.length : 0,
      queriesCount: users.length * 3, // Estimate
    };

    await this.logRepository.save(savedLog);

    this.logger.log(
      `🎯 Hoàn thành tạo voucher ${reason}: ${savedLog.successCount}/${savedLog.targetUsersCount} thành công`,
    );

    return savedLog;
  }

  /**
   * Chuyển đổi VoucherTemplate → CreateVoucherDto
   * Tận dụng hoàn toàn cấu trúc Template có sẵn
   */
  private templateToVoucherDto(
    template: VoucherTemplate,
    user: User,
  ): CreateVoucherDto {
    const today = dayjs();
    const validTo = today.add(template.validityDays, 'day');

    return {
      // Generate unique code
      code: this.generateUniqueCode(template, user, today.toDate()),

      // Copy từ template
      value_discount: template.discountValue,
      discount_type: template.discountType,
      description: `${template.description || template.name} - Tự động tạo cho ${user.email}`,
      targetType: template.targetType,
      targetReceiverGroup: template.targetReceiverGroup,

      // Specific user assignment
      receiverIds: [user.id],

      // Date range
      validFrom: today.toDate(),
      validTo: validTo.toDate(),

      // Limits từ template
      min_order_value: template.minOrderValue,
      max_discount_value: template.maxDiscountValue,
      usage_limit: template.usageLimit,
      per_user_limit: template.perUserLimit,

      // Auto-generated vouchers are private
      isActive: true,
      isPublic: false,
    } as CreateVoucherDto;
  }

  /**
   * Generate unique voucher code từ template pattern
   */
  private generateUniqueCode(
    template: VoucherTemplate,
    user: User,
    date: Date,
  ): string {
    const prefix = template.codePrefix || template.type.toUpperCase();
    const dateStr = dayjs(date).format('YYYYMMDD');
    const userStr = user.id.toString().padStart(6, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${prefix}${dateStr}_${userStr}_${random}`;
  }

  /**
   * Lấy users có sinh nhật trong ngày
   * Tối ưu query với JOIN profile
   */
  private async getBirthdayUsers(date: dayjs.Dayjs): Promise<User[]> {
    const month = date.month() + 1;
    const day = date.date();

    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('MONTH(profile.birthday) = :month', { month })
      .andWhere('DAY(profile.birthday) = :day', { day })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.deletedAt IS NULL')
      .getMany();
  }

  /**
   * Execute một schedule cụ thể
   */
  private async executeSchedule(
    schedule: VoucherScheduleEntity,
  ): Promise<void> {
    try {
      const users = await this.getTargetUsersForSchedule(schedule);

      if (users.length > 0) {
        const log = await this.generateVouchersFromTemplate(
          schedule.template,
          users,
          `SCHEDULE_${schedule.name}`,
        );

        log.scheduleId = schedule.id;
        await this.logRepository.save(log);
      }

      // Update schedule next run
      schedule.lastRunAt = new Date();
      schedule.nextRunAt = this.calculateNextRun(schedule);
      await this.scheduleRepository.save(schedule);
    } catch (error) {
      this.logger.error(`❌ Lỗi execute schedule ${schedule.id}:`, error);

      // Log error
      const errorLog = new VoucherGenerationLogEntity();
      errorLog.scheduleId = schedule.id;
      errorLog.executionTime = new Date();
      errorLog.status = EGenerationStatus.FAILED;
      errorLog.errorMessage = error.message;
      await this.logRepository.save(errorLog);
    }
  }

  /**
   * Lấy target users cho schedule theo criteria
   */
  private async getTargetUsersForSchedule(
    schedule: VoucherScheduleEntity,
  ): Promise<User[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.deletedAt IS NULL');

    const criteria = schedule.targetCriteria;
    if (!criteria) return qb.getMany();

    // Birthday criteria
    if (criteria.birthdayToday) {
      const today = dayjs();
      qb.andWhere('MONTH(profile.birthday) = :month', {
        month: today.month() + 1,
      }).andWhere('DAY(profile.birthday) = :day', { day: today.date() });
    }

    // Registration criteria
    if (criteria.registeredDaysAgo) {
      const targetDate = dayjs().subtract(criteria.registeredDaysAgo, 'day');
      qb.andWhere('DATE(user.createdAt) = :targetDate', {
        targetDate: targetDate.format('YYYY-MM-DD'),
      });
    }

    // Role criteria
    if (criteria.userRoles?.length) {
      qb.andWhere('user.role IN (:...roles)', { roles: criteria.userRoles });
    }

    return qb.getMany();
  }

  /**
   * Tính toán lần chạy tiếp theo
   */
  private calculateNextRun(schedule: VoucherScheduleEntity): Date {
    if (schedule.cronExpression) {
      // Parse cron expression (simplified)
      return dayjs().add(1, 'day').toDate();
    }

    if (schedule.specificDate) {
      // For yearly events, add 1 year
      return dayjs(schedule.specificDate).add(1, 'year').toDate();
    }

    return dayjs().add(1, 'day').toDate();
  }

  /**
   * API để tạo schedule từ template
   */
  async createScheduleFromTemplate(
    templateId: number,
    scheduleConfig: Partial<VoucherScheduleEntity>,
  ): Promise<VoucherScheduleEntity> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, isActive: true },
    });

    if (!template) {
      throw new Error(`Template ${templateId} không tồn tại hoặc không active`);
    }

    const schedule = new VoucherScheduleEntity();
    schedule.templateId = templateId;
    schedule.name = scheduleConfig.name || `Auto ${template.name}`;
    schedule.cronExpression = scheduleConfig.cronExpression;
    schedule.specificDate = scheduleConfig.specificDate;
    schedule.daysBefore = scheduleConfig.daysBefore;
    schedule.targetCriteria = scheduleConfig.targetCriteria;
    schedule.status = EScheduleStatus.ACTIVE;
    schedule.nextRunAt = this.calculateNextRun(schedule);

    return this.scheduleRepository.save(schedule);
  }
}
