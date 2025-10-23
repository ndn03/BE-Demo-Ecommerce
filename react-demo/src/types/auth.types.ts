export interface LoginDto {
  username: string;
  password: string;
}

export interface UserRegistrationDto {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  status: string;
  profile?: {
    id: number;
    fullName: string;
    code: string;
    avatar?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T = any> {
  message: string;
  data: T;
  success?: boolean;
}
