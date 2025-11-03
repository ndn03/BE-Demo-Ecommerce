import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { ERole } from '@configs/interface.config';
import AdminDashboard from '@pages/admin/dashboard';
import HRDashboard from '@pages/hr/dashboard';

/**
 * 🚦 Dashboard Router - Điều hướng dashboard dựa trên role người dùng
 * Tự động chuyển hướng đến dashboard phù hợp với quyền hạn
 */
const DashboardRouter: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  // Redirect về login nếu chưa đăng nhập
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Điều hướng dựa trên role
  switch (user.role) {
    case ERole.ADMINISTRATOR:
      return <AdminDashboard />;

    case ERole.HUMAN_RESOURCES:
      return <HRDashboard />;

    case ERole.EMPLOYEE:
      // Employee sẽ được chuyển đến trang profile hoặc dashboard đơn giản
      return <Navigate to="/profile" replace />;

    default:
      // Các role khác (CUSTOMER, VIP, etc.) chuyển đến unauthorized
      return <Navigate to="/unauthorized" replace />;
  }
};

export default DashboardRouter;
