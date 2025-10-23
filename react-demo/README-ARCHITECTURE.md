# 🏗️ React Demo - Utility/Helper Pattern Architecture

## 📁 Project Structure

```
src/
├── utils/                          # 🔧 Utility/Helper Layer
│   ├── constants/                  # 📋 Application Constants
│   │   ├── app.constants.ts        # Main app constants
│   │   └── index.ts
│   ├── storage/                    # 💾 Storage Utilities
│   │   ├── storage.helper.ts       # LocalStorage abstraction
│   │   └── index.ts
│   ├── http/                       # 🌐 HTTP Client Utilities
│   │   ├── http.client.ts          # Axios wrapper with interceptors
│   │   └── index.ts
│   ├── formatters/                 # 💱 Data Formatters
│   │   ├── format.helper.ts        # Currency, phone, text formatters
│   │   └── index.ts
│   ├── validators/                 # ✅ Validation Utilities
│   │   ├── validation.helper.ts    # Form validation helpers
│   │   └── index.ts
│   ├── helpers/                    # 🔧 General Helpers
│   │   ├── general.helper.ts       # Object, Array, Performance helpers
│   │   └── index.ts
│   ├── date.utils.ts               # 📅 Enhanced Date Utilities
│   └── index.ts                    # Central export point
├── services/                       # 🔌 API Service Layer
│   ├── auth.service.v2.ts          # Enhanced auth service
│   ├── user.service.ts
│   ├── order.service.ts
│   └── ...
├── components/                     # 🧩 Reusable Components
├── pages/                         # 📄 Page Components
└── ...
```

## 🎯 Architecture Principles

### 1. **Utility/Helper Pattern**

- **Single Responsibility**: Each utility has one clear purpose
- **Stateless Functions**: Pure functions without side effects
- **Reusability**: Can be used across different modules
- **Testability**: Easy to unit test in isolation

### 2. **Separation of Concerns**

- **Constants**: Application-wide configuration
- **Storage**: Data persistence abstraction
- **HTTP**: Network communication layer
- **Formatters**: Data presentation utilities
- **Validators**: Input validation logic
- **Helpers**: General purpose utilities

### 3. **TypeScript Integration**

- **Strong Typing**: Full TypeScript support
- **Interface Definitions**: Clear contracts
- **Generic Utilities**: Reusable with different types
- **Compile-time Safety**: Catch errors early

## 🔧 Utility Categories

### 📋 Constants (`utils/constants/`)

Centralized configuration and constant values.

```typescript
import {
  API_ENDPOINTS,
  ORDER_STATUS,
  VALIDATION_RULES,
} from '@/utils/constants';

// Usage
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
const pendingStatus = ORDER_STATUS.PENDING;
```

### 💾 Storage (`utils/storage/`)

Abstracted localStorage operations with error handling.

```typescript
import { AuthStorage, StorageHelper } from '@/utils/storage';

// Usage
AuthStorage.setAccessToken(token);
const user = AuthStorage.getUser();
StorageHelper.setItem('theme', 'dark');
```

### 🌐 HTTP (`utils/http/`)

Centralized HTTP client with interceptors and error handling.

```typescript
import { httpClient, get, post } from '@/utils/http';

// Usage
const response = await get<User[]>('/users');
const newUser = await post<User>('/users', userData);
```

### 💱 Formatters (`utils/formatters/`)

Data formatting utilities for consistent presentation.

```typescript
import {
  CurrencyFormatter,
  DateHelper,
  TextFormatter,
} from '@/utils/formatters';

// Usage
const price = CurrencyFormatter.formatVND(100000); // "100.000₫"
const date = DateHelper.formatDisplay(new Date()); // "23/10/2025"
const slug = TextFormatter.slugify('Hello World'); // "hello-world"
```

### ✅ Validators (`utils/validators/`)

Input validation with consistent error messages.

```typescript
import { Validator, FormValidator } from '@/utils/validators';

// Usage
const emailResult = Validator.email('test@example.com');
const phoneResult = Validator.phone('0123456789');

// Form validation
const formValidator = new FormValidator();
formValidator.validateAll(data, {
  email: [Validator.required, Validator.email],
  password: [Validator.required, Validator.password],
});
```

### 🔧 Helpers (`utils/helpers/`)

General purpose utility functions.

```typescript
import { ObjectHelper, ArrayHelper, PerformanceHelper } from '@/utils/helpers';

// Usage
const cloned = ObjectHelper.deepClone(complexObject);
const unique = ArrayHelper.unique([1, 2, 2, 3]);
const debounced = PerformanceHelper.debounce(searchFunction, 300);
```

## 🚀 Usage Examples

### Enhanced Service Layer

```typescript
// services/auth.service.v2.ts
import { httpClient } from '../utils/http';
import { AuthStorage } from '../utils/storage';
import { Validator } from '../utils/validators';
import { API_ENDPOINTS } from '../utils/constants';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validate input
    const emailValidation = Validator.email(credentials.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    // Make API call
    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );

    // Store result
    AuthStorage.setAccessToken(response.data.access_token);
    return response.data;
  }
}
```

### Component Integration

```typescript
// components/AdminDashboard.tsx
import React from 'react';
import {
  CurrencyFormatter,
  DateHelper,
  ORDER_STATUS,
  ORDER_STATUS_COLORS,
} from '@/utils';

const AdminDashboard = () => {
  const formatOrderAmount = (amount: number) => {
    return CurrencyFormatter.formatVND(amount);
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status] || '#default';
  };

  // Component logic...
};
```

## 💡 Benefits

### 1. **Code Reusability**

- Utilities can be used across different components and services
- Consistent behavior throughout the application
- Reduced code duplication

### 2. **Maintainability**

- Changes to utilities propagate automatically
- Single source of truth for common operations
- Easy to update and extend functionality

### 3. **Testability**

- Utilities are pure functions, easy to test
- Mock utilities for component testing
- Isolated testing of business logic

### 4. **Type Safety**

- Full TypeScript support with proper typing
- Compile-time error detection
- Better IDE support and autocomplete

### 5. **Performance**

- Optimized utility functions
- Built-in performance helpers (debounce, throttle)
- Efficient data processing

## 🔄 Migration Guide

### From Old Structure

```typescript
// Old way
import { formatDate } from '../../utils/date.utils';
import axios from 'axios';

const date = formatDate(new Date());
const response = await axios.get('/api/users');
```

### To New Structure

```typescript
// New way
import { DateHelper, httpClient } from '@/utils';

const date = DateHelper.formatDisplay(new Date());
const response = await httpClient.get<User[]>('/users');
```

## 🧪 Testing Strategy

### Unit Testing Utilities

```typescript
// tests/utils/formatters.test.ts
import { CurrencyFormatter } from '@/utils/formatters';

describe('CurrencyFormatter', () => {
  it('should format VND currency correctly', () => {
    expect(CurrencyFormatter.formatVND(100000)).toBe('100.000₫');
  });
});
```

### Integration Testing

```typescript
// tests/services/auth.test.ts
import { AuthService } from '@/services/auth.service.v2';
import { httpClient } from '@/utils/http';

jest.mock('@/utils/http');

describe('AuthService', () => {
  it('should login successfully', async () => {
    // Test implementation...
  });
});
```

## 📚 Best Practices

1. **Keep Utilities Pure**: No side effects, same input = same output
2. **Use TypeScript**: Strong typing for better developer experience
3. **Error Handling**: Graceful error handling in utilities
4. **Documentation**: Clear JSDoc comments for all utilities
5. **Consistent Naming**: Follow naming conventions
6. **Performance**: Optimize for common use cases
7. **Testing**: Comprehensive unit tests for utilities

## 🔮 Future Enhancements

- [ ] Add logging utilities
- [ ] Implement caching helpers
- [ ] Add more validation rules
- [ ] Create animation utilities
- [ ] Add internationalization helpers
- [ ] Implement theme utilities
- [ ] Add accessibility helpers

## 📖 References

- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [React Patterns](https://reactpatterns.com/)
- [Testing Utilities](https://testing-library.com/docs/)
