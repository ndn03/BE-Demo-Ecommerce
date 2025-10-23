import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, AuthTokens } from '../types/auth.types';
import { authApi } from '../services/auth.service';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
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
        console.error('Error loading auth state:', error);
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
      const response = await authApi.login({ username, password });

      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data.data);

      const { data } = response.data; // This gets the 'data' property from response.data

      console.log('Extracted data:', data);
      console.log('Access token:', data.accessToken);
      console.log('User from API:', data.user);

      // Backend trả về accessToken
      const accessToken = data.accessToken;

      // User object từ API response
      const user = data.user;

      console.log('Final user object:', user);

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
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      message.success('Đăng xuất thành công');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authApi.refreshToken();
      const { data } = response.data;

      const accessToken = data.accessToken;
      localStorage.setItem('access_token', accessToken);
      setToken(accessToken);
    } catch (error) {
      console.error('Refresh token error:', error);
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
    refreshToken,
  };

  console.log(
    'AuthContext - token:',
    !!token,
    'user:',
    !!user,
    'isAuthenticated:',
    !!token && !!user,
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
