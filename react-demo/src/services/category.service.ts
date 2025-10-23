import axios from 'axios';
import { API_ENDPOINT } from '../configs/api.config';

const api = axios.create({
  baseURL: API_ENDPOINT || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - không thêm auth cho public endpoints
api.interceptors.request.use(
  (config) => {
    // List-categories là public endpoint, không cần auth
    console.log('Making request to:', config.url);
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

export interface Category {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QueryCategoryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CategoryListResponse {
  message: string;
  data: Category[];
  total: number;
  limit: number;
  page: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export const categoryApi = {
  // Lấy danh sách categories
  getCategories: async (
    query: QueryCategoryDto = {},
  ): Promise<CategoryListResponse> => {
    try {
      console.log('Making request to categories with query:', query);

      // Clean up query - remove undefined values
      const cleanQuery = Object.fromEntries(
        Object.entries(query).filter(([_, v]) => v != null),
      );

      console.log('Clean query:', cleanQuery);
      const response = await api.get('/v1/categories/list-categories', {
        params: cleanQuery,
      });
      console.log('Categories response:', response.data);
      return {
        message: response.data.message || 'Success',
        data: response.data.data,
        total: response.data.total,
        page: query.page || 1,
        limit: query.limit || 10,
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty result to prevent crash
      return {
        message: 'Error',
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
    }
  },

  // Lấy category theo ID
  getCategoryById: async (id: number): Promise<{ data: Category }> => {
    const response = await api.get(`/v1/categories/${id}`);
    return response.data;
  },

  // Tạo category mới
  createCategory: async (
    categoryData: CreateCategoryDto,
  ): Promise<{ data: Category }> => {
    const response = await api.post(
      '/v1/categories/create-category',
      categoryData,
    );
    return response.data;
  },

  // Cập nhật category
  updateCategory: async (
    id: number,
    categoryData: UpdateCategoryDto,
  ): Promise<{ data: Category }> => {
    const response = await api.patch(`/v1/categories/${id}`, categoryData);
    return response.data;
  },

  // Xóa mềm category
  softDeleteCategory: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/categories/soft-remove/${id}`);
    return response.data;
  },

  // Khôi phục category
  restoreCategory: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/v1/categories/restore/${id}`);
    return response.data;
  },

  // Xóa vĩnh viễn category
  deleteCategory: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/categories/delete/${id}`);
    return response.data;
  },

  // Thống kê categories
  getCategoryStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> => {
    try {
      const allCategories = await api.get('/v1/categories/list-categories', {
        params: { limit: 1000 },
      });
      const categories = allCategories.data.data || [];

      return {
        total: categories.length,
        active: categories.filter(
          (category: Category) => category.status === 'active',
        ).length,
        inactive: categories.filter(
          (category: Category) => category.status === 'inactive',
        ).length,
      };
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
  },
};
