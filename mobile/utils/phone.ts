/**
 * Phone Number & Email Validation and Normalization Utilities for KalaMitra / DIY-Nest.
 */

/**
 * Checks if the given identifier string is an email address.
 */
export function isEmail(identifier: string): boolean {
  if (!identifier) return false;
  const trimmed = identifier.trim();
  return trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Normalizes Indian and International phone numbers into standard E.164 format (+XXXXXXXXXXX).
 *
 * Examples:
 * - "9876543210"        -> "+919876543210"
 * - "98765 43210"       -> "+919876543210"
 * - "+919876543210"     -> "+919876543210"
 * - "+91 98765 43210"   -> "+919876543210"
 * - "09876543210"       -> "+919876543210"
 * - "919876543210"      -> "+919876543210"
 * - "+1 (555) 123-4567" -> "+15551234567"
 */
export function normalizePhoneNumber(input: string): string {
  if (!input) return '';

  let cleaned = input.trim();

  // If already starts with '+', strip all spaces, dashes, parentheses and non-digits
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return `+${digits}`;
  }

  // Remove any non-digits
  const digitsOnly = cleaned.replace(/\D/g, '');

  // 10 digits (Standard Indian mobile number without country code)
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // 12 digits starting with 91 (e.g. 919876543210)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // Fallback: prefix with '+' for generic international digits
  return `+${digitsOnly}`;
}

/**
 * Validates whether the normalized string is a valid E.164 phone number.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // E.164: '+' followed by 7 to 15 digits
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
