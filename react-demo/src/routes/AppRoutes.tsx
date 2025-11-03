import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Auth pages
import Login from '@pages/auth/login';
import Register from '@pages/auth/register';
import ForgotPassword from '@pages/auth/forgot-password';
import TestLogin from '@pages/test/login';
import MockLogin from '@pages/test/mock-login';
import UserAPITest from '@components/widgets/UserAPITest';

// Layout components
import LayoutApp from '@components/layout';
import NotFound from '@components/screens/404';

// Route configuration
import routeConfig, { TRouteConfig } from '@route/routeConfig';
import ProtectedRoute from '@route/protectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/test/login" element={<TestLogin />} />
        <Route path="/test/mock-login" element={<MockLogin />} />
        <Route path="/test/api" element={<UserAPITest />} />

        {/* Redirect /login to /auth/login for backward compatibility */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/auth/register" replace />}
        />
        <Route
          path="/forgot-password"
          element={<Navigate to="/auth/forgot-password" replace />}
        />

        {/* Protected routes from routeConfig */}
        {routeConfig.map(
          ({ path, Element, key, ...args }: TRouteConfig, index: number) => (
            <Route
              path={path}
              key={index}
              element={
                <ProtectedRoute keyName={key}>
                  <LayoutApp>
                    <Element />
                  </LayoutApp>
                </ProtectedRoute>
              }
              action={args.action}
              loader={args.loader}
            />
          ),
        )}

        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default AppRoutes;
