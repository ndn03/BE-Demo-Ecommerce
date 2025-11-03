import lazyLoading from '@components/widgets/LazyLoading';
import { ERole } from '@configs/interface.config';
import { match } from 'path-to-regexp';
import React from 'react';
import { PathRouteProps } from 'react-router-dom';

// Define a custom route configuration type
export interface TRouteConfig extends PathRouteProps {
  Element: React.FC; // React component to render for the route
  key: ERole[]; // List of roles allowed to access the route
}
// Dashboard - Main dashboard page with role-based routing
const DashboardRouter = lazyLoading(
  () => import('@components/common/DashboardRouter'),
);

// Admin Dashboard
const AdminDashboard = lazyLoading(() => import('@pages/admin/dashboard'));
// HR Dashboard
const HRDashboard = lazyLoading(() => import('@pages/hr/dashboard'));

/**
 * User Management
 */
// My Profile - User profile page
const MyProfile = lazyLoading(() => import('@pages/user/profile'));
// User management for admin
const User = lazyLoading(() => import('@pages/admin/user'));
// Admin user management (full system access)
const AdminUserManagement = lazyLoading(() => import('@pages/admin/users'));
// HR employee management (company staff only)
const HREmployeeManagement = lazyLoading(() => import('@pages/hr/employees'));

/**
 * Special Pages
 */
// Unauthorized access page
const Unauthorized = lazyLoading(() => import('@pages/unauthorized'));

/**
 * Product Management
 */
// const ProductList = lazyLoading(() => import('@pages/product/list'));
// const ProductCreate = lazyLoading(() => import('@pages/product/create'));
// const ProductDetail = lazyLoading(() => import('@pages/product/detail'));
// const ProductEdit = lazyLoading(() => import('@pages/product/edit'));

// /**
//  * Category Management
//  */
// const CategoryList = lazyLoading(() => import('@pages/category/list'));
// const CategoryCreate = lazyLoading(() => import('@pages/category/create'));
// const CategoryDetail = lazyLoading(() => import('@pages/category/detail'));

// /**
//  * Brand Management
//  */
// const BrandList = lazyLoading(() => import('@pages/brand/list'));
// const BrandCreate = lazyLoading(() => import('@pages/brand/create'));
// const BrandDetail = lazyLoading(() => import('@pages/brand/detail'));

// /**
//  * Order Management
//  */
// const OrderList = lazyLoading(() => import('@pages/order/list'));
// const OrderDetail = lazyLoading(() => import('@pages/order/detail'));

// /**
//  * Voucher Management
//  */
// const VoucherList = lazyLoading(() => import('@pages/voucher/list'));
// const VoucherCreate = lazyLoading(() => import('@pages/voucher/create'));
// const VoucherDetail = lazyLoading(() => import('@pages/voucher/detail'));

// /**
//  * Media Management
//  */
// const MediaLibrary = lazyLoading(() => import('@pages/media/library'));

// /**
//  * Document Management
//  */
// const DocumentHub = lazyLoading(() => import('@pages/document/hub'));
// const DocumentDetail = lazyLoading(() => import('@pages/document/detail'));

// /**
//  * Notifications
//  */
// const MyNotification = lazyLoading(() => import('@pages/notification/list'));
// const NotificationDetail = lazyLoading(() => import('@pages/notification/detail'));

// /**
//  * Settings
//  */
// const SystemSettings = lazyLoading(() => import('@pages/settings/system'));

// Define the route configurations for Admin & HR System
const routeConfig: TRouteConfig[] = [
  // Dashboard - Role-based routing dashboard
  {
    path: '/',
    Element: DashboardRouter,
    key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE],
  },

  // Separate dashboard routes for direct access
  {
    path: '/admin/dashboard',
    Element: AdminDashboard,
    key: [ERole.ADMINISTRATOR],
  },
  {
    path: '/hr/dashboard',
    Element: HRDashboard,
    key: [ERole.HUMAN_RESOURCES],
  },

  /**
   * User Management
   */
  // Legacy user management route (keep for backward compatibility)
  {
    path: '/users',
    Element: User,
    key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  },

  // Admin - Full system user management
  {
    path: '/admin/users',
    Element: AdminUserManagement,
    key: [ERole.ADMINISTRATOR],
  },

  // HR - Employee management for company staff
  {
    path: '/hr/employees',
    Element: HREmployeeManagement,
    key: [ERole.HUMAN_RESOURCES],
  },

  // User profile page
  {
    path: '/profile',
    Element: MyProfile,
    key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE],
  },

  /**
   * Special Pages
   */
  // Unauthorized access page
  {
    path: '/unauthorized',
    Element: Unauthorized,
    key: [], // No restriction - anyone can see this page
  },

  /**
   * Product Management
   */
  // Product list and management
  //   {
  //     path: '/products',
  //     Element: ProductList,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/products/create',
  //     Element: ProductCreate,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/products/:id',
  //     Element: ProductDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/products/:id/edit',
  //     Element: ProductEdit,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Category Management
  //    */
  //   {
  //     path: '/categories',
  //     Element: CategoryList,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/categories/create',
  //     Element: CategoryCreate,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/categories/:id',
  //     Element: CategoryDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Brand Management
  //    */
  //   {
  //     path: '/brands',
  //     Element: BrandList,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/brands/create',
  //     Element: BrandCreate,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/brands/:id',
  //     Element: BrandDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Order Management
  //    */
  //   {
  //     path: '/orders',
  //     Element: OrderList,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/orders/:id',
  //     Element: OrderDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Voucher Management
  //    */
  //   {
  //     path: '/vouchers',
  //     Element: VoucherList,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/vouchers/create',
  //     Element: VoucherCreate,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/vouchers/:id',
  //     Element: VoucherDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Media/Upload Management
  //    */
  //   {
  //     path: '/media',
  //     Element: MediaLibrary,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Document Management
  //    */
  //   {
  //     path: '/documents',
  //     Element: DocumentHub,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },
  //   {
  //     path: '/documents/:id',
  //     Element: DocumentDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES],
  //   },

  //   /**
  //    * Notifications
  //    */
  //   {
  //     path: '/notifications',
  //     Element: MyNotification,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE],
  //   },
  //   {
  //     path: '/notifications/:id',
  //     Element: NotificationDetail,
  //     key: [ERole.ADMINISTRATOR, ERole.HUMAN_RESOURCES, ERole.EMPLOYEE],
  //   },

  //   /**
  //    * Settings
  //    */
  //   {
  //     path: '/settings',
  //     Element: SystemSettings,
  //     key: [ERole.ADMINISTRATOR],
  //   },
];

export default routeConfig;

export const isValidRoute = (redirectPath: string | null) => {
  if (!redirectPath) return false;
  return routeConfig.some(
    (route) =>
      route.path &&
      match(route.path, { decode: decodeURIComponent })(redirectPath),
  );
};
