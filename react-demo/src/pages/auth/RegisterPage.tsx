import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Progress } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/auth.service';
import { UserRegistrationDto } from '../../types/auth.types';
import './RegisterPage.less';

const { Title, Text } = Typography;

interface FormValues extends UserRegistrationDto {
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Tính độ mạnh mật khẩu
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 10;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength < 30) return '#ff4d4f';
    if (passwordStrength < 60) return '#faad14';
    if (passwordStrength < 80) return '#1890ff';
    return '#52c41a';
  };

  const getPasswordStrengthText = (): string => {
    if (passwordStrength < 30) return 'Yếu';
    if (passwordStrength < 60) return 'Trung bình';
    if (passwordStrength < 80) return 'Khá';
    return 'Mạnh';
  };

  const onFinish = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setError('');

      const { confirmPassword, ...registerData } = values;
      await authApi.register(registerData);

      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} className="auth-title">
            Tạo tài khoản mới
          </Title>
          <Text className="auth-subtitle">Điền thông tin để tạo tài khoản</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: '24px' }}
            showIcon
            closable
            onClose={() => setError('')}
          />
        )}

        {success && (
          <Alert
            message={success}
            type="success"
            style={{ marginBottom: '24px' }}
            showIcon
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
              { max: 20, message: 'Tên đăng nhập không được quá 20 ký tự!' },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message:
                  'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới!',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên đăng nhập"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Nhập địa chỉ email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              size="large"
              onChange={onPasswordChange}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <Text
                style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}
              >
                Độ mạnh mật khẩu: {getPasswordStrengthText()}
              </Text>
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor()}
                showInfo={false}
                size="small"
                style={{ marginTop: '4px' }}
              />
            </div>
          )}

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu xác nhận không khớp!'),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
              icon={<UserAddOutlined />}
            >
              {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-links">
          <Link to="/login">
            <ArrowLeftOutlined style={{ marginRight: '8px' }} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
