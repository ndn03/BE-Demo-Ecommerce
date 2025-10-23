/**
 * 💾 **Storage Utilities**
 *
 * Unified interface for localStorage operations with error handling
 */

import { STORAGE_KEYS } from '../constants/app.constants';

export class StorageHelper {
  /**
   * Get item from localStorage with error handling
   */
  static getItem<T = string>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set item to localStorage with error handling
   */
  static setItem<T>(key: string, value: T): boolean {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error setting item to localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 🔐 **Auth Storage Utilities**
 *
 * Specialized storage utilities for authentication data
 */
export class AuthStorage {
  static getAccessToken(): string | null {
    return StorageHelper.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static setAccessToken(token: string): boolean {
    return StorageHelper.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static getRefreshToken(): string | null {
    return StorageHelper.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static setRefreshToken(token: string): boolean {
    return StorageHelper.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  static getUser(): any | null {
    return StorageHelper.getItem<any>(STORAGE_KEYS.USER);
  }

  static setUser(user: any): boolean {
    return StorageHelper.setItem(STORAGE_KEYS.USER, user);
  }

  static clearAuth(): boolean {
    const results = [
      StorageHelper.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      StorageHelper.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      StorageHelper.removeItem(STORAGE_KEYS.USER),
    ];
    return results.every(Boolean);
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }
}

/**
 * 🎨 **Theme Storage Utilities**
 */
export class ThemeStorage {
  static getTheme(): string | null {
    return StorageHelper.getItem<string>(STORAGE_KEYS.THEME);
  }

  static setTheme(theme: string): boolean {
    return StorageHelper.setItem(STORAGE_KEYS.THEME, theme);
  }

  static getLanguage(): string | null {
    return StorageHelper.getItem<string>(STORAGE_KEYS.LANGUAGE);
  }

  static setLanguage(language: string): boolean {
    return StorageHelper.setItem(STORAGE_KEYS.LANGUAGE, language);
  }
}
