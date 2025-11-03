import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  GiftOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  BellOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import logoApp from '@assets/logo-app.svg';
import logoMinimal from '@assets/logo-minimal.svg';
import UserDropdownAuth from '@components/widgets/UserDropdownAuth';
import { ERole } from '@configs/interface.config';
import { checkAuth } from '@libs/localStorage';
import {
  useQueryProfile,
  useQueryUnreadNotification,
  useQueryUnreadMessage,
} from '@queries/hooks/auth';
import { useRefreshOnFocus } from '@src/hooks/useRefreshOnFocus';
import { COLORS } from '@src/styles/theme';
import {
  Badge,
  Button,
  Col,
  ConfigProvider,
  Flex,
  Image,
  Layout,
  Menu,
  MenuProps,
  Row,
} from 'antd';
import { Popover } from 'antd/lib';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

/** Helper tạo item menu */
const getItem = (
  label: React.ReactNode,
  key: React.Key,
  keyName: ERole,
  roles: ERole[],
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem | null => {
  if (roles?.length > 0 && !roles.includes(keyName)) return null;
  return { key, icon, children, label } as MenuItem;
};

interface ILayoutApp {
  children: React.ReactNode;
}

function LayoutApp({ children }: ILayoutApp) {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const location = useLocation();
  const { pathname } = location;

  const accessToken = checkAuth();
  const { data: profile } = useQueryProfile();
  const roleCurrent = useMemo(() => profile?.role || ERole.CUSTOMER, [profile]);

  const { data: unreadNotifications, refetch: refetchNotifications } =
    useQueryUnreadNotification();
  const { data: unreadMessages, refetch: refetchMessages } =
    useQueryUnreadMessage();
  useRefreshOnFocus(refetchNotifications, !!accessToken);
  useRefreshOnFocus(refetchMessages, !!accessToken);

  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeyMenu, setSelectedKeyMenu] = useState<string[]>([
    'dashboard',
  ]);

  useEffect(() => {
    if (!screens.lg && screens.lg != null) setCollapsed(!screens.lg);
  }, [screens.lg, pathname]);

  useEffect(() => {
    const pathSnippets = pathname.split('/').filter((i) => i);
    if (pathSnippets && pathSnippets?.length > 0) {
      setSelectedKeyMenu(pathSnippets);
    } else {
      setSelectedKeyMenu(['dashboard']);
    }
  }, [location]);

  const onSelectMenu = ({ keyPath }: { keyPath: string[] }) => {
    setSelectedKeyMenu(keyPath);
  };

  /** Danh sách menu */
  const menuItems: MenuItem[] = useMemo(
    () => [
      // --- ADMIN ---
      getItem(
        <Link to="/">🛠️ Dashboard Admin</Link>,
        'dashboard',
        roleCurrent,
        [ERole.ADMINISTRATOR],
        <DashboardOutlined />,
      ),
      getItem(
        '⚙️ Quản trị hệ thống',
        'admin',
        roleCurrent,
        [ERole.ADMINISTRATOR],
        <SettingOutlined />,
        [
          getItem(
            <Link to="/admin/users">👥 Quản lý người dùng</Link>,
            'admin/users',
            roleCurrent,
            [ERole.ADMINISTRATOR],
            <UserOutlined />,
          ),
          getItem(
            <Link to="/admin/settings">⚙️ Cài đặt hệ thống</Link>,
            'admin/settings',
            roleCurrent,
            [ERole.ADMINISTRATOR],
            <SettingOutlined />,
          ),
        ],
      ),
      getItem(
        '🛒 eCommerce',
        'ecommerce',
        roleCurrent,
        [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
        <ShoppingCartOutlined />,
        [
          getItem(
            <Link to="/products">📦 Sản phẩm</Link>,
            'products',
            roleCurrent,
            [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
            <ShoppingOutlined />,
          ),
          getItem(
            <Link to="/orders">🛍️ Đơn hàng</Link>,
            'orders',
            roleCurrent,
            [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
            <ShoppingCartOutlined />,
          ),
          getItem(
            <Link to="/customers">👤 Khách hàng</Link>,
            'customers',
            roleCurrent,
            [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
            <UserOutlined />,
          ),
        ],
      ),

      // --- HR ---
      getItem(
        <Link to="/">👥 Dashboard HR</Link>,
        'hr-dashboard',
        roleCurrent,
        [ERole.HUMAN_RESOURCES],
        <DashboardOutlined />,
      ),
      getItem(
        '👥 Quản lý nhân sự',
        'hr',
        roleCurrent,
        [ERole.HUMAN_RESOURCES],
        <UserOutlined />,
        [
          getItem(
            <Link to="/hr/employees">📋 Danh sách nhân viên</Link>,
            'hr/employees',
            roleCurrent,
            [ERole.HUMAN_RESOURCES],
            <UserOutlined />,
          ),
          getItem(
            <Link to="/hr/attendance">⏰ Chấm công</Link>,
            'hr/attendance',
            roleCurrent,
            [ERole.HUMAN_RESOURCES],
            <FileTextOutlined />,
          ),
          getItem(
            <Link to="/hr/leave-requests">📅 Đơn nghỉ phép</Link>,
            'hr/leave-requests',
            roleCurrent,
            [ERole.HUMAN_RESOURCES],
            <FileTextOutlined />,
          ),
        ],
      ),

      // --- EMPLOYEE ---
      getItem(
        <Link to="/profile">👤 Hồ sơ cá nhân</Link>,
        'profile',
        roleCurrent,
        [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE],
        <UserOutlined />,
      ),
      getItem(
        <Link to="/my-tasks">📋 Công việc của tôi</Link>,
        'my-tasks',
        roleCurrent,
        [ERole.EMPLOYEE],
        <FileTextOutlined />,
      ),

      // --- CUSTOMER ---
      getItem(
        <Link to="/">Trang chủ</Link>,
        'home',
        roleCurrent,
        [ERole.CUSTOMER],
        <DashboardOutlined />,
      ),
      getItem(
        <Link to="/shop">Cửa hàng</Link>,
        'shop',
        roleCurrent,
        [ERole.CUSTOMER],
        <ShoppingOutlined />,
      ),
      getItem(
        <Link to="/cart">Giỏ hàng</Link>,
        'cart',
        roleCurrent,
        [ERole.CUSTOMER],
        <ShoppingCartOutlined />,
      ),
      getItem(
        <Link to="/orders/my">Đơn hàng của tôi</Link>,
        'my-orders',
        roleCurrent,
        [ERole.CUSTOMER],
        <FileTextOutlined />,
      ),
      getItem(
        <Link to="/account">Tài khoản của tôi</Link>,
        'account',
        roleCurrent,
        [ERole.CUSTOMER],
        <UserOutlined />,
      ),
    ],
    [roleCurrent],
  );

  return (
    <Layout style={{ minHeight: '100vh', position: 'relative' }}>
      {/* --- HEADER --- */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          zIndex: 1051,
          width: '100%',
          paddingLeft: 24,
          paddingRight: 24,
          backgroundColor: COLORS.white,
          borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        }}
      >
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Flex align="center" gap={16}>
              <Button
                onClick={() => setCollapsed((prev) => !prev)}
                type="text"
                size="small"
              >
                {collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 20 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 20 }} />
                )}
              </Button>
              {screens.lg && (
                <Link to="/">
                  <Image
                    src={logoApp}
                    alt="logo"
                    width={160}
                    preview={false}
                    style={{ marginBottom: 4 }}
                  />
                </Link>
              )}
            </Flex>
          </Col>

          {!screens.lg && (
            <Col>
              <Link to="/">
                <Image
                  src={logoMinimal}
                  alt="logo"
                  width={48}
                  preview={false}
                />
              </Link>
            </Col>
          )}

          <Col>
            <Flex align="center" gap={16}>
              <Popover
                content={<div>Thông báo của bạn</div>}
                trigger="click"
                placement="bottomRight"
              >
                <Button type="text" size="small">
                  <Badge dot={!!unreadNotifications?.count}>
                    <BellOutlined style={{ fontSize: 20 }} />
                  </Badge>
                </Button>
              </Popover>
              <Button
                type="text"
                size="small"
                onClick={() => navigate('/messages')}
              >
                <Badge dot={!!unreadMessages?.count}>
                  <MessageOutlined style={{ fontSize: 20 }} />
                </Badge>
              </Button>
              <UserDropdownAuth />
            </Flex>
          </Col>
        </Row>
      </Header>

      {/* --- SIDEBAR --- */}
      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth={!screens.lg ? 0 : 80}
          width={240}
          collapsed={collapsed}
          theme="light"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            insetInlineStart: 0,
            top: 0,
            bottom: 0,
            paddingTop: 64,
            zIndex: 11,
            borderRight: '1px solid rgba(5,5,5,0.06)',
          }}
        >
          <Menu
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            selectedKeys={selectedKeyMenu}
            onSelect={onSelectMenu}
          />
        </Sider>

        {/* --- CONTENT --- */}
        <Layout
          style={{
            padding: '64px 20px 0',
            marginInlineStart: collapsed
              ? !screens.lg
                ? 0
                : 80
              : screens.lg
              ? 240
              : 0,
            background: COLORS.gray[50],
            transition: 'all 0.25s ease',
          }}
        >
          <Content
            style={{ padding: '24px 0', minHeight: 'calc(100vh - 64px)' }}
          >
            <Row>{children}</Row>
          </Content>
        </Layout>
      </Layout>

      {/* --- OVERLAY (mobile) --- */}
      <div
        onClick={() => setCollapsed(true)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10,
          opacity: !screens.lg && !collapsed ? 1 : 0,
          pointerEvents: !screens.lg && !collapsed ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
    </Layout>
  );
}

export default LayoutApp;
