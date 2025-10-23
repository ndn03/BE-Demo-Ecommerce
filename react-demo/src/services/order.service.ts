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
    console.log('Making order request to:', config.url, 'with token:', !!token);
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

// Real interfaces from backend
export interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  total: number; // Changed from totalAmount to total to match backend entity
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  shippingAddress?: string; // Made optional to match backend
  reason?: string; // Added field from backend
  note?: string; // Added field from backend
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[]; // Made optional
  user?: {
    id: number;
    email: string;
    username?: string;
    profile?: {
      id: number;
      fullName?: string;
      subName?: string;
    };
  };
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  brandId: number;
  status: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    description?: string;
  };
  brand?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface QueryOrderDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface QueryProductDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
  brandId?: number;
}

export const orderApi = {
  // Lấy danh sách orders từ API
  getOrders: async (
    query: QueryOrderDto = {},
  ): Promise<{
    data: Order[];
    total: number;
    limit: number;
    page: number;
  }> => {
    try {
      console.log('Fetching orders with query:', query);
      const response = await api.get('/v1/orders/admin/all', { params: query });
      console.log('Orders response:', response.data);

      // Safe parsing of response
      const responseData = response.data?.data || {};
      const orders = responseData.orders || [];
      const total = responseData.total || 0;
      const currentPage = responseData.currentPage || query.page || 1;

      console.log('Parsed orders:', { orders, total, currentPage });

      return {
        data: orders,
        total: total,
        page: currentPage,
        limit: query.limit || 10,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return empty data instead of throwing
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
    }
  },

  // Lấy order theo ID
  getOrderById: async (id: number): Promise<{ data: Order }> => {
    try {
      const response = await api.get(`/v1/orders/${id}`);
      return { data: response.data.order };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái order
  updateOrderStatus: async (
    id: number,
    status: Order['status'],
  ): Promise<{ data: Order }> => {
    try {
      const response = await api.put(`/v1/orders/${id}/status`, { status });
      return { data: response.data.order };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Thống kê orders
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    todayRevenue: number;
    thisMonthRevenue: number;
  }> => {
    try {
      console.log('Fetching order stats...');
      const response = await api.get('/v1/orders/stats/overview');
      console.log('Order stats response:', response.data);
      const stats = response.data.data[0] || {};

      return {
        total: stats.totalOrders || 0,
        pending: stats.pendingOrders || 0,
        confirmed: stats.confirmedOrders || 0,
        shipped: stats.shippedOrders || 0,
        delivered: stats.deliveredOrders || 0,
        cancelled: stats.cancelledOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        todayRevenue: stats.todayRevenue || 0,
        thisMonthRevenue: stats.thisMonthRevenue || 0,
      };
    } catch (error) {
      console.error('Error fetching order stats:', error);
      // Return default stats as fallback
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        thisMonthRevenue: 0,
      };
    }
  },
};

export const productApi = {
  // Lấy danh sách products từ API
  getProducts: async (
    query: QueryProductDto = {},
  ): Promise<{
    data: Product[];
    total: number;
    limit: number;
    page: number;
  }> => {
    try {
      console.log('Fetching products with query:', query);
      const response = await api.get('/v1/product', { params: query });
      console.log('Products response:', response.data);
      return {
        data: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.currentPage || query.page || 1,
        limit: query.limit || 10,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return empty data instead of throwing
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
    }
  },

  // Thống kê products
  getProductStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    lowStock: number;
  }> => {
    try {
      // Since there's no specific stats endpoint, we'll get all products and calculate
      const response = await api.get('/v1/product', {
        params: { limit: 1000 },
      });
      const products = response.data.data || [];

      return {
        total: products.length,
        active: products.filter((p: Product) => p.status === 'active').length,
        inactive: products.filter((p: Product) => p.status === 'inactive')
          .length,
        outOfStock: products.filter((p: Product) => p.stock === 0).length,
        lowStock: products.filter((p: Product) => p.stock < 10 && p.stock > 0)
          .length,
      };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      // Return default stats as fallback
      return {
        total: 0,
        active: 0,
        inactive: 0,
        outOfStock: 0,
        lowStock: 0,
      };
    }
  },
};
