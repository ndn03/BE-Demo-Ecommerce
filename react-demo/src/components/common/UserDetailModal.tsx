/**
 * 👤 **User Detail Modal**
 *
 * Modal component for viewing and editing user details
 */

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Avatar,
  Upload,
  message,
  Divider,
  Space,
  Tag,
  Typography,
  Card,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { TUser } from '@modules/user';
import { SmartImage } from './index';

// Simple format date function
const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

// Define UpdateUserDto type based on TUser
type UpdateUserDto = Partial<Pick<TUser, 'role' | 'isActive'>> & {
  fullName?: string;
  subName?: string;
  phone?: string;
  fullAddress?: string;
  birthDay?: string;
  workShift?: string;
  position?: string;
  employmentType?: string;
  gender?: string;
};

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface UserDetailModalProps {
  open: boolean;
  user: TUser | null;
  onClose: () => void;
  onUpdate: (userId: number, userData: UpdateUserDto) => Promise<void>;
  loading?: boolean;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  user,
  onClose,
  onUpdate,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user && open) {
      // Populate form with user data
      form.setFieldsValue({
        email: user.email,
        role: user.role,
        status: user.isActive,
        fullName: user.profile?.fullName || '',
        employeeCode: user.profile?.employeeCode || '',
        position: user.profile?.position || '',
        employmentType: user.profile?.employmentType || '',
        gender: user.profile?.gender || '',
        birthDay: user.profile?.birthDay ? dayjs(user.profile.birthDay) : null,
        baseSalary: user.profile?.baseSalary || 0,
        organization: user.profile?.organization || '',
        subsidiaryName: user.profile?.subsidiaryName || '',
      });
      setEditMode(false);
    }
  }, [user, open, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!user) return;

      // Format data according to BE DTO
      const updateData = {
        role: values.role,
        isActive: Number(values.status), // Ensure it's a number
        fullName: values.fullName,
        ...(values.employeeCode && { employeeCode: values.employeeCode }),
        ...(values.organization && { organization: values.organization }),
        ...(values.birthDay && { birthDay: values.birthDay.toISOString() }),
        ...(values.position && { position: values.position }),
        ...(values.employmentType && { employmentType: values.employmentType }),
        ...(values.gender && { gender: values.gender }),
        ...(values.baseSalary && { baseSalary: Number(values.baseSalary) }),
        ...(values.subsidiaryName && { subsidiaryName: values.subsidiaryName }),
      };

      console.log('Form values:', values);
      console.log('Updating user with data:', updateData);
      console.log('User ID:', user.id);

      await onUpdate(user.id, updateData);
      setEditMode(false);
      message.success('Cập nhật thông tin người dùng thành công!');
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin!');
    }
  };

  const handleUpload = async (file: any) => {
    setUploading(true);
    try {
      // TODO: Implement actual upload to Uploadcare
      // For now, just simulate upload
      setTimeout(() => {
        form.setFieldsValue({ avatar: 'mock-uploaded-file-id' });
        setUploading(false);
        message.success('Tải ảnh lên thành công!');
      }, 2000);

      return false; // Prevent default upload
    } catch (error) {
      setUploading(false);
      message.error('Tải ảnh lên thất bại!');
      return false;
    }
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMINISTRATOR: 'Quản trị viên',
      HUMAN_RESOURCES: 'Nhân sự',
      EMPLOYEE: 'Nhân viên',
      CUSTOMER: 'Khách hàng',
      CUSTOMER_VIP1: 'Khách hàng VIP 1',
      CUSTOMER_VIP2: 'Khách hàng VIP 2',
      CUSTOMER_VIP3: 'Khách hàng VIP 3',
      // Legacy support
      administrator: 'Quản trị viên',
      manager: 'Quản lý',
      staff: 'Nhân viên',
      user: 'Người dùng',
    };
    return roleMap[role] || role;
  };

  const getStatusColor = (status: string | number) => {
    // Handle both string status and numeric isActive
    if (typeof status === 'number') {
      return status === 1 ? 'green' : 'red';
    }
    const statusMap: Record<string, string> = {
      active: 'green',
      inactive: 'red',
      pending: 'orange',
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string | number) => {
    // Handle both string status and numeric isActive
    if (typeof status === 'number') {
      return status === 1 ? 'Hoạt động' : 'Ngưng hoạt động';
    }
    const statusMap: Record<string, string> = {
      active: 'Hoạt động',
      inactive: 'Ngưng hoạt động',
      pending: 'Chờ xử lý',
    };
    return statusMap[status] || status;
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          {editMode ? 'Chỉnh sửa thông tin người dùng' : 'Chi tiết người dùng'}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        editMode ? (
          <Space>
            <Button onClick={() => setEditMode(false)}>Hủy</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
            >
              Lưu thay đổi
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
            >
              Chỉnh sửa
            </Button>
          </Space>
        )
      }
    >
      <Form form={form} layout="vertical">
        "
        <Row gutter={24}>
          {/* Avatar Section */}
          <Col span={24}>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col flex="none">
                  <SmartImage
                    fileId={(user.profile as any)?.avatar}
                    isAvatar={true}
                    avatarSize={80}
                    fallbackType="avatar"
                    alt={user.email}
                  />
                </Col>
                <Col flex="auto">
                  <Space direction="vertical" size="small">
                    <Title level={4} style={{ margin: 0 }}>
                      {user.profile?.fullName || user.email}
                    </Title>
                    <Space>
                      <Tag color={getStatusColor(user.isActive)}>
                        {getStatusText(user.isActive)}
                      </Tag>
                      <Tag color="blue">{getRoleText(user.role)}</Tag>
                    </Space>
                    <Text type="secondary">
                      Tham gia: {formatDate(user.createdAt)}
                    </Text>
                  </Space>
                </Col>
                {editMode && (
                  <Col flex="none">
                    <Upload
                      showUploadList={false}
                      beforeUpload={handleUpload}
                      accept="image/*"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading}
                        size="small"
                      >
                        Đổi ảnh
                      </Button>
                    </Upload>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>

          {/* Basic Information */}
          <Col span={12}>
            <Form.Item label="ID Người dùng" name="id">
              <Input prefix={<UserOutlined />} disabled value={user?.id} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input prefix={<MailOutlined />} disabled={!editMode} />
            </Form.Item>
          </Col>

          {/* Personal Information */}
          <Col span={12}>
            <Form.Item
              label="Họ tên"
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input placeholder="Nhập họ tên đầy đủ" disabled={!editMode} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mã nhân viên" name="employeeCode">
              <Input
                prefix={<IdcardOutlined />}
                placeholder="Nhập mã nhân viên"
                disabled={!editMode}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Tổ chức" name="organization">
              <Input placeholder="Nhập tên tổ chức" disabled={!editMode} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Lương cơ bản" name="baseSalary">
              <Input
                type="number"
                placeholder="Nhập lương cơ bản"
                disabled={!editMode}
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          {/* Role and Status */}
          <Col span={12}>
            <Form.Item
              label="Vai trò"
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
            >
              <Select placeholder="Chọn vai trò" disabled={!editMode}>
                <Option value="ADMINISTRATOR">Quản trị viên</Option>
                <Option value="HUMAN_RESOURCES">Nhân sự</Option>
                <Option value="EMPLOYEE">Nhân viên</Option>
                <Option value="CUSTOMER">Khách hàng</Option>
                <Option value="CUSTOMER_VIP1">Khách hàng VIP 1</Option>
                <Option value="CUSTOMER_VIP2">Khách hàng VIP 2</Option>
                <Option value="CUSTOMER_VIP3">Khách hàng VIP 3</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
            >
              <Select placeholder="Chọn trạng thái" disabled={!editMode}>
                <Option value={1}>Hoạt động</Option>
                <Option value={0}>Ngưng hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Additional Info */}
          <Col span={24}>
            <Form.Item label="Công ty con" name="subsidiaryName">
              <Input placeholder="Nhập tên công ty con" disabled={!editMode} />
            </Form.Item>
          </Col>

          {/* Additional Profile Information */}
          <Col span={24}>
            <Divider orientation="left">Thông tin bổ sung</Divider>
          </Col>

          <Col span={12}>
            <Form.Item label="Ngày sinh" name="birthDay">
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Chọn ngày sinh"
                disabled={!editMode}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giới tính" name="gender">
              <Select placeholder="Chọn giới tính" disabled={!editMode}>
                <Option value="MALE">Nam</Option>
                <Option value="FEMALE">Nữ</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Vị trí công việc" name="position">
              <Select placeholder="Chọn vị trí" disabled={!editMode}>
                <Option value="INTERN">Thực tập sinh</Option>
                <Option value="STAFF">Nhân viên</Option>
                <Option value="ENGINEER">Kỹ sư</Option>
                <Option value="TEAM_LEAD">Trưởng nhóm</Option>
                <Option value="MANAGER">Trưởng phòng</Option>
                <Option value="DIRECTOR">Giám đốc</Option>
                <Option value="ACCOUNTANT">Kế toán</Option>
                <Option value="HR">Nhân sự</Option>
                <Option value="SALE">Bán hàng</Option>
                <Option value="CUSTOMER_SERVICE">Chăm sóc khách hàng</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Loại nhân viên" name="employmentType">
              <Select placeholder="Chọn loại nhân viên" disabled={!editMode}>
                <Option value="FULL_TIME">Toàn thời gian</Option>
                <Option value="PART_TIME">Bán thời gian</Option>
                <Option value="CONTRACT">Hợp đồng</Option>
                <Option value="TEMPORARY">Tạm thời</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserDetailModal;
