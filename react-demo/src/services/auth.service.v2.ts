/**
 * 🔐 **Enhanced Auth Service**
 *
 * Authentication service using new utility patterns
 */

import { httpClient } from '../utils/http/http.client';
import { AuthStorage } from '../utils/storage/storage.helper';
import { Validator } from '../utils/validators/validation.helper';
import { API_ENDPOINTS } from '../utils/constants/app.constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: number;
  email: string;
  username?: string;
  role: string;
  profile?: {
    id: number;
    fullName?: string;
    subName?: string;
    avatar?: string;
  };
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validate credentials
    const emailValidation = Validator.email(credentials.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    const passwordValidation = Validator.required(
      credentials.password,
      'Password',
    );
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    try {
      const response = await httpClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
      );

      // Store auth data
      if (response.data.access_token) {
        AuthStorage.setAccessToken(response.data.access_token);
      }

      if (response.data.refresh_token) {
        AuthStorage.setRefreshToken(response.data.refresh_token);
      }

      if (response.data.user) {
        AuthStorage.setUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Validate registration data
    const validationErrors: string[] = [];

    const emailValidation = Validator.email(data.email);
    if (!emailValidation.isValid) {
      validationErrors.push(emailValidation.message!);
    }

    const passwordValidation = Validator.password(data.password);
    if (!passwordValidation.isValid) {
      validationErrors.push(passwordValidation.message!);
    }

    const confirmPasswordValidation = Validator.confirmPassword(
      data.password,
      data.confirmPassword,
    );
    if (!confirmPasswordValidation.isValid) {
      validationErrors.push(confirmPasswordValidation.message!);
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    try {
      const response = await httpClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      );

      // Store auth data
      if (response.data.access_token) {
        AuthStorage.setAccessToken(response.data.access_token);
      }

      if (response.data.refresh_token) {
        AuthStorage.setRefreshToken(response.data.refresh_token);
      }

      if (response.data.user) {
        AuthStorage.setUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      const token = AuthStorage.getAccessToken();
      if (token) {
        await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local auth data
      AuthStorage.clearAuth();
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return AuthStorage.getUser();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return AuthStorage.isAuthenticated();
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<string | null> {
    const refreshToken = AuthStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await httpClient.post<{ access_token: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refresh_token: refreshToken },
      );

      if (response.data.access_token) {
        AuthStorage.setAccessToken(response.data.access_token);
        return response.data.access_token;
      }

      return null;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // Clear auth data if refresh fails
      AuthStorage.clearAuth();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email: string): Promise<void> {
    const emailValidation = Validator.email(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    try {
      await httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const passwordValidation = Validator.password(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    try {
      await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password: newPassword,
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await httpClient.put<User>(
        API_ENDPOINTS.USERS.PROFILE,
        data,
      );

      // Update stored user data
      if (response.data) {
        AuthStorage.setUser(response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

// Export convenience methods
export const {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
} = AuthService;
