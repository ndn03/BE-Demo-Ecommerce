/**
 * 🧪 Test Login Page - Comprehensive API Testing
 * Trang test toàn diện cho login functionality và backend connectivity
 */
import React from 'react';
import { Row, Col } from 'antd';
import BackendHealthCheck from '../../components/widgets/BackendHealthCheck';
import APITestSuite from '../../components/widgets/APITestSuite';

const TestLogin: React.FC = () => {
  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <Row gutter={[24, 24]}>
        {/* Backend Health Check */}
        <Col xs={24} lg={12}>
          <BackendHealthCheck />
        </Col>

        {/* API Test Suite */}
        <Col xs={24} lg={12}>
          <APITestSuite />
        </Col>
      </Row>
    </div>
  );
};
export default TestLogin;
