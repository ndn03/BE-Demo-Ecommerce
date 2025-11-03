/* eslint-disable react/function-component-definition */
import { ReloadOutlined } from '@ant-design/icons';
import { customizeRequiredMark } from '@src/libs/antd';
import { TUser, TUserSetPassword } from '@src/modules';
import { generateRandomPassword } from '@src/utils/helper';
import { regexAlphaNumSpecial } from '@src/utils/regex';
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Typography,
} from 'antd';
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react';

type TSetPasswordModal = {
  userUpdatePassword?: TUser;
  isLoading?: boolean;
  onSave?: (frmData: TUserSetPassword) => void;
  onCancel?: () => void;
};

export type TSetPasswordModalHandle = {
  onOpen: (x: boolean) => void;
  onReset: () => void;
};

const SetPasswordModal: ForwardRefRenderFunction<
  TSetPasswordModalHandle,
  TSetPasswordModal
> = ({ isLoading, onSave, onCancel, userUpdatePassword }, ref) => {
  const [form] = Form.useForm<TUserSetPassword>();
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    onOpen: (x) => setIsOpen(x),
    onReset: () => form.resetFields(),
  }));

  const generatePassword = () => {
    const password = generateRandomPassword(8, true, true);
    form.setFieldsValue({ newPassword: password, confirmPassword: password });
  };

  const handleCancel = () => {
    if (!isLoading) {
      setIsOpen(false);
      form.resetFields();
      if (onCancel) onCancel();
    }
  };

  const onFinish = (frmValue: TUserSetPassword) => {
    if (onSave) onSave(frmValue);
  };
  return (
    <Modal
      open={isOpen}
      maskClosable={false}
      onCancel={handleCancel}
      footer={
        <Row gutter={16}>
          <Col span={12}>
            <Button block onClick={handleCancel} disabled={isLoading}>
              Hủy bỏ
            </Button>
          </Col>
          <Col span={12}>
            <Button
              block
              type="primary"
              loading={isLoading}
              onClick={() => form.submit()}
              disabled={isLoading}
            >
              Cập nhật
            </Button>
          </Col>
        </Row>
      }
    >
      <Row gutter={[32, 32]}>
        <Col span={24}>
          <Flex vertical gap={8} justify="center" align="center">
            <Typography.Title level={4}>Đặt lại mật khẩu</Typography.Title>
            <Typography.Text style={{ textAlign: 'center' }}>
              Vui lòng đặt lại mật khẩu cho nhân viên{' '}
              {userUpdatePassword?.profile.fullName} (Mã NV:{' '}
              {userUpdatePassword?.profile.employeeCode}).
            </Typography.Text>
          </Flex>
        </Col>
        <Col span={24}>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            onFinish={onFinish}
            requiredMark={customizeRequiredMark}
          >
            <Form.Item label="Mật khẩu mới" required>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  noStyle
                  name="newPassword"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                    { max: 20, message: 'Mật khẩu không được quá 20 ký tự' },
                    {
                      pattern: regexAlphaNumSpecial,
                      message:
                        'Mật khẩu chỉ được chứa chữ cái, số hoặc ký tự đặc biệt',
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="Vui lòng nhập"
                    allowClear
                    type="password"
                    maxLength={20}
                    onPressEnter={() =>
                      form.getFieldInstance('confirmPassword').focus()
                    }
                  />
                </Form.Item>
                <Button
                  onClick={generatePassword}
                  type="default"
                  icon={<ReloadOutlined style={{ fontSize: 20 }} />}
                />
              </Space.Compact>
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Mật khẩu mới và mật khẩu xác nhận không khớp'),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Vui lòng nhập"
                allowClear
                type="password"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};

export default forwardRef(SetPasswordModal);
