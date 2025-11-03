import HeadHtml from '@components/layout/HeadHtml';
import { Button, Col, Flex, Form, Image, Input, Row } from 'antd';
import { TSignIn } from '@modules/auth';
import { checkAuth } from '@libs/localStorage';
import { useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutationSignIn } from '@queries/hooks';
import logoApp from '@assets/logo-app.svg';
import { customizeRequiredMark } from '@libs/antd';
import { COLORS } from '@styles/theme';
import { isValidRoute } from '@route/routeConfig';
import TermOfPolicyLink from '@components/elements/TermOfPolicyLink';

function Login() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const navigate = useNavigate();
  const [form] = Form.useForm<TSignIn>();
  const token: string = checkAuth();

  const isValidRedirect = useMemo(() => isValidRoute(redirect), [redirect]);

  const { mutate, status } = useMutationSignIn();
  const onLogin = (values: TSignIn) => {
    mutate(values, {
      onSuccess: () => {
        if (redirect && isValidRedirect) {
          navigate(redirect, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      },
    });
  };

  useEffect(() => {
    if (token) {
      if (redirect && isValidRedirect) {
        navigate(redirect, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, token]);
  return (
    <div className="login-page">
      <HeadHtml title="Đăng nhập - Admin Dashboard" />
      <div className="login-container">
        <Row gutter={[0, 32]} align="middle" justify="center">
          <Col span={24}>
            <div style={{ textAlign: 'center' }}>
              <Image src={logoApp} alt="logo" width={180} preview={false} />
              <h2>Đăng nhập Admin</h2>
              <p>Quản lý hệ thống thương mại điện tử</p>
            </div>
          </Col>
          <Col span={24}>
            <Form
              name="login"
              form={form}
              onFinish={onLogin}
              layout="vertical"
              requiredMark={customizeRequiredMark}
            >
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                ]}
              >
                <Input
                  placeholder="Nhập tên đăng nhập"
                  autoFocus
                  size="large"
                  onPressEnter={() => form.getFieldInstance('password').focus()}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password
                  type="password"
                  placeholder="Nhập mật khẩu"
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="btn-submit-login"
                  loading={status === 'pending'}
                  disabled={status === 'pending'}
                  size="large"
                  block
                >
                  {status === 'pending' ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form.Item>
              <Flex justify="space-between" align="center">
                <Link to="/forgot-password" style={{ color: COLORS.gray[600] }}>
                  Quên mật khẩu?
                </Link>
                <span style={{ color: COLORS.gray[600] }}>
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/auth/register"
                    style={{ color: COLORS.green[600] }}
                  >
                    Đăng ký ngay
                  </Link>
                </span>
              </Flex>
            </Form>
          </Col>
        </Row>
        <TermOfPolicyLink />
      </div>
    </div>
  );
}

export default Login;
