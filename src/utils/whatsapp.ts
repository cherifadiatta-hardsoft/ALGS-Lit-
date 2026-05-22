/**
 * Utility functions for WhatsApp integration
 */

/**
 * Clears whitespaces, dashes, brackets, and leading '+' from a phone number
 * to prepare it for WhatsApp's wa.me international format format (e.g., 221782632977).
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-digit characters except maybe keeping the number structure
  let cleaned = phone.replace(/\D/g, '');
  
  // If the number starts with 00, replace with just the rest
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  return cleaned;
};

/**
 * Checks if a phone number appears to be in format with country code
 * e.g., at least 8 to 15 digits
 */
export const isValidInternationalPhone = (phone: string): boolean => {
  const cleaned = formatPhoneForWhatsApp(phone);
  return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Generates the wa.me WhatsApp API link
 */
export const createWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
};
