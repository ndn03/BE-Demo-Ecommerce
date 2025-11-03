import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Avatar,
  Typography,
  Space,
  Button,
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  RiseOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '@contexts/AuthContext';

const { Title, Text } = Typography;

/**
 * 🛠️ Admin Dashboard - Trang tổng quan quản trị hệ thống
 * Hiển thị thống kê tổng quan, biểu đồ và dữ liệu quan trọng cho Administrator
 */
const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - trong thực tế sẽ fetch từ API
  const systemStats = {
    totalUsers: 1248,
    totalOrders: 3567,
    totalRevenue: 2456789000,
    growthRate: 23.5,
  };

  const recentOrders = [
    {
      id: 1,
      orderCode: '#ORD001',
      customer: 'Nguyễn Văn A',
      amount: 2500000,
      status: 'completed',
      date: '2024-10-31',
    },
    {
      id: 2,
      orderCode: '#ORD002',
      customer: 'Trần Thị B',
      amount: 1800000,
      status: 'pending',
      date: '2024-10-31',
    },
    {
      id: 3,
      orderCode: '#ORD003',
      customer: 'Lê Văn C',
      amount: 950000,
      status: 'processing',
      date: '2024-10-30',
    },
  ];

  const recentUsers = [
    {
      id: 1,
      name: 'Phạm Thị D',
      email: 'pham.d@company.com',
      role: 'EMPLOYEE',
      avatar: null,
      joinDate: '2024-10-30',
    },
    {
      id: 2,
      name: 'Hoàng Văn E',
      email: 'hoang.e@company.com',
      role: 'HR',
      avatar: null,
      joinDate: '2024-10-29',
    },
  ];

  const orderColumns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(amount),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'green', text: 'Hoàn thành' },
          pending: { color: 'orange', text: 'Chờ xử lý' },
          processing: { color: 'blue', text: 'Đang xử lý' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
  ];

  const userColumns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleConfig = {
          EMPLOYEE: { color: 'blue', text: 'Nhân viên' },
          HR: { color: 'purple', text: 'HR' },
          ADMINISTRATOR: { color: 'red', text: 'Admin' },
        };
        const config = roleConfig[role as keyof typeof roleConfig];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>🛠️ Bảng điều khiển Admin</Title>
        <Text type="secondary">
          Xin chào {user?.profile?.fullName}, chào mừng bạn quay trở lại hệ
          thống quản trị
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={systemStats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={systemStats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={systemStats.totalRevenue}
              prefix={<DollarCircleOutlined />}
              precision={0}
              formatter={(value) =>
                new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(value as number)
              }
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tăng trưởng"
              value={systemStats.growthRate}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="📊 Hiệu suất hệ thống" extra={<SettingOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>CPU Usage</Text>
                <Progress percent={65} status="active" />
              </div>
              <div>
                <Text>Memory Usage</Text>
                <Progress percent={80} status="normal" />
              </div>
              <div>
                <Text>Disk Usage</Text>
                <Progress percent={45} status="normal" />
              </div>
              <div>
                <Text>Network</Text>
                <Progress percent={30} status="normal" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="📈 Thống kê nhanh">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Đơn hôm nay"
                    value={87}
                    valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Khách mới"
                    value={23}
                    valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Tỷ lệ chuyển đổi"
                    value={12.8}
                    suffix="%"
                    valueStyle={{ fontSize: '18px', color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Đánh giá TB"
                    value={4.6}
                    suffix="/5"
                    valueStyle={{ fontSize: '18px', color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="📦 Đơn hàng gần đây"
            extra={
              <Button type="link" href="/orders">
                Xem tất cả
              </Button>
            }
          >
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="👥 Người dùng mới"
            extra={
              <Button type="link" href="/users">
                Xem tất cả
              </Button>
            }
          >
            <Table
              dataSource={recentUsers}
              columns={userColumns}
              pagination={false}
              size="small"
              showHeader={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="⚡ Thao tác nhanh" style={{ marginTop: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col>
            <Button type="primary" icon={<UserOutlined />}>
              Thêm người dùng
            </Button>
          </Col>
          <Col>
            <Button icon={<ShoppingCartOutlined />}>Xem đơn hàng</Button>
          </Col>
          <Col>
            <Button icon={<SettingOutlined />}>Cài đặt hệ thống</Button>
          </Col>
          <Col>
            <Button icon={<RiseOutlined />}>Báo cáo thống kê</Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;
