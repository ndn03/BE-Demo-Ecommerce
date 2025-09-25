import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brand.controller';
import { BrandsEntity } from 'src/entities/brands.entity';
import { BrandsService } from './brand.service';
import { MediaService } from '../upload/media.service';
import { VoucherEntity } from 'src/entities/voucher.entity';
@Module({
  imports: [TypeOrmModule.forFeature([BrandsEntity, VoucherEntity])],
  providers: [BrandsService, MediaService],
  controllers: [BrandsController],
  exports: [BrandsService, MediaService],
})
export class BrandsModule {}
