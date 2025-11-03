import React, { useState } from 'react';
import { Card, Button, Tag, Typography, Space, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { API_ENDPOINT, API_PREFIX } from '@configs/api.config';

const { Title, Text, Paragraph } = Typography;

/**
 * 🔍 Backend Health Check Component
 * Kiểm tra kết nối và status của backend API
 */
const BackendHealthCheck: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    api: 'unknown' | 'healthy' | 'error';
    cors: 'unknown' | 'ok' | 'blocked';
    message: string;
  }>({
    api: 'unknown',
    cors: 'unknown',
    message: 'Chưa kiểm tra',
  });

  const checkBackendHealth = async () => {
    setIsChecking(true);
    const baseUrl = `${API_ENDPOINT}${API_PREFIX}`;

    try {
      // Test basic connectivity with actual login endpoint
      const response = await fetch(`${baseUrl}/v1/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'test', password: 'test' }),
      });

      if (response.status === 400 || response.status === 401) {
        // Login endpoint responds even with wrong credentials - means API is working
        setHealthStatus({
          api: 'healthy',
          cors: 'ok',
          message:
            'Backend API kết nối thành công! Ready để login với credentials đúng.',
        });
      } else if (response.ok) {
        setHealthStatus({
          api: 'healthy',
          cors: 'ok',
          message: 'Backend đang hoạt động bình thường',
        });
      } else {
        setHealthStatus({
          api: 'error',
          cors: 'unknown',
          message: `Backend trả về status: ${response.status}`,
        });
      }
    } catch (error: any) {
      console.error('Backend health check error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setHealthStatus({
          api: 'error',
          cors: 'blocked',
          message: 'Không thể kết nối đến backend - kiểm tra CORS hoặc server',
        });
      } else {
        setHealthStatus({
          api: 'error',
          cors: 'unknown',
          message: `Lỗi: ${error.message}`,
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
      case 'blocked':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      default:
        return <ApiOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'success';
      case 'error':
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      title="🔍 Backend Health Check"
      extra={
        <Button
          type="primary"
          onClick={checkBackendHealth}
          loading={isChecking}
          icon={isChecking ? <LoadingOutlined /> : <ApiOutlined />}
        >
          {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra Backend'}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Backend URL: </Text>
          <Text code>
            {API_ENDPOINT}
            {API_PREFIX || '/'}
          </Text>
          <br />
          <Text strong>Login Endpoint: </Text>
          <Text code>{API_ENDPOINT}/v1/user/login</Text>
        </div>

        <Divider />

        <div>
          <Title level={5}>Trạng thái kết nối:</Title>

          <div style={{ marginBottom: 8 }}>
            {getStatusIcon(healthStatus.api)}
            <Text style={{ marginLeft: 8 }}>API Status:</Text>
            <Tag
              color={getStatusColor(healthStatus.api)}
              style={{ marginLeft: 4 }}
            >
              {healthStatus.api.toUpperCase()}
            </Tag>
          </div>

          <div style={{ marginBottom: 8 }}>
            {getStatusIcon(healthStatus.cors)}
            <Text style={{ marginLeft: 8 }}>CORS Status:</Text>
            <Tag
              color={getStatusColor(healthStatus.cors)}
              style={{ marginLeft: 4 }}
            >
              {healthStatus.cors.toUpperCase()}
            </Tag>
          </div>

          <Paragraph
            type={healthStatus.api === 'error' ? 'danger' : 'secondary'}
          >
            {healthStatus.message}
          </Paragraph>
        </div>

        {healthStatus.api === 'error' && (
          <div>
            <Divider />
            <Title level={5}>💡 Hướng dẫn khắc phục:</Title>

            <Paragraph>
              <Text strong>1. Kiểm tra Backend:</Text>
              <br />• Đảm bảo server đang chạy trên{' '}
              <Text code>http://localhost:3000</Text>
              <br />• Kiểm tra endpoint <Text code>/api/v1/health</Text> có tồn
              tại
            </Paragraph>

            <Paragraph>
              <Text strong>2. Cấu hình CORS (Backend):</Text>
              <br />
              <Text code style={{ whiteSpace: 'pre' }}>
                {`app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));`}
              </Text>
            </Paragraph>

            <Paragraph>
              <Text strong>3. Kiểm tra Network:</Text>
              <br />• Mở DevTools (F12) → Network tab
              <br />• Thử gọi API và xem error details
            </Paragraph>
          </div>
        )}

        {healthStatus.api === 'healthy' && (
          <div>
            <Divider />
            <Paragraph type="success">
              ✅ Backend kết nối thành công! Bạn có thể test login và các
              features khác.
            </Paragraph>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default BackendHealthCheck;
