import { NError } from '@configs/const.config';
import { TResApi, TResApiErr } from '@configs/interface.config';
import {
  clearLocalStored,
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from '@libs/localStorage';
import logger from '@libs/logger';
import {
  forgotPassword,
  signIn,
  signUp,
  signOut,
  refreshToken,
} from '@queries/apis/auth';
import { FORGOT_PASSWORD, LOGIN, LOGOUT, USER_PROFILE } from '@queries/keys';
import { API_ENDPOINT, API_PREFIX } from '@src/configs/api.config';
import {
  TSignIn,
  TAuthUserRegistration,
  TForgotPassword,
  TAuthResponse,
  TSignInResponse,
  TRefreshTokenResponse,
  TLogoutResponse,
  TForgotPasswordResponse,
} from '@src/modules/auth';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { notification } from 'antd';

/**
 * @method useMutationSignIn
 * @returns
 */
export const useMutationSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation<TSignInResponse, TResApiErr, TSignIn>({
    mutationKey: [LOGIN],
    mutationFn: signIn,
    onSuccess: (res: TSignInResponse) => {
      // Store authentication data from backend response
      setStoredAuth({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });

      // Show success notification
      notification.success({
        message: 'Đăng nhập thành công',
        description: res.message,
      });

      // Invalidate user profile queries
      queryClient.invalidateQueries({ queryKey: [USER_PROFILE] });
    },
    onError(error: TResApiErr) {
      void clearStoredAuth();
      notification.error({
        message: NError,
        description: error.message || error.statusText || 'Đăng nhập thất bại',
      });
    },
    onSettled() {
      queryClient.invalidateQueries();
    },
  });
};

/**
 * @method useMutationSignUp
 * @returns mutation for user registration
 */
export const useMutationSignUp = () => {
  return useMutation<any, TResApiErr, TAuthUserRegistration>({
    mutationKey: ['REGISTER'],
    mutationFn: signUp,
    onSuccess: (res) => {
      // Show success notification
      notification.success({
        message: 'Đăng ký thành công',
        description:
          res.message ||
          'Tài khoản đã được tạo thành công. Vui lòng đăng nhập.',
      });
    },
    onError(error: TResApiErr) {
      notification.error({
        message: 'Đăng ký thất bại',
        description:
          error.message ||
          error.statusText ||
          'Có lỗi xảy ra khi tạo tài khoản',
      });
    },
  });
};

/**
 * @method useMutationSignOut
 * @returns {UseMutationResult<TLogoutResponse, TResApiErr, void, unknown>}
 */
export const useMutationSignOut = (
  invalidate = true,
): UseMutationResult<TLogoutResponse, TResApiErr, void, unknown> => {
  const queryClient = useQueryClient();
  return useMutation<TLogoutResponse, TResApiErr>({
    mutationKey: [LOGOUT],
    mutationFn: signOut,
    onSuccess: (res: TLogoutResponse) => {
      // Show success notification
      notification.success({
        message: 'Đăng xuất thành công',
        description: res.message,
      });
    },
    onSettled() {
      if (invalidate) {
        queryClient.invalidateQueries();
      }
      void clearStoredAuth();
      clearLocalStored('lastConversationId');
    },
  });
};

/**
 * @method refreshTokenFn
 * @returns {Promise<TRefreshTokenResponse | null>}
 */
export const refreshTokenFn =
  async (): Promise<TRefreshTokenResponse | null> => {
    const signature = getStoredAuth();

    if (signature && signature?.refreshToken) {
      try {
        const response = await fetch(
          `${API_ENDPOINT + API_PREFIX}/v1/user/refresh-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${signature.accessToken}`,
            },
          },
        );

        const result = await response.json();
        if (response.ok) {
          // Update stored auth with new tokens
          setStoredAuth({
            ...signature,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          });
          return result;
        }
        return null;
      } catch (error) {
        logger.error('🚨🚨🚨 ~ Error while refreshing token:', error);
        return null;
      }
    }
    return null;
  };

/**
 * @method useMutationForgotPassword
 * @returns
 */
export const useMutationForgotPassword = () =>
  useMutation<TForgotPasswordResponse, TResApiErr, TForgotPassword>({
    mutationFn: forgotPassword,
    mutationKey: [FORGOT_PASSWORD],
    onSuccess: (res: TForgotPasswordResponse) => {
      if (res.success) {
        notification.success({
          message: 'Thành công',
          description: res.message,
        });
      } else {
        notification.error({
          message: 'Thất bại',
          description: res.message,
        });
      }
    },
    onError: (error: TResApiErr) => {
      notification.error({
        message: 'Lỗi',
        description: error.message || 'Không thể gửi email khôi phục mật khẩu',
      });
    },
  });

/**
 * @method useQueryProfile
 * @returns user profile information
 */
export const useQueryProfile = () => {
  const auth = getStoredAuth();

  return {
    data: auth?.user || null,
    isLoading: false,
    error: null,
  };
};

/**
 * @method useQueryUnreadNotification
 * @returns unread notifications count
 */
export const useQueryUnreadNotification = () => {
  // Mock implementation - replace with actual API call when backend is ready
  return {
    data: { count: 0 },
    refetch: () => Promise.resolve(),
    isLoading: false,
    error: null,
  };
};

/**
 * @method useQueryUnreadMessage
 * @returns unread messages count
 */
export const useQueryUnreadMessage = () => {
  // Mock implementation - replace with actual API call when backend is ready
  return {
    data: { count: 0 },
    refetch: () => Promise.resolve(),
    isLoading: false,
    error: null,
  };
};
