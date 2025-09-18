// // import { PersonWithTrackingWithoutSoftDeleteEntity } from '@src/common/entities/common';
// // import {
// //   Column,
// //   Entity,
// //   Index,
// //   JoinColumn,
// //   OneToOne,
// //   PrimaryGeneratedColumn,
// // } from 'typeorm';
// // import { User } from './user.entity';
// // import { Exclude } from 'class-transformer';
// // import { EEmployeeType, EGender } from '@common/type.common';
// // import { IsUniqueFieldInArray } from '@src/common/decorators/array-unique-field.decorator';
// // import { IsOptional } from 'class-validator';

//  @Column({ type: 'json', nullable: true })
//   @IsOptional()
//   @IsUniqueFieldInArray('label', {
//     message: 'Each label in spouseBonuses must be unique.',
//   })
//   bonuses: { label: string; value: number }[];

//     // Salary, bonus and allowance information
//   @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
//   baseSalary: number; // lương cơ bản
// tài khoản ngân hàng
