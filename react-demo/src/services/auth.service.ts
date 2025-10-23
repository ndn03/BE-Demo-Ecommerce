import axios, { AxiosResponse } from 'axios';
import {
  LoginDto,
  UserRegistrationDto,
  ForgotPasswordDto,
  AuthTokens,
  LoginResponse,
  User,
  ApiResponse,
} from '../types/auth.types';
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
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  // Đăng nhập
  login: async (
    data: LoginDto,
  ): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => {
    return api.post('/v1/user/login', data);
  },

  // Đăng ký
  register: async (
    data: UserRegistrationDto,
  ): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.post('/v1/user/register', data);
  },

  // Refresh token
  refreshToken: async (): Promise<AxiosResponse<ApiResponse<AuthTokens>>> => {
    return api.post('/v1/user/refresh-token');
  },

  // Đăng xuất
  logout: async (): Promise<AxiosResponse<ApiResponse<string>>> => {
    return api.post('/v1/user/logout');
  },

  // Quên mật khẩu
  forgotPassword: async (
    data: ForgotPasswordDto,
  ): Promise<AxiosResponse<ApiResponse<boolean>>> => {
    return api.post('/v1/user/forgot-password', data);
  },
};

export default api;
