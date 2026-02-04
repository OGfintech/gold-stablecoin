/**
 * STTAURX Encryption Utility
 * AES-256-GCM Encryption for KYC Documents
 *
 * Based on: Third-Party Security Audit
 * Fixes Issue #6 - KYC Document Storage vulnerability
 *
 * IMPORTANT: Documents are encrypted at rest, never stored as plain files
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;      // GCM standard: 12 bytes
const AUTH_TAG_LENGTH = 16; // GCM standard: 16 bytes
const KEY_LENGTH = 32;      // 256 bits

/**
 * Get encryption key from environment
 * In production, this should come from HSM or secure key management
 */
function getEncryptionKey() {
  const keyBase64 = process.env.KYC_ENCRYPTION_KEY;

  if (!keyBase64) {
    throw new Error('KYC_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(keyBase64, 'base64');

  if (key.length !== KEY_LENGTH) {
    throw new Error(`Invalid encryption key length: expected ${KEY_LENGTH} bytes, got ${key.length}`);
  }

  return key;
}

/**
 * Generate a new encryption key (for initial setup)
 * Run once and store securely in environment
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param {Buffer|string} data - Data to encrypt
 * @returns {Object} - { encryptedContent, iv, authTag }
 */
function encrypt(data) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  // Convert string to buffer if needed
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  const encrypted = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted,
    iv: iv,
    authTag: authTag
  };
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param {Buffer} encryptedContent - Encrypted data
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @returns {Buffer} - Decrypted data
 */
function decrypt(encryptedContent, iv, authTag) {
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedContent),
    decipher.final()
  ]);

  return decrypted;
}

/**
 * Encrypt a file buffer for KYC document storage
 *
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} filename - Original filename (also encrypted)
 * @returns {Object} - { encryptedContent, iv, authTag, encryptedFilename }
 */
function encryptKycDocument(fileBuffer, filename) {
  // Encrypt the file content
  const { encryptedContent, iv, authTag } = encrypt(fileBuffer);

  // Encrypt the filename separately (for additional privacy)
  const filenameResult = encrypt(filename);

  return {
    encryptedContent,
    iv,
    authTag,
    encryptedFilename: filenameResult.encryptedContent,
    filenameIv: filenameResult.iv,
    filenameAuthTag: filenameResult.authTag
  };
}

/**
 * Decrypt a KYC document
 *
 * @param {Buffer} encryptedContent - Encrypted file content
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @returns {Buffer} - Decrypted file content
 */
function decryptKycDocument(encryptedContent, iv, authTag) {
  return decrypt(encryptedContent, iv, authTag);
}

/**
 * Hash sensitive data (one-way, for comparison)
 * Uses SHA-256 with salt
 *
 * @param {string} data - Data to hash
 * @param {string} salt - Salt (use user ID or similar)
 * @returns {string} - Hex hash
 */
function hashData(data, salt = '') {
  return crypto
    .createHash('sha256')
    .update(salt + data)
    .digest('hex');
}

/**
 * Generate a random token (for session IDs, etc.)
 *
 * @param {number} length - Byte length (default 32)
 * @returns {string} - Hex token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID v4 (for JWT jti claim)
 *
 * @returns {string} - UUID string
 */
function generateUUID() {
  return crypto.randomUUID();
}

module.exports = {
  encrypt,
  decrypt,
  encryptKycDocument,
  decryptKycDocument,
  hashData,
  generateToken,
  generateUUID,
  generateEncryptionKey,
  ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_LENGTH
};
