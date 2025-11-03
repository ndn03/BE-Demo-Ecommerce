import { API_ENDPOINT, API_PREFIX, API_TIMEOUT } from '@configs/api.config';
import { checkAuth, clearStoredAuth } from '@libs/localStorage';
import logger from '@libs/logger';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { refreshTokenFn } from '../hooks/auth';

dayjs.extend(utc);
dayjs.extend(timezone);

// Create an axios instance with basic configuration
const client = axios.create({
  baseURL: API_ENDPOINT + API_PREFIX, // Base URL for API
  timeout: API_TIMEOUT, // Timeout for each request
  timeoutErrorMessage: '🚧🚧🚧 Server connection time out !', // Timeout error message
  // Temporarily disable XSRF for CORS compatibility
  // xsrfCookieName: 'XSRF-TOKEN',
  // xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json', // Accept response in JSON format
    'Content-Type': 'application/json', // Content type for the request body
  },
});

// Variables and functions to handle token refreshing when encountering a 401 error
let isRefreshing = false; // Flag to track if token refresh is in progress
// eslint-disable-next-line @typescript-eslint/ban-types
let refreshSubscribers: Function[] = []; // Array to store callbacks for token refresh

// Function to call all subscribers with the new token after it's refreshed
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token)); // Call all stored callback functions
  refreshSubscribers = []; // Clear the list of subscribers
}

// Interceptor to handle 401 errors (Unauthorized) when the token has expired
client.interceptors.response.use(
  (response) => response, // Return the response if the request is successful
  async (error) => {
    // Handle errors when something goes wrong
    const originalRequest = error.config; // Get the original request configuration
    if (error.response?.status === 401) {
      // Check if the error is a 401 (Unauthorized)
      if (!originalRequest._retry) {
        // If the request hasn't been retried yet
        if (isRefreshing) {
          // If a token refresh is already in progress
          // Return a Promise that waits for the token to be refreshed
          return new Promise((resolve) => {
            // Add a callback to the list of subscribers to be called when the token is refreshed
            refreshSubscribers.push((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`; // Set the new token in the header
              resolve(client(originalRequest)); // Retry the original request with the new token
            });
          });
        }

        originalRequest._retry = true; // Mark the request as having been retried
        isRefreshing = true; // Mark the token refresh process as in progress
        try {
          // Call the refresh token function to get a new token
          const newResRT = await refreshTokenFn();
          if (newResRT && newResRT.data?.accessToken) {
            const { accessToken } = newResRT.data; // Get the new access token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`; // Set the new token in the header
            onRefreshed(accessToken); // Notify all subscribers with the new token
            isRefreshing = false; // Mark the token refresh process as complete
            return client(originalRequest); // Retry the original request with the new token
          }
          clearStoredAuth(); // Clear authentication information if the token refresh fails
          window.location.href = '/login'; // Redirect the user to the login page
          return Promise.reject('Token refresh failed'); // Reject the promise if token refresh fails
        } catch (error) {
          clearStoredAuth(); // Clear authentication information if there was an error during the refresh
          isRefreshing = false; // Mark the token refresh process as complete
          window.location.href = '/login'; // Redirect the user to the login page
          throw error; // Throw the error to be handled by the caller
        }
      } else {
        // If the request has already been retried but still failed, clear the auth and redirect to login
        clearStoredAuth();
        isRefreshing = false;
        window.location.href = '/login';
      }
    }

    // Reject the promise with the error if it's not a 401 error
    return Promise.reject(error);
  },
);

// Interceptor: pre request
client.interceptors.request.use(
  (config) => {
    const newConfig = { ...config };
    const accessToken = checkAuth();
    if (accessToken && !newConfig.headers.Authorization)
      newConfig.headers.Authorization = `Bearer ${accessToken}`;
    // Temporarily disable timezone header for CORS compatibility
    // newConfig.headers.tz = dayjs.tz.guess();
    return newConfig;
  },
  (error) => {
    logger.error('🚨🚨🚨 ~ Axios interceptors request:', error);
    Promise.reject(error);
  },
);

// Function to make the API request with the given options
export const request = async <T = any>(options: AxiosRequestConfig) => {
  logger.debug('🚧🚧🚧 ~ Axios Options:', options); // Log the request options

  // Function to handle successful API response
  const onSuccess = (response: AxiosResponse<T>): T => {
    logger.debug('🚀🚀🚀 ~ Response API:', response?.data); // Log the API response data
    return response?.data; // Return the response data
  };

  // Function to handle API errors
  const onError = async (error: any) => {
    logger.error('🚨🚨🚨 ~ Axios onError:', error); // Log the error details

    // Log detailed error info for debugging
    console.group('🚨 API Error Details');
    console.log('URL:', error?.config?.url);
    console.log('Method:', error?.config?.method?.toUpperCase());
    console.log('Status:', error?.response?.status);
    console.log('Response Data:', error?.response?.data);
    console.log('Request Data:', error?.config?.data);
    console.groupEnd();

    await Promise.reject({
      statusCode: error?.response?.data?.statusCode, // Capture the status code from the error response
      message: error?.response?.data?.message
        ? Array.isArray(error?.response?.data?.message)
          ? error?.response?.data?.message.join(', ') // Join multiple error messages if they exist
          : error?.response?.data?.message
        : 'Đã có lỗi xảy ra. Vui lòng thử lại sau.', // Default error message if no message is available
      statusText: error?.response?.statusText || 'Error', // Capture the status text
      status: error?.response?.status, // Capture the status code
      data: error?.response?.data?.data || null, // Capture the response data if available
      details: error?.response?.data?.details, // Capture error details if available
      response: error?.response, // Include full response for debugging
    });

    return undefined as T;
  };

  // Send the request and handle the response and error using the functions above
  return client<T>(options).then(onSuccess).catch(onError);
};
