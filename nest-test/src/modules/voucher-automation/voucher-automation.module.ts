// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ScheduleModule } from '@nestjs/schedule';

// import { VoucherAutoGenerationService } from './voucher-auto-generation.service';
// import { VoucherTemplateService } from './voucher-template.service';
// import { VoucherScheduleService } from './voucher-schedule.service';
// // import { VoucherAutomationController } from './voucher-automation.controller';

// // Import VoucherModule để sử dụng VoucherService
// import { VoucherModule } from '../voucher/voucher.module';

// // Import các modules cần thiết khác
// import { ProductModule } from '../product/product.module';
// import { BrandsModule } from '../brand/brand.module';
// import { CategoryModule } from '../category/category.module';
// import { UserModule } from '../user/user.module';

// // Import entities cho automation
// import { VoucherTemplate } from '../../entities/voucher.template.entity';
// import { VoucherCampaign } from '../../entities/voucher.campaign.entity';
// import { VoucherScheduleEntity } from '../../entities/voucher.schedule.entity';
// import { VoucherGenerationLogEntity } from '../../entities/voucher.generation-log.entity';
// import { VoucherEntity } from '../../entities/voucher.entity';
// import { User } from '../../entities/user.entity';

// /**
//  * Module riêng cho Voucher Auto Generation System
//  * Tách biệt khỏi VoucherModule để dễ quản lý và maintain
//  */
// @Module({
//   imports: [
//     // TypeORM entities cho automation features
//     TypeOrmModule.forFeature([
//       VoucherTemplate,
//       VoucherCampaign,
//       VoucherScheduleEntity,
//       VoucherGenerationLogEntity,
//       VoucherEntity,
//       User,
//     ]),

//     // Schedule module cho cron jobs
//     ScheduleModule.forRoot(),

//     // Import VoucherModule để sử dụng VoucherService
//     VoucherModule,

//     // Import các modules dependency
//     ProductModule,
//     BrandsModule,
//     CategoryModule,
//     UserModule,
//   ],

//   providers: [
//     VoucherAutoGenerationService,
//     VoucherTemplateService,
//     VoucherScheduleService,
//   ],

//   // controllers: [VoucherAutomationController],

//   exports: [
//     VoucherAutoGenerationService,
//     VoucherTemplateService,
//     VoucherScheduleService,
//   ],
// })
// export class VoucherAutomationModule {}
