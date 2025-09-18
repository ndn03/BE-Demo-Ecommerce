// TODO: Update the import path below if the User entity is located elsewhere
import { User } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

export class PersonEntity {
  @Column({ type: 'int', nullable: true })
  creatorId: number;
  @ManyToOne((): typeof User => User, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'int', nullable: true })
  editorId: number;
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
  })
  @JoinColumn({ name: 'editorId' })
  editor: User;
}

export class TrackingWithoutSoftDeleteEntity {
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;
}

export class TrackingEntity extends TrackingWithoutSoftDeleteEntity {
  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date;
}
export class PersonWithTrackingEntity extends PersonEntity {
  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;
}

export class PersonWithTrackingWithoutSoftDeleteEntity extends PersonEntity {
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;
}
