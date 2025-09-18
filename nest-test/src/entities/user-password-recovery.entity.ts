import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';
import { TrackingWithoutSoftDeleteEntity } from 'src/common/entities/common';

@Entity('user_password_recovery')
export class UserPasswordRecovery extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 191,
    nullable: false,
    unique: true,
  })
  token: string;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  expiresAt: Date;

  @OneToOne(() => User, (user) => user.userPasswordRecoveries, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  @Exclude({ toPlainOnly: true })
  user: User;

  @Exclude()
  load(u: Partial<UserPasswordRecovery>) {
    Object.assign(this, u);
  }
}
