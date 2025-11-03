// Auth module types based on backend APIs

// Sign In (Login) - Uses username instead of email
export type TSignIn = {
  username: string; // Backend expects username, not email
  password: string;
};

// User Registration for Auth
export type TAuthUserRegistration = {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  employeeCode?: string;
};

// Forgot Password - Uses email
export type TForgotPassword = {
  email: string;
};

// Auth Response Types
export type TAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TAuthUser = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  isActive: boolean;
  profile?: {
    code?: string;
    fullName?: string;
    avatar?: string;
  };
};

export type TAuthResponse = TAuthTokens & {
  user: TAuthUser;
};

// API Response Types
export type TSignInResponse = {
  message: string;
  data: TAuthResponse;
};

export type TRegisterResponse = {
  message: string;
  data: TAuthUser;
};

export type TForgotPasswordResponse = {
  message: string;
  success: boolean;
};

export type TRefreshTokenResponse = {
  message: string;
  data: TAuthTokens;
};

export type TLogoutResponse = {
  message: string;
};
