// import { Routes, Route, Outlet } from 'react-router-dom';
// // import Login from '@pages/auth/login';
// // import ForgotPassword from '@pages/auth/forgot-password';
// // import Register from '@pages/auth/register';
// // import LayoutApp from '@components/layout';
// // import Notfound from '@components/screens/404';
// // import { SocketProvider } from '@src/hooks/SocketContext';
// // import ConfirmEmail from '@src/pages/employee/confirm-email';

// import routeConfig, { TRouteConfig } from './routeConfig';
// import ProtectedRoute from './protectedRoute';

// function RouteApp() {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route path="/forgot-password" element={<ForgotPassword />} />
//       <Route path="/register/:code" element={<Register />} />
//       <Route path="*" element={<Notfound />} />
//       <Route path="confirm-email" element={<ConfirmEmail />} />
//       {routeConfig.map(
//         ({ path, Element, key, ...args }: TRouteConfig, index: number) => (
//           <Route
//             path={path}
//             key={index}
//             element={
//               <ProtectedRoute keyName={key}>
//                 <SocketProvider>
//                   <LayoutApp>
//                     <Element />
//                   </LayoutApp>
//                   <Outlet />
//                 </SocketProvider>
//               </ProtectedRoute>
//             }
//             action={args.action}
//             loader={args.action}
//           />
//         ),
//       )}
//     </Routes>
//   );
// }

// export default RouteApp;
