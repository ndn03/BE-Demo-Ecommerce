import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

/**
 * 🚫 Unauthorized Page - Trang thông báo không có quyền truy cập
 * Hiển thị khi user không có quyền truy cập vào trang được yêu cầu
 */
const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập vào trang này."
        extra={
          <div>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Tài khoản của bạn ({user?.email}) không được phép truy cập vào khu
              vực này.
              <br />
              Vui lòng liên hệ administrator để được hỗ trợ.
            </p>
            <Button
              type="primary"
              onClick={handleGoHome}
              style={{ marginRight: '8px' }}
            >
              Về trang chủ
            </Button>
            <Button onClick={handleGoBack} style={{ marginRight: '8px' }}>
              Quay lại
            </Button>
            <Button type="link" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default Unauthorized;
