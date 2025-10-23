# React Authentication System với Ant Design

Hệ thống xác thực hoàn chỉnh được xây dựng với React, TypeScript, Ant Design và tích hợp với NestJS backend.

## 🚀 Tính năng

### ✅ **Đã hoàn thành:**

- **Đăng nhập** - Login với username/password
- **Đăng ký** - Register tài khoản mới với validation
- **Quên mật khẩu** - Forgot password với email
- **Dashboard** - Trang chính sau khi đăng nhập
- **Protected Routes** - Bảo vệ routes yêu cầu authentication
- **Auth Context** - Quản lý state toàn cục
- **Responsive Design** - Tương thích mobile/desktop
- **Password Strength** - Hiển thị độ mạnh mật khẩu
- **Loading States** - Loading indicators
- **Error Handling** - Xử lý lỗi user-friendly

### 🎨 **Giao diện:**

- **Ant Design components** - UI components chuyên nghiệp
- **Gradient backgrounds** - Background đẹp mắt
- **Glass morphism effects** - Hiệu ứng thủy tinh hiện đại
- **Smooth animations** - Animation mượt mà
- **Dark/Light theme ready** - Sẵn sàng cho dark theme

## 📁 Cấu trúc thư mục

```
src/
├── contexts/
│   └── AuthContext.tsx          # Context quản lý authentication
├── services/
│   └── auth.service.ts          # API calls cho authentication
├── types/
│   └── auth.types.ts            # TypeScript interfaces
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx        # Trang đăng nhập
│   │   ├── LoginPage.less       # Styles cho login
│   │   ├── RegisterPage.tsx     # Trang đăng ký
│   │   ├── RegisterPage.less    # Styles cho register
│   │   ├── ForgotPasswordPage.tsx # Trang quên mật khẩu
│   │   └── ForgotPasswordPage.less # Styles cho forgot password
│   └── dashboard/
│       ├── DashboardPage.tsx    # Trang dashboard
│       └── DashboardPage.less   # Styles cho dashboard
├── routes/
│   └── AppRoutes.tsx            # Routing configuration
└── App.tsx                      # Main app component
```

## 🔧 API Endpoints tương ứng

Hệ thống tích hợp với các API endpoints từ `auth.controller.ts`:

```typescript
POST /v1/user/login           # Đăng nhập
POST /v1/user/register        # Đăng ký
POST /v1/user/refresh-token   # Refresh token
POST /v1/user/logout          # Đăng xuất
POST /v1/user/forgot-password # Quên mật khẩu
```

## 🚀 Hướng dẫn sử dụng

### 1. **Cài đặt dependencies:**

```bash
npm install antd axios react-router-dom
npm install @types/react @types/react-dom --save-dev
```

### 2. **Cấu hình API endpoint:**

Cập nhật `src/configs/api.config.ts`:

```typescript
export const API_ENDPOINT = 'http://localhost:3000'; // URL backend
```

### 3. **Khởi chạy ứng dụng:**

```bash
npm start
```

### 4. **Truy cập các trang:**

- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Forgot Password**: http://localhost:3000/forgot-password
- **Dashboard**: http://localhost:3000/dashboard (cần đăng nhập)

## 🔐 Authentication Flow

### **Login Process:**

1. User nhập username/password
2. Call API `/v1/user/login`
3. Lưu token vào localStorage
4. Redirect đến dashboard
5. Set up axios interceptor với token

### **Auto-redirect Logic:**

- **Chưa đăng nhập** → Redirect đến `/login`
- **Đã đăng nhập** → Redirect đến `/dashboard`
- **Token expired** → Auto logout + redirect đến `/login`

### **Protected Routes:**

- Sử dụng `ProtectedRoute` component
- Check `isAuthenticated` từ AuthContext
- Auto redirect nếu chưa đăng nhập

## 📱 Responsive Design

### **Breakpoints:**

- **Desktop**: > 768px - Full layout
- **Tablet**: 768px - Adjusted spacing
- **Mobile**: < 480px - Stack layout

### **Mobile optimizations:**

- Stack form elements vertically
- Larger touch targets
- Optimized spacing
- Readable font sizes

## 🎨 Customization

### **Themes:**

```typescript
// Trong AppRoutes.tsx
<ConfigProvider locale={viVN} theme={customTheme}>
```

### **Colors:**

```less
// Trong .less files
.login-button {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
}
```

### **Animations:**

```less
.login-card {
  transition: all 0.3s;
  &:hover {
    transform: translateY(-2px);
  }
}
```

## 🔍 Validation Rules

### **Login:**

- Username: min 3 chars, required
- Password: min 6 chars, required

### **Register:**

- Username: min 3 chars, max 50 chars, alphanumeric + underscore
- Email: valid email format
- Password: min 6 chars with strength indicator
- Confirm Password: must match password

### **Forgot Password:**

- Email: valid email format, required

## 🛠️ Error Handling

### **API Errors:**

- 401 Unauthorized → Auto logout + redirect login
- 400 Bad Request → Show error message
- 500 Server Error → Show generic error

### **Form Validation:**

- Real-time validation
- Custom error messages in Vietnamese
- Visual feedback (red borders, icons)

## 🔄 State Management

### **AuthContext provides:**

```typescript
{
  user: User | null;              // Current user info
  token: string | null;           // JWT token
  isLoading: boolean;             // Loading state
  isAuthenticated: boolean;       // Auth status
  login: (username, password);    // Login function
  logout: ();                     // Logout function
  refreshToken: ();               // Refresh token
}
```

### **localStorage:**

- `access_token`: JWT token
- `user`: User information object

## 🧪 Testing

### **Manual testing checklist:**

- [ ] Login với credentials hợp lệ
- [ ] Login với credentials không hợp lệ
- [ ] Register tài khoản mới
- [ ] Forgot password flow
- [ ] Auto redirect khi đã đăng nhập
- [ ] Protected route access
- [ ] Token expiration handling
- [ ] Logout functionality
- [ ] Responsive design trên mobile

## 🚀 Deployment

### **Build production:**

```bash
npm run build
```

### **Environment variables:**

```bash
REACT_APP_API_ENDPOINT=https://your-api.com
```

## 🔮 Mở rộng

### **Có thể thêm:**

- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication
- [ ] Password reset flow
- [ ] User profile management
- [ ] Role-based access control
- [ ] Dark/Light theme toggle
- [ ] Internationalization (i18n)
- [ ] Remember me functionality
- [ ] Session timeout warning

## 📞 Hỗ trợ

Nếu có vấn đề, vui lòng kiểm tra:

1. Backend server đang chạy
2. API endpoints đúng
3. CORS được cấu hình
4. Network connectivity

---

**Tạo bởi:** AI Assistant  
**Framework:** React + TypeScript + Ant Design  
**Backend:** NestJS  
**Styling:** LESS + CSS3
