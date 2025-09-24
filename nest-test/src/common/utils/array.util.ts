/**
 *
 * Removes duplicates from an array (deep equality).
 * @param array The array from which duplicates should be removed
 * @returns A new array without duplicates (deep compare)
 */
export function uniqueArray<T>(array: T[]): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const key =
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Returns an array of duplicate elements (deep equality).
 * @param array The array to check
 * @returns Array of duplicated elements (each value appears only once)
 */
export function findDuplicatesInArray<T>(array: T[]): T[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const result: T[] = [];

  array.forEach((item) => {
    const key =
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item);
    if (seen.has(key)) {
      if (!duplicates.has(key)) {
        result.push(item);
        duplicates.add(key);
      }
    } else {
      seen.add(key);
    }
  });

  return result;
}

/**
 * Returns an array of unique elements that appear only once in the input array (deep equality).
 * @param array The array to check
 * @returns Array of elements that appear exactly once
 */
export function findUniqueElementsInArray<T>(array: T[]): T[] {
  const countMap = new Map<string, { count: number; item: T }>();

  array.forEach((item) => {
    const key =
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item);
    if (countMap.has(key)) {
      countMap.get(key)!.count += 1;
    } else {
      countMap.set(key, { count: 1, item });
    }
  });

  return Array.from(countMap.values())
    .filter((entry) => entry.count === 1)
    .map((entry) => entry.item);
}
