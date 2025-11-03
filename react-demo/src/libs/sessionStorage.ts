import logger from './logger'

/**
 * Stores a value in sessionStorage under the specified key.
 * @param key - The key to store the value under.
 * @param value - The value to store (can be of any data type).
 */
export const setSessionStorage = (key: string, value: any): void => {
  try {
    const serializedValue = JSON.stringify(value)
    sessionStorage.setItem(key, serializedValue)
  } catch (error) {
    logger.error('🚀 ~ Error saving to sessionStorage:', error)
  }
}

/**
 * Retrieves a value from sessionStorage by its key.
 * @param key - The key of the value to retrieve.
 * @returns The parsed value from sessionStorage or null if not found or if an error occurs.
 */
export const getSessionStorage = <T>(key: string): T | null => {
  try {
    const serializedValue = sessionStorage.getItem(key)
    if (serializedValue === null) return null
    return JSON.parse(serializedValue) as T
  } catch (error) {
    logger.error('🚀 ~ Error retrieving from sessionStorage:', error)
    return null
  }
}

/**
 * Removes a specific key and its associated value from sessionStorage.
 * @param key - The key of the value to remove.
 */
export const removeSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    logger.error('🚀 ~ Error removing from sessionStorage:', error)
  }
}

/**
 * Clears all data stored in sessionStorage.
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.clear()
  } catch (error) {
    logger.error('🚀 ~ Error clearing sessionStorage:', error)
  }
}

/**
 * Checks if a specific key exists in sessionStorage.
 * @param key - The key to check for existence.
 * @returns True if the key exists, false otherwise.
 */
export const hasSessionStorage = (key: string): boolean => {
  try {
    return sessionStorage.getItem(key) !== null
  } catch (error) {
    logger.error('🚀 ~ Error checking sessionStorage:', error)
    return false
  }
}
