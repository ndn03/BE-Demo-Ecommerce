// Local Storage Keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Auth Token Management
export const setAuth = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const clearStoredAuth = removeAuth; // Alias for compatibility

// Check if user is authenticated
export const checkAuth = (): string => {
  return getAccessToken() || '';
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// User Data Management
export const setUser = (user: any) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// Clear all stored data
export const clearAllStorage = () => {
  localStorage.clear();
};

// Auth object management (for compatibility with existing code)
export const setStoredAuth = (authData: {
  accessToken: string;
  refreshToken: string;
  user: any;
}) => {
  setAuth(authData.accessToken, authData.refreshToken);
  setUser(authData.user);
};

export const getStoredAuth = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const user = getUser();

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
    user,
  };
};

// Clear specific local stored item
export const clearLocalStored = (key: string) => {
  localStorage.removeItem(key);
};
