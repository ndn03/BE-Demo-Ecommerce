// Email validation regex pattern
export const emailRegex =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// Function to check if the given email is valid
export const isValidEmail = (email: string): boolean => emailRegex.test(email);

// Slug validation regex pattern (only lowercase letters, numbers, and hyphens)
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Function to check if the given slug is valid
export const isValidSlug = (slug: string): boolean => slugRegex.test(slug);

// Password validation regex pattern (requires at least one digit, one special character, and 6-15 characters)
export const pwdStrongRegex =
  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,15}$/;
// Function to check if the given password is strong
export const isStrongPassword = (password: string): boolean =>
  pwdStrongRegex.test(password);

// Uppercase letters only validation regex pattern
export const azUppercaseRegex = /^[A-Z]*$/;
// Function to check if the given string contains only uppercase letters
export const isAllUppercase = (text: string): boolean =>
  azUppercaseRegex.test(text);

// Username validation regex pattern (allows alphanumeric characters, underscores, and periods, 3 to 30 characters long)
export const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
// Function to check if the given username is valid
export const isValidUsername = (username: string): boolean =>
  usernameRegex.test(username);

// Alphabet letters only validation regex pattern (allows upper and lower case letters only)
export const alphabetRegex = /^[a-zA-Z]*$/;
// Function to check if the given string contains only alphabetic characters
export const isAlphabetOnly = (text: string): boolean =>
  alphabetRegex.test(text);

// Post type validation regex pattern (only lowercase letters and hyphens)
export const postTypeRegex = /^[a-z-]+$/;
// Function to check if the given post type is valid
export const isValidPostType = (text: string): boolean =>
  postTypeRegex.test(text);

// Capital letters or underscores only validation regex pattern
export const capitalLettersUnderscoresRegex = /^[A-Z_]+$/;
// Function to check if the given text contains only uppercase letters or underscores
export const isValidCapitalLettersOrUnderscores = (text: string): boolean =>
  capitalLettersUnderscoresRegex.test(text);

// Regex pattern (any character except whitespace)
export const noWhitespaceRegex = /^\S*$/;
// Function to check if the given text does not contain any whitespace
export const containsNoWhitespace = (text: string): boolean =>
  noWhitespaceRegex.test(text);

// Regex pattern (only alphanumeric characters and special characters)
export const regexAlphaNumSpecial =
  /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
// Function to check if the given text contains only alphanumeric characters and special characters
export const isAlphaNumSpecial = (text: string): boolean =>
  regexAlphaNumSpecial.test(text);
