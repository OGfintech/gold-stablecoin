/**
 * STTAURX JWT Token Blacklist Middleware
 * Redis-based token revocation system
 *
 * Based on: Third-Party Security Audit
 * Fixes Issue #3 - JWT Revocation Complexity
 *
 * "Without a blacklist mechanism, a stolen 7-day refresh token could
 * allow an attacker persistent access until it naturally expires."
 */

const { redis } = require('../database/db');

// Redis key prefixes
const TOKEN_BLACKLIST_PREFIX = 'blacklist:token:';
const USER_TOKEN_VERSION_PREFIX = 'token_version:';

/**
 * Add a specific token to the blacklist
 * Called on logout, password change, or when compromise is detected
 *
 * @param {string} tokenId - JWT ID (jti claim)
 * @param {number} expiresInSeconds - TTL (should match token expiry)
 * @param {string} reason - Reason for revocation (audit trail)
 * @returns {Promise<void>}
 */
async function revokeToken(tokenId, expiresInSeconds, reason = 'logout') {
  const key = `${TOKEN_BLACKLIST_PREFIX}${tokenId}`;

  // Store with TTL matching token expiry (auto-cleanup)
  await redis.setex(key, expiresInSeconds, JSON.stringify({
    reason,
    revokedAt: new Date().toISOString()
  }));
}

/**
 * Check if a specific token has been revoked
 *
 * @param {string} tokenId - JWT ID (jti claim)
 * @returns {Promise<boolean>} - True if token is revoked
 */
async function isTokenRevoked(tokenId) {
  const key = `${TOKEN_BLACKLIST_PREFIX}${tokenId}`;
  const result = await redis.get(key);
  return result !== null;
}

/**
 * Get the current token version for a user
 * Used for mass revocation (e.g., password change revokes all tokens)
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Current token version
 */
async function getUserTokenVersion(userId) {
  const key = `${USER_TOKEN_VERSION_PREFIX}${userId}`;
  const version = await redis.get(key);
  return parseInt(version, 10) || 0;
}

/**
 * Increment user's token version (revokes ALL existing tokens)
 * Called on: password change, account compromise, admin force logout
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} - New token version
 */
async function revokeAllUserTokens(userId) {
  const key = `${USER_TOKEN_VERSION_PREFIX}${userId}`;
  const newVersion = await redis.incr(key);
  return newVersion;
}

/**
 * Middleware to check token blacklist
 * Add to protected routes after JWT verification
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function checkTokenBlacklist(req, res, next) {
  try {
    // Get JWT ID from decoded token (set by JWT middleware)
    const tokenId = req.user?.jti;
    const userId = req.user?.userId;
    const tokenVersion = req.user?.version;

    if (!tokenId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: missing token ID'
      });
    }

    // Check if specific token is blacklisted
    if (await isTokenRevoked(tokenId)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Check if user's token version has changed (mass revocation)
    if (userId && tokenVersion !== undefined) {
      const currentVersion = await getUserTokenVersion(userId);
      if (tokenVersion < currentVersion) {
        return res.status(401).json({
          success: false,
          error: 'Session expired due to security update. Please login again.',
          code: 'TOKEN_VERSION_MISMATCH'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Token blacklist check error:', error);
    // Fail closed: if we can't check, deny access
    return res.status(500).json({
      success: false,
      error: 'Unable to verify token status'
    });
  }
}

/**
 * Revocation reasons for audit trail
 */
const RevocationReason = {
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  COMPROMISED: 'compromised',
  ADMIN_REVOKE: 'admin_revoke',
  MFA_ENABLED: 'mfa_enabled',
  ACCOUNT_LOCKED: 'account_locked'
};

/**
 * Clean up expired entries from database backup
 * Redis handles its own TTL cleanup, but we also store in PostgreSQL
 * Run this as a scheduled job
 *
 * @param {Object} prisma - Prisma client
 * @returns {Promise<number>} - Number of entries deleted
 */
async function cleanupExpiredTokens(prisma) {
  const result = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  return result.count;
}

module.exports = {
  revokeToken,
  isTokenRevoked,
  getUserTokenVersion,
  revokeAllUserTokens,
  checkTokenBlacklist,
  cleanupExpiredTokens,
  RevocationReason
};
