/**
 * 🎯 Demo Data cho hệ thống Admin & HR
 * Mock data để test các tính năng dashboard và management
 */

import { ERole, EEmployeeType, EGender } from '@configs/interface.config';

// Demo Users Data
export const demoUsers = [
  {
    id: 1,
    name: 'Nguyễn Văn Admin',
    email: 'admin@company.com',
    role: ERole.ADMINISTRATOR,
    status: 'active',
    lastLogin: '2024-10-31 14:30',
    createdDate: '2023-01-15',
    avatar: null,
    profile: {
      fullName: 'Nguyễn Văn Admin',
      employeeCode: 'ADM001',
      position: 'System Administrator',
      department: 'IT',
      phone: '+84 901 234 567',
    },
  },
  {
    id: 2,
    name: 'Trần Thị HR Manager',
    email: 'hr@company.com',
    role: ERole.HUMAN_RESOURCES,
    status: 'active',
    lastLogin: '2024-10-31 09:15',
    createdDate: '2023-02-20',
    avatar: null,
    profile: {
      fullName: 'Trần Thị HR Manager',
      employeeCode: 'HR001',
      position: 'HR Manager',
      department: 'Human Resources',
      phone: '+84 902 345 678',
    },
  },
  {
    id: 3,
    name: 'Lê Văn Developer',
    email: 'dev@company.com',
    role: ERole.EMPLOYEE,
    status: 'active',
    lastLogin: '2024-10-30 16:45',
    createdDate: '2023-03-10',
    avatar: null,
    profile: {
      fullName: 'Lê Văn Developer',
      employeeCode: 'EMP001',
      position: 'Senior Developer',
      department: 'IT',
      phone: '+84 903 456 789',
    },
  },
  {
    id: 4,
    name: 'Phạm Thị Designer',
    email: 'design@company.com',
    role: ERole.EMPLOYEE,
    status: 'active',
    lastLogin: '2024-10-30 14:20',
    createdDate: '2024-01-05',
    avatar: null,
    profile: {
      fullName: 'Phạm Thị Designer',
      employeeCode: 'EMP002',
      position: 'UI/UX Designer',
      department: 'Design',
      phone: '+84 904 567 890',
    },
  },
];

// Demo Employees (for HR)
export const demoEmployees = [
  {
    id: 1,
    employeeCode: 'EMP001',
    name: 'Lê Văn Developer',
    email: 'dev@company.com',
    position: 'Senior Developer',
    department: 'IT',
    employmentType: EEmployeeType.FULL_TIME,
    gender: EGender.MALE,
    startDate: '2023-03-10',
    salary: 25000000,
    status: 'active',
    avatar: null,
  },
  {
    id: 2,
    employeeCode: 'EMP002',
    name: 'Phạm Thị Designer',
    email: 'design@company.com',
    position: 'UI/UX Designer',
    department: 'Design',
    employmentType: EEmployeeType.FULL_TIME,
    gender: EGender.FEMALE,
    startDate: '2024-01-05',
    salary: 20000000,
    status: 'active',
    avatar: null,
  },
  {
    id: 3,
    employeeCode: 'EMP003',
    name: 'Hoàng Minh Tester',
    email: 'test@company.com',
    position: 'QA Tester',
    department: 'QA',
    employmentType: EEmployeeType.FULL_TIME,
    gender: EGender.MALE,
    startDate: '2023-08-15',
    salary: 18000000,
    status: 'active',
    avatar: null,
  },
  {
    id: 4,
    employeeCode: 'EMP004',
    name: 'Ngô Thị Marketing',
    email: 'marketing@company.com',
    position: 'Marketing Specialist',
    department: 'Marketing',
    employmentType: EEmployeeType.PART_TIME,
    gender: EGender.FEMALE,
    startDate: '2024-06-01',
    salary: 12000000,
    status: 'active',
    avatar: null,
  },
];

// Demo Leave Requests
export const demoLeaveRequests = [
  {
    id: 1,
    employeeCode: 'EMP001',
    employeeName: 'Lê Văn Developer',
    leaveType: 'Nghỉ phép',
    startDate: '2024-11-01',
    endDate: '2024-11-03',
    days: 3,
    reason: 'Nghỉ lễ gia đình',
    status: 'pending',
    submitDate: '2024-10-28',
  },
  {
    id: 2,
    employeeCode: 'EMP002',
    employeeName: 'Phạm Thị Designer',
    leaveType: 'Nghỉ ốm',
    startDate: '2024-10-30',
    endDate: '2024-10-31',
    days: 2,
    reason: 'Ốm, có giấy bác sĩ',
    status: 'approved',
    submitDate: '2024-10-29',
  },
  {
    id: 3,
    employeeCode: 'EMP003',
    employeeName: 'Hoàng Minh Tester',
    leaveType: 'Nghỉ cá nhân',
    startDate: '2024-11-05',
    endDate: '2024-11-05',
    days: 1,
    reason: 'Việc cá nhân',
    status: 'pending',
    submitDate: '2024-11-01',
  },
];

// Demo Orders (for eCommerce)
export const demoOrders = [
  {
    id: 1,
    orderCode: '#ORD001',
    customer: 'Nguyễn Văn A',
    customerEmail: 'customer1@gmail.com',
    amount: 2500000,
    status: 'completed',
    date: '2024-10-31',
    items: [{ name: 'Laptop Dell XPS 13', quantity: 1, price: 2500000 }],
  },
  {
    id: 2,
    orderCode: '#ORD002',
    customer: 'Trần Thị B',
    customerEmail: 'customer2@gmail.com',
    amount: 1800000,
    status: 'pending',
    date: '2024-10-31',
    items: [{ name: 'iPhone 15', quantity: 1, price: 1800000 }],
  },
  {
    id: 3,
    orderCode: '#ORD003',
    customer: 'Lê Văn C',
    customerEmail: 'customer3@gmail.com',
    amount: 950000,
    status: 'processing',
    date: '2024-10-30',
    items: [{ name: 'AirPods Pro', quantity: 1, price: 950000 }],
  },
];

// Demo Statistics
export const demoAdminStats = {
  totalUsers: 1248,
  totalOrders: 3567,
  totalRevenue: 2456789000,
  growthRate: 23.5,
  systemHealth: {
    cpu: 65,
    memory: 80,
    disk: 45,
    network: 30,
  },
  quickStats: {
    todayOrders: 87,
    newCustomers: 23,
    conversionRate: 12.8,
    averageRating: 4.6,
  },
};

export const demoHRStats = {
  totalEmployees: 145,
  activeEmployees: 138,
  onLeave: 7,
  newHires: 12,
  performance: {
    attendanceRate: 96,
    employeeSatisfaction: 88,
    trainingCompletion: 75,
    retentionRate: 92,
  },
};

// Demo Upcoming Events
export const demoUpcomingEvents = [
  {
    title: 'Họp định kỳ team Development',
    date: '2024-11-01 09:00',
    type: 'meeting',
  },
  {
    title: 'Đánh giá hiệu suất Q4',
    date: '2024-11-03 14:00',
    type: 'review',
  },
  {
    title: 'Training Security Awareness',
    date: '2024-11-05 10:30',
    type: 'training',
  },
  {
    title: 'Sinh nhật Phạm Thị Designer',
    date: '2024-11-07',
    type: 'birthday',
  },
];

// Demo Recent Activities
export const demoRecentActivities = [
  {
    title: 'Phê duyệt đơn nghỉ phép - Phạm Thị Designer',
    timestamp: '2 giờ trước',
    type: 'approval',
  },
  {
    title: 'Cập nhật hồ sơ nhân viên mới - Hoàng Minh Tester',
    timestamp: '4 giờ trước',
    type: 'profile',
  },
  {
    title: 'Gửi thông báo về chính sách mới',
    timestamp: '1 ngày trước',
    type: 'notification',
  },
  {
    title: 'Thêm người dùng mới - Marketing Specialist',
    timestamp: '2 ngày trước',
    type: 'user',
  },
];

// Helper functions
export const getRandomEmployee = () => {
  return demoEmployees[Math.floor(Math.random() * demoEmployees.length)];
};

export const getRandomOrder = () => {
  return demoOrders[Math.floor(Math.random() * demoOrders.length)];
};

export const generateRecentUsers = (count: number = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 100,
    name: `Nhân viên ${index + 1}`,
    email: `emp${index + 1}@company.com`,
    role: Math.random() > 0.5 ? ERole.EMPLOYEE : ERole.CUSTOMER,
    avatar: null,
    joinDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));
};

export default {
  demoUsers,
  demoEmployees,
  demoLeaveRequests,
  demoOrders,
  demoAdminStats,
  demoHRStats,
  demoUpcomingEvents,
  demoRecentActivities,
  getRandomEmployee,
  getRandomOrder,
  generateRecentUsers,
};
