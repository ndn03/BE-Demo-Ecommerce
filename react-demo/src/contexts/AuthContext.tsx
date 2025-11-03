import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { TAuthUser } from '@modules/auth';
import { TUser } from '@modules/user';
import { signIn, signOut, refreshToken } from '@queries/apis/auth';
import { message } from 'antd';
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from '@libs/localStorage';

interface AuthContextType {
  user: TUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<TUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo auth state từ localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await signIn({ username, password });

      const { data } = response.data; // This gets the 'data' property from response.data

      // Backend trả về accessToken
      const accessToken = data.accessToken;

      // User object từ API response
      const user = data.user;

      if (!user) {
        throw new Error('User data not found in response');
      }

      // Lưu token và user info
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Cập nhật state đồng thời
      setToken(accessToken);
      setUser(user);
      setIsLoading(false);

      message.success(
        `Đăng nhập thành công! Chào mừng ${user?.username || 'User'}`,
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Đăng nhập thất bại';
      message.error(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      throw error;
    } finally {
      // Clear local state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      message.success('Đăng xuất thành công');
    }
  };

  const refreshTokenFunc = async (): Promise<void> => {
    try {
      const response = await refreshToken();
      const { data } = response.data;

      const accessToken = data.accessToken;
      localStorage.setItem('access_token', accessToken);
      setToken(accessToken);
    } catch (error) {
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshToken: refreshTokenFunc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
