import axios from 'axios';
import { API_ENDPOINT } from '../configs/api.config';

const api = axios.create({
  baseURL: API_ENDPOINT || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor để xử lý token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface QueryUserDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile?: {
    first_name: string;
    last_name: string;
    code: string;
    phone: string;
  };
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  message: string;
  data: User[];
  total: number;
  limit: number;
  page: number;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: string;
  profile?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

export const userApi = {
  // Lấy danh sách users
  getUsers: async (query: QueryUserDto = {}): Promise<UserListResponse> => {
    const response = await api.get('/v1/user/find-all', { params: query });
    return response.data;
  },

  // Lấy user theo ID
  getUserById: async (id: number): Promise<{ data: User }> => {
    const response = await api.get(`/v1/user/${id}`);
    return response.data;
  },

  // Tạo user mới
  createUser: async (userData: CreateUserDto): Promise<{ data: User }> => {
    const response = await api.post('/v1/user/create-user', userData);
    return response.data;
  },

  // Cập nhật user
  updateUser: async (
    id: number,
    userData: Partial<CreateUserDto>,
  ): Promise<{ data: User }> => {
    const response = await api.patch(`/v1/user/update-user/${id}`, userData);
    return response.data;
  },

  // Xóa mềm user
  softDeleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/user/soft-delete/${id}`);
    return response.data;
  },

  // Khôi phục user
  restoreUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/v1/user/restore/${id}`);
    return response.data;
  },

  // Xóa vĩnh viễn user
  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/user/${id}`);
    return response.data;
  },

  // Thống kê users
  getUserStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }> => {
    // Gọi API để lấy tất cả users và tính toán thống kê
    const allUsers = await api.get('/v1/user/find-all?limit=1000');
    const users = allUsers.data.data;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: users.length,
      active: users.filter((user: User) => user.status === 'active').length,
      inactive: users.filter((user: User) => user.status === 'inactive').length,
      newThisMonth: users.filter(
        (user: User) => new Date(user.created_at) >= thisMonth,
      ).length,
    };
  },
};
