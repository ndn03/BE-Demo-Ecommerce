import { LoginOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Flex, Row, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useMutationSignOut, useQueryProfile } from '@queries/hooks';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { ERole } from '@src/configs/interface.config';

const { Text } = Typography;

function UserDropdownAuth() {
  const screens = useBreakpoint();
  const { mutate } = useMutationSignOut();
  const { data: user, isLoading } = useQueryProfile();

  const onLogout = (e: any) => {
    e.preventDefault();
    mutate();
  };

  const items: MenuProps['items'] = useMemo(() => {
    const role = user?.role || ERole.EMPLOYEE;
    const menuItemMyProfile = {
      key: '1',
      label: (
        <Link to="/my-profile">
          <Space size={10} align="center">
            <UserOutlined />
            <Text>{user?.profile?.fullName || user?.email}</Text>
          </Space>
        </Link>
      ),
    };
    const MenuItemLogout = {
      key: '3',
      label: (
        <Link to="/logout" onClick={onLogout}>
          <Space size={10} align="center">
            <LoginOutlined />
            <Text>Đăng xuất</Text>
          </Space>
        </Link>
      ),
    };

    if (role === ERole.ADMINISTRATOR) return [MenuItemLogout];
    return [menuItemMyProfile, MenuItemLogout];
  }, [user]);
  return (
    <Row>
      {user && !isLoading && (
        <Dropdown menu={{ items }} placement="topRight">
          <Space align="center">
            {screens.lg && (
              <Text style={{ fontSize: 16 }}>
                {user?.profile?.fullName || user?.email}
              </Text>
            )}
            <Flex align="center" justify="center">
              <Avatar size={screens.lg ? 36 : 32} icon={<UserOutlined />} />
            </Flex>
          </Space>
        </Dropdown>
      )}
    </Row>
  );
}

export default UserDropdownAuth;
