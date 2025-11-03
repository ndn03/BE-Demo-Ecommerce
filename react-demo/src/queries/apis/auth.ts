import { TSignIn, TAuthUserRegistration, TForgotPassword } from '@modules/auth';

import { request } from './config';

// Đăng ký người dùng mới
export const signUp = (body: TAuthUserRegistration) =>
  request({ url: 'v1/user/register', method: 'POST', data: body });

// Đăng nhập (sử dụng username thay vì email như BE yêu cầu)
export const signIn = (body: TSignIn) =>
  request({ url: 'v1/user/login', method: 'POST', data: body });

// Đăng xuất
export const signOut = () => request({ url: 'v1/user/logout', method: 'POST' });

// Làm mới token
export const refreshToken = () =>
  request({ url: 'v1/user/refresh-token', method: 'POST' });

// Quên mật khẩu - gửi mật khẩu mới qua email
export const forgotPassword = (body: TForgotPassword) =>
  request({ url: 'v1/user/forgot-password', method: 'POST', data: body });
