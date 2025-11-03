import { request } from './config';

// Types based on backend DTOs
export interface QueryUserParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderType?: 'ASC' | 'DESC';
  isActive?: number; // 0 | 1
  role?: string;
  code?: string;
  search?: string;
}

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
  fullName: string; // Required in backend
  registrationType?: string; // Required in backend
  workShift?: string; // Required in backend
  position?: string;
  employmentType?: string; // Required in backend
  isActive?: number; // Optional with default
  // Additional profile fields
  phone?: string;
  gender?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  role?: string;
  isActive?: number;
  // Profile data
  fullName?: string;
  phone?: string;
  gender?: string;
  employeeType?: string;
  position?: string;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Profile data
  profile?: {
    fullName?: string;
    phone?: string;
    gender?: string;
    employeeType?: string;
    position?: string;
  };
}

export interface UserListResponse {
  message: string;
  data: User[];
  total: number;
  limit: number;
  page: number;
}

// API functions
export const userApi = {
  // Get all users with pagination and filters
  getUsers: (params: QueryUserParams): Promise<UserListResponse> =>
    request({ method: 'GET', url: '/v1/user/find-all', params }),

  // Get user by ID
  getUser: (id: number): Promise<{ message: string; data: User }> =>
    request({ method: 'GET', url: `/v1/user/${id}` }),

  // Create new user
  createUser: (
    data: CreateUserData,
  ): Promise<{ message: string; data: User }> =>
    request({ method: 'POST', url: '/v1/user/create-user', data }),

  // Update user
  updateUser: (
    id: number,
    data: UpdateUserData,
  ): Promise<{ message: string; data: User }> =>
    request({ method: 'PATCH', url: `/v1/user/update-user/${id}`, data }),

  // Set password for user
  setPassword: (
    id: number,
    data: ChangePasswordData,
  ): Promise<{ message: string }> =>
    request({ method: 'PATCH', url: `/v1/user/${id}/set-password`, data }),

  // Soft delete user
  softDeleteUser: (id: number): Promise<{ message: string }> =>
    request({ method: 'DELETE', url: `/v1/user/soft-delete/${id}` }),

  // Restore soft deleted user
  restoreUser: (id: number): Promise<{ message: string }> =>
    request({ method: 'PATCH', url: `/v1/user/restore/${id}` }),

  // Hard delete user (admin only)
  deleteUser: (id: number): Promise<{ message: string }> =>
    request({ method: 'DELETE', url: `/v1/user/${id}` }),
};
