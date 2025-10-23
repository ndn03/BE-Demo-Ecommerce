/**
 * 🌐 **HTTP Client Utilities**
 *
 * Centralized HTTP client with interceptors and error handling
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { AuthStorage } from '../storage/storage.helper';
import { HTTP_STATUS, APP_ROUTES } from '../constants/app.constants';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export class HttpClient {
  private instance: AxiosInstance;

  constructor(baseURL?: string, timeout = 15000) {
    this.instance = axios.create({
      baseURL:
        baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = AuthStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
            headers: config.headers,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(
            `✅ ${response.config.method?.toUpperCase()} ${
              response.config.url
            }`,
            {
              status: response.status,
              data: response.data,
            },
          );
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          // Clear auth data and redirect to login
          AuthStorage.clearAuth();

          // Only redirect if not already on login page
          if (window.location.pathname !== APP_ROUTES.LOGIN) {
            window.location.href = APP_ROUTES.LOGIN;
          }
        }

        // Log error in development
        if (import.meta.env.DEV) {
          console.error(
            `❌ ${originalRequest?.method?.toUpperCase()} ${
              originalRequest?.url
            }`,
            {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
            },
          );
        }

        return Promise.reject(this.formatError(error));
      },
    );
  }

  private formatError(error: AxiosError): ApiError {
    const response = error.response;
    const responseData = response?.data as any;

    return {
      message: responseData?.message || error.message || 'An error occurred',
      status: response?.status || 500,
      errors: responseData?.errors,
    };
  }

  // HTTP Methods
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    };

    const response = await this.instance.post<ApiResponse<T>>(
      url,
      formData,
      config,
    );
    return response.data;
  }

  // Get axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Create default HTTP client instance
export const httpClient = new HttpClient();

// Export convenience methods
export const { get, post, put, patch, delete: del, upload } = httpClient;
