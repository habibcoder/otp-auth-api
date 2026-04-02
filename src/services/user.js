/**
 * User management service with in-memory storage.
 * Handles user registration, authentication tracking, and profile management.
 * 
 * Note: Replace with database-backed implementation in production.
 * 
 * @typedef {Object} UserRecord
 * @property {string} registeredAt - ISO timestamp of registration
 * @property {string} lastLogin - ISO timestamp of last login
 */

/** @type {Record<string, UserRecord>} In-memory user store */
const store = {};

/**
 * Check if a phone number has a registered user record.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if user exists, false otherwise
 */
function exists(phone) {
  return Object.prototype.hasOwnProperty.call(store, phone);
}

/**
 * Create or update a user record for the given phone number.
 * Sets registration timestamp on creation, updates last login on existing users.
 * @param {string} phone - Normalized phone number
 * @returns {UserRecord} The created or updated user record
 */
function upsert(phone) {
  const now = new Date().toISOString();
  
  store[phone] = {
    registeredAt: exists(phone) ? store[phone].registeredAt : now,
    lastLogin: now,
  };
  
  return store[phone];
}

/**
 * Retrieve a user record by phone number.
 * @param {string} phone - Normalized phone number
 * @returns {UserRecord | null} User record or null if not found
 */
function get(phone) {
  return store[phone] ?? null;
}

/**
 * Get all registered users as an array.
 * @returns {Array<{phone: string, registeredAt: string, lastLogin: string}>} Array of user records with phone numbers
 */
function getAll() {
  return Object.entries(store).map(([phone, record]) => ({
    phone,
    ...record,
  }));
}

/**
 * Delete a user record.
 * @param {string} phone - Normalized phone number
 * @returns {boolean} True if user was deleted, false if didn't exist
 */
function remove(phone) {
  if (!exists(phone)) {
    return false;
  }
  delete store[phone];
  return true;
}

/**
 * Get count of registered users.
 * @returns {number} Total number of registered users
 */
function getCount() {
  return Object.keys(store).length;
}

module.exports = { exists, upsert, get, getAll, remove, getCount };
