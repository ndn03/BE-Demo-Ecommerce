import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  signIn,
  signOut,
  signUp,
  forgotPassword,
  refreshToken,
} from './apis/auth';
import { TSignIn, TAuthUserRegistration, TForgotPassword } from '@modules/auth';
import { setAuth, removeAuth } from '@libs/localStorage';

// Sign In Mutation
export const useMutationSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TSignIn) => signIn(body),
    onSuccess: (data) => {
      // Save auth data to localStorage
      if (data.data) {
        setAuth(data.data.accessToken, data.data.refreshToken);
        // Save user data if needed
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      message.success(data.message || 'Đăng nhập thành công');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Đăng nhập thất bại';
      message.error(errorMessage);
    },
  });
};

// Sign Up Mutation
export const useMutationSignUp = () => {
  return useMutation({
    mutationFn: (body: TAuthUserRegistration) => signUp(body),
    onSuccess: (data) => {
      message.success(data.message || 'Đăng ký thành công');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      message.error(errorMessage);
    },
  });
};

// Sign Out Mutation
export const useMutationSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: (data) => {
      removeAuth();
      localStorage.removeItem('user');
      message.success(data.message || 'Đăng xuất thành công');
      queryClient.clear();
    },
    onError: (error: any) => {
      // Even if API fails, still logout locally
      removeAuth();
      localStorage.removeItem('user');
      queryClient.clear();
      const errorMessage =
        error.response?.data?.message || 'Đăng xuất thành công';
      message.info(errorMessage);
    },
  });
};

// Forgot Password Mutation
export const useMutationForgotPassword = () => {
  return useMutation({
    mutationFn: (body: TForgotPassword) => forgotPassword(body),
    onSuccess: (data) => {
      if (data.success) {
        message.success(
          data.message || 'Mật khẩu mới đã được gửi đến email của bạn',
        );
      } else {
        message.error(data.message || 'Không thể xử lý yêu cầu');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Yêu cầu thất bại';
      message.error(errorMessage);
    },
  });
};

// Refresh Token Mutation
export const useMutationRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshToken(),
    onSuccess: (data) => {
      if (data.data) {
        setAuth(data.data.accessToken, data.data.refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      removeAuth();
      localStorage.removeItem('user');
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};

// Re-export from auth hooks
export { useQueryProfile } from './hooks/auth';
