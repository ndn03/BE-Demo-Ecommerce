import { TUser } from '@src/modules/user';

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

export enum ERole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  // COMPANY_ADMIN = 'COMPANY_ADMIN',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  EMPLOYEE = 'EMPLOYEE',
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
