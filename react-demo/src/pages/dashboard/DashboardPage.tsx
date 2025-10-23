import React from 'react';
import { Card, Typography, Button, Space, Avatar, Row, Col } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.less';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <DashboardOutlined style={{ marginRight: '12px' }} />
            Dashboard
          </Title>
        </div>
        <div className="user-info">
          <Avatar icon={<UserOutlined />} />
          <span>Xin chào, {user?.username || 'Admin'}</span>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        <div className="welcome-card">
          <Title level={2}>Chào mừng đến với hệ thống!</Title>
          <Text>
            Đây là trang dashboard chính. Bạn có thể quản lý hệ thống từ đây.
          </Text>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <TeamOutlined />
            </div>
            <div className="stat-number">150</div>
            <div className="stat-label">Người dùng</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ShoppingCartOutlined />
            </div>
            <div className="stat-number">45</div>
            <div className="stat-label">Đơn hàng</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <BarChartOutlined />
            </div>
            <div className="stat-number">12.5M</div>
            <div className="stat-label">Doanh thu</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <SettingOutlined />
            </div>
            <div className="stat-number">8</div>
            <div className="stat-label">Cài đặt</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
