import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { ProductsEntity } from './products.entity';
@Entity('brands')
export class BrandsEntity extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Logo của thương hiệu',
    select: false,
  })
  logo: string;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ProductsEntity, (product) => product.brand, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  products: ProductsEntity[];
}
