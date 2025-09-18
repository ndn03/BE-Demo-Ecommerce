import {
  EEmployeeType,
  EOrderBy,
  EOrderByWithAt,
} from 'src/common/type.common';
// import { ERole } from 'src/configs/role.config';
// import { User } from 'src/entities/user.entity';

export const EOrderByUser = {
  ...EOrderBy,
  ...EOrderByWithAt,
  FULLNAME: 'fullName',
  CODE: 'code',
  EMAIL: 'email',
};
export type EOrderByUser = (typeof EOrderByUser)[keyof typeof EOrderByUser];

// Define EUserCustomStatus if not already defined or import it from the correct module
// export type TUserWithCustomStatus = User & {
//   customStatus: EUserCustomStatus | null;
// };
export enum ELevelReadDocument {}

export const EOrderByUserRegistration = {
  ...EOrderBy,
  ...EOrderByWithAt,
  FULLNAME: 'fullName',
  CODE: 'code',
  EMAIL: 'email',
};
export type EOrderByUserRegistration =
  (typeof EOrderByUserRegistration)[keyof typeof EOrderByUserRegistration];

export const USER_EMPLOYEE_TYPE_LABELS = {
  [EEmployeeType.FULL_TIME]: 'Nhân viên chính thức',
  [EEmployeeType.PART_TIME]: 'Nhân viên thời vụ',
  [EEmployeeType.CONTRACT]: 'Nhân viên hợp đồng',
  [EEmployeeType.TEMPORARY]: 'Nhân viên tạm thời',
};

export const CHANGE_EMAIL_EXPIRED_AFTER = 10 * 60 * 1000; // 10 minutes
