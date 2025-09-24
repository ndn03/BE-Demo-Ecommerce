import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Voucher')
export class VoucherEntity {
    @PrimaryGeneratedColumn() id:string;
}
