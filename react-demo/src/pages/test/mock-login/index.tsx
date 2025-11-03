import React from 'react';
import { Card, Button, Typography, Space, Alert, Divider } from 'antd';
import { LoginOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Mock Login Component for Testing API
 */
const MockLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleMockLogin = () => {
    // Mock token và user data để test API
    const mockToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiQURNSU5JU1RSQVRPUiIsImlhdCI6MTUxNjIzOTAyMn0.mock_signature';
    const mockUser = {
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      role: 'ADMINISTRATOR',
      isActive: 1,
    };

    // Lưu vào localStorage
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    alert('Mock login thành công! Token và user đã được lưu vào localStorage.');
  };

  const handleClearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    alert('Đã xóa tất cả auth data!');
  };

  const handleTestAPI = () => {
    navigate('/test/api');
  };

  const handleGoToUsers = () => {
    navigate('/admin/users');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🔐 Mock Login for Testing</Title>

        <Alert
          message="Test Authentication"
          description="Trang này dùng để mock login và test API khi chưa có backend authentication hoàn chỉnh."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            block
            onClick={handleMockLogin}
          >
            Mock Login (Admin)
          </Button>

          <Button type="default" size="large" block onClick={handleClearAuth}>
            Clear Auth Data
          </Button>

          <Divider>Test Pages</Divider>

          <Button
            type="dashed"
            icon={<UserOutlined />}
            block
            onClick={handleTestAPI}
          >
            Test User API
          </Button>

          <Button type="dashed" block onClick={handleGoToUsers}>
            Go to Admin Users Page
          </Button>
        </Space>

        <Divider />

        <div style={{ fontSize: '12px', color: '#666' }}>
          <Text strong>Current Auth Status:</Text>
          <br />
          <Text>
            Token: {localStorage.getItem('access_token') ? '✅ Có' : '❌ Không'}
          </Text>
          <br />
          <Text>
            User: {localStorage.getItem('user') ? '✅ Có' : '❌ Không'}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default MockLoginPage;
