import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import {
  MailOutlined,
  ArrowLeftOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/auth.service';
import { ForgotPasswordDto } from '../../types/auth.types';
import './ForgotPasswordPage.less';

const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string>('');

  const onFinish = async (values: ForgotPasswordDto) => {
    try {
      setIsSubmitting(true);
      setError('');

      await authApi.forgotPassword(values);
      setEmailSent(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center' }}>
            <SendOutlined
              style={{
                fontSize: '64px',
                color: '#52c41a',
                marginBottom: '24px',
              }}
            />
            <Title level={2} className="auth-title">
              Email đã được gửi!
            </Title>
            <Text
              className="auth-subtitle"
              style={{ display: 'block', marginBottom: '32px' }}
            >
              Vui lòng kiểm tra email của bạn và làm theo hướng dẫn để đặt lại
              mật khẩu.
            </Text>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
              size="large"
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} className="auth-title">
            Quên mật khẩu?
          </Title>
          <Text className="auth-subtitle">
            Nhập email để nhận link đặt lại mật khẩu
          </Text>
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

        <Form
          form={form}
          name="forgotPassword"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form"
        >
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
              placeholder="Nhập địa chỉ email của bạn"
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
              icon={<SendOutlined />}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
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

export default ForgotPasswordPage;
