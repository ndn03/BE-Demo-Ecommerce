import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Tag,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { userApi } from '@queries/apis/user';
import { getAccessToken, getUser, isAuthenticated } from '@libs/localStorage';

const { Title, Text, Paragraph } = Typography;

/**
 * Component để test kết nối API và hiển thị dữ liệu users
 */
const UserAPITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<any>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Testing User API...');

      const response = await userApi.getUsers({
        page: 1,
        limit: 5, // Lấy 5 user đầu tiên để test
      });

      console.log('✅ API Response:', response);

      setUsers(response.data || []);
      setLastFetch(new Date().toLocaleString('vi-VN'));
      message.success(
        `Tải thành công ${response.data?.length || 0} người dùng!`,
      );
    } catch (err: any) {
      console.error('❌ API Error:', err);
      setError(err.message || 'Lỗi không xác định');
      message.error('Lỗi khi gọi API: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check auth info
    const token = getAccessToken();
    const user = getUser();
    const authenticated = isAuthenticated();

    setAuthInfo({
      token: token ? token.substring(0, 20) + '...' : 'No token',
      user: user,
      authenticated,
    });

    testAPI(); // Auto load khi component mount
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>🧪 User API Test</Title>
        <Paragraph>
          Component này dùng để test kết nối API users và debug dữ liệu
        </Paragraph>

        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Auth Status */}
          {authInfo && (
            <Alert
              message="Auth Status"
              description={
                <Space direction="vertical">
                  <div>
                    <strong>Authenticated:</strong>{' '}
                    {authInfo.authenticated ? '✅ Yes' : '❌ No'}
                  </div>
                  <div>
                    <strong>Token:</strong> {authInfo.token}
                  </div>
                  <div>
                    <strong>User:</strong>{' '}
                    {authInfo.user
                      ? JSON.stringify(authInfo.user)
                      : 'No user data'}
                  </div>
                </Space>
              }
              type={authInfo.authenticated ? 'success' : 'warning'}
              style={{ marginBottom: '16px' }}
            />
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={testAPI}
            loading={loading}
          >
            Test API Users
          </Button>{' '}
          {lastFetch && (
            <Text type="secondary">Lần cuối cập nhật: {lastFetch}</Text>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <div>Đang tải dữ liệu...</div>
            </div>
          )}
          {error && (
            <Card size="small" style={{ borderColor: '#ff4d4f' }}>
              <Text type="danger">
                <CloseCircleOutlined /> Lỗi: {error}
              </Text>
            </Card>
          )}
          {!loading && !error && users.length > 0 && (
            <Card size="small" style={{ borderColor: '#52c41a' }}>
              <Text type="success">
                <CheckCircleOutlined /> Thành công! Tìm thấy {users.length}{' '}
                người dùng
              </Text>

              <div style={{ marginTop: '16px' }}>
                <Title level={5}>Dữ liệu users:</Title>
                {users.map((user, index) => (
                  <Card
                    key={user.id || index}
                    size="small"
                    style={{ marginBottom: '8px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <strong>ID:</strong> {user.id} |<strong> Email:</strong>{' '}
                        {user.email} |<strong> Username:</strong>{' '}
                        {user.username}
                      </div>
                      <div>
                        <strong>Role:</strong>{' '}
                        <Tag color="blue">{user.role}</Tag>
                        <strong>Status:</strong>{' '}
                        <Tag color={user.isActive ? 'green' : 'red'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Created: {user.createdAt} | Updated: {user.updatedAt}
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>
            </Card>
          )}
          {!loading && !error && users.length === 0 && (
            <Card size="small" style={{ borderColor: '#faad14' }}>
              <Text type="warning">
                ⚠️ API kết nối thành công nhưng không có dữ liệu users
              </Text>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default UserAPITest;
