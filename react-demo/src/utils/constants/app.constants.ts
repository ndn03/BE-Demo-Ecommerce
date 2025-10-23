/**
 * 🏪 **Application Constants**
 *
 * Central place for all application-wide constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/signin',
    REGISTER: '/v1/auth/signup',
    REFRESH: '/v1/auth/refresh',
    LOGOUT: '/v1/auth/logout',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
  },
  USERS: {
    PROFILE: '/v1/users/profile',
    LIST: '/v1/users',
    UPDATE: (id: number) => `/v1/users/${id}`,
    DELETE: (id: number) => `/v1/users/${id}`,
  },
  ORDERS: {
    LIST: '/v1/orders/admin/all',
    DETAIL: (id: number) => `/v1/orders/${id}`,
    UPDATE_STATUS: (id: number) => `/v1/orders/${id}/status`,
    STATS: '/v1/orders/stats/overview',
  },
  PRODUCTS: {
    LIST: '/v1/product',
    DETAIL: (id: number) => `/v1/product/${id}`,
    CREATE: '/v1/product',
    UPDATE: (id: number) => `/v1/product/${id}`,
    DELETE: (id: number) => `/v1/product/${id}`,
    STATS: '/v1/product/stats',
  },
  CATEGORIES: {
    LIST: '/v1/categories/list-categories',
    DETAIL: (id: number) => `/v1/categories/${id}`,
    CREATE: '/v1/categories',
    UPDATE: (id: number) => `/v1/categories/${id}`,
    DELETE: (id: number) => `/v1/categories/${id}`,
  },
  BRANDS: {
    LIST: '/v1/brand',
    DETAIL: (id: number) => `/v1/brand/${id}`,
    CREATE: '/v1/brand',
    UPDATE: (id: number) => `/v1/brand/${id}`,
    DELETE: (id: number) => `/v1/brand/${id}`,
  },
} as const;

// Application Routes
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Order Status Colors
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#faad14',
  [ORDER_STATUS.CONFIRMED]: '#1890ff',
  [ORDER_STATUS.PROCESSING]: '#722ed1',
  [ORDER_STATUS.SHIPPED]: '#13c2c2',
  [ORDER_STATUS.DELIVERED]: '#52c41a',
  [ORDER_STATUS.CANCELLED]: '#ff4d4f',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  MODERATOR: 'moderator',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    MESSAGE:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  },
  PHONE: {
    PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
    MESSAGE: 'Please enter a valid phone number',
  },
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type LoadingState = (typeof LOADING_STATES)[keyof typeof LOADING_STATES];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
