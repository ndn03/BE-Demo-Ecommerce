import { ReactNode } from 'react';
import { Row, Col } from 'antd';
import TermOfPolicyLink from '@components/elements/TermOfPolicyLink';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

function AuthLayout({
  children,
  className = 'auth-container',
}: AuthLayoutProps) {
  return (
    <Row className={`auth-page ${className}`} style={{ position: 'relative' }}>
      <Col className={className}>{children}</Col>
      <TermOfPolicyLink />
    </Row>
  );
}

export default AuthLayout;
