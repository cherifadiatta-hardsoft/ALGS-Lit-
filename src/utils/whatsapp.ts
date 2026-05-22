import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

/**
 * Utility functions for WhatsApp integration
 */

/**
 * Dynamically detects the browser's country code to bootstrap prefix conventions.
 */
export const getBrowserCountryCode = (): CountryCode => {
  try {
    const locale = navigator.language || (navigator as any).userLanguage;
    if (locale && locale.includes('-')) {
      const parts = locale.split('-');
      const country = parts[parts.length - 1].toUpperCase();
      if (country.length === 2) {
        return country as CountryCode;
      }
    }
  } catch (e) {
    console.error("Failed to auto-detect browser locale country", e);
  }
  // Standard fallback to Senegal (SN)
  return 'SN';
};

/**
 * Clears whitespaces, dashes, brackets, and leading '+' from a phone number
 * to prepare it for WhatsApp's wa.me international format (e.g., 221782632977).
 * It automatically normalizes local formats into global formats via libphonenumber-js when possible.
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  const normalizedInput = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
  
  // Try parsing with absolute country fallback (first with detected locale, then defaults)
  const defaultCountry = getBrowserCountryCode();
  let parsed = parsePhoneNumberFromString(normalizedInput);
  
  if (!parsed || !parsed.isValid()) {
    // If input had no explicit '+', try parsing relative to local client region
    parsed = parsePhoneNumberFromString(phone.trim(), defaultCountry);
  }
  
  if (parsed && parsed.isValid()) {
    const formatted = parsed.format('E.164');
    return formatted.replace('+', '');
  }

  // Fallback to manual dial code extraction if parsing failed
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

/**
 * Checks if a phone number appears to be in valid format with country code either globally or relative to current country
 */
export const isValidInternationalPhone = (phone: string): boolean => {
  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Let's check with libphonenumber-js
  const defaultCountry = getBrowserCountryCode();
  const parsedWithPlus = parsePhoneNumberFromString(trimmed.startsWith('+') ? trimmed : `+${trimmed}`);
  if (parsedWithPlus && parsedWithPlus.isValid()) {
    return true;
  }

  const parsedWithCountry = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (parsedWithCountry && parsedWithCountry.isValid()) {
    return true;
  }

  // Generic fallback checks if parser misaligns on very exotic layouts
  const cleaned = phone.replace(/\D/g, '');
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
