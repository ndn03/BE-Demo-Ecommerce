import * as crypto from 'crypto';

/**
 *
 * Remove Vietnamese accents from a string and replace them with their non-accented equivalents.
 * @param str The string to remove accents from
 * @returns A string with accents removed
 */
export const removeAccents = (str: string) => {
  // Mapping Vietnamese accented characters to their non-accented counterparts.
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
};

/**
 *
 * Convert a string into a URL-friendly slug.
 * @param text The string to convert into a slug
 * @returns The slugified version of the input string
 */
export const convertToSlug = (text: string) => {
  // Remove accents, convert to lowercase, and replace spaces with hyphens
  const cleanedText = removeAccents(text);
  return cleanedText
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w ]+/g, '') // Remove non-alphanumeric characters
    .replace(/ +/g, '-') // Replace spaces with hyphens
    .trim(); // Remove any leading/trailing whitespace
};

/**
 *
 * Convert a string into a URL-friendly slug while preserving Japanese characters.
 * @param text The string to convert into a slug
 * @returns The slugified version of the input string
 */
export const convertToSlugPreserveNonJp = (text: string) => {
  if (!text) return '';

  const hasJapanese =
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
      text,
    );

  if (hasJapanese) {
    return text
      .trim()
      .replace(/\s+/g, '-')
      .replace(
        /[^\w\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+/g,
        '',
      )
      .toLowerCase();
  }

  const cleanedText = removeAccents(text);
  return cleanedText
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim();
};

/**
 *
 * Capitalize the first letter of a string and make the rest lowercase.
 * @param text The string to capitalize
 * @returns The capitalized version of the string
 */
export const capitalize = (text: string) => {
  // Capitalize the first letter and make the rest lowercase
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Create a random code with given length using crypto.randomBytes
 * @param length The length of the code
 * @returns The random code
 */
export const createRandomCode = (length: number) => {
  const code = crypto.randomBytes(length).toString('hex');
  return code.slice(0, length);
};
