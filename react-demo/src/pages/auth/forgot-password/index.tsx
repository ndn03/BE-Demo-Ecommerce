import HeadHtml from '@components/layout/HeadHtml';
import { Button, Col, Form, Image, Input, Row, Result } from 'antd';
import { TForgotPassword } from '@modules/auth';
import { checkAuth } from '@libs/localStorage';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutationForgotPassword } from '@queries/hooks';
import logoApp from '@assets/logo-app.svg';
import { customizeRequiredMark } from '@libs/antd';
import { COLORS } from '@styles/theme';
import TermOfPolicyLink from '@components/elements/TermOfPolicyLink';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';

function ForgotPassword() {
  const navigate = useNavigate();
  const [form] = Form.useForm<TForgotPassword>();
  const token: string = checkAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const { mutate, status } = useMutationForgotPassword();

  const onSubmit = (values: TForgotPassword) => {
    setEmail(values.email);
    mutate(values, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
    });
  };

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate, token]);

  if (isSubmitted) {
    return (
      <div className="forgot-password-page">
        <HeadHtml title="Kiểm tra email" />
        <div className="forgot-password-container">
          <Row gutter={[0, 32]} align="middle" justify="center">
            <Col span={24}>
              <div style={{ textAlign: 'center' }}>
                <Image src={logoApp} alt="logo" width={150} preview={false} />
              </div>
            </Col>
            <Col span={24}>
              <Result
                icon={<MailOutlined style={{ color: COLORS.green[600] }} />}
                title="Kiểm tra email của bạn"
                subTitle={
                  <div style={{ color: COLORS.gray[600] }}>
                    Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến
                    <br />
                    <strong>{email}</strong>
                  </div>
                }
                extra={[
                  <Button
                    key="back"
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/auth/login')}
                    size="large"
                  >
                    Quay lại đăng nhập
                  </Button>,
                  <Button
                    key="resend"
                    type="primary"
                    onClick={() => setIsSubmitted(false)}
                    size="large"
                  >
                    Gửi lại email
                  </Button>,
                ]}
              />
            </Col>
          </Row>
          <TermOfPolicyLink />
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <HeadHtml title="Quên mật khẩu" />
      <div className="forgot-password-container">
        <Row gutter={[0, 32]} align="middle" justify="center">
          <Col span={24}>
            <div style={{ textAlign: 'center' }}>
              <Image src={logoApp} alt="logo" width={160} preview={false} />
              <h2>Quên mật khẩu?</h2>
              <p>Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu</p>
            </div>
          </Col>
          <Col span={24}>
            <Form
              name="forgotPassword"
              form={form}
              onFinish={onSubmit}
              layout="vertical"
              requiredMark={customizeRequiredMark}
            >
              <Form.Item
                name="email"
                label="Địa chỉ email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input
                  placeholder="Nhập địa chỉ email"
                  size="large"
                  prefix={<MailOutlined style={{ color: COLORS.gray[400] }} />}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="btn-submit-forgot-password"
                  loading={status === 'pending'}
                  disabled={status === 'pending'}
                  size="large"
                  block
                >
                  {status === 'pending'
                    ? 'Đang gửi...'
                    : 'Gửi hướng dẫn khôi phục'}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link
                  to="/auth/login"
                  style={{
                    color: COLORS.gray[600],
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ArrowLeftOutlined />
                  Quay lại đăng nhập
                </Link>
              </div>
            </Form>
          </Col>
        </Row>
        <TermOfPolicyLink />
      </div>
    </div>
  );
}

export default ForgotPassword;
