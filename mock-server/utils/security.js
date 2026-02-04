/**
 * STTAURX Security Utilities
 * Password Hashing, Rate Limiting, Security Helpers
 *
 * Based on: Third-Party Security Audit
 * Fixes Issue #5 - Bcrypt Cost Factor (upgraded to 14)
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');

// SECURITY HARDENING: Bcrypt cost factor upgraded from 12 to 14
// Audit recommendation: "For a gold-backed financial platform in 2026,
// cost 14 is recommended (16,384 iterations, ~1000ms hash time)"
const BCRYPT_COST = 14;

// Previous cost factor for migration detection
const MINIMUM_ACCEPTABLE_COST = 12;

/**
 * Hash a password using bcrypt with cost factor 14
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a hash
 *
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password hash needs to be re-hashed with higher cost
 * Used for gradual migration to cost 14
 *
 * @param {string} hash - Stored bcrypt hash
 * @returns {boolean} - True if hash should be upgraded
 */
function needsRehash(hash) {
  try {
    const currentCost = bcrypt.getRounds(hash);
    return currentCost < BCRYPT_COST;
  } catch (error) {
    // If we can't determine the cost, rehash to be safe
    return true;
  }
}

/**
 * Verify password and return whether it needs rehashing
 * Used during login to transparently upgrade old hashes
 *
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<{valid: boolean, needsRehash: boolean}>}
 */
async function verifyAndCheckRehash(password, hash) {
  const valid = await verifyPassword(password, hash);
  return {
    valid,
    needsRehash: valid && needsRehash(hash)
  };
}

/**
 * Generate a cryptographically secure random string
 *
 * @param {number} length - Length in bytes (default 32)
 * @param {string} encoding - Output encoding (default 'hex')
 * @returns {string} - Random string
 */
function generateSecureRandom(length = 32, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * Generate a JWT token ID (jti) for revocation tracking
 *
 * @returns {string} - UUID v4
 */
function generateJti() {
  return crypto.randomUUID();
}

/**
 * Hash a value using SHA-256 (for audit log chain, etc.)
 *
 * @param {string} value - Value to hash
 * @returns {string} - Hex hash
 */
function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

/**
 * Create a hash for audit log chain integrity
 *
 * @param {Object} logData - Audit log data
 * @param {string} previousHash - Hash of previous log entry
 * @returns {string} - SHA-256 hash
 */
function createAuditLogHash(logData, previousHash) {
  const payload = JSON.stringify({
    adminId: logData.adminId,
    action: logData.action,
    entityType: logData.entityType,
    entityId: logData.entityId,
    timestamp: logData.timestamp || new Date().toISOString(),
    previousHash: previousHash || 'GENESIS'
  });

  return sha256(payload);
}

/**
 * Validate password strength
 *
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/,           // 3+ repeated characters
    /^123|^abc|^qwerty/i,  // Common sequences
    /password/i,           // "password" anywhere
    /^.{0,7}$/             // Too short
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns or is too weak');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input (basic XSS prevention)
 *
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Mask sensitive data for logging
 *
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of visible characters at start/end
 * @returns {string} - Masked value
 */
function maskSensitiveData(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars * 2) {
    return '****';
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars * 2, 8));

  return `${start}${masked}${end}`;
}

module.exports = {
  hashPassword,
  verifyPassword,
  needsRehash,
  verifyAndCheckRehash,
  generateSecureRandom,
  generateJti,
  sha256,
  createAuditLogHash,
  validatePasswordStrength,
  sanitizeInput,
  maskSensitiveData,
  BCRYPT_COST,
  MINIMUM_ACCEPTABLE_COST
};
