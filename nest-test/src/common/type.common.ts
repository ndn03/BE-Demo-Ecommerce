export interface IRes<T = any> {
  data?: T; // Dữ liệu trả về, có thể là một đối tượng hoặc mảng
  message: string; // Thông điệp trả về
  [key: string]: any;
}

export interface IResListData<T = any> extends IRes<T> {
  total: number; // Tổng số bản ghi
  limit: number; // Giới hạn số bản ghi trên mỗi trang
  page: number; // Số trang hiện tại
}

export type Nullable<T> = T | null;

export enum EStatusOrder {
  PENDING = 'PENDING', // Đang chờ xử lý
  PROCESSING = 'PROCESSING', // Đang xử lý
  SHIPPED = 'SHIPPED', // Đã giao hàng
  DELIVERED = 'DELIVERED', // Đã nhận hàng
  CANCELLED = 'CANCELLED', // Đã hủy
  RETURNED = 'RETURNED', // Đã trả hàng
  REFUNDED = 'REFUNDED', // Đã hoàn tiền
}

export enum EVoucherStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
  UPCOMING = 'UPCOMING',
}

export const EStatusOrderLabel: Record<EStatusOrder, string> = {
  [EStatusOrder.PENDING]: 'Đang chờ xử lý',
  [EStatusOrder.PROCESSING]: 'Đang xử lý',
  [EStatusOrder.SHIPPED]: 'Đã giao hàng',
  [EStatusOrder.DELIVERED]: 'Đã nhận hàng',
  [EStatusOrder.CANCELLED]: 'Đã hủy',
  [EStatusOrder.RETURNED]: 'Đã trả hàng',
  [EStatusOrder.REFUNDED]: 'Đã hoàn tiền',
};
export enum ETypeDiscount {
  PERCENTAGE = 'PERCENTAGE', // Phần trăm
  AMOUNT = 'AMOUNT', // Số tiền
  NO_DISCOUNT = 'NO_DISCOUNT', // Không giảm giá
}

export enum EStatusProduct {
  ACTIVE = 'ACTIVE', // Đang bán
  INACTIVE = 'INACTIVE', // Ngưng bán / ẩn
  OUT_OF_STOCK = 'OUT_OF_STOCK', // Hết hàng
  COMING_SOON = 'COMING_SOON', // Sắp ra mắt
  DISCONTINUED = 'DISCONTINUED', // Ngừng sản xuất
}

export enum EAccountType {
  REGISTER_YOURSELF = 'REGISTER_YOURSELF', // Tự đăng ký
  ACCOUNT_ISSUED = 'ACCOUNT_ISSUED', // Tài khoản được phát hành
  ADMIN_ISSUED = 'ADMIN_ISSUED', // Admin hệ thống phát hành (Thường trong trường hợp phát hành tài khoản HR cho công ty khi tạo một công ty mới)
}
export enum ETemplateTaskOffsetUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export enum EAccountStatus {
  ACTIVE = 'ACTIVE', // Tài khoản đang hoạt động
  INACTIVE = 'INACTIVE', // Tài khoản không hoạt động
  SUSPENDED = 'SUSPENDED', // Tài khoản bị tạm ngưng
  PENDING = 'PENDING', // Tài khoản đang chờ xác nhận
  BLOCKED = 'BLOCKED', // Tài khoản bị chặn
  REJECTED = 'REJECTED', // Tài khoản bị từ chối
}

export const EAccountStatusLabel: Record<EAccountStatus, string> = {
  [EAccountStatus.ACTIVE]: 'Đang hoạt động',
  [EAccountStatus.INACTIVE]: 'Không hoạt động',
  [EAccountStatus.SUSPENDED]: 'Bị tạm ngưng',
  [EAccountStatus.PENDING]: 'Đang chờ xác nhận',
  [EAccountStatus.BLOCKED]: 'Bị chặn',
  [EAccountStatus.REJECTED]: 'Bị từ chối',
};

export enum EWorkShift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  ROTATING = 'ROTATING',
  FULL_DAY = 'FULL_DAY',
}
export enum EWorkShift_LABEL {
  MORNING = 'Ca sáng',
  AFTERNOON = 'Ca chiều',
  EVENING = 'Ca tối',
  NIGHT = 'Ca đêm',
  ROTATING = 'Ca luân phiên',
  FULL_DAY = 'Cả ngày',
}

export enum EEmployeeType {
  FULL_TIME = 'FULL_TIME', // Nhân viên chính thức
  TEMPORARY = 'TEMPORARY', // Nhân viên tạm thời
  PART_TIME = 'PART_TIME', // Nhân viên bán thời gian
  CONTRACT = 'CONTRACT', // Nhân viên hợp đồng
}

export enum EGender {
  MALE = 'MALE', // Nam
  FEMALE = 'FEMALE', // Nữ
  OTHER = 'OTHER', // Khác
}

export enum ERquestLeaveStatus {
  OPEN = 'OPEN', // Đang mở
  PENDING = 'PENDING', // Đang chờ hợp nhất
  CLOSED = 'CLOSED', // Đã đóng (Quá trình nghỉ phép đã hoàn tất)
}

export enum EOrder {
  DESC = 'DESC', // Giảm dần
  ASC = 'ASC', // Tăng dần
}

export enum EPosition {
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  STAFF = 'STAFF',
  INTERN = 'INTERN',
  ENGINEER = 'ENGINEER',
  ACCOUNTANT = 'ACCOUNTANT',
  HR = 'HR',
  SALE = 'SALE',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
}

export const EPosition_LABEL: Record<EPosition, string> = {
  [EPosition.DIRECTOR]: 'Giám đốc',
  [EPosition.MANAGER]: 'Trưởng phòng',
  [EPosition.TEAM_LEAD]: 'Trưởng nhóm',
  [EPosition.STAFF]: 'Nhân viên',
  [EPosition.INTERN]: 'Thực tập sinh',
  [EPosition.ENGINEER]: 'Kỹ sư',
  [EPosition.ACCOUNTANT]: 'Kế toán',
  [EPosition.HR]: 'Nhân sự',
  [EPosition.SALE]: 'Kinh doanh',
  [EPosition.CUSTOMER_SERVICE]: 'Chăm sóc khách hàng',
};

// Enum cho các trường sắp xếp theo thời gian
export const EOrderByWithAt = {
  UPDATED_AT: 'updatedAt', // Thời gian cập nhật
  CREATE_AT: 'createdAt', // Thời gian tạo
} as const;
export type EOrderByWithAt =
  (typeof EOrderByWithAt)[keyof typeof EOrderByWithAt];

export const EOrderBy = { ID: 'id' } as const;
export type EOrderBy = (typeof EOrderBy)[keyof typeof EOrderBy];

// Enum cho các nhóm người nhận thông báo
export enum ETargetReceiverGroup {
  ALL = 0,
  HUMAN_RESOURCES = 1,
  EMPLOYEE = 2,
}

export const CHUNK_SIZE = 100; // Kích thước chunk tối đa cho các thao tác phân mảnh

// Số năm tối đa cho các khoảng thời gian
export const OFFSET_MAX_YEARS = 5;
export const OFFSET_MAX_MONTHS = OFFSET_MAX_YEARS * 12;
export const OFFSET_MAX_WEEKS = OFFSET_MAX_YEARS * 52;
export const OFFSET_MAX_DAYS = OFFSET_MAX_YEARS * 365;
