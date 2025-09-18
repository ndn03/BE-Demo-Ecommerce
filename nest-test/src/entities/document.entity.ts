import { PersonWithTrackingEntity } from 'src/common/entities/common';
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ETargetReceiverGroup } from 'src/common/type.common';
import { SendHistory } from './send-history.entity';

@Entity('document')
export class Document extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'nvarchar',
    length: 191,
    transformer: {
      to: (value: string) => value.trim(),
      from: (value: string) => value,
    },
  })
  @Index({ fulltext: true })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
    transformer: {
      to: (value: string) => (value ? value.toLowerCase() : value),
      from: (value: string) => value,
    },
  })
  author: string;

  @Column({ type: 'boolean', default: true })
  isFile: boolean;

  @Column({ type: 'varchar', nullable: true, default: null })
  thumbnail: string;

  @Column({ type: 'text', nullable: true, default: null })
  file: string;

  @Column({
    type: 'nvarchar',
    nullable: true,
    default: null,
    length: 500,
    transformer: {
      to: (value: string) => (value ? value.trim() : null),
      from: (value: string) => value,
    },
  })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: ETargetReceiverGroup,
    default: ETargetReceiverGroup.ALL,
  })
  targetReceiverGroup: ETargetReceiverGroup;

  @Column({ type: 'json', nullable: true })
  receiverIds: number[]; // list id receivers

  @OneToMany(() => SendHistory, (history) => history.document, {
    lazy: true,
  })
  sendHistories: Promise<SendHistory[]>;

  //   @Column({ type: 'boolean', default: true })
  //   showAll: boolean;

  constructor() {
    super();
    this.receiverIds = this.receiverIds ?? null;
  }

  @Exclude()
  load(u: Partial<Document>) {
    Object.assign(this, u);
  }
}
