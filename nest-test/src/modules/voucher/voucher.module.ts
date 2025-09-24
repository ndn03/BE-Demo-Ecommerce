import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherController } from './voucher.controller';
import { VoucherEntity } from './voucher.entity';
import { VoucherService } from './voucher.service';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherEntity])],
  providers: [VoucherService],
  controllers: [VoucherController]
})
export class VoucherModule { }
