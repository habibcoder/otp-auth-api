const crypto = require("crypto");

/**
 * Phone number validation and normalization utilities for Bangladeshi numbers.
 * Supports formats: 01XXXXXXXXX, 8801XXXXXXXXX, 1XXXXXXXXX (10 digits)
 */

/**
 * Normalize a raw phone string to standard format: 8801XXXXXXXXX
 * @param {string} phone - Raw phone number input
 * @returns {string} Normalized phone number in format 8801XXXXXXXXX
 * @throws {Error} When phone number is empty or invalid
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") {
    throw new Error("Phone number must be a non-empty string.");
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Phone number cannot be empty.");
  }

  let normalized;
  
  // Determine normalization strategy based on input format
  if (digits.startsWith("8801")) {
    // Already in correct format with country code
    normalized = digits;
  } else if (digits.startsWith("01")) {
    // Format: 01XXXXXXXXX -> replace leading 0 with 880
    normalized = "880" + digits.slice(1);
  } else if (digits.length === 10) {
    // Format: 1XXXXXXXXX (10 digits) -> add country code 880
    normalized = "880" + digits;
  } else {
    throw new Error(
      `Invalid phone number format. Expected formats: 01XXXXXXXXX, 8801XXXXXXXXX, or 1XXXXXXXXX. Received: ${phone}`
    );
  }

  // Validate final format: must be 13 digits starting with 8801,
  // followed by operator code (3-9) and 8 more digits
  if (!isValidFormat(normalized)) {
    throw new Error(
      `Invalid Bangladeshi phone number. Must start with 8801 and have valid operator code (3-9). Received: ${normalized}`
    );
  }

  return normalized;
}

/**
 * Validate if a phone number matches the expected Bangladeshi mobile format.
 * @private
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if valid format, false otherwise
 */
function isValidFormat(phone) {
  return /^8801[3-9]\d{8}$/.test(phone);
}

/**
 * Check if a phone string is a valid Bangladeshi mobile number.
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidBDPhone(phone) {
  try {
    normalizePhone(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt() for secure random number generation.
 * @returns {string} 6-digit OTP as zero-padded string
 */
function generateOTP() {
  // Generate random number between 100000 and 999999 (inclusive)
  const otp = crypto.randomInt(100_000, 1_000_000);
  return otp.toString().padStart(6, "0"); // Ensure 6 digits with leading zeros if needed
}

module.exports = { normalizePhone, isValidBDPhone, generateOTP };
