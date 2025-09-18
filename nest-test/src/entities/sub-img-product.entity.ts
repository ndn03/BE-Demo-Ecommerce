import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TrackingWithoutSoftDeleteEntity } from '@src/common/entities/common';
import { ProductsEntity } from './products.entity';

@Entity('sub_img_product')
export class SubImgProductEntity extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductsEntity, (product) => product.subImages, {
    onDelete: 'CASCADE', // Đảm bảo sử dụng CASCADE
    onUpdate: 'CASCADE',
  })
  product: ProductsEntity;

  @Column({ type: 'varchar', length: 191 })
  url: string; // URL of the sub-image
}
