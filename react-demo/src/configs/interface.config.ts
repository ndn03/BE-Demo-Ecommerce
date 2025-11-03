import { TUser } from '@modules/user';

export enum EEmployeeType {
  FULL_TIME = 'FULL_TIME',
  TEMPORARY = 'TEMPORARY',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
}

export enum EGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum EWorkShift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export enum EPosition {
  INTERN = 'INTERN',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  TEAM_LEAD = 'TEAM_LEAD',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
}

export enum EAccountType {
  ACCOUNT_ISSUED = 'ACCOUNT_ISSUED',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export enum ERole {
  ADMINISTRATOR = 'ADMINISTRATOR', // Admin hệ thống
  HUMAN_RESOURCES = 'HUMAN_RESOURCES', // HR của công ty
  EMPLOYEE = 'EMPLOYEE', // Nhân viên công ty
  CUSTOMER = 'CUSTOMER', // Khách hàng
  CUSTOMER_VIP1 = 'CUSTOMER_VIP1', // Khách hàng VIP 1
  CUSTOMER_VIP2 = 'CUSTOMER_VIP2', // Khách hàng VIP 2
  CUSTOMER_VIP3 = 'CUSTOMER_VIP3', // Khách hàng VIP 3
}

export interface IStatusCode {
  statusCode: number;
}

export interface IMessage {
  message: string;
}

export interface ILimit {
  limit?: number;
}

export interface IPage {
  page?: number;
}

export interface IExtra<T = any> {
  [key: string]: T;
}

export type TQueryList<T = any> = ILimit &
  IPage & {
    order?: EOrder;
    orderBy?: EOrderBy;
    s?: string;
    'unIds[]'?: number[];
    'notInIds[]'?: number[];
  } & T;

export type TQueryListWithDeleted<T = any> = TQueryList<T> & {
  isDeleted?: 0 | 1;
  withDeleted?: 0 | 1;
};

export type TResDataListApi<T = any, K = any> = {
  page: number;
  limit: number;
  total: number;
} & { data: T } & IExtra<K>;
export type TRecordWithDeleted = {
  deletedAt: Date;
};

export type TRecordWithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type TRecordWithAuthor = {
  creatorId: number;
  creator: TUser;
  editorId: number;
  editor: TUser;
};

export enum EOrder {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum EOrderBy {
  ID = 'id',
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  OFFSET_DAYS = 'offsetDays',
  DEADLINE = 'deadline',
  FULLNAME = 'fullName',
  EMAIL = 'email',
  EMPLOYEE_CODE = 'employeeCode',
}

export enum ETargetReceiverGroup {
  ALL = 0,
  HUMAN_RESOURCES = 1,
  EMPLOYEE = 2,
}

// API Response Types
export type TResApi<T = any> = IMessage & {
  data: T;
  statusCode?: number;
};

export type TResApiErr = {
  message: string;
  statusText?: string;
  statusCode?: number;
};
