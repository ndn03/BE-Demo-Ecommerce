// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Delete,
//   Body,
//   Param,
//   Query,
//   UseGuards,
//   ParseIntPipe,
//   ValidationPipe,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
// } from '@nestjs/swagger';

// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RoleGuard } from '../auth/role.guard';
// import { VoucherAutoGenerationService } from './voucher-auto-generation.service';
// import { VoucherTemplateService } from './voucher-template.service';
// import { VoucherScheduleService } from './voucher-schedule.service';
// import {
//   VoucherTemplate,
//   EVoucherTemplateType,
// } from '../../entities/voucher.template.entity';
// import {
//   VoucherScheduleEntity,
//   EScheduleStatus,
// } from '../../entities/voucher.schedule.entity';

// /**
//  * Controller tối ưu cho quản lý Voucher Auto Generation
//  * Tận dụng tối đa hệ thống có sẵn
//  */
// @ApiTags('Voucher Auto Generation')
// @Controller('voucher-automation')
// @UseGuards(JwtAuthGuard, RoleGuard)
// @ApiBearerAuth()
// export class VoucherAutomationController {
//   constructor(
//     private autoGenerationService: VoucherAutoGenerationService,
//     private templateService: VoucherTemplateService,
//     private scheduleService: VoucherScheduleService,
//   ) {}

//   // ====================== TEMPLATE MANAGEMENT ======================

//   @Post('templates/from-campaign/:campaignId')
//   @ApiOperation({ summary: 'Tạo template từ campaign có sẵn' })
//   @ApiResponse({ status: 201, description: 'Template created successfully' })
//   async createTemplateFromCampaign(
//     @Param('campaignId', ParseIntPipe) campaignId: number,
//     @Body() templateData: Partial<VoucherTemplate>,
//   ): Promise<VoucherTemplate> {
//     return this.templateService.createTemplateFromCampaign(
//       campaignId,
//       templateData,
//     );
//   }

//   @Post('templates/from-voucher/:voucherId')
//   @ApiOperation({ summary: 'Tạo template từ voucher có sẵn' })
//   @ApiResponse({ status: 201, description: 'Template created successfully' })
//   async createTemplateFromVoucher(
//     @Param('voucherId', ParseIntPipe) voucherId: number,
//     @Body() templateData: Partial<VoucherTemplate>,
//   ): Promise<VoucherTemplate> {
//     return this.templateService.createTemplateFromVoucher(
//       voucherId,
//       templateData,
//     );
//   }

//   @Get('templates')
//   @ApiOperation({ summary: 'Lấy danh sách templates' })
//   async getTemplates(
//     @Query('type') type?: EVoucherTemplateType,
//     @Query('isActive') isActive?: boolean,
//   ): Promise<VoucherTemplate[]> {
//     if (type) {
//       return this.templateService.getTemplatesByType(type, isActive);
//     }
//     return this.templateService.getTemplatesByType(
//       EVoucherTemplateType.CUSTOM,
//       isActive,
//     );
//   }

//   @Get('templates/:id')
//   @ApiOperation({ summary: 'Lấy chi tiết template với statistics' })
//   async getTemplateWithStats(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<any> {
//     return this.templateService.getTemplateWithStats(id);
//   }

//   @Post('templates/:id/duplicate')
//   @ApiOperation({ summary: 'Nhân đôi template với modifications' })
//   async duplicateTemplate(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() modifications: Partial<VoucherTemplate>,
//   ): Promise<VoucherTemplate> {
//     return this.templateService.duplicateTemplate(id, modifications);
//   }

//   @Put('templates/bulk')
//   @ApiOperation({ summary: 'Bulk update templates' })
//   async bulkUpdateTemplates(
//     @Body() data: { templateIds: number[]; updates: Partial<VoucherTemplate> },
//   ): Promise<{ success: boolean; message: string }> {
//     await this.templateService.bulkUpdateTemplates(
//       data.templateIds,
//       data.updates,
//     );
//     return {
//       success: true,
//       message: `Updated ${data.templateIds.length} templates`,
//     };
//   }

//   @Delete('templates/:id')
//   @ApiOperation({ summary: 'Deactivate template và related schedules' })
//   async deactivateTemplate(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<{ success: boolean; message: string }> {
//     await this.templateService.deactivateTemplate(id);
//     return { success: true, message: 'Template deactivated successfully' };
//   }

//   // ====================== SCHEDULE MANAGEMENT ======================

//   @Post('schedules')
//   @ApiOperation({ summary: 'Tạo schedule mới' })
//   @ApiResponse({ status: 201, description: 'Schedule created successfully' })
//   async createSchedule(
//     @Body(ValidationPipe) scheduleData: any, // Should be CreateScheduleDto
//   ): Promise<VoucherScheduleEntity> {
//     return this.scheduleService.createSchedule(scheduleData);
//   }

//   @Put('schedules/:id')
//   @ApiOperation({ summary: 'Cập nhật schedule' })
//   async updateSchedule(
//     @Param('id', ParseIntPipe) id: number,
//     @Body(ValidationPipe) updateData: any, // Should be UpdateScheduleDto
//   ): Promise<VoucherScheduleEntity> {
//     return this.scheduleService.updateSchedule(id, updateData);
//   }

//   @Put('schedules/:id/toggle')
//   @ApiOperation({ summary: 'Pause/Resume schedule' })
//   async toggleScheduleStatus(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<VoucherScheduleEntity> {
//     return this.scheduleService.toggleScheduleStatus(id);
//   }

//   @Get('schedules')
//   @ApiOperation({ summary: 'Lấy danh sách schedules với pagination' })
//   async getSchedules(
//     @Query('templateId') templateId?: number,
//     @Query('status') status?: EScheduleStatus,
//     @Query('page') page?: number,
//     @Query('limit') limit?: number,
//   ): Promise<any> {
//     return this.scheduleService.getSchedules({
//       templateId,
//       status,
//       page,
//       limit,
//     });
//   }

//   @Get('schedules/:id/logs')
//   @ApiOperation({ summary: 'Lấy execution logs cho schedule' })
//   async getScheduleLogs(
//     @Param('id', ParseIntPipe) id: number,
//     @Query('page') page?: number,
//     @Query('limit') limit?: number,
//   ): Promise<any> {
//     return this.scheduleService.getScheduleLogs(id, { page, limit });
//   }

//   @Get('schedules/:id/stats')
//   @ApiOperation({ summary: 'Lấy statistics cho schedule' })
//   async getScheduleStats(@Param('id', ParseIntPipe) id: number): Promise<any> {
//     return this.scheduleService.getScheduleStats(id);
//   }

//   @Post('schedules/:id/duplicate')
//   @ApiOperation({ summary: 'Nhân đôi schedule' })
//   async duplicateSchedule(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() data: { name: string },
//   ): Promise<VoucherScheduleEntity> {
//     return this.scheduleService.duplicateSchedule(id, data.name);
//   }

//   @Put('schedules/bulk')
//   @ApiOperation({ summary: 'Bulk update schedules' })
//   async bulkUpdateSchedules(
//     @Body()
//     data: {
//       scheduleIds: number[];
//       updates: Partial<VoucherScheduleEntity>;
//     },
//   ): Promise<{ success: boolean; message: string }> {
//     await this.scheduleService.bulkUpdateSchedules(
//       data.scheduleIds,
//       data.updates,
//     );
//     return {
//       success: true,
//       message: `Updated ${data.scheduleIds.length} schedules`,
//     };
//   }

//   @Delete('schedules/:id')
//   @ApiOperation({ summary: 'Xóa schedule' })
//   async deleteSchedule(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<{ success: boolean; message: string }> {
//     await this.scheduleService.deleteSchedule(id);
//     return { success: true, message: 'Schedule deleted successfully' };
//   }

//   // ====================== AUTO GENERATION UTILITIES ======================

//   @Post('schedules/from-template/:templateId')
//   @ApiOperation({ summary: 'Tạo schedule từ template' })
//   async createScheduleFromTemplate(
//     @Param('templateId', ParseIntPipe) templateId: number,
//     @Body() scheduleConfig: any, // Should be proper interface
//   ): Promise<VoucherScheduleEntity> {
//     return this.autoGenerationService.createScheduleFromTemplate(
//       templateId,
//       scheduleConfig,
//     );
//   }

//   @Post('manual-generation/birthday')
//   @ApiOperation({ summary: 'Manual trigger birthday voucher generation' })
//   async manualBirthdayGeneration(): Promise<{
//     success: boolean;
//     message: string;
//   }> {
//     await this.autoGenerationService.processBirthdayVouchers();
//     return { success: true, message: 'Birthday voucher generation completed' };
//   }

//   @Post('manual-generation/scheduled')
//   @ApiOperation({ summary: 'Manual trigger scheduled voucher generation' })
//   async manualScheduledGeneration(): Promise<{
//     success: boolean;
//     message: string;
//   }> {
//     await this.autoGenerationService.processScheduledVouchers();
//     return { success: true, message: 'Scheduled voucher generation completed' };
//   }

//   @Get('ready-schedules')
//   @ApiOperation({ summary: 'Lấy danh sách schedules sẵn sàng chạy' })
//   async getReadySchedules(): Promise<VoucherScheduleEntity[]> {
//     return this.scheduleService.getReadySchedules();
//   }

//   // ====================== ANALYTICS & REPORTING ======================

//   @Get('analytics/overview')
//   @ApiOperation({ summary: 'Tổng quan analytics cho auto generation' })
//   async getAnalyticsOverview(): Promise<{
//     totalTemplates: number;
//     activeTemplates: number;
//     totalSchedules: number;
//     activeSchedules: number;
//     totalGeneratedToday: number;
//     successRate: number;
//   }> {
//     // This would need implementation in services
//     return {
//       totalTemplates: 0,
//       activeTemplates: 0,
//       totalSchedules: 0,
//       activeSchedules: 0,
//       totalGeneratedToday: 0,
//       successRate: 0,
//     };
//   }

//   @Get('analytics/template-performance')
//   @ApiOperation({ summary: 'Performance analytics cho templates' })
//   async getTemplatePerformance(
//     @Query('templateId') templateId?: number,
//     @Query('days') days: number = 30,
//   ): Promise<any[]> {
//     // This would need implementation
//     return [];
//   }

//   // ====================== SYSTEM HEALTH ======================

//   @Get('health/cron-jobs')
//   @ApiOperation({ summary: 'Kiểm tra trạng thái cron jobs' })
//   async checkCronJobsHealth(): Promise<{
//     totalJobs: number;
//     activeJobs: number;
//     failedJobs: number;
//     details: any[];
//   }> {
//     // This would need implementation
//     return {
//       totalJobs: 0,
//       activeJobs: 0,
//       failedJobs: 0,
//       details: [],
//     };
//   }

//   @Post('health/restart-jobs')
//   @ApiOperation({ summary: 'Restart all cron jobs' })
//   async restartAllCronJobs(): Promise<{ success: boolean; message: string }> {
//     // This would need implementation to restart all cron jobs
//     return { success: true, message: 'All cron jobs restarted successfully' };
//   }

//   // ========================================
//   // 🧪 TEST ENDPOINTS FOR CODE GENERATION
//   // ========================================

//   /**
//    * 🎂 Test birthday code generation
//    */
//   @Post('test/birthday-code')
//   @ApiOperation({ summary: 'Test birthday voucher code generation' })
//   async testBirthdayCode(
//     @Body()
//     dto: {
//       userId: number;
//       birthdayDate: string;
//       templateId?: number;
//       templatePrefix?: string;
//     },
//   ) {
//     // Create mock template for testing
//     const mockTemplate = {
//       id: dto.templateId || 1,
//       name: 'Test Birthday Template',
//       description: dto.templatePrefix || 'BIRTHDAY',
//       codePrefix: dto.templatePrefix,
//     } as any;

//     const code = this.templateService.generateBirthdayVoucherCode(
//       dto.userId,
//       new Date(dto.birthdayDate),
//       mockTemplate,
//     );

//     return {
//       success: true,
//       code,
//       details: {
//         userId: dto.userId,
//         birthdayDate: dto.birthdayDate,
//         template: mockTemplate.name,
//         format: 'BIRTHDAY_{YYYYMMDD}_{USER_ID}_{AGE}Y_{RANDOM}',
//       },
//     };
//   }

//   /**
//    * 👋 Test welcome code generation
//    */
//   @Post('test/welcome-code')
//   @ApiOperation({ summary: 'Test welcome voucher code generation' })
//   async testWelcomeCode(@Body() dto: { userId: number; templateId?: number }) {
//     const mockTemplate = {
//       id: dto.templateId || 2,
//       name: 'Welcome Template',
//       description: 'WELCOME',
//       type: EVoucherTemplateType.WELCOME,
//     } as any;

//     const code = this.templateService.generateVoucherCodeByTemplate(
//       mockTemplate,
//       dto.userId,
//     );

//     return {
//       success: true,
//       code,
//       details: {
//         userId: dto.userId,
//         template: mockTemplate.name,
//         format: 'WELCOME_{YYYYMMDD}_{USER_ID}_{RANDOM}',
//       },
//     };
//   }

//   /**
//    * 🎄 Test seasonal code generation
//    */
//   @Post('test/seasonal-code')
//   @ApiOperation({ summary: 'Test seasonal voucher code generation' })
//   async testSeasonalCode(
//     @Body() dto: { userId: number; eventName: string; templateId?: number },
//   ) {
//     const mockTemplate = {
//       id: dto.templateId || 3,
//       name: `${dto.eventName} Template`,
//       description: dto.eventName,
//       type: EVoucherTemplateType.SEASONAL,
//     } as any;

//     const code = this.templateService.generateVoucherCodeByTemplate(
//       mockTemplate,
//       dto.userId,
//       { eventName: dto.eventName },
//     );

//     return {
//       success: true,
//       code,
//       details: {
//         userId: dto.userId,
//         eventName: dto.eventName,
//         template: mockTemplate.name,
//         format: '{EVENT}_{YYYY}_{USER_ID}_{RANDOM}',
//       },
//     };
//   }

//   /**
//    * ⭐ Test loyalty code generation
//    */
//   @Post('test/loyalty-code')
//   @ApiOperation({ summary: 'Test loyalty voucher code generation' })
//   async testLoyaltyCode(
//     @Body() dto: { userId: number; loyaltyLevel: string; templateId?: number },
//   ) {
//     const mockTemplate = {
//       id: dto.templateId || 4,
//       name: `${dto.loyaltyLevel} Loyalty Template`,
//       description: `LOYALTY ${dto.loyaltyLevel}`,
//       type: EVoucherTemplateType.LOYALTY,
//     } as any;

//     const code = this.templateService.generateVoucherCodeByTemplate(
//       mockTemplate,
//       dto.userId,
//     );

//     return {
//       success: true,
//       code,
//       details: {
//         userId: dto.userId,
//         loyaltyLevel: dto.loyaltyLevel,
//         template: mockTemplate.name,
//         format: 'LOYALTY_{LEVEL}_{USER_ID}_{RANDOM}',
//       },
//     };
//   }

//   /**
//    * 🎨 Test custom code generation
//    */
//   @Post('test/custom-code')
//   @ApiOperation({ summary: 'Test custom voucher code generation' })
//   async testCustomCode(
//     @Body()
//     dto: {
//       userId: number;
//       birthdayDate: string;
//       templatePrefix: string;
//       templateId?: number;
//     },
//   ) {
//     const mockTemplate = {
//       id: dto.templateId || 5,
//       name: 'Custom Template',
//       description: dto.templatePrefix,
//       codePrefix: dto.templatePrefix,
//       type: EVoucherTemplateType.BIRTHDAY,
//     } as any;

//     const code = this.templateService.generateBirthdayVoucherCode(
//       dto.userId,
//       new Date(dto.birthdayDate),
//       mockTemplate,
//     );

//     return {
//       success: true,
//       code,
//       details: {
//         userId: dto.userId,
//         birthdayDate: dto.birthdayDate,
//         customPrefix: dto.templatePrefix,
//         template: mockTemplate.name,
//         format: `${dto.templatePrefix}_{YYYYMMDD}_{USER_ID}_{AGE}Y_{RANDOM}`,
//       },
//     };
//   }
// }

// /**
//  * Các DTO interfaces (nên tạo files riêng)
//  */

// interface CreateTemplateDto {
//   name: string;
//   description?: string;
//   type: EVoucherTemplateType;
//   discountValue: number;
//   discountType: string;
//   validityDays: number;
//   codePrefix?: string;
//   autoTriggerRules?: any;
//   scheduledSend?: any;
//   minOrderValue?: number;
//   maxDiscountValue?: number;
//   usageLimit?: number;
//   perUserLimit?: number;
// }

// interface CreateScheduleFromTemplateDto {
//   name: string;
//   cronExpression?: string;
//   specificDate?: Date;
//   daysBefore?: number;
//   targetCriteria?: {
//     birthdayToday?: boolean;
//     registeredDaysAgo?: number;
//     userRoles?: string[];
//     minOrderValue?: number;
//     lastOrderDaysAgo?: number;
//   };
//   isActive?: boolean;
// }
