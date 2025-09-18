import { PersonWithTrackingWithoutSoftDeleteEntity } from '../common/entities/common';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';
import {
  EEmployeeType,
  EGender,
  EPosition,
  EWorkShift,
} from '../common/type.common';
// import { IsOptional } from 'class-validator';
// import { IsUniqueFieldInArray } from 'src/common/decorators/array-unique-field.decorator';

@Entity('user-profile')
export class UserProfile extends PersonWithTrackingWithoutSoftDeleteEntity {
  @Index()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;
  @OneToOne(() => User, (u) => u.profile, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'varchar',
    length: 191,
    transformer: {
      to: (value: string) => (value ? value.trim() : value),
      from: (value: string) => value,
    },
    nullable: true,
  })
  fullName: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 191,
    transformer: {
      to: (value: string) => (value ? value.trim() : value),
      from: (value: string) => value,
    },
    nullable: true,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 191,
    transformer: {
      to: (value: string) => (value ? value.trim() : value),
      from: (value: string) => value,
    },
    nullable: true,
  })
  subName: string;

  @Column({ type: 'nvarchar', nullable: true, length: 191 })
  avatar: string;

  @Column({ type: 'enum', enum: EWorkShift, nullable: true })
  workShift: EWorkShift;

  @Column({ type: 'enum', enum: EPosition, nullable: true })
  position: EPosition;

  @Column({ type: 'timestamp', nullable: true })
  birthDay: Date;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: EEmployeeType, default: null, nullable: true })
  employmentType: EEmployeeType;

  @Column({ type: 'enum', enum: EGender, default: null, nullable: true })
  gender: EGender;

  @Exclude()
  @Column({ nullable: true })
  fullAddress: string;

  @Exclude()
  load(u: Partial<UserProfile>) {
    Object.assign(this, u);
  }
  /**
   * @example
   * const profile = new UserProfile();
   * profile.load({ firstName: 'John', age: 30 });
   *
   * @explain-comment
   * Hàm này dùng để cập nhật các thuộc tính của đối tượng hiện tại bằng các giá trị từ đối tượng truyền vào.
   * Nó sử dụng Object.assign để sao chép các thuộc tính từ đối tượng u sang đối tượng hiện tại.
   */
}
