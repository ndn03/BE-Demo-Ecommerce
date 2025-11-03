// API Configuration
export const API_ENDPOINT =
  import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;
export const API_PREFIX = ''; // No global prefix, controller uses v1 directly
