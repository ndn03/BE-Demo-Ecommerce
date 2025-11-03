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
  Calendar,
  List,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@contexts/AuthContext';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

/**
 * 👥 HR Dashboard - Trang tổng quan quản lý nhân sự
 * Hiển thị thống kê nhân sự, lịch làm việc, và các hoạt động HR
 */
const HRDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - trong thực tế sẽ fetch từ API
  const hrStats = {
    totalEmployees: 145,
    activeEmployees: 138,
    onLeave: 7,
    newHires: 12,
  };

  const leaveRequests = [
    {
      id: 1,
      employee: 'Nguyễn Văn A',
      type: 'Nghỉ phép',
      startDate: '2024-11-01',
      endDate: '2024-11-03',
      status: 'pending',
      days: 3,
    },
    {
      id: 2,
      employee: 'Trần Thị B',
      type: 'Nghỉ ốm',
      startDate: '2024-10-30',
      endDate: '2024-10-31',
      status: 'approved',
      days: 2,
    },
    {
      id: 3,
      employee: 'Lê Văn C',
      type: 'Nghỉ cá nhân',
      startDate: '2024-11-05',
      endDate: '2024-11-05',
      status: 'pending',
      days: 1,
    },
  ];

  const upcomingEvents = [
    {
      title: 'Họp định kỳ team Marketing',
      date: '2024-11-01 09:00',
      type: 'meeting',
    },
    {
      title: 'Đánh giá hiệu suất Q4',
      date: '2024-11-03 14:00',
      type: 'review',
    },
    {
      title: 'Training Security Awareness',
      date: '2024-11-05 10:30',
      type: 'training',
    },
    {
      title: 'Sinh nhật Nguyễn Thị D',
      date: '2024-11-07',
      type: 'birthday',
    },
  ];

  const recentActivities = [
    {
      title: 'Phê duyệt đơn nghỉ phép - Trần Văn E',
      timestamp: '2 giờ trước',
      type: 'approval',
    },
    {
      title: 'Cập nhật hồ sơ nhân viên mới - Hoàng Thị F',
      timestamp: '4 giờ trước',
      type: 'profile',
    },
    {
      title: 'Gửi thông báo về chính sách mới',
      timestamp: '1 ngày trước',
      type: 'notification',
    },
  ];

  const leaveColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'employee',
      key: 'employee',
      render: (name: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          {name}
        </Space>
      ),
    },
    {
      title: 'Loại nghỉ',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Từ ngày',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: 'Đến ngày',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: 'Số ngày',
      dataIndex: 'days',
      key: 'days',
      render: (days: number) => `${days} ngày`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Chờ duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          rejected: { color: 'red', text: 'Từ chối' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
  ];

  const onPanelChange = (value: Dayjs, mode: string) => {
    console.log(value.format('YYYY-MM-DD'), mode);
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>👥 Bảng điều khiển HR</Title>
        <Text type="secondary">
          Xin chào {user?.profile?.fullName}, quản lý nhân sự hiệu quả cùng hệ
          thống HR
        </Text>
      </div>

      {/* HR Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={hrStats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={hrStats.activeEmployees}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang nghỉ"
              value={hrStats.onLeave}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Nhân viên mới tháng này"
              value={hrStats.newHires}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* HR Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="📊 Hiệu suất nhân sự" extra={<FileTextOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Tỷ lệ tham dự (Attendance Rate)</Text>
                <Progress percent={96} status="active" strokeColor="#52c41a" />
              </div>
              <div>
                <Text>Tỷ lệ hài lòng nhân viên</Text>
                <Progress percent={88} status="normal" strokeColor="#1890ff" />
              </div>
              <div>
                <Text>Hoàn thành đào tạo</Text>
                <Progress percent={75} status="normal" strokeColor="#faad14" />
              </div>
              <div>
                <Text>Tỷ lệ giữ chân nhân viên</Text>
                <Progress percent={92} status="normal" strokeColor="#f5222d" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="📅 Lịch làm việc" extra={<CalendarOutlined />}>
            <Calendar fullscreen={false} onPanelChange={onPanelChange} />
          </Card>
        </Col>
      </Row>

      {/* Leave Requests & Activities */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card
            title="📝 Đơn nghỉ phép chờ duyệt"
            extra={
              <Button type="link" href="/hr/leave-requests">
                Xem tất cả
              </Button>
            }
          >
            <Table
              dataSource={leaveRequests}
              columns={leaveColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="🔔 Sự kiện sắp tới">
            <List
              size="small"
              dataSource={upcomingEvents}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === 'meeting' ? (
                            <TeamOutlined />
                          ) : item.type === 'training' ? (
                            <FileTextOutlined />
                          ) : (
                            <CalendarOutlined />
                          )
                        }
                        size="small"
                      />
                    }
                    title={item.title}
                    description={item.date}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activities & Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="🕒 Hoạt động gần đây">
            <List
              size="small"
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === 'approval' ? (
                            <CheckCircleOutlined />
                          ) : item.type === 'profile' ? (
                            <UserOutlined />
                          ) : (
                            <NotificationOutlined />
                          )
                        }
                        size="small"
                      />
                    }
                    title={item.title}
                    description={item.timestamp}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="⚡ Thao tác nhanh HR">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <Button type="primary" icon={<UserOutlined />} block>
                  Thêm NV
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button icon={<CalendarOutlined />} block>
                  Lịch làm việc
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button icon={<FileTextOutlined />} block>
                  Báo cáo
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button icon={<ClockCircleOutlined />} block>
                  Chấm công
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button icon={<NotificationOutlined />} block>
                  Thông báo
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button icon={<TeamOutlined />} block>
                  Đào tạo
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HRDashboard;
