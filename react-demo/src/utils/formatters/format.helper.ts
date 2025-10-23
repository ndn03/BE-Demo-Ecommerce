/**
 * 💰 **Currency Formatter**
 */
export class CurrencyFormatter {
  static formatVND(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return '0₫';

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }

  static formatNumber(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return '0';

    return new Intl.NumberFormat('vi-VN').format(numAmount);
  }

  static parseVND(formattedAmount: string): number {
    // Remove currency symbol and separators
    const numStr = formattedAmount.replace(/[₫\s.,]/g, '');
    return parseFloat(numStr) || 0;
  }
}

/**
 * 📞 **Phone Formatter**
 */
export class PhoneFormatter {
  static formatVietnamese(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Check if it's a Vietnamese phone number
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11 && digits.startsWith('84')) {
      return `+84-${digits.slice(2, 5)}-${digits.slice(5, 8)}-${digits.slice(
        8,
      )}`;
    }

    return phone;
  }

  static normalizeVietnamese(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    // Convert +84 to 0
    if (digits.startsWith('84') && digits.length === 11) {
      return '0' + digits.slice(2);
    }

    return digits;
  }
}

/**
 * ✂️ **Text Formatter**
 */
export class TextFormatter {
  static truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map((word) => this.capitalize(word))
      .join(' ');
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  static removeHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  static highlightText(text: string, search: string): string {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

/**
 * 📊 **Number Formatter**
 */
export class NumberFormatter {
  static formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static formatCompactNumber(value: number): string {
    const formatter = new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
    });

    return formatter.format(value);
  }
}
