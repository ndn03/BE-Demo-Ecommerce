import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Popconfirm,
  message,
  Tooltip,
  Switch,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UndoOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import {
  userApi,
  User,
  QueryUserParams,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
} from '@queries/apis/user';
import {
  ERole,
  EEmployeeType,
  EGender,
  EWorkShift,
  EPosition,
} from '@configs/interface.config';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Custom styles for better UI
const customStyles = `
  .custom-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #1890ff !important;
    color: #1890ff !important;
  }
  
  .table-row-light {
    background: #fafafa !important;
  }
  
  .table-row-dark {
    background: white !important;
  }
  
  .custom-table .ant-table-tbody > tr:hover > td {
    background: #e6f7ff !important;
  }
  
  .custom-table .ant-pagination {
    margin-top: 24px !important;
  }
  
  .custom-table .ant-table-pagination.ant-pagination {
    display: flex !important;
    justify-content: center !important;
  }
`;

/**
 * 👥 Admin User Management - Quản lý người dùng cho Administrator
 * Cho phép admin xem, thêm, sửa, xóa và quản lý tất cả người dùng trong hệ thống
 */
const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const loadingRef = useRef(false);

  // Load users data
  const loadUsers = useCallback(async () => {
    if (loadingRef.current) return; // Prevent multiple simultaneous calls

    loadingRef.current = true;
    setLoading(true);
    try {
      const params: QueryUserParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive:
          statusFilter === 'all'
            ? undefined
            : statusFilter === 'active'
            ? 1
            : 0,
      };

      const response = await userApi.getUsers(params);
      setUsers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
      }));
    } catch (error: any) {
      console.error('User API Error:', error);
      if (error.status === 401) {
        message.error('Bạn cần đăng nhập để xem dữ liệu người dùng');
      } else if (error.statusCode === 401) {
        message.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        message.error(
          'Tải danh sách người dùng thất bại: ' +
            (error.message || 'Lỗi không xác định'),
        );
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    roleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    loadUsers();
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    roleFilter,
    statusFilter,
  ]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (type: 'role' | 'status', value: string) => {
    if (type === 'role') {
      setRoleFilter(value);
    } else {
      setStatusFilter(value);
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle create user
  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      ...user.profile,
    });
    setIsModalVisible(true);
  };

  // Handle set password
  const handleSetPassword = (user: User) => {
    // Clear any previous state
    passwordForm.resetFields();
    setEditingUser(user);
    setIsPasswordModalVisible(true);
  };

  // Handle save user
  const handleSaveUser = async (values: any) => {
    try {
      if (editingUser) {
        // Update user
        const updateData: UpdateUserData = {
          email: values.email,
          username: values.username,
          role: values.role,
          isActive: values.isActive,
          fullName: values.fullName,
          phone: values.phone,
          gender: values.gender,
          employeeType: values.employeeType,
          position: values.position,
        };
        await userApi.updateUser(editingUser.id, updateData);
        message.success('Cập nhật người dùng thành công!');
      } else {
        // Create user
        console.log('📝 Form values received:', values);
        const createData: CreateUserData = {
          email: values.email,
          username: values.username,
          password: values.password,
          confirmPassword: values.confirmPassword,
          role: values.role,
          fullName: values.fullName || values.username, // Required field
          registrationType: 'ACCOUNT_ISSUED', // Default value
          workShift: values.workShift || EWorkShift.MORNING, // Default value
          employmentType: values.employmentType || EEmployeeType.FULL_TIME, // Default value
          position: values.position || EPosition.INTERN, // Default value
          isActive: 1, // Active by default
          phone: values.phone,
          gender: values.gender || EGender.MALE, // Default value
        };
        await userApi.createUser(createData);
        message.success('Tạo người dùng thành công!');
      }
      setIsModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error('Lưu người dùng thất bại: ' + error.message);
    }
  };

  // Handle set password
  const handleSetPasswordSubmit = async (values: ChangePasswordData) => {
    if (!editingUser) return;

    try {
      // Admin set password - add currentPassword (can be empty for admin)
      const passwordData = {
        currentPassword: 'admin', // Some backend may require this field
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      };

      console.log(
        '🔐 Setting password for user:',
        editingUser.id,
        passwordData,
      );
      await userApi.setPassword(editingUser.id, passwordData);
      message.success('Đặt mật khẩu thành công!');

      // Clear form and close modal
      passwordForm.resetFields();
      setIsPasswordModalVisible(false);
      setEditingUser(null); // Clear editing user to prevent state issues

      // Optionally reload users to reflect any changes
      // await loadUsers();
    } catch (error: any) {
      console.error('❌ Set password error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Unknown error';
      message.error('Đặt mật khẩu thất bại: ' + errorMessage);
    }
  };

  // Handle soft delete user
  const handleDeleteUser = async (userId: number) => {
    try {
      await userApi.softDeleteUser(userId);
      message.success('Xóa người dùng thành công!');
      loadUsers();
    } catch (error: any) {
      message.error('Xóa người dùng thất bại: ' + error.message);
    }
  };

  // Handle restore user
  const handleRestoreUser = async (userId: number) => {
    try {
      await userApi.restoreUser(userId);
      message.success('Khôi phục người dùng thành công!');
      loadUsers();
    } catch (error: any) {
      message.error('Khôi phục người dùng thất bại: ' + error.message);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (userId: number) => {
    try {
      await userApi.deleteUser(userId);
      message.success('Xóa vĩnh viễn người dùng thành công!');
      loadUsers();
    } catch (error: any) {
      message.error('Xóa vĩnh viễn người dùng thất bại: ' + error.message);
    }
  };

  const columns = [
    {
      title: '👤 Thông tin người dùng',
      dataIndex: 'username',
      key: 'username',
      width: 280,
      render: (username: string, record: User) => (
        <Space size="middle">
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              background: record.isActive
                ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
                : 'linear-gradient(135deg, #ff7875 0%, #f5222d 100%)',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#1890ff',
                marginBottom: 2,
              }}
            >
              {record.profile?.fullName || username}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#666',
                fontFamily: 'monospace',
              }}
            >
              📧 {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username_field',
      width: 120,
      render: (username: string) => (
        <code
          style={{
            background: '#f0f2f5',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            color: '#1890ff',
            fontWeight: 500,
          }}
        >
          {username}
        </code>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      align: 'center' as const,
      render: (role: string) => {
        const roleConfig: Record<
          string,
          { color: string; text: string; gradient: string }
        > = {
          [ERole.ADMINISTRATOR]: {
            color: 'red',
            text: 'Admin',
            gradient: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
          },
          [ERole.HUMAN_RESOURCES]: {
            color: 'purple',
            text: 'HR',
            gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
          },
          [ERole.EMPLOYEE]: {
            color: 'blue',
            text: 'Nhân viên',
            gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          },
          [ERole.CUSTOMER]: {
            color: 'green',
            text: 'Khách hàng',
            gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          },
        };
        const config = roleConfig[role] || {
          color: 'default',
          text: role,
          gradient: 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
        };
        return (
          <div
            style={{
              background: config.gradient,
              color: 'white',
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              display: 'inline-block',
              minWidth: 90,
            }}
          >
            {config.text}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (isActive: number, record: User) => {
        if (record.deletedAt) {
          return (
            <div
              style={{
                background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              🗑️ Đã xóa
            </div>
          );
        }

        return (
          <div
            style={{
              background: isActive
                ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                : 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {isActive ? 'Hoạt động' : 'Tạm khóa'}
          </div>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      align: 'center' as const,
      render: (date: string) => (
        <div style={{ fontSize: 12 }}>
          <div
            style={{
              color: '#1890ff',
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {new Date(date).toLocaleDateString('vi-VN')}
          </div>
          <div
            style={{
              color: '#666',
              fontSize: 11,
            }}
          >
            {' '}
            {new Date(date).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'center' as const,
      width: 150,
      fixed: 'right' as const,
      render: (record: User) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa thông tin">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              style={{
                borderRadius: 6,
                background: '#1890ff',
                borderColor: '#1890ff',
                boxShadow: '0 2px 4px rgba(24,144,255,0.3)',
              }}
            />
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="default"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleSetPassword(record)}
              style={{
                borderRadius: 6,
                borderColor: '#faad14',
                color: '#faad14',
                background: 'rgba(250,173,20,0.1)',
              }}
            />
          </Tooltip>

          {record.deletedAt ? (
            <Tooltip title="Khôi phục người dùng">
              <Popconfirm
                title="🔄 Khôi phục người dùng này?"
                description="Người dùng sẽ được kích hoạt lại và có thể đăng nhập."
                onConfirm={() => handleRestoreUser(record.id)}
                okText="✅ Khôi phục"
                cancelText="❌ Hủy"
                okButtonProps={{
                  style: {
                    background: '#52c41a',
                    borderColor: '#52c41a',
                  },
                }}
              >
                <Button
                  type="default"
                  size="small"
                  icon={<UndoOutlined />}
                  style={{
                    borderRadius: 6,
                    borderColor: '#52c41a',
                    color: '#52c41a',
                    background: 'rgba(82,196,26,0.1)',
                  }}
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="Xóa tạm thời">
              <Popconfirm
                title="🗑️ Xóa tạm thời người dùng này?"
                description="Người dùng sẽ không thể đăng nhập nhưng dữ liệu vẫn được lưu trữ."
                onConfirm={() => handleDeleteUser(record.id)}
                okText="🗑️ Xóa"
                cancelText="❌ Hủy"
                okButtonProps={{
                  danger: true,
                  style: {
                    background: '#ff4d4f',
                    borderColor: '#ff4d4f',
                  },
                }}
              >
                <Button
                  type="default"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    borderRadius: 6,
                    borderColor: '#ff4d4f',
                    color: '#ff4d4f',
                    background: 'rgba(255,77,79,0.1)',
                  }}
                />
              </Popconfirm>
            </Tooltip>
          )}

          <Tooltip title="Xóa vĩnh viễn">
            <Popconfirm
              title="Xóa vĩnh viễn người dùng này? Hành động này không thể hoàn tác!"
              onConfirm={() => handlePermanentDelete(record.id)}
              okText="Xóa vĩnh viễn"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive === 1).length,
    inactive: users.filter((u) => u.isActive === 0).length,
    deleted: users.filter((u) => u.deletedAt).length,
  };

  return (
    <div
      style={{
        padding: 24,
        background: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Page Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: '24px 32px',
          marginBottom: 24,
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Title
          level={2}
          style={{
            color: 'white',
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          👥 Quản lý Người dùng
        </Title>
        <p
          style={{
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
            marginTop: 8,
            fontSize: 16,
          }}
        >
          Quản lý tất cả người dùng trong hệ thống
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                  Tổng người dùng
                </span>
              }
              value={pagination.total}
              valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              prefix={<UserOutlined style={{ color: 'white', fontSize: 20 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              color: 'white',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                  Đang hoạt động
                </span>
              }
              value={stats.active}
              valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              prefix={<UserOutlined style={{ color: 'white', fontSize: 20 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #ff7875 0%, #f5222d 100%)',
              color: 'white',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                  Tạm khóa
                </span>
              }
              value={stats.inactive}
              valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              prefix={<UserOutlined style={{ color: 'white', fontSize: 20 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
              color: 'white',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                  Đã xóa
                </span>
              }
              value={stats.deleted}
              valueStyle={{ color: 'white', fontSize: 28, fontWeight: 600 }}
              prefix={
                <DeleteOutlined style={{ color: 'white', fontSize: 20 }} />
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        {/* Filters and Actions Header */}
        <div
          style={{
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            🔍 Tìm kiếm và Lọc
          </Title>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#666',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Tìm kiếm
              </span>
            </div>
            <Search
              placeholder="Nhập tên, email hoặc username..."
              onSearch={handleSearch}
              style={{ width: '100%' }}
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#666',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Vai trò
              </span>
            </div>
            <Select
              value={roleFilter}
              onChange={(value) => handleFilterChange('role', value)}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="all">🎯 Tất cả vai trò</Option>
              <Option value={ERole.ADMINISTRATOR}>Administrator</Option>
              <Option value={ERole.HUMAN_RESOURCES}> HR</Option>
              <Option value={ERole.EMPLOYEE}>Employee</Option>
              <Option value={ERole.CUSTOMER}>Customer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#666',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Trạng thái
              </span>
            </div>
            <Select
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm khóa</Option>
            </Select>
          </Col>
          <Col xs={24} lg={8}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'end',
                height: '100%',
                paddingTop: 28,
              }}
            >
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateUser}
                  size="large"
                  style={{
                    background:
                      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(24,144,255,0.3)',
                  }}
                >
                  Thêm người dùng
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadUsers}
                  size="large"
                  style={{
                    borderRadius: 8,
                    fontWeight: 500,
                  }}
                >
                  Làm mới
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Table Header */}
        <div
          style={{
            marginBottom: 16,
            paddingTop: 24,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            📋 Danh sách Người dùng
          </Title>
          <p
            style={{
              color: '#666',
              margin: '4px 0 0 0',
              fontSize: 14,
            }}
          >
            Hiển thị {users.length} / {pagination.total} người dùng
          </p>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          className="custom-table"
          style={{
            background: 'white',
            borderRadius: 8,
            overflow: 'hidden',
          }}
          rowClassName={(record, index) =>
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
            },
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 18,
              fontWeight: 600,
              color: '#1890ff',
            }}
          >
            {editingUser ? (
              <>
                <EditOutlined style={{ color: '#1890ff' }} />
                Chỉnh sửa thông tin người dùng
              </>
            ) : (
              <>
                <PlusOutlined style={{ color: '#52c41a' }} />
                Thêm người dùng mới
              </>
            )}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
        centered
        style={{
          top: 20,
        }}
        styles={{
          body: {
            padding: '24px 32px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
          size="large"
        >
          {/* Thông tin cơ bản */}
          <div
            style={{
              marginBottom: 24,
              padding: '16px 20px',
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e9ecef',
            }}
          >
            <Title
              level={5}
              style={{
                margin: '0 0 16px 0',
                color: '#1890ff',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              📧 Thông tin đăng nhập
            </Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label={<span style={{ fontWeight: 500 }}>Email</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' },
                  ]}
                >
                  <Input
                    placeholder="Nhập email người dùng"
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="username"
                  label={<span style={{ fontWeight: 500 }}>Tên đăng nhập</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập username!' },
                  ]}
                >
                  <Input
                    placeholder="Nhập tên đăng nhập"
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {!editingUser && (
            <div
              style={{
                marginBottom: 24,
                padding: '16px 20px',
                background: '#fff7e6',
                borderRadius: 8,
                border: '1px solid #ffd591',
              }}
            >
              <Title
                level={5}
                style={{
                  margin: '0 0 16px 0',
                  color: '#fa8c16',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                🔐 Mật khẩu đăng nhập
              </Title>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                    ]}
                  >
                    <Input.Password
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="confirmPassword"
                    label={
                      <span style={{ fontWeight: 500 }}>Xác nhận mật khẩu</span>
                    }
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng xác nhận mật khẩu!',
                      },
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
                      prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* Vai trò và Trạng thái */}
          <div
            style={{
              marginBottom: 24,
              padding: '16px 20px',
              background: '#f0f9ff',
              borderRadius: 8,
              border: '1px solid #bae7ff',
            }}
          >
            <Title
              level={5}
              style={{
                margin: '0 0 16px 0',
                color: '#1890ff',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              👤 Vai trò và Quyền hạn
            </Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="role"
                  label={<span style={{ fontWeight: 500 }}>Vai trò</span>}
                  rules={[
                    { required: true, message: 'Vui lòng chọn vai trò!' },
                  ]}
                >
                  <Select placeholder="Chọn vai trò người dùng" size="large">
                    <Option value={ERole.ADMINISTRATOR}>
                      👑 Administrator
                    </Option>
                    <Option value={ERole.HUMAN_RESOURCES}>
                      👥 Human Resources
                    </Option>
                    <Option value={ERole.EMPLOYEE}>Employee</Option>
                    <Option value={ERole.CUSTOMER}>Customer</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="isActive"
                  label={
                    <span style={{ fontWeight: 500 }}>
                      Trạng thái tài khoản
                    </span>
                  }
                  initialValue={1}
                >
                  <Select size="large">
                    <Option value={1}>Hoạt động</Option>
                    <Option value={0}>Tạm khóa</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Thông tin cá nhân */}
          <div
            style={{
              marginBottom: 24,
              padding: '16px 20px',
              background: '#f6ffed',
              borderRadius: 8,
              border: '1px solid #b7eb8f',
            }}
          >
            <Title
              level={5}
              style={{
                margin: '0 0 16px 0',
                color: '#52c41a',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              📝 Thông tin cá nhân
            </Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label={
                    <span style={{ fontWeight: 500 }}>
                      Họ và tên đầy đủ <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: 'Vui lòng nhập họ và tên đầy đủ!',
                    },
                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                  ]}
                >
                  <Input
                    placeholder="Nhập họ và tên đầy đủ"
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    prefix={<span style={{ color: '#bfbfbf' }}>📱</span>}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="gender"
                  label={<span style={{ fontWeight: 500 }}>Giới tính</span>}
                  initialValue={EGender.MALE}
                >
                  <Select placeholder="Chọn giới tính" size="large">
                    <Option value={EGender.MALE}>👨 Nam</Option>
                    <Option value={EGender.FEMALE}>👩 Nữ</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="employmentType"
                  label={<span style={{ fontWeight: 500 }}>Loại hợp đồng</span>}
                  rules={[
                    { required: true, message: 'Vui lòng chọn loại hợp đồng!' },
                  ]}
                  initialValue={EEmployeeType.FULL_TIME}
                >
                  <Select placeholder="Chọn loại hợp đồng" size="large">
                    <Option value={EEmployeeType.FULL_TIME}>
                      🕐 Toàn thời gian
                    </Option>
                    <Option value={EEmployeeType.PART_TIME}>
                      ⏰ Bán thời gian
                    </Option>
                    <Option value={EEmployeeType.TEMPORARY}>⚡ Tạm thời</Option>
                    <Option value={EEmployeeType.CONTRACT}>📋 Hợp đồng</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="position"
                  label={
                    <span style={{ fontWeight: 500 }}>Vị trí công việc</span>
                  }
                  initialValue={EPosition.INTERN}
                >
                  <Select placeholder="Chọn vị trí công việc" size="large">
                    <Option value={EPosition.INTERN}>🎓 Thực tập sinh</Option>
                    <Option value={EPosition.JUNIOR}>� Junior</Option>
                    <Option value={EPosition.SENIOR}>👨‍💼 Senior</Option>
                    <Option value={EPosition.TEAM_LEAD}>👑 Team Lead</Option>
                    <Option value={EPosition.MANAGER}>� Manager</Option>
                    <Option value={EPosition.DIRECTOR}>🎯 Director</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="workShift"
                  label={<span style={{ fontWeight: 500 }}>Ca làm việc</span>}
                  rules={[
                    { required: true, message: 'Vui lòng chọn ca làm việc!' },
                  ]}
                  initialValue={EWorkShift.MORNING}
                >
                  <Select placeholder="Chọn ca làm việc" size="large">
                    <Option value={EWorkShift.MORNING}>🌅 Ca sáng</Option>
                    <Option value={EWorkShift.AFTERNOON}>☀️ Ca chiều</Option>
                    <Option value={EWorkShift.EVENING}>🌆 Ca tối</Option>
                    <Option value={EWorkShift.NIGHT}>🌙 Ca đêm</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              marginTop: 32,
              padding: '20px 0',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <Button
              onClick={() => setIsModalVisible(false)}
              size="large"
              style={{
                minWidth: 100,
                borderRadius: 8,
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{
                minWidth: 120,
                background: editingUser
                  ? 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)'
                  : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 500,
                boxShadow: editingUser
                  ? '0 2px 8px rgba(250,140,22,0.3)'
                  : '0 2px 8px rgba(82,196,26,0.3)',
              }}
            >
              {editingUser ? '💾 Cập nhật' : '✨ Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Set Password Modal */}
      <Modal
        title="Đặt mật khẩu"
        open={isPasswordModalVisible}
        onCancel={() => {
          passwordForm.resetFields();
          setEditingUser(null);
          setIsPasswordModalVisible(false);
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleSetPasswordSubmit}
        >
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password placeholder="Mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu xác nhận không khớp!'),
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Đặt mật khẩu
              </Button>
              <Button onClick={() => setIsPasswordModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
