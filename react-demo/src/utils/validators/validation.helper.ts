/**
 * ✅ **Validation Utilities**
 *
 * Comprehensive validation helpers for forms and data
 */

import { VALIDATION_RULES } from '../constants/app.constants';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class Validator {
  /**
   * Email validation
   */
  static email(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }

    if (!VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
      return { isValid: false, message: VALIDATION_RULES.EMAIL.MESSAGE };
    }

    return { isValid: true };
  }

  /**
   * Password validation
   */
  static password(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      return {
        isValid: false,
        message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long`,
      };
    }

    if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
      return {
        isValid: false,
        message: `Password must be less than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters long`,
      };
    }

    if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
      return { isValid: false, message: VALIDATION_RULES.PASSWORD.MESSAGE };
    }

    return { isValid: true };
  }

  /**
   * Phone validation
   */
  static phone(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: false, message: 'Phone number is required' };
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Vietnamese phone number validation
    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      return { isValid: true };
    }

    if (cleanPhone.length === 11 && cleanPhone.startsWith('84')) {
      return { isValid: true };
    }

    return { isValid: false, message: VALIDATION_RULES.PHONE.MESSAGE };
  }

  /**
   * Required field validation
   */
  static required(value: any, fieldName = 'This field'): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, message: `${fieldName} is required` };
    }

    if (typeof value === 'string' && value.trim() === '') {
      return { isValid: false, message: `${fieldName} is required` };
    }

    return { isValid: true };
  }

  /**
   * Minimum length validation
   */
  static minLength(
    value: string,
    minLength: number,
    fieldName = 'This field',
  ): ValidationResult {
    if (value.length < minLength) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${minLength} characters long`,
      };
    }

    return { isValid: true };
  }

  /**
   * Maximum length validation
   */
  static maxLength(
    value: string,
    maxLength: number,
    fieldName = 'This field',
  ): ValidationResult {
    if (value.length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName} must be less than ${maxLength} characters long`,
      };
    }

    return { isValid: true };
  }

  /**
   * Number validation
   */
  static number(value: any, fieldName = 'This field'): ValidationResult {
    const num = Number(value);

    if (isNaN(num)) {
      return { isValid: false, message: `${fieldName} must be a valid number` };
    }

    return { isValid: true };
  }

  /**
   * Positive number validation
   */
  static positiveNumber(
    value: any,
    fieldName = 'This field',
  ): ValidationResult {
    const numberResult = this.number(value, fieldName);
    if (!numberResult.isValid) return numberResult;

    const num = Number(value);
    if (num <= 0) {
      return {
        isValid: false,
        message: `${fieldName} must be a positive number`,
      };
    }

    return { isValid: true };
  }

  /**
   * URL validation
   */
  static url(url: string): ValidationResult {
    if (!url) {
      return { isValid: false, message: 'URL is required' };
    }

    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, message: 'Please enter a valid URL' };
    }
  }

  /**
   * File validation
   */
  static file(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {},
  ): ValidationResult {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return {
        isValid: false,
        message: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(
          ', ',
        )}`,
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        message: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(
          ', ',
        )}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Confirm password validation
   */
  static confirmPassword(
    password: string,
    confirmPassword: string,
  ): ValidationResult {
    if (password !== confirmPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }

    return { isValid: true };
  }

  /**
   * Date validation
   */
  static date(dateStr: string): ValidationResult {
    if (!dateStr) {
      return { isValid: false, message: 'Date is required' };
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Please enter a valid date' };
    }

    return { isValid: true };
  }

  /**
   * Date range validation
   */
  static dateRange(startDate: string, endDate: string): ValidationResult {
    const startResult = this.date(startDate);
    if (!startResult.isValid) return startResult;

    const endResult = this.date(endDate);
    if (!endResult.isValid) return endResult;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return { isValid: false, message: 'End date must be after start date' };
    }

    return { isValid: true };
  }

  /**
   * Vietnamese ID card validation
   */
  static vietnameseId(id: string): ValidationResult {
    if (!id) {
      return { isValid: false, message: 'ID card number is required' };
    }

    // Remove spaces and hyphens
    const cleanId = id.replace(/[\s-]/g, '');

    // Old format: 9 digits
    // New format: 12 digits
    if (!/^\d{9}$|^\d{12}$/.test(cleanId)) {
      return {
        isValid: false,
        message: 'ID card number must be 9 or 12 digits',
      };
    }

    return { isValid: true };
  }
}

/**
 * 📋 **Form Validation Helper**
 */
export class FormValidator {
  private errors: Record<string, string> = {};

  validate(field: string, value: any, rules: ValidationRule[]): boolean {
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        this.errors[field] = result.message || 'Invalid value';
        return false;
      }
    }

    delete this.errors[field];
    return true;
  }

  validateAll(
    data: Record<string, any>,
    rules: Record<string, ValidationRule[]>,
  ): boolean {
    this.errors = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const fieldValid = this.validate(field, data[field], fieldRules);
      if (!fieldValid) {
        isValid = false;
      }
    }

    return isValid;
  }

  getErrors(): Record<string, string> {
    return { ...this.errors };
  }

  getError(field: string): string | undefined {
    return this.errors[field];
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  clearErrors(): void {
    this.errors = {};
  }

  clearError(field: string): void {
    delete this.errors[field];
  }
}

export type ValidationRule = (value: any) => ValidationResult;
