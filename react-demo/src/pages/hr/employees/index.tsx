import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Typography,
  DatePicker,
  message,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { EEmployeeType, EGender } from '@configs/interface.config';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

/**
 * 👥 HR Employee Management - Quản lý nhân viên cho HR
 * Cho phép HR quản lý thông tin nhân viên, chấm công, và các hoạt động HR
 */
const HREmployeeManagement: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');

  // Mock data - nhân viên
  const employeesData = [
    {
      id: 1,
      employeeCode: 'EMP001',
      name: 'Nguyễn Văn A',
      email: 'nguyen.a@company.com',
      position: 'Senior Developer',
      department: 'IT',
      employmentType: EEmployeeType.FULL_TIME,
      gender: EGender.MALE,
      startDate: '2023-01-15',
      salary: 25000000,
      status: 'active',
      avatar: null,
    },
    {
      id: 2,
      employeeCode: 'EMP002',
      name: 'Trần Thị B',
      email: 'tran.b@company.com',
      position: 'Marketing Manager',
      department: 'Marketing',
      employmentType: EEmployeeType.FULL_TIME,
      gender: EGender.FEMALE,
      startDate: '2023-02-20',
      salary: 22000000,
      status: 'active',
      avatar: null,
    },
    {
      id: 3,
      employeeCode: 'EMP003',
      name: 'Lê Văn C',
      email: 'le.c@company.com',
      position: 'Intern Designer',
      department: 'Design',
      employmentType: EEmployeeType.PART_TIME,
      gender: EGender.MALE,
      startDate: '2024-01-10',
      salary: 8000000,
      status: 'active',
      avatar: null,
    },
  ];

  // Mock data - đơn nghỉ phép
  const leaveRequestsData = [
    {
      id: 1,
      employeeCode: 'EMP001',
      employeeName: 'Nguyễn Văn A',
      leaveType: 'Nghỉ phép',
      startDate: '2024-11-01',
      endDate: '2024-11-03',
      days: 3,
      reason: 'Nghỉ lễ gia đình',
      status: 'pending',
      submitDate: '2024-10-28',
    },
    {
      id: 2,
      employeeCode: 'EMP002',
      employeeName: 'Trần Thị B',
      leaveType: 'Nghỉ ốm',
      startDate: '2024-10-30',
      endDate: '2024-10-31',
      days: 2,
      reason: 'Ốm, có giấy bác sĩ',
      status: 'approved',
      submitDate: '2024-10-29',
    },
  ];

  const stats = {
    totalEmployees: 145,
    activeEmployees: 138,
    onLeave: 7,
    pendingRequests: 5,
  };

  const employeeColumns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 100,
    },
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Loại hợp đồng',
      dataIndex: 'employmentType',
      key: 'employmentType',
      render: (type: EEmployeeType) => {
        const typeConfig = {
          [EEmployeeType.FULL_TIME]: { color: 'green', text: 'Toàn thời gian' },
          [EEmployeeType.PART_TIME]: { color: 'orange', text: 'Bán thời gian' },
          [EEmployeeType.CONTRACT]: { color: 'blue', text: 'Hợp đồng' },
          [EEmployeeType.TEMPORARY]: { color: 'purple', text: 'Tạm thời' },
        };
        const config = typeConfig[type];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(salary),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditEmployee(record)}
          >
            Sửa
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            Hồ sơ
          </Button>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Loại nghỉ',
      dataIndex: 'leaveType',
      key: 'leaveType',
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
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: any) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleApproveLeave(record.id)}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleRejectLeave(record.id)}
              >
                Từ chối
              </Button>
            </>
          )}
          <Button size="small" icon={<FileTextOutlined />}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setIsModalVisible(true);
  };

  const handleApproveLeave = (requestId: number) => {
    message.success(`Đã duyệt đơn nghỉ phép ID: ${requestId}`);
  };

  const handleRejectLeave = (requestId: number) => {
    message.error(`Đã từ chối đơn nghỉ phép ID: ${requestId}`);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
    message.success(
      editingEmployee ? 'Cập nhật thành công!' : 'Thêm nhân viên thành công!',
    );
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingEmployee(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>👥 Quản lý nhân sự</Title>
        <p style={{ color: '#666' }}>
          Quản lý thông tin nhân viên, chấm công và các hoạt động HR
        </p>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.activeEmployees}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Đang nghỉ"
              value={stats.onLeave}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Đơn chờ duyệt"
              value={stats.pendingRequests}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="👤 Quản lý nhân viên" key="employees">
            {/* Actions */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={12} lg={8}>
                <Search
                  placeholder="Tìm kiếm nhân viên..."
                  allowClear
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Select style={{ width: '100%' }} placeholder="Phòng ban">
                  <Option value="all">Tất cả</Option>
                  <Option value="IT">IT</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Sales">Sales</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} lg={10}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddEmployee}
                  >
                    Thêm nhân viên
                  </Button>
                  <Button icon={<CalendarOutlined />}>Chấm công</Button>
                  <Button icon={<FileTextOutlined />}>Báo cáo</Button>
                </Space>
              </Col>
            </Row>

            {/* Employees Table */}
            <Table
              columns={employeeColumns}
              dataSource={employeesData}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} nhân viên`,
              }}
            />
          </TabPane>

          <TabPane tab="📅 Đơn nghỉ phép" key="leave-requests">
            {/* Leave Requests Table */}
            <Table
              columns={leaveColumns}
              dataSource={leaveRequestsData}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} đơn nghỉ phép`,
              }}
            />
          </TabPane>

          <TabPane tab="📊 Báo cáo" key="reports">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
              <p>Tính năng báo cáo sẽ được phát triển sau</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Employee Modal */}
      <Modal
        title={
          editingEmployee ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" initialValues={editingEmployee}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã nhân viên"
                name="employeeCode"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã nhân viên!' },
                ]}
              >
                <Input placeholder="VD: EMP001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vị trí"
                name="position"
                rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
              >
                <Input placeholder="VD: Senior Developer" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Phòng ban"
                name="department"
                rules={[
                  { required: true, message: 'Vui lòng chọn phòng ban!' },
                ]}
              >
                <Select placeholder="Chọn phòng ban">
                  <Option value="IT">IT</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Loại hợp đồng"
                name="employmentType"
                rules={[
                  { required: true, message: 'Vui lòng chọn loại hợp đồng!' },
                ]}
              >
                <Select placeholder="Chọn loại hợp đồng">
                  <Option value={EEmployeeType.FULL_TIME}>
                    Toàn thời gian
                  </Option>
                  <Option value={EEmployeeType.PART_TIME}>Bán thời gian</Option>
                  <Option value={EEmployeeType.CONTRACT}>Hợp đồng</Option>
                  <Option value={EEmployeeType.TEMPORARY}>Tạm thời</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Giới tính"
                name="gender"
                rules={[
                  { required: true, message: 'Vui lòng chọn giới tính!' },
                ]}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value={EGender.MALE}>Nam</Option>
                  <Option value={EGender.FEMALE}>Nữ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày bắt đầu"
                name="startDate"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Lương cơ bản"
                name="salary"
                rules={[{ required: true, message: 'Vui lòng nhập lương!' }]}
              >
                <Input
                  placeholder="VD: 25000000"
                  addonAfter="VNĐ"
                  type="number"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default HREmployeeManagement;
