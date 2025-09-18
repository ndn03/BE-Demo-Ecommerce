import { EAccountStatus, EAccountType } from '../common/type.common';
import { PasswordService } from 'src/common/services/password.service';
import { ERole } from '../configs/role.config';
import { PersonWithTrackingEntity } from '../common/entities/common';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  //   JoinColumn,
  //   ManyToMany,
  //   ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
// import { Conversation } from './conversation.entity';
// import { MessageTracking } from './message-tracking.entity';
// import { NotificationRecipient } from './notification-recipient.entity';
// import { PlanGroup } from './plan-group.entity';
// import { UserManagerTask } from './user-manager-task.entity';
import { UserPasswordRecovery } from './user-password-recovery.entity';
import { UserProfile } from './user-profile.entity';
import { DocumentRecipient } from './documment-recipient.entity';
@Entity('user')
export class User extends PersonWithTrackingEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
  username: string;

  @Column({
    type: 'varchar',
    unique: true,
    length: 191,
    nullable: false,
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value,
    },
  })
  @Index()
  email: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ERole,
    default: ERole.CUSTOMER,
  })
  role: ERole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Indicates if the measure is currently active

  @Column({
    nullable: false,
    type: 'enum',
    enum: EAccountStatus,
    default: EAccountStatus.ACTIVE,
  })
  status: EAccountStatus;

  @Column({
    type: 'enum',
    enum: EAccountType,
    nullable: false,
    default: EAccountType.REGISTER_YOURSELF,
  })
  registrationType: EAccountType;

  @Column({ type: 'varchar', nullable: false, length: 255, select: false })
  password: string;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
  })
  profile: UserProfile;

  @OneToMany(() => UserPasswordRecovery, (u) => u.user, {
    cascade: ['insert', 'remove'],
  })
  userPasswordRecoveries: UserPasswordRecovery[];

  @OneToMany(() => DocumentRecipient, (dr) => dr.user, {
    cascade: ['insert', 'remove'],
  })
  documentRecipients: DocumentRecipient[]; // Array of documents the user has received

  // Decorators handle
  @Exclude()
  load(u: Partial<User>) {
    Object.assign(this, u);
  }

  @BeforeInsert()
  hashPasswordBeforeInsert() {
    if (this.password) {
      const passwordService = new PasswordService();
      this.password = passwordService.hashingPassword(this.password);
    }
  }

  @BeforeUpdate()
  hashPasswordBeforeUpdate() {
    if (this.password) {
      const passwordService = new PasswordService();
      this.password = passwordService.hashingPassword(this.password);
    }
  }
}
