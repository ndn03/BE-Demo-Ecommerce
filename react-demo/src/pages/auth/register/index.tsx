import HeadHtml from '@components/layout/HeadHtml';
import { Button, Col, Flex, Form, Image, Input, Row, Checkbox } from 'antd';
import { TAuthUserRegistration } from '@modules/auth';
import { checkAuth } from '@libs/localStorage';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutationSignUp } from '@queries/hooks';
import logoApp from '@assets/logo-app.svg';
import { customizeRequiredMark } from '@libs/antd';
import { COLORS } from '@styles/theme';
import TermOfPolicyLink from '@components/elements/TermOfPolicyLink';

function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm<
    TAuthUserRegistration & { confirmPassword: string; agreeTerms: boolean }
  >();
  const token: string = checkAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate, status } = useMutationSignUp();

  const onRegister = (
    values: TAuthUserRegistration & {
      confirmPassword: string;
      agreeTerms: boolean;
    },
  ) => {
    setIsSubmitting(true);
    const { confirmPassword, agreeTerms, ...registerData } = values;

    mutate(registerData, {
      onSuccess: () => {
        navigate('/auth/login?message=registration_success', { replace: true });
      },
      onError: () => {
        setIsSubmitting(false);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate, token]);

  return (
    <div className="register-page">
      <HeadHtml title="Đăng ký tài khoản" />
      <div className="register-container">
        <Row gutter={[0, 32]} align="middle" justify="center">
          <Col span={24}>
            <div style={{ textAlign: 'center' }}>
              <Image src={logoApp} alt="logo" width={160} preview={false} />
              <h2>Tạo tài khoản mới</h2>
              <p>Đăng ký để truy cập hệ thống</p>
            </div>
          </Col>
          <Col span={24}>
            <Form
              name="register"
              form={form}
              onFinish={onRegister}
              layout="vertical"
              requiredMark={customizeRequiredMark}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="Tên đăng nhập"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập tên đăng nhập',
                      },
                      {
                        min: 3,
                        message: 'Tên đăng nhập phải có ít nhất 3 ký tự',
                      },
                      {
                        pattern: /^[a-zA-Z0-9_]+$/,
                        message:
                          'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
                      },
                    ]}
                  >
                    <Input placeholder="Nhập tên đăng nhập" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ và tên' },
                      { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' },
                    ]}
                  >
                    <Input placeholder="Nhập họ và tên" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập địa chỉ email" size="large" />
              </Form.Item>

              <Form.Item name="employeeCode" label="Mã nhân viên (tùy chọn)">
                <Input placeholder="Nhập mã nhân viên (nếu có)" size="large" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message:
                          'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
                      },
                    ]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu' },
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
                      placeholder="Nhập lại mật khẩu"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="agreeTerms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error('Vui lòng đồng ý với điều khoản sử dụng'),
                          ),
                  },
                ]}
              >
                <Checkbox>
                  Tôi đồng ý với{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    style={{ color: COLORS.green[600] }}
                  >
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    style={{ color: COLORS.green[600] }}
                  >
                    Chính sách bảo mật
                  </Link>
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="btn-submit-register"
                  loading={isSubmitting || status === 'pending'}
                  disabled={isSubmitting || status === 'pending'}
                  size="large"
                  block
                >
                  {isSubmitting || status === 'pending'
                    ? 'Đang đăng ký...'
                    : 'Đăng ký'}
                </Button>
              </Form.Item>

              <Flex justify="center" gap="small" style={{ marginTop: 16 }}>
                <span style={{ color: COLORS.gray[600] }}>
                  Đã có tài khoản?
                </span>
                <Link to="/auth/login" style={{ color: COLORS.green[600] }}>
                  Đăng nhập ngay
                </Link>
              </Flex>
            </Form>
          </Col>
        </Row>
        <TermOfPolicyLink />
      </div>
    </div>
  );
}

export default Register;
