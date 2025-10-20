// // 🎯 Import NestJS core dependencies
// import { Injectable, Logger } from '@nestjs/common'; // Injectable decorator và Logger service
// import { InjectRepository } from '@nestjs/typeorm'; // Decorator để inject repository
// import { Repository } from 'typeorm'; // TypeORM Repository pattern

// // 🎨 Import voucher template entities và enums
// import {
//   VoucherTemplate, // Entity chính cho template
//   EVoucherTemplateType, // Enum định nghĩa các loại template
// } from '../../entities/voucher.template.entity';

// // ⏰ Import voucher schedule entities
// import {
//   VoucherScheduleEntity, // Entity quản lý lịch trình
//   EScheduleStatus, // Enum trạng thái schedule
// } from '../../entities/voucher.schedule.entity';

// // 🎪 Import related entities
// import { VoucherCampaign } from '../../entities/voucher.campaign.entity'; // Entity campaign
// import { CreateVoucherDto } from '../voucher/dto/create.voucher.dto'; // DTO tạo voucher
// import { VoucherEntity } from '../../entities/voucher.entity'; // Entity voucher chính

// /**
//  * 🎨 **VoucherTemplateService** - Service quản lý template voucher
//  *
//  * **Chức năng chính:**
//  * - Tạo template từ campaign/voucher có sẵn (tái sử dụng config)
//  * - Quản lý lifecycle template (CRUD operations)
//  * - Tự động sinh code voucher thông minh theo nhiều format
//  * - Validation và optimization template configuration
//  *
//  * **Tận dụng tối đa VoucherCampaign có sẵn để tránh dư thừa**
//  */
// @Injectable()
// export class VoucherTemplateService {
//   // 📝 Logger instance để track operations và debug
//   private readonly logger = new Logger(VoucherTemplateService.name);

//   constructor(
//     // 🎨 Repository để thao tác với VoucherTemplate entity
//     @InjectRepository(VoucherTemplate)
//     private templateRepository: Repository<VoucherTemplate>,

//     // 🎪 Repository để thao tác với VoucherCampaign entity (tái sử dụng config)
//     @InjectRepository(VoucherCampaign)
//     private campaignRepository: Repository<VoucherCampaign>,

//     // ⏰ Repository để thao tác với VoucherScheduleEntity (liên kết schedule)
//     @InjectRepository(VoucherScheduleEntity)
//     private scheduleRepository: Repository<VoucherScheduleEntity>,

//     // 🎫 Repository để thao tác với VoucherEntity (tracking generated vouchers)
//     @InjectRepository(VoucherEntity)
//     private voucherRepository: Repository<VoucherEntity>,
//   ) {} // 🚀 Constructor injection - NestJS tự động inject các dependency

//   /**
//    * 🎪 **Tạo template mới từ campaign có sẵn**
//    *
//    * **Logic:** Tận dụng campaign configuration để tránh duplicate setup
//    * **Input:** campaignId + partial template data
//    * **Output:** VoucherTemplate entity đã được save vào DB
//    */
//   async createTemplateFromCampaign(
//     campaignId: number, // 📍 ID của campaign làm base
//     templateData: Partial<VoucherTemplate>, // 🎨 Data override cho template
//   ): Promise<VoucherTemplate> {
//     // 🔍 Tìm campaign với relations để lấy voucher samples
//     const campaign = await this.campaignRepository.findOne({
//       where: { id: campaignId }, // 📍 Filter theo ID
//       relations: ['vouchers'], // 🔗 Eager load vouchers để copy config
//     });

//     // ❌ Validation: Campaign phải tồn tại
//     if (!campaign) {
//       throw new Error(`Campaign ${campaignId} không tồn tại`);
//     }

//     // 🎯 Sample voucher từ campaign để copy config
//     const sampleVoucher = campaign.vouchers?.[0]; // 📄 Lấy voucher đầu tiên làm mẫu
//     if (!sampleVoucher) {
//       throw new Error(`Campaign ${campaignId} chưa có voucher mẫu`);
//     }

//     // 🏗️ Tạo instance template mới
//     const template = new VoucherTemplate();

//     // 📋 Copy metadata từ campaign (business context)
//     template.name = templateData.name || `${campaign.name} Template`; // 🏷️ Tên mặc định từ campaign
//     template.description = templateData.description || campaign.description; // 📝 Mô tả kế thừa

//     // 💰 Copy discount configuration từ sample voucher (proven settings)
//     template.discountType = sampleVoucher.discount_type; // 📊 Loại giảm giá (%, fixed)
//     template.discountValue = sampleVoucher.value_discount; // 💵 Giá trị giảm giá
//     template.minOrderValue = sampleVoucher.min_order_value; // 🛒 Đơn hàng tối thiểu
//     template.maxDiscountValue = sampleVoucher.max_discount_value; // 🔝 Giới hạn giảm tối đa

//     // 🎯 Copy targeting configuration (ai được nhận)
//     template.targetType = sampleVoucher.targetType; // 👥 Loại target (user, group, etc)
//     template.targetReceiverGroup = sampleVoucher.targetReceiverGroup; // 🎭 Nhóm đối tượng

//     // 📊 Copy usage limits (kiểm soát sử dụng)
//     template.usageLimit = sampleVoucher.usage_limit; // 🔢 Tổng số lần sử dụng
//     template.perUserLimit = sampleVoucher.per_user_limit; // 👤 Giới hạn per user

//     // 🎨 Template specific configuration (automation features)
//     template.type = templateData.type || EVoucherTemplateType.CUSTOM; // 🏷️ Loại template
//     template.validityDays = templateData.validityDays || 30; // ⏳ Số ngày hiệu lực mặc định
//     template.isActive = true; // ✅ Active ngay sau khi tạo
//     template.codePrefix = templateData.codePrefix; // 🔤 Prefix cho code generation
//     template.autoTriggerRules = templateData.autoTriggerRules; // ⚡ Rules tự động trigger
//     template.scheduledSend = templateData.scheduledSend; // ⏰ Lịch trình gửi

//     // 🛍️ Product relations will be handled separately if needed (complex mapping)

//     // 💾 Save template vào database và return
//     return this.templateRepository.save(template);
//   }

//   /**
//    * 🎫 **Tạo template từ voucher có sẵn**
//    *
//    * **Logic:** Tối ưu để reuse configuration từ voucher đã proven hiệu quả
//    * **Use case:** Khi có voucher manual thành công, muốn tự động hóa
//    */
//   async createTemplateFromVoucher(
//     voucherId: number, // 🎯 ID voucher làm base template
//     templateData: Partial<VoucherTemplate>, // 🎨 Override data nếu cần
//   ): Promise<VoucherTemplate> {
//     // 🔍 Tìm voucher với đầy đủ relations để copy config
//     const voucher = await this.voucherRepository.findOne({
//       where: { id: voucherId }, // 📍 Filter theo voucher ID
//       relations: ['voucherProducts', 'campaign'], // 🔗 Load product và campaign relations
//     });

//     // ❌ Validation: Voucher phải tồn tại
//     if (!voucher) {
//       throw new Error(`Voucher ${voucherId} không tồn tại`);
//     }

//     // 🏗️ Tạo template instance mới
//     const template = new VoucherTemplate();

//     // 📋 Copy basic info từ voucher (proven effective settings)
//     template.name = templateData.name || `Template từ ${voucher.code}`; // 🏷️ Tên từ voucher code
//     template.description = templateData.description || voucher.description; // 📝 Mô tả kế thừa

//     // 💰 Copy tất cả discount configuration (đã proven hiệu quả)
//     template.discountType = voucher.discount_type; // 📊 Loại giảm giá
//     template.discountValue = voucher.value_discount; // 💵 Giá trị giảm
//     template.minOrderValue = voucher.min_order_value; // 🛒 Đơn tối thiểu
//     template.maxDiscountValue = voucher.max_discount_value; // 🔝 Giảm tối đa

//     // 🎯 Copy targeting configuration
//     template.targetType = voucher.targetType; // 👥 Loại đối tượng
//     template.targetReceiverGroup = voucher.targetReceiverGroup; // 🎭 Nhóm đối tượng

//     // 📊 Copy usage limits (có thể adjust cho template)
//     template.usageLimit = voucher.usage_limit; // 🔢 Giới hạn sử dụng
//     template.perUserLimit = voucher.per_user_limit; // 👤 Giới hạn per user

//     // 🛍️ Campaign and product relations will be handled separately if needed (complex logic)

//     // 🎨 Template specific configuration (automation capabilities)
//     template.type = templateData.type || EVoucherTemplateType.CUSTOM; // 🏷️ Loại template
//     template.validityDays = templateData.validityDays || 30; // ⏳ Thời hạn mặc định
//     template.isActive = true; // ✅ Kích hoạt ngay
//     template.codePrefix = templateData.codePrefix; // 🔤 Prefix for code generation
//     template.autoTriggerRules = templateData.autoTriggerRules; // ⚡ Auto trigger rules

//     // 💾 Save và return template đã tạo
//     return this.templateRepository.save(template);
//   }

//   /**
//    * 📊 **Lấy template với statistics chi tiết**
//    *
//    * **Logic:** Combine template data với thống kê usage để đánh giá hiệu quả
//    * **Return:** Template + statistics về voucher generated và schedules
//    */
//   async getTemplateWithStats(templateId: number): Promise<any> {
//     // 🔍 Tìm template theo ID
//     const template = await this.templateRepository.findOne({
//       where: { id: templateId }, // 📍 Filter theo template ID
//     });

//     // ❌ Validation: Template phải tồn tại
//     if (!template) {
//       throw new Error(`Template ${templateId} không tồn tại`);
//     }

//     // 📊 Count vouchers được tạo từ template (measure effectiveness)
//     const vouchersCount = await this.voucherRepository.count({
//       where: { templateId: templateId }, // 🔗 Filter vouchers theo template ID
//     });

//     // ⏰ Count active schedules sử dụng template (measure automation usage)
//     const activeSchedulesCount = await this.scheduleRepository.count({
//       where: {
//         templateId: templateId, // 🔗 Filter schedules theo template
//         status: EScheduleStatus.ACTIVE, // ✅ Chỉ count schedules đang active
//       },
//     });

//     // 🎯 Return template với enriched statistics
//     return {
//       ...template, // 📄 Spread tất cả template properties
//       statistics: {
//         generatedVouchersCount: vouchersCount, // 📊 Số voucher đã tạo
//         activeSchedulesCount, // ⏰ Số schedule đang active
//       },
//     };
//   }

//   /**
//    * 📋 **Duplicate template với modifications**
//    *
//    * **Logic:** Tối ưu để tạo variations từ template có sẵn (A/B testing, seasonal variants)
//    * **Use case:** Tạo template tương tự nhưng có một số thay đổi nhỏ
//    */
//   async duplicateTemplate(
//     templateId: number, // 📍 ID template gốc cần duplicate
//     modifications: Partial<VoucherTemplate>, // 🎨 Các thay đổi muốn apply
//   ): Promise<VoucherTemplate> {
//     // 🔍 Tìm template gốc để duplicate
//     const original = await this.templateRepository.findOne({
//       where: { id: templateId }, // 📍 Filter theo template ID
//     });

//     // ❌ Validation: Template gốc phải tồn tại
//     if (!original) {
//       throw new Error(`Template ${templateId} không tồn tại`);
//     }

//     // 🏗️ Tạo instance mới để duplicate
//     const duplicate = new VoucherTemplate();

//     // 📋 Copy tất cả properties từ original (shallow copy)
//     Object.assign(duplicate, original);

//     // 🗑️ Remove các fields auto-generated để tạo mới (avoid conflicts)
//     delete duplicate.id; // 🆔 ID sẽ được auto-generate
//     delete duplicate.createdAt; // ⏰ Timestamp sẽ được tự động set
//     delete duplicate.updatedAt; // ⏰ Timestamp sẽ được tự động set

//     // 🎨 Apply modifications lên duplicate (override specific fields)
//     Object.assign(duplicate, modifications);

//     // 🏷️ Ensure unique name nếu không có custom name
//     if (!modifications.name) {
//       duplicate.name = `${original.name} (Copy)`; // 📝 Default naming convention
//     }

//     // 💾 Save duplicate template và return
//     return this.templateRepository.save(duplicate);
//   }

//   /**
//    * 🔄 **Convert template thành CreateVoucherDto**
//    *
//    * **Logic:** Utility function for voucher generation từ template
//    * **Purpose:** Bridge pattern giữa Template và actual Voucher creation
//    */
//   templateToCreateDto(
//     template: VoucherTemplate, // 📋 Template source data
//     overrides?: Partial<CreateVoucherDto>, // 🎨 Override specific fields if needed
//   ): CreateVoucherDto {
//     // 🏗️ Build base DTO từ template configuration
//     const baseDto: CreateVoucherDto = {
//       code: '', // 🔤 Will be generated by code generation functions
//       description: template.description, // 📝 Copy description từ template

//       // 💰 Discount configuration từ template
//       value_discount: template.discountValue, // 💵 Giá trị giảm giá
//       discount_type: template.discountType, // 📊 Loại giảm giá (%, fixed)

//       // 🎯 Target configuration từ template
//       targetType: template.targetType, // 👥 Loại đối tượng
//       targetReceiverGroup: template.targetReceiverGroup, // 🎭 Nhóm đối tượng

//       // 🛒 Order và usage limits từ template
//       min_order_value: template.minOrderValue, // 🛒 Đơn hàng tối thiểu
//       max_discount_value: template.maxDiscountValue, // 🔝 Giảm giá tối đa
//       usage_limit: template.usageLimit, // 🔢 Tổng số lần sử dụng
//       per_user_limit: template.perUserLimit, // 👤 Giới hạn per user

//       // 🛍️ Product IDs and template ID will be handled by caller if needed (complex logic)

//       // ⚙️ Default voucher configuration
//       isActive: true, // ✅ Active ngay khi tạo
//       isPublic: false, // 🔒 Private by default (controlled distribution)

//       // ⏰ Validity period calculation từ template
//       validFrom: new Date(), // 📅 Hiệu lực từ bây giờ
//       validTo: new Date(
//         Date.now() + template.validityDays * 24 * 60 * 60 * 1000, // ⏳ Tính validTo từ validityDays
//       ),
//       receiverIds: [], // 👥 Will be set by caller (specific targeting)
//     };

//     // 🎨 Merge base DTO với overrides và return
//     return { ...baseDto, ...overrides };
//   }

//   /**
//    * 🔍 **Get templates by type với filtering**
//    *
//    * **Logic:** Query templates theo type với optional active status filter
//    * **Use Case:** Dashboard filtering, type-specific template management
//    * **Performance:** Indexed query với QueryBuilder cho optimization
//    */
//   async getTemplatesByType(
//     type: EVoucherTemplateType, // 🏷️ Template type filter (Birthday, Welcome, etc.)
//     isActive?: boolean, // ✅ Optional active status filter
//   ): Promise<VoucherTemplate[]> {
//     // 🔍 Build query với type filter
//     const queryBuilder = this.templateRepository
//       .createQueryBuilder('template') // 📋 Query alias
//       .where('template.type = :type', { type }); // 🎯 Type-based filtering

//     // ✅ Add active status filter if specified
//     if (isActive !== undefined) {
//       queryBuilder.andWhere('template.isActive = :isActive', { isActive });
//     }

//     // 📊 Execute query và return results
//     return queryBuilder.getMany();
//   }

//   /**
//    * 🔄 **Bulk operations cho templates**
//    *
//    * **Logic:** Mass update multiple templates efficiently
//    * **Use Case:** Bulk activation/deactivation, mass configuration updates
//    * **Performance:** Single database operation thay vì multiple individual updates
//    */
//   async bulkUpdateTemplates(
//     templateIds: number[], // 📍 Array of template IDs to update
//     updates: Partial<VoucherTemplate>, // 🎨 Update data to apply
//   ): Promise<void> {
//     // 🔄 Execute bulk update operation
//     await this.templateRepository.update(templateIds, updates);

//     // 📝 Log operation cho tracking
//     this.logger.log(`✅ Bulk updated ${templateIds.length} templates`);
//   }

//   /**
//    * 🔒 **Deactivate template và related schedules**
//    *
//    * **Logic:** Comprehensive deactivation - template + dependent schedules
//    * **Use Case:** Template deprecation, campaign termination
//    * **Safety:** Ensures no orphaned active schedules
//    */
//   async deactivateTemplate(templateId: number): Promise<void> {
//     // 🔒 Deactivate the template itself
//     await this.templateRepository.update(templateId, { isActive: false });

//     // ⏸️ Deactivate tất cả related schedules để avoid orphaned automations
//     await this.scheduleRepository.update(
//       { templateId }, // 🔗 Filter schedules by template ID
//       { status: EScheduleStatus.PAUSED }, // ⏸️ Pause instead of delete (reversible)
//     );

//     // 📝 Log comprehensive deactivation
//     this.logger.log(
//       `🔒 Deactivated template ${templateId} and related schedules`,
//     );
//   }

//   /**
//    * 🎂 **Tự sinh code voucher sinh nhật**
//    *
//    * **Smart Format:** BIRTHDAY_{YYYYMMDD}_{USER_ID}_{AGE}Y_{RANDOM}
//    * **Example:** BIRTHDAY_20241009_000123_34Y_A5F2
//    * **Features:** Meaningful, unique, readable, trackable
//    */
//   generateBirthdayVoucherCode(
//     userId: number, // 👤 User ID để personalize
//     birthdayDate?: Date, // 🎂 Ngày sinh để tính tuổi và context
//     template?: VoucherTemplate, // 📋 Template để lấy custom prefix (optional)
//   ): string {
//     // 🔤 Get prefix từ template hoặc default 'BIRTHDAY'
//     const prefix = template?.codePrefix || 'BIRTHDAY';

//     // 📅 Sử dụng birthday date hoặc ngày hiện tại (flexible dating)
//     const targetDate = birthdayDate || new Date();
//     const dateStr = this.formatDateForCode(targetDate); // 📅 Convert to YYYYMMDD format

//     // 👤 User ID với padding to ensure consistent length (000123)
//     const userStr = userId.toString().padStart(6, '0');

//     // 🎲 Random string để đảm bảo uniqueness (collision prevention)
//     const random = this.generateRandomString(4);

//     // 🎯 Age calculation (nếu có birthday date) - adds business context
//     let ageStr = '';
//     if (birthdayDate) {
//       const age = this.calculateAge(birthdayDate); // 🧮 Tính tuổi chính xác
//       ageStr = age > 0 ? `_${age}Y` : ''; // 📊 Format: 34Y (34 years old)
//     }

//     // 🎨 Assemble final code với meaningful structure
//     return `${prefix}_${dateStr}_${userStr}${ageStr}_${random}`;
//   }

//   /**
//    * 🎨 **Universal Code Generator - Tự sinh code theo template và context**
//    *
//    * **Logic:** Smart dispatcher dựa trên template type
//    * **Features:** Context-aware, type-specific formatting, extensible
//    * **Supported Types:** Birthday, Welcome, Seasonal, Loyalty, Default
//    */
//   generateVoucherCodeByTemplate(
//     template: VoucherTemplate, // 📋 Template chứa type và config
//     userId: number, // 👤 User context cho personalization
//     context?: {
//       // 🎯 Additional context cho specialized generation
//       birthdayDate?: Date; // 🎂 Birthday context for age calculation
//       eventName?: string; // 🎄 Event name for seasonal vouchers
//       specialCode?: string; // ⭐ Special code for custom scenarios
//     },
//   ): string {
//     // 🎯 Smart dispatcher - Route to appropriate generator based on type
//     switch (template.type) {
//       case EVoucherTemplateType.BIRTHDAY:
//         // 🎂 Birthday-specific generation with age calculation
//         return this.generateBirthdayVoucherCode(
//           userId, // 👤 User ID
//           context?.birthdayDate, // 🎂 Birthday for age context
//           template, // 📋 Template for prefix/config
//         );

//       case EVoucherTemplateType.WELCOME:
//         // 👋 Welcome voucher for new users
//         return this.generateWelcomeVoucherCode(userId, template);

//       case EVoucherTemplateType.SEASONAL:
//         // 🎄 Seasonal/holiday vouchers (Christmas, Tet, etc.)
//         return this.generateSeasonalVoucherCode(
//           userId, // 👤 User context
//           template, // 📋 Template config
//           context?.eventName, // 🎄 Event name (CHRISTMAS, TET)
//         );

//       case EVoucherTemplateType.LOYALTY:
//         // ⭐ Loyalty program vouchers (VIP, Member levels)
//         return this.generateLoyaltyVoucherCode(userId, template);

//       default:
//         // 🎟️ Fallback to generic voucher code generation
//         return this.generateDefaultVoucherCode(userId, template);
//     }
//   }

//   /**
//    * 👋 **Sinh code cho welcome voucher**
//    *
//    * **Format:** WELCOME_{YYYYMMDD}_{USER_ID}_{RANDOM}
//    * **Example:** WELCOME_20241009_000123_X8K9
//    * **Use Case:** New user onboarding, first-time buyer incentive
//    */
//   private generateWelcomeVoucherCode(
//     userId: number, // 👤 New user ID
//     template: VoucherTemplate, // 📋 Template config
//   ): string {
//     // 🔤 Prefix từ template hoặc default 'WELCOME'
//     const prefix = template.codePrefix || 'WELCOME';
//     // 📅 Current date for context (registration/welcome date)
//     const dateStr = this.formatDateForCode(new Date());
//     // 👤 Padded user ID for consistency
//     const userStr = userId.toString().padStart(6, '0');
//     // 🎲 Random component for uniqueness
//     const random = this.generateRandomString(4);

//     // 🎯 Assemble welcome-specific code
//     return `${prefix}_${dateStr}_${userStr}_${random}`;
//   }

//   /**
//    * 🎄 **Sinh code cho seasonal voucher (Tết, Christmas, etc.)**
//    *
//    * **Format:** {EVENT}_{YYYY}_{USER_ID}_{RANDOM}
//    * **Examples:** CHRISTMAS_2024_000123_F5A2, TET_2025_000456_K9L7
//    * **Use Case:** Holiday campaigns, seasonal promotions
//    */
//   private generateSeasonalVoucherCode(
//     userId: number, // 👤 Target user ID
//     template: VoucherTemplate, // 📋 Template với event config
//     eventName?: string, // 🎄 Override event name
//   ): string {
//     // 🎄 Event name priority: parameter > template prefix > default
//     const event = eventName || template.codePrefix || 'SEASON';
//     // 📅 Current year for seasonal context
//     const year = new Date().getFullYear();
//     // 👤 Consistent user ID formatting
//     const userStr = userId.toString().padStart(6, '0');
//     // 🎲 Random uniqueness component
//     const random = this.generateRandomString(4);

//     // 🎯 Seasonal code assembly
//     return `${event}_${year}_${userStr}_${random}`;
//   }

//   /**
//    * ⭐ **Sinh code cho loyalty voucher**
//    *
//    * **Format:** LOYALTY_{LEVEL}_{USER_ID}_{RANDOM}
//    * **Examples:** LOYALTY_VIP_000123_Q4R5, LOYALTY_MEMBER_000456_T7U8
//    * **Use Case:** Loyalty program rewards, tier-based incentives
//    */
//   private generateLoyaltyVoucherCode(
//     userId: number, // 👤 Loyalty program member ID
//     template: VoucherTemplate, // 📋 Template với loyalty config
//   ): string {
//     // 🔤 Base prefix từ template
//     const prefix = template.codePrefix || 'LOYALTY';
//     // 👤 Consistent user formatting
//     const userStr = userId.toString().padStart(6, '0');
//     // 🎲 Random component cho uniqueness
//     const random = this.generateRandomString(4);

//     // ⭐ Smart loyalty level determination từ template context
//     const level = this.determineLoyaltyLevel(template);

//     // 🎯 Loyalty-specific code với level context
//     return `${prefix}_${level}_${userStr}_${random}`;
//   }

//   /**
//    * 🎟️ **Sinh code mặc định**
//    *
//    * **Format:** VOUCHER_{YYYYMMDD}_{USER_ID}_{RANDOM}
//    * **Example:** VOUCHER_20241009_000123_Z9X8Y7
//    * **Use Case:** Fallback cho các loại template không có specialized generator
//    */
//   private generateDefaultVoucherCode(
//     userId: number, // 👤 User ID cho personalization
//     template: VoucherTemplate, // 📋 Template cho basic config
//   ): string {
//     // 🔤 Generic prefix từ template hoặc default
//     const prefix = template.codePrefix || 'VOUCHER';
//     // 📅 Current date context
//     const dateStr = this.formatDateForCode(new Date());
//     // 👤 Consistent user ID formatting
//     const userStr = userId.toString().padStart(6, '0');
//     // 🎲 Longer random string cho generic vouchers (extra security)
//     const random = this.generateRandomString(6);

//     // 🎯 Standard voucher code assembly
//     return `${prefix}_${dateStr}_${userStr}_${random}`;
//   }

//   // =====================================================
//   // 🛠️ **HELPER METHODS** - Code Generation Utilities
//   // =====================================================

//   /**
//    * 📅 **Helper: Format date cho voucher code**
//    *
//    * **Logic:** Convert Date object thành YYYYMMDD format cho code
//    * **Input:** JavaScript Date object
//    * **Output:** String format YYYYMMDD (e.g., "20241009")
//    */
//   private formatDateForCode(date: Date): string {
//     // 📅 Convert to ISO string, extract date part, remove dashes
//     return date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
//   }

//   /**
//    * 🎲 **Helper: Generate random string**
//    *
//    * **Logic:** Tạo random alphanumeric string với length specified
//    * **Characters:** A-Z + 0-9 (36 chars total) - easy to read/type
//    * **Use Case:** Uniqueness component trong voucher codes
//    */
//   private generateRandomString(length: number): string {
//     // 🔤 Character set: uppercase letters + numbers (avoid confusion)
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let result = ''; // 📄 Result accumulator

//     // 🔄 Generate each character randomly
//     for (let i = 0; i < length; i++) {
//       result += chars.charAt(Math.floor(Math.random() * chars.length)); // 🎲 Random character selection
//     }
//     return result; // 🎯 Return generated string
//   }

//   /**
//    * 🧮 **Helper: Tính tuổi từ birthday**
//    *
//    * **Logic:** Accurate age calculation considering month/day differences
//    * **Edge Cases:** Handles leap years, future birthdays, month/day precision
//    * **Use Case:** Age context trong birthday voucher codes
//    */
//   private calculateAge(birthday: Date): number {
//     const today = new Date(); // 📅 Current date reference
//     const birthDate = new Date(birthday); // 🎂 Birth date normalized

//     // 🧮 Basic year difference calculation
//     let age = today.getFullYear() - birthDate.getFullYear();

//     // 📅 Month difference để adjust age accuracy
//     const monthDiff = today.getMonth() - birthDate.getMonth();

//     // 🎯 Adjust age if birthday hasn't occurred this year yet
//     if (
//       monthDiff < 0 || // 📅 Birthday month hasn't come yet
//       (monthDiff === 0 && today.getDate() < birthDate.getDate()) // 📅 Same month but day hasn't come
//     ) {
//       age--; // 🔄 Subtract one year if birthday not reached
//     }

//     return age; // 🎯 Return accurate age
//   }

//   /**
//    * ⭐ **Helper: Xác định loyalty level**
//    *
//    * **Logic:** Smart loyalty level detection từ template context
//    * **Current Implementation:** Simple keyword matching
//    * **Future Enhancement:** Integration với user history, purchase patterns
//    */
//   private determineLoyaltyLevel(template: VoucherTemplate): string {
//     // 🔍 Logic có thể phức tạp hơn dựa vào user history, purchase patterns
//     // 📊 Hiện tại sử dụng simple keyword matching trong description

//     // ⭐ Check for VIP indicators trong template description
//     return template.description?.includes('VIP') ? 'VIP' : 'MEMBER';

//     // 🚀 Future enhancements:
//     // - Integration với user purchase history
//     // - Dynamic level calculation based on spending
//     // - Time-based loyalty progression
//     // - Custom loyalty rules từ template configuration
//   }

//   /**
//    * ✅ **Validate template configuration**
//    *
//    * **Logic:** Comprehensive validation cho template data integrity
//    * **Returns:** Array of error messages (empty = valid)
//    * **Use Case:** Pre-save validation, API input validation
//    */
//   validateTemplate(template: Partial<VoucherTemplate>): string[] {
//     const errors: string[] = []; // 📝 Error collector array

//     // 🏷️ Validate template name (required field)
//     if (!template.name?.trim()) {
//       errors.push('Template name is required'); // 📝 Name cannot be empty/whitespace
//     }

//     // 💰 Validate discount value (must be positive)
//     if (!template.discountValue || template.discountValue <= 0) {
//       errors.push('Discount value must be greater than 0'); // 💵 Positive discount required
//     }

//     // ⏳ Validate validity days (must be positive)
//     if (!template.validityDays || template.validityDays <= 0) {
//       errors.push('Validity days must be greater than 0'); // 📅 Positive duration required
//     }

//     // 🛒 Validate min order value (cannot be negative if set)
//     if (template.minOrderValue && template.minOrderValue < 0) {
//       errors.push('Min order value cannot be negative'); // 💸 No negative minimums
//     }

//     // 🔝 Validate max discount value (must be positive if set)
//     if (template.maxDiscountValue && template.maxDiscountValue <= 0) {
//       errors.push('Max discount value must be greater than 0 if set'); // 💰 Positive cap required
//     }

//     // 🎯 Future validation rules to consider:
//     // - maxDiscountValue should be >= discountValue for fixed discounts
//     // - perUserLimit should be <= usageLimit if both are set
//     // - codePrefix should follow naming conventions
//     // - autoTriggerRules should have valid JSON structure

//     return errors; // 📋 Return validation results
//   }
// }
