/**
 * 🎯 **Utils Index**
 *
 * Central export point for all utilities
 */

// Constants
export * from './constants/app.constants';

// Storage
export * from './storage/storage.helper';

// HTTP
export * from './http/http.client';

// Formatters
export * from './formatters/format.helper';

// Validators
export * from './validators/validation.helper';

// Helpers
export * from './helpers/general.helper';

// Date utilities (legacy and new)
export * from './date.utils';

// Re-export commonly used utilities for convenience
export {
  // Storage
  AuthStorage,
  StorageHelper,
  ThemeStorage,
} from './storage/storage.helper';

export {
  // HTTP
  httpClient,
  get,
  post,
  put,
  patch,
  del as delete,
  upload,
} from './http/http.client';

export {
  // Formatters
  CurrencyFormatter,
  PhoneFormatter,
  TextFormatter,
  NumberFormatter,
} from './formatters/format.helper';

export {
  // Validators
  Validator,
  FormValidator,
} from './validators/validation.helper';

export {
  // Helpers
  ObjectHelper,
  ArrayHelper,
  RandomHelper,
  PerformanceHelper,
  RetryHelper,
} from './helpers/general.helper';

export {
  // Date
  DateHelper,
  formatDate,
  formatDateTime,
  isValidDate,
} from './date.utils';
