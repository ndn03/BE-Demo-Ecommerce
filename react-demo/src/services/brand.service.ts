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
    // List-brands là public endpoint, không cần auth
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

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QueryBrandDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface BrandListResponse {
  message: string;
  data: Brand[];
  total: number;
  limit: number;
  page: number;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
  logo?: File;
}

export interface UpdateBrandDto {
  name?: string;
  description?: string;
  logo?: File;
}

export const brandApi = {
  // Lấy danh sách brands
  getBrands: async (query: QueryBrandDto = {}): Promise<BrandListResponse> => {
    try {
      console.log('Making request to brands with query:', query);

      // Clean up query - remove undefined values
      const cleanQuery = Object.fromEntries(
        Object.entries(query).filter(([_, v]) => v != null),
      );

      console.log('Clean brand query:', cleanQuery);
      const response = await api.get('/v1/brand/list-brands', {
        params: cleanQuery,
      });
      console.log('Brands response:', response.data);
      return {
        message: response.data.message || 'Success',
        data: response.data.data,
        total: response.data.total,
        page: query.page || 1,
        limit: query.limit || 10,
      };
    } catch (error) {
      console.error('Error fetching brands:', error);
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

  // Lấy brand theo ID
  getBrandById: async (id: number): Promise<{ data: Brand }> => {
    const response = await api.get(`/v1/brand/${id}`);
    return response.data;
  },

  // Tạo brand mới
  createBrand: async (brandData: CreateBrandDto): Promise<{ data: Brand }> => {
    const formData = new FormData();
    formData.append('name', brandData.name);
    if (brandData.description) {
      formData.append('description', brandData.description);
    }
    if (brandData.logo) {
      formData.append('logo', brandData.logo);
    }

    const response = await api.post('/v1/brand/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật brand
  updateBrand: async (
    id: number,
    brandData: UpdateBrandDto,
  ): Promise<{ data: Brand }> => {
    const formData = new FormData();
    if (brandData.name) formData.append('name', brandData.name);
    if (brandData.description)
      formData.append('description', brandData.description);
    if (brandData.logo) formData.append('logo', brandData.logo);

    const response = await api.patch(`/v1/brand/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa mềm brand
  softDeleteBrand: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/brand/soft-remove/${id}`);
    return response.data;
  },

  // Khôi phục brand
  restoreBrand: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/v1/brand/restore/${id}`);
    return response.data;
  },

  // Xóa vĩnh viễn brand
  deleteBrand: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/v1/brand/remove/${id}`);
    return response.data;
  },

  // Thống kê brands
  getBrandStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> => {
    try {
      const allBrands = await api.get('/v1/brand/list-brands', {
        params: { limit: 1000 },
      });
      const brands = allBrands.data.data || [];

      return {
        total: brands.length,
        active: brands.filter((brand: Brand) => brand.status === 'active')
          .length,
        inactive: brands.filter((brand: Brand) => brand.status === 'inactive')
          .length,
      };
    } catch (error) {
      console.error('Error fetching brand stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
  },
};
