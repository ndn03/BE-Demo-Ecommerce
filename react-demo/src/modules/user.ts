import {
  EEmployeeType,
  EGender,
  ERole,
  TQueryList,
  TRecordWithAuthor,
  TRecordWithDeleted,
  TRecordWithTimestamps,
} from '@configs/interface.config';
import { UploadFile } from 'antd';

export type TQueryUser = TQueryList<
  Partial<{
    isDeleted: 0 | 1;
    withDeleted: 0 | 1;
    isActive: 0 | 1;
    role: ERole;
    companyId: number;
    canAssignNewTasks: 0 | 1;
    includeTaskStats: 0 | 1;
    isStatusChangingSoon: 0 | 1;
    withUserBirthInfo: 0 | 1;
  }>
>;

export type TUserSetPassword = { newPassword: string; confirmPassword: string };

export type TUserChangePassword = { password: string } & TUserSetPassword;

export type TUserProfileBonus = { label: string; value: number };

export type TUserProfile = {
  id: number;
  userId: number;
  avatar: string;
  employeeCode: string;
  fullName: string;
  organization: string;
  position: string;
  employmentType: EEmployeeType;
  gender: EGender;
  birthDay: Date;
  baseSalary: number;
  bonuses: TUserProfileBonus[];
  dependents: string;
  numOfDependent: number;
  numOfChildren: number;
  familyAddress: string;
  spouseName: string;
  spouseEmploymentType: EEmployeeType;
  spouseBaseSalary: number;
  spouseBirthday: Date;
  spouseBonuses: TUserProfileBonus[];
  subsidiaryName: string;
} & TRecordWithAuthor &
  TRecordWithTimestamps;
export type ChangeEmailRequest = {
  email: string;
};
export type TUser = {
  id: number;
  email: string;
  role: ERole;
  isActive: number;
  companyId: number;
  profile: TUserProfile;
  changeEmailRequest: ChangeEmailRequest | null;
} & TRecordWithAuthor &
  TRecordWithDeleted &
  TRecordWithTimestamps;

export type TPostUser = {
  email: string;
  password: string;
  role?: ERole;
  isActive?: number;
  companyId?: number;
  employeeCode?: string;
  fullName?: string;
  employmentType?: EEmployeeType;
  gender?: EGender;
  birthDay?: Date;
  subsidiaryName?: string;
};

export type TTokenConfirm = {
  token: string;
};
export type TPatchUser = Omit<Partial<TPostUser>, 'email' | 'password'>;

export type TPostOrUpdateProfile = Partial<{
  employeeCode: string;
  fullName: string;
  organization: string;
  position: string;
  employmentType: EEmployeeType;
  gender: EGender;
  birthDay: Date;
  baseSalary: number;
  bonuses: TUserProfileBonus[];
  dependents: string;
  numOfDependent: number;
  numOfChildren: number;
  familyAddress: string;
  spouseName: string;
  spouseEmploymentType: EEmployeeType;
  spouseBaseSalary: number;
  spouseBirthday: Date;
  spouseBonuses: TUserProfileBonus[];
  subsidiaryName: string;
}>;

export type TPatchUserHasProfile = TPatchUser & TPostOrUpdateProfile;

export type TEmployeeStatusStats = {
  countOfUsers: number;
};

// User Registration
export type TUserRegistration = {
  id: number;
  email: string;
  fullName: string;
  employeeCode: string;
  employmentType: EEmployeeType;
  gender: EGender;
  birthDay: Date;
  subsidiaryName: string;
} & TRecordWithTimestamps;

export type TRegisterUser = {
  companyCode: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  employeeCode: string;
  employmentType: EEmployeeType;
  gender: EGender;
  birthDay: Date;
  subsidiaryName: string;
};

export type TQueryUserRegistration = TQueryList<
  Partial<{ employeeType: EEmployeeType; gender: EGender }>
>;

export type TStatisticsUserRegistration = { total: number };

export type TPostImportEmployee = { file: UploadFile };

export type TImportEmployeeItemErr = {
  row: number;
  column: string;
  message: string;
};

export type TQueryCompanyUserHumanResources = Omit<
  TQueryUser,
  | 'isDeleted'
  | 'withDeleted'
  | 'isActive'
  | 'role'
  | 'companyId'
  | 'canAssignNewTasks'
  | 'includeTaskStats'
  | 'customStatus[]'
>;
