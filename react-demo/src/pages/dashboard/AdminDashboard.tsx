import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Avatar,
  Typography,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Progress,
  List,
  message,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  SettingOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  RiseOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  UsergroupAddOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  TagOutlined,
  GiftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userApi, User } from '../../services/user.service';
import { brandApi, Brand } from '../../services/brand.service';
import { categoryApi, Category } from '../../services/category.service';
import {
  orderApi,
  productApi,
  Order,
  Product,
} from '../../services/order.service';
import {
  formatDate,
  CurrencyFormatter,
  DateHelper,
  ORDER_STATUS_COLORS,
  ORDER_STATUS,
} from '../../utils';
import './DashboardPage.less';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data
const recentOrders = [
  {
    key: '1',
    id: '#ORD-001',
    customer: 'Nguyễn Văn A',
    product: 'iPhone 15 Pro',
    amount: '25,990,000₫',
    status: 'pending',
    created_at: '2025-10-22T10:30:00.000Z',
  },
  {
    key: '2',
    id: '#ORD-002',
    customer: 'Trần Thị B',
    product: 'MacBook Air M2',
    amount: '28,990,000₫',
    status: 'completed',
    created_at: '2025-10-22T14:15:00.000Z',
  },
  {
    key: '3',
    id: '#ORD-003',
    customer: 'Lê Văn C',
    product: 'iPad Pro',
    amount: '22,990,000₫',
    status: 'shipping',
    created_at: '2025-10-21T09:45:00.000Z',
  },
  {
    key: '4',
    id: '#ORD-004',
    customer: 'Phạm Thị D',
    product: 'AirPods Pro',
    amount: '6,290,000₫',
    status: 'completed',
    created_at: '2025-10-21T16:20:00.000Z',
  },
];

const topProducts = [
  {
    key: '1',
    name: 'iPhone 15 Pro',
    category: 'Điện thoại',
    sold: 145,
    revenue: '3,763,550,000₫',
    stock: 23,
    trend: 'up',
  },
  {
    key: '2',
    name: 'MacBook Air M2',
    category: 'Laptop',
    sold: 89,
    revenue: '2,580,110,000₫',
    stock: 12,
    trend: 'up',
  },
  {
    key: '3',
    name: 'iPad Pro 12.9"',
    category: 'Tablet',
    sold: 67,
    revenue: '1,540,330,000₫',
    stock: 8,
    trend: 'down',
  },
  {
    key: '4',
    name: 'AirPods Pro',
    category: 'Phụ kiện',
    sold: 234,
    revenue: '1,471,860,000₫',
    stock: 45,
    trend: 'up',
  },
];

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // State cho dữ liệu thống kê
  const [stats, setStats] = useState({
    orders: {
      total: 0,
      pending: 0,
      delivered: 0,
      totalRevenue: 0,
      thisMonthRevenue: 0,
    },
    products: { total: 0, active: 0, outOfStock: 0 },
    users: { total: 0, active: 0, newThisMonth: 0 },
    brands: { total: 0, active: 0 },
    categories: { total: 0, active: 0 },
  });

  // State cho dữ liệu bảng
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // State cho pagination và filter
  const [pagination, setPagination] = useState({
    orders: { current: 1, pageSize: 10, total: 0 },
    products: { current: 1, pageSize: 10, total: 0 },
    users: { current: 1, pageSize: 10, total: 0 },
    brands: { current: 1, pageSize: 10, total: 0 },
    categories: { current: 1, pageSize: 10, total: 0 },
  });

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load dữ liệu theo tab được chọn
  useEffect(() => {
    switch (selectedMenuItem) {
      case 'orders':
        loadOrders();
        break;
      case 'products':
        loadProducts();
        break;
      case 'customers':
        loadUsers();
        break;
      case 'brands':
        loadBrands();
        break;
      case 'categories':
        loadCategories();
        break;
    }
  }, [selectedMenuItem]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load thống kê từ các API
      const [orderStats, productStats, userStats, brandStats, categoryStats] =
        await Promise.all([
          orderApi.getOrderStats(),
          productApi.getProductStats(),
          userApi.getUserStats(),
          brandApi.getBrandStats(),
          categoryApi.getCategoryStats(),
        ]);

      setStats({
        orders: orderStats,
        products: productStats,
        users: userStats,
        brands: brandStats,
        categories: categoryStats,
      });

      // Load một số đơn hàng gần đây cho dashboard
      const recentOrdersData = await orderApi.getOrders({ limit: 5 });
      setOrders(recentOrdersData.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (page = 1, pageSize = 10, filters = {}) => {
    try {
      setLoading(true);
      console.log('Loading orders - start');

      const result = await orderApi.getOrders({
        page,
        limit: pageSize,
        ...filters,
      });

      console.log('Orders loaded successfully:', result);
      setOrders(result.data);
      setPagination((prev) => ({
        ...prev,
        orders: {
          current: page,
          pageSize,
          total: result.total,
        },
      }));
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('Không thể tải danh sách đơn hàng');
      // Set empty data to prevent further errors
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (page = 1, pageSize = 10, filters = {}) => {
    try {
      setLoading(true);
      const result = await productApi.getProducts({
        page,
        limit: pageSize,
        ...filters,
      });

      setProducts(result.data);
      setPagination((prev) => ({
        ...prev,
        products: {
          current: page,
          pageSize,
          total: result.total,
        },
      }));
    } catch (error) {
      console.error('Error loading products:', error);
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1, pageSize = 10, filters = {}) => {
    try {
      setLoading(true);
      const result = await userApi.getUsers({
        page,
        limit: pageSize,
        ...filters,
      });

      setUsers(result.data);
      setPagination((prev) => ({
        ...prev,
        users: {
          current: page,
          pageSize,
          total: result.total,
        },
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async (page = 1, pageSize = 10, filters = {}) => {
    try {
      setLoading(true);
      console.log('Loading brands without params...');
      const result = await brandApi.getBrands();

      setBrands(result.data);
      setPagination((prev) => ({
        ...prev,
        brands: {
          current: page,
          pageSize,
          total: result.total,
        },
      }));
    } catch (error) {
      console.error('Error loading brands:', error);
      message.error('Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (page = 1, pageSize = 10, filters = {}) => {
    try {
      setLoading(true);
      console.log('Loading categories without params...');
      const result = await categoryApi.getCategories();

      setCategories(result.data);
      setPagination((prev) => ({
        ...prev,
        categories: {
          current: page,
          pageSize,
          total: result.total,
        },
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const orderColumns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer_name',
      render: (_: any, record: Order) => {
        const user = record.user;
        let name = 'N/A';

        if (user) {
          if (user.profile?.fullName) {
            name = user.profile.fullName;
          } else if (user.username) {
            name = user.username;
          } else {
            name = user.email || 'N/A';
          }
        }

        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {name}
          </Space>
        );
      },
    },
    {
      title: 'Email',
      key: 'customer_email',
      render: (_: any, record: Order) => record.user?.email || 'N/A',
    },
    {
      title: 'Số tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => {
        const safeAmount = amount || 0;
        return (
          <Text strong style={{ color: '#52c41a' }}>
            {CurrencyFormatter.formatVND(safeAmount)}
          </Text>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          [ORDER_STATUS.PENDING]: { color: 'orange', text: 'Chờ xử lý' },
          [ORDER_STATUS.CONFIRMED]: { color: 'blue', text: 'Đã xác nhận' },
          [ORDER_STATUS.PROCESSING]: { color: 'purple', text: 'Đang xử lý' },
          [ORDER_STATUS.SHIPPED]: { color: 'purple', text: 'Đang giao' },
          [ORDER_STATUS.DELIVERED]: { color: 'green', text: 'Hoàn thành' },
          [ORDER_STATUS.CANCELLED]: { color: 'red', text: 'Đã hủy' },
        };
        const statusInfo = statusMap[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (text: string, record: Product) => (
        <Tag>{record.category?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Thương hiệu',
      dataIndex: ['brand', 'name'],
      key: 'brand',
      render: (text: string, record: Product) => (
        <Tag color="blue">{record.brand?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => {
        const safePrice = price || 0;
        return (
          <Text strong style={{ color: '#52c41a' }}>
            {CurrencyFormatter.formatVND(safePrice)}
          </Text>
        );
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (num: number) => (
        <Tag color={num < 10 ? 'red' : num < 20 ? 'orange' : 'green'}>
          {num}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: 'Hoạt động' },
          inactive: { color: 'red', text: 'Không hoạt động' },
          out_of_stock: { color: 'orange', text: 'Hết hàng' },
        };
        const statusInfo = statusMap[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Họ tên',
      key: 'fullname',
      render: (_: any, record: User) => {
        const profile = record.profile;
        if (profile) {
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          return fullName || 'N/A';
        }
        return 'N/A';
      },
    },
    {
      title: 'Mã nhân viên',
      key: 'code',
      render: (_: any, record: User) => record.profile?.code || 'N/A',
    },
    {
      title: 'Điện thoại',
      key: 'phone',
      render: (_: any, record: User) => record.profile?.phone || 'N/A',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, { color: string; text: string }> = {
          administrator: { color: 'red', text: 'Quản trị viên' },
          manager: { color: 'blue', text: 'Quản lý' },
          staff: { color: 'green', text: 'Nhân viên' },
          user: { color: 'default', text: 'Người dùng' },
        };
        const roleInfo = roleMap[role] || { color: 'default', text: role };
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: 'Hoạt động' },
          inactive: { color: 'red', text: 'Không hoạt động' },
          pending: { color: 'orange', text: 'Chờ xử lý' },
        };
        const statusInfo = statusMap[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  const brandColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên thương hiệu',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Logo',
      dataIndex: 'logo_url',
      key: 'logo_url',
      render: (url: string) =>
        url ? (
          <Avatar src={url} size="small" />
        ) : (
          <Avatar icon={<ShopOutlined />} size="small" />
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: 'Hoạt động' },
          inactive: { color: 'red', text: 'Không hoạt động' },
        };
        const statusInfo = statusMap[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Brand) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
          <Button type="link" icon={<DeleteOutlined />} size="small" danger>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: 'Hoạt động' },
          inactive: { color: 'red', text: 'Không hoạt động' },
        };
        const statusInfo = statusMap[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Category) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Sửa
          </Button>
          <Button type="link" icon={<DeleteOutlined />} size="small" danger>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn hàng',
    },
    {
      key: 'products',
      icon: <ShopOutlined />,
      label: 'Sản phẩm',
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: 'Khách hàng',
    },
    {
      key: 'categories',
      icon: <TagOutlined />,
      label: 'Danh mục',
    },
    {
      key: 'brands',
      icon: <ShopOutlined />,
      label: 'Thương hiệu',
    },
    {
      key: 'promotions',
      icon: <GiftOutlined />,
      label: 'Khuyến mãi',
    },
    {
      key: 'reviews',
      icon: <StarOutlined />,
      label: 'Đánh giá',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'dashboard':
        return (
          <>
            {/* Statistics Cards */}
            <Spin spinning={loading}>
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Tổng doanh thu"
                      value={stats.orders.totalRevenue}
                      precision={0}
                      valueStyle={{ color: '#3f8600', fontSize: '24px' }}
                      prefix={<DollarCircleOutlined />}
                      suffix="₫"
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text type="success">
                        <RiseOutlined /> Tháng này:{' '}
                        {CurrencyFormatter.formatVND(
                          stats.orders.thisMonthRevenue,
                        )}
                      </Text>
                    </div>
                    <Progress
                      percent={Math.min(
                        100,
                        (stats.orders.thisMonthRevenue /
                          stats.orders.totalRevenue) *
                          100,
                      )}
                      showInfo={false}
                      strokeColor="#52c41a"
                      style={{ marginTop: '8px' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Đơn hàng"
                      value={stats.orders.total}
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      prefix={<ShoppingCartOutlined />}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text>
                        Chờ xử lý: {stats.orders.pending} | Hoàn thành:{' '}
                        {stats.orders.delivered}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats.orders.total > 0
                          ? (stats.orders.delivered / stats.orders.total) * 100
                          : 0
                      }
                      showInfo={false}
                      strokeColor="#1890ff"
                      style={{ marginTop: '8px' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Sản phẩm"
                      value={stats.products.total}
                      valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                      prefix={<ShopOutlined />}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text
                        type={
                          stats.products.outOfStock > 0 ? 'warning' : 'success'
                        }
                      >
                        Hết hàng: {stats.products.outOfStock}
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats.products.total > 0
                          ? (stats.products.active / stats.products.total) * 100
                          : 0
                      }
                      showInfo={false}
                      strokeColor="#722ed1"
                      style={{ marginTop: '8px' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Khách hàng"
                      value={stats.users.total}
                      valueStyle={{ color: '#eb2f96', fontSize: '24px' }}
                      prefix={<UsergroupAddOutlined />}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text type="success">
                        <RiseOutlined /> +{stats.users.newThisMonth} khách hàng
                        mới
                      </Text>
                    </div>
                    <Progress
                      percent={
                        stats.users.total > 0
                          ? (stats.users.active / stats.users.total) * 100
                          : 0
                      }
                      showInfo={false}
                      strokeColor="#eb2f96"
                      style={{ marginTop: '8px' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Spin>

            {/* Orders & Products */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card
                  title={
                    <Space>
                      <ShoppingCartOutlined />
                      Đơn hàng gần đây
                    </Space>
                  }
                  extra={
                    <Button type="primary" icon={<PlusOutlined />}>
                      Tạo đơn hàng
                    </Button>
                  }
                  className="data-card"
                >
                  <Table
                    columns={orderColumns}
                    dataSource={orders}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: 800 }}
                    rowKey="id"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <Space>
                      <ShopOutlined />
                      Sản phẩm bán chạy
                    </Space>
                  }
                  extra={
                    <Button type="link" icon={<EyeOutlined />}>
                      Xem tất cả
                    </Button>
                  }
                  className="data-card"
                >
                  <List
                    dataSource={topProducts.slice(0, 4)}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Text strong>{item.name}</Text>}
                          description={
                            <Space direction="vertical" size="small">
                              <Text type="secondary">{item.category}</Text>
                              <Text strong style={{ color: '#52c41a' }}>
                                {item.revenue}
                              </Text>
                            </Space>
                          }
                        />
                        <div style={{ textAlign: 'right' }}>
                          <Text strong>{item.sold}</Text>
                          <br />
                          <Text type="secondary">đã bán</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </>
        );

      case 'orders':
        return (
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                Quản lý đơn hàng
              </Space>
            }
            className="data-card"
          >
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Tìm kiếm đơn hàng..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="pending">Chờ xử lý</Option>
                    <Option value="completed">Hoàn thành</Option>
                    <Option value="shipping">Đang giao</Option>
                    <Option value="cancelled">Đã hủy</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <RangePicker style={{ width: '100%' }} />
                </Col>
                <Col xs={24} sm={4}>
                  <Button type="primary" icon={<PlusOutlined />} block>
                    Tạo đơn hàng
                  </Button>
                </Col>
              </Row>
            </div>
            <Spin spinning={loading}>
              {orders && orders.length > 0 ? (
                <Table
                  columns={orderColumns}
                  dataSource={orders}
                  scroll={{ x: 1000 }}
                  rowKey="id"
                  pagination={{
                    ...pagination.orders,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} của ${total} đơn hàng`,
                    onChange: (page, pageSize) => loadOrders(page, pageSize),
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <Text type="secondary">
                    {loading ? 'Đang tải...' : 'Không có đơn hàng nào'}
                  </Text>
                </div>
              )}
            </Spin>
          </Card>
        );

      case 'products':
        return (
          <Card
            title={
              <Space>
                <ShopOutlined />
                Quản lý sản phẩm
              </Space>
            }
            className="data-card"
          >
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Danh mục"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="phone">Điện thoại</Option>
                    <Option value="laptop">Laptop</Option>
                    <Option value="tablet">Tablet</Option>
                    <Option value="accessories">Phụ kiện</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="active">Đang bán</Option>
                    <Option value="inactive">Ngừng bán</Option>
                    <Option value="out_of_stock">Hết hàng</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={4}>
                  <Button type="primary" icon={<PlusOutlined />} block>
                    Thêm sản phẩm
                  </Button>
                </Col>
              </Row>
            </div>
            <Spin spinning={loading}>
              <Table
                columns={productColumns}
                dataSource={products}
                scroll={{ x: 1200 }}
                rowKey="id"
                pagination={{
                  ...pagination.products,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} sản phẩm`,
                  onChange: (page, pageSize) => loadProducts(page, pageSize),
                }}
              />
            </Spin>
          </Card>
        );

      case 'customers':
        return (
          <Card
            title={
              <Space>
                <TeamOutlined />
                Quản lý khách hàng
              </Space>
            }
            className="data-card"
          >
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Tìm kiếm khách hàng..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Vai trò"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="administrator">Quản trị viên</Option>
                    <Option value="manager">Quản lý</Option>
                    <Option value="staff">Nhân viên</Option>
                    <Option value="user">Người dùng</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Không hoạt động</Option>
                    <Option value="pending">Chờ xử lý</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={4}>
                  <Button type="primary" icon={<PlusOutlined />} block>
                    Thêm khách hàng
                  </Button>
                </Col>
              </Row>
            </div>
            <Spin spinning={loading}>
              <Table
                columns={userColumns}
                dataSource={users}
                scroll={{ x: 1200 }}
                rowKey="id"
                pagination={{
                  ...pagination.users,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} khách hàng`,
                  onChange: (page, pageSize) => loadUsers(page, pageSize),
                }}
              />
            </Spin>
          </Card>
        );

      case 'brands':
        return (
          <Card
            title={
              <Space>
                <ShopOutlined />
                Quản lý thương hiệu
              </Space>
            }
            className="data-card"
          >
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Tìm kiếm thương hiệu..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Không hoạt động</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={10}>
                  <Space>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Thêm thương hiệu
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
            <Spin spinning={loading}>
              <Table
                columns={brandColumns}
                dataSource={brands}
                scroll={{ x: 1000 }}
                rowKey="id"
                pagination={{
                  ...pagination.brands,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} thương hiệu`,
                  onChange: (page, pageSize) => loadBrands(page, pageSize),
                }}
              />
            </Spin>
          </Card>
        );

      case 'categories':
        return (
          <Card
            title={
              <Space>
                <TagOutlined />
                Quản lý danh mục
              </Space>
            }
            className="data-card"
          >
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Tìm kiếm danh mục..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="Trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Không hoạt động</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={10}>
                  <Space>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Thêm danh mục
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
            <Spin spinning={loading}>
              <Table
                columns={categoryColumns}
                dataSource={categories}
                scroll={{ x: 1000 }}
                rowKey="id"
                pagination={{
                  ...pagination.categories,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} danh mục`,
                  onChange: (page, pageSize) => loadCategories(page, pageSize),
                }}
              />
            </Spin>
          </Card>
        );

      default:
        return (
          <Card
            title={`Trang ${
              menuItems.find((item) => item.key === selectedMenuItem)?.label
            }`}
            className="data-card"
          >
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Title level={3}>Đang phát triển</Title>
              <Text>Trang này đang được phát triển...</Text>
            </div>
          </Card>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-sider"
        width={250}
      >
        <div className="admin-logo">
          <ShopOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          {!collapsed && (
            <span
              style={{
                marginLeft: '12px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Admin Panel
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuItem]}
          items={menuItems}
          onClick={({ key }) => setSelectedMenuItem(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout className="admin-layout">
        {/* Header */}
        <Header className="admin-header">
          <div className="admin-header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
            <Title level={4} style={{ margin: 0, color: '#333' }}>
              {menuItems.find((item) => item.key === selectedMenuItem)?.label ||
                'Dashboard'}
            </Title>
          </div>

          <div className="admin-header-right">
            <Space size="large">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="notification-btn"
              />
              <div className="admin-user-info">
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                  {user?.username || 'Admin'}
                </span>
              </div>
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </Space>
          </div>
        </Header>

        {/* Content */}
        <Content className="admin-content">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;
