import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '@contexts/AuthContext';
import { ERole } from '@configs/interface.config';

/**
 * 🧭 Role-based Navigation Menu
 * Hiển thị menu navigation dựa trên role của user đăng nhập
 */
const RoleBasedMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getCurrentKey = () => {
    const path = location.pathname;
    if (path === '/') return '/';
    return path;
  };

  // Render menu dựa trên role
  const renderMenuByRole = () => {
    switch (user.role) {
      case ERole.ADMINISTRATOR:
        return (
          <Menu
            mode="inline"
            selectedKeys={[getCurrentKey()]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/',
                icon: <DashboardOutlined />,
                label: '🛠️ Dashboard Admin',
              },
              {
                key: 'admin',
                icon: <SettingOutlined />,
                label: '⚙️ Quản trị hệ thống',
                children: [
                  {
                    key: '/admin/users',
                    icon: <TeamOutlined />,
                    label: 'Quản lý người dùng',
                  },
                  {
                    key: '/admin/settings',
                    icon: <SettingOutlined />,
                    label: 'Cài đặt hệ thống',
                  },
                ],
              },
              {
                key: 'ecommerce',
                icon: <ShoppingCartOutlined />,
                label: 'eCommerce',
                children: [
                  {
                    key: '/products',
                    icon: <AppstoreOutlined />,
                    label: 'Sản phẩm',
                  },
                  {
                    key: '/orders',
                    icon: <FileTextOutlined />,
                    label: 'Đơn hàng',
                  },
                  {
                    key: '/customers',
                    icon: <UserOutlined />,
                    label: 'Khách hàng',
                  },
                ],
              },
              {
                key: '/profile',
                icon: <UserOutlined />,
                label: '👤 Hồ sơ cá nhân',
              },
            ]}
          />
        );

      case ERole.HUMAN_RESOURCES:
        return (
          <Menu
            mode="inline"
            selectedKeys={[getCurrentKey()]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/',
                icon: <DashboardOutlined />,
                label: '👥 Dashboard HR',
              },
              {
                key: 'hr',
                icon: <TeamOutlined />,
                label: '👥 Quản lý nhân sự',
                children: [
                  {
                    key: '/hr/employees',
                    icon: <UserOutlined />,
                    label: 'Danh sách nhân viên',
                  },
                  {
                    key: '/hr/attendance',
                    icon: <CalendarOutlined />,
                    label: 'Chấm công',
                  },
                  {
                    key: '/hr/leave-requests',
                    icon: <FileTextOutlined />,
                    label: 'Đơn nghỉ phép',
                  },
                  {
                    key: '/hr/payroll',
                    icon: <FileTextOutlined />,
                    label: 'Bảng lương',
                  },
                ],
              },
              {
                key: '/profile',
                icon: <UserOutlined />,
                label: '👤 Hồ sơ cá nhân',
              },
            ]}
          />
        );

      case ERole.EMPLOYEE:
        return (
          <Menu
            mode="inline"
            selectedKeys={[getCurrentKey()]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/profile',
                icon: <UserOutlined />,
                label: '👤 Hồ sơ cá nhân',
              },
              {
                key: '/my-tasks',
                icon: <FileTextOutlined />,
                label: '📋 Công việc của tôi',
              },
              {
                key: '/my-attendance',
                icon: <CalendarOutlined />,
                label: '⏰ Chấm công',
              },
              {
                key: '/my-leave',
                icon: <CalendarOutlined />,
                label: '📅 Nghỉ phép',
              },
            ]}
          />
        );

      default:
        return (
          <Menu
            mode="inline"
            selectedKeys={[getCurrentKey()]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '/profile',
                icon: <UserOutlined />,
                label: '👤 Hồ sơ cá nhân',
              },
            ]}
          />
        );
    }
  };

  return renderMenuByRole();
};

export default RoleBasedMenu;
