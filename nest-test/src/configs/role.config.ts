export enum ERole {
  ADMINISTRATOR = 'ADMINISTRATOR', // Admin hệ thống
  HUMAN_RESOURCES = 'HUMAN_RESOURCES', // HR của công ty
  EMPLOYEE = 'EMPLOYEE', // Nhân viên công ty
  CUSTOMER = 'CUSTOMER', // Khách hàng
  CUSTOMER_VIP1 = 'CUSTOMER_VIP1', // Khách hàng VIP 1
  CUSTOMER_VIP2 = 'CUSTOMER_VIP2', // Khách hàng VIP 2
  CUSTOMER_VIP3 = 'CUSTOMER_VIP3', // Khách hàng VIP 3
}

export const ROLES_OF_SYSTEM = [
  ERole.ADMINISTRATOR,
  ERole.HUMAN_RESOURCES,
  ERole.EMPLOYEE,
  ERole.CUSTOMER,
  ERole.CUSTOMER_VIP1,
  ERole.CUSTOMER_VIP2,
  ERole.CUSTOMER_VIP3,
];

export const ROLE_LABELS = {
  [ERole.ADMINISTRATOR]: 'Admin hệ thống',
  [ERole.HUMAN_RESOURCES]: 'HR công ty',
  [ERole.EMPLOYEE]: 'Nhân viên công ty',
  [ERole.CUSTOMER]: 'Khách hàng',
  [ERole.CUSTOMER_VIP1]: 'Khách hàng VIP 1',
  [ERole.CUSTOMER_VIP2]: 'Khách hàng VIP 2',
  [ERole.CUSTOMER_VIP3]: 'Khách hàng VIP 3',
};

export const ROLE_GROUPS = {
  MANAGEMENT: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  CUSTOMERS: [
    ERole.CUSTOMER,
    ERole.CUSTOMER_VIP1,
    ERole.CUSTOMER_VIP2,
    ERole.CUSTOMER_VIP3,
  ],
  EMPLOYEES: [ERole.EMPLOYEE],
  ALL: [
    ERole.ADMINISTRATOR,
    ERole.HUMAN_RESOURCES,
    ERole.EMPLOYEE,
    ERole.CUSTOMER,
    ERole.CUSTOMER_VIP1,
    ERole.CUSTOMER_VIP2,
    ERole.CUSTOMER_VIP3,
  ],
  VIP: [ERole.CUSTOMER_VIP1, ERole.CUSTOMER_VIP2, ERole.CUSTOMER_VIP3],
};

const ERolePrefix: Record<ERole, string> = {
  [ERole.ADMINISTRATOR]: 'ADMIN',
  [ERole.HUMAN_RESOURCES]: 'HR',
  [ERole.EMPLOYEE]: 'NV',
  [ERole.CUSTOMER]: 'KH',
  [ERole.CUSTOMER_VIP1]: 'VIP1',
  [ERole.CUSTOMER_VIP2]: 'VIP2',
  [ERole.CUSTOMER_VIP3]: 'VIP3',
};

export function generateCode(role: ERole, id: number): string {
  const prefix = ERolePrefix[role];
  const paddedId = String(id).padStart(4, '0'); // max 9999
  return `${prefix}-${paddedId}`;
}
