import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brand.controller';
import { BrandsEntity } from 'src/entities/brands.entity';
import { BrandsService } from './brand.service';
import { MediaService } from '../upload/media.service';
@Module({
  imports: [TypeOrmModule.forFeature([BrandsEntity])],
  providers: [BrandsService, MediaService],
  controllers: [BrandsController],
})
export class BrandsModule {}
