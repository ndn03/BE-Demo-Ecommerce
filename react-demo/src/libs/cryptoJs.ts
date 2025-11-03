import logger from './logger';

const SECRET_KEY = 'ZyyDmMGAZvDzbgfKhPRFpgnLqvHGM49W';

/**
 * Simple base64 encoding for basic data protection
 * @param data - The data to encode (can be string, object, or number).
 * @returns Encoded data as a string.
 */
export const encodeData = (data: any): string => {
  try {
    const serializedData = JSON.stringify(data);
    // Simple base64 encoding with secret key
    const combined = `${SECRET_KEY}:${serializedData}`;
    return btoa(combined);
  } catch (error) {
    logger.error('Error encoding data:', error);
    throw new Error('Failed to encode data');
  }
};

/**
 * Decodes base64 encoded data back to its original form.
 * @param encodedData - The encoded string.
 * @returns The original data (parsed as JSON or raw string).
 */
export const decodeData = <T>(encodedData: string): T | null => {
  try {
    const decoded = atob(encodedData);
    const [key, serializedData] = decoded.split(':');

    if (key !== SECRET_KEY) {
      throw new Error('Invalid key');
    }

    return JSON.parse(serializedData) as T;
  } catch (error) {
    logger.error('Error decoding data:', error);
    return null;
  }
};
