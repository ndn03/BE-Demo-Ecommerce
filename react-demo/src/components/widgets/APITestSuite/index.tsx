import React, { useState } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Alert,
  Steps,
  Typography,
  Divider,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  LockOutlined,
  ApiOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { signIn } from '@queries/apis/auth';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * 🧪 Complete API Test Component
 * Comprehensive testing interface for login functionality
 */
const APITestSuite: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    connectivity: 'pending' | 'success' | 'failed';
    authentication: 'pending' | 'success' | 'failed';
    message: string;
  }>({
    connectivity: 'pending',
    authentication: 'pending',
    message: '',
  });

  // Common test credentials
  const testCredentials = [
    { username: 'admin', password: 'admin123', role: 'Administrator' },
    { username: 'hr', password: 'hr123', role: 'HR Manager' },
    { username: 'user', password: 'user123', role: 'Employee' },
    { username: 'admin', password: 'admin', role: 'Simple Admin' },
    { username: 'test', password: 'test', role: 'Test User' },
  ];

  const testLogin = async (username: string, password: string) => {
    setLoading(true);
    setCurrentStep(1);

    try {
      console.log(`🧪 Testing login: ${username}/${password}`);

      const response = await signIn({ username, password });
      console.log('✅ Login successful:', response);

      setTestResults({
        connectivity: 'success',
        authentication: 'success',
        message: `✅ Đăng nhập thành công với ${username}! Token nhận được, hệ thống sẵn sàng.`,
      });
      setCurrentStep(2);
    } catch (error: any) {
      console.error('❌ Login failed:', error);

      if (error?.statusCode === 400 || error?.statusCode === 401) {
        setTestResults({
          connectivity: 'success',
          authentication: 'failed',
          message: `❌ Credentials không đúng (${username}/${password}). API hoạt động nhưng cần credentials đúng.`,
        });
      } else if (error?.statusCode === 404) {
        setTestResults({
          connectivity: 'failed',
          authentication: 'pending',
          message: '❌ API endpoint không tồn tại. Kiểm tra backend routing.',
        });
      } else {
        setTestResults({
          connectivity: 'failed',
          authentication: 'pending',
          message: `❌ Lỗi kết nối: ${error?.message || 'Unknown error'}`,
        });
      }
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (credentials: {
    username: string;
    password: string;
  }) => {
    testLogin(credentials.username, credentials.password);
  };

  const onFinish = (values: any) => {
    testLogin(values.username, values.password);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title="🧪 API Test Suite - Admin/HR System">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Progress Steps */}
          <Steps current={currentStep} size="small">
            <Step
              title="Ready"
              description="Sẵn sàng test"
              icon={<ApiOutlined />}
            />
            <Step
              title="Testing"
              description="Đang test API"
              icon={loading ? <LoadingOutlined /> : <UserOutlined />}
            />
            <Step
              title="Complete"
              description="Kết quả test"
              icon={<CheckCircleOutlined />}
            />
          </Steps>

          <Divider />

          {/* Test Results */}
          {testResults.connectivity !== 'pending' && (
            <Alert
              message="Kết quả Test"
              description={testResults.message}
              type={
                testResults.authentication === 'success' ? 'success' : 'warning'
              }
              icon={<InfoCircleOutlined />}
              showIcon
            />
          )}

          {/* Quick Test Buttons */}
          <div>
            <Title level={4}>⚡ Quick Test với Common Credentials:</Title>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {testCredentials.map((cred, index) => (
                <Button
                  key={index}
                  onClick={() => handleQuickTest(cred)}
                  loading={loading}
                  type={index === 0 ? 'primary' : 'default'}
                  size="small"
                >
                  {cred.username}/{cred.password}
                  <br />
                  <Text style={{ fontSize: '10px' }}>({cred.role})</Text>
                </Button>
              ))}
            </div>
            <Text type="secondary">
              💡 Click button để test nhanh với credentials phổ biến
            </Text>
          </div>

          <Divider />

          {/* Custom Login Test */}
          <div>
            <Title level={4}>🔧 Custom Test:</Title>
            <Form onFinish={onFinish} layout="vertical">
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập username!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập username để test"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập password để test"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<ApiOutlined />}
                >
                  Test Custom Credentials
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Instructions */}
          <div>
            <Title level={4}>📋 Hướng dẫn:</Title>
            <Paragraph>
              <Text strong>1. Backend Setup:</Text>
              <br />• Đảm bảo NestJS backend chạy trên port 3000
              <br />• API endpoint: <Text code>POST /v1/user/login</Text>
              <br />• CORS phải cho phép origin{' '}
              <Text code>http://localhost:5173</Text>
            </Paragraph>

            <Paragraph>
              <Text strong>2. Test Process:</Text>
              <br />• Click Quick Test buttons hoặc nhập custom credentials
              <br />• Xem kết quả trong Alert box
              <br />• Check DevTools Console (F12) để xem chi tiết
            </Paragraph>

            <Paragraph>
              <Text strong>3. Expected Results:</Text>
              <br />• ✅ Nếu credentials đúng: Nhận được JWT token
              <br />• ❌ Nếu credentials sai: Error 400/401 (API vẫn hoạt động)
              <br />• ❌ Nếu API lỗi: Connection error hoặc 404
            </Paragraph>

            <Paragraph type="secondary">
              💡 <Text strong>Tip:</Text> Nếu tất cả Quick Test đều fail, có thể
              database chưa có users hoặc credentials khác. Check backend logs
              hoặc seed database.
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default APITestSuite;
