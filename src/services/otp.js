const { OTP } = require("../config/env");

/**
 * OTP (One-Time Password) service for managing verification codes.
 * Uses in-memory storage - replace with Redis/database in production.
 * 
 * @typedef {Object} OTPRecord
 * @property {string} otp - The OTP code
 * @property {number} expiresAt - Timestamp when OTP expires
 * @property {number} attempts - Number of failed verification attempts
 */

/** @type {Record<string, OTPRecord>} In-memory OTP store */
const store = {};

/**
 * Store a new OTP for the given phone number.
 * Resets attempt counter to zero.
 * @param {string} phone - Normalized phone number
 * @param {string} otp - OTP code to store
 * @returns {void}
 */
function set(phone, otp) {
  store[phone] = {
    otp,
    expiresAt: Date.now() + OTP.EXPIRY_MS,
    attempts: 0,
  };
}

/**
 * Retrieve OTP record for a phone number.
 * @param {string} phone - Normalized phone number
 * @returns {OTPRecord | null} OTP record or null if not found
 */
function get(phone) {
  return store[phone] ?? null;
}

/**
 * Delete OTP record for a phone number.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if deleted, false if didn't exist
 */
function remove(phone) {
  const existed = phone in store;
  delete store[phone];
  return existed;
}

/**
 * Check if enough time has passed to allow OTP resend.
 * Returns true if an OTP was issued within the cooldown window.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if must wait before resending, false if can resend
 */
function isFresh(phone) {
  const record = store[phone];
  if (!record) return false;
  
  const timeSinceCreation = Date.now() - (record.expiresAt - OTP.EXPIRY_MS);
  return timeSinceCreation < OTP.RESEND_COOLDOWN_MS;
}

/**
 * Check if OTP has expired.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if expired, false if still valid
 */
function isExpired(phone) {
  const record = store[phone];
  return record ? Date.now() > record.expiresAt : true;
}

/**
 * Check if phone number is locked due to too many failed attempts.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if locked out, false if attempts remaining
 */
function isLocked(phone) {
  const record = store[phone];
  return record ? record.attempts >= OTP.MAX_ATTEMPTS : false;
}

/**
 * Increment failed verification attempt counter.
 * @param {string} phone - Normalized phone number
 * @returns {number} Updated attempt count
 */
function incrementAttempts(phone) {
  if (!store[phone]) {
    return 0;
  }
  store[phone].attempts += 1;
  return store[phone].attempts;
}

/**
 * Get remaining attempts for verification.
 * @param {string} phone - Normalized phone number
 * @returns {number} Number of attempts remaining
 */
function getRemainingAttempts(phone) {
  const record = store[phone];
  if (!record) return 0;
  return Math.max(0, OTP.MAX_ATTEMPTS - record.attempts);
}

module.exports = { 
  set, 
  get, 
  remove, 
  isFresh, 
  isExpired, 
  isLocked, 
  incrementAttempts,
  getRemainingAttempts
};
