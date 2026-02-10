/**
 * STTAURX JWT Authentication Middleware
 * Verifies JWT tokens and attaches user context to requests
 *
 * Security Hardening — Phase 2: Authentication Foundation
 */

const jwt = require('jsonwebtoken');
const { checkTokenBlacklist } = require('./tokenBlacklist');

const JWT_SECRET = process.env.JWT_SECRET || 'sttaurx_dev_jwt_secret_key_change_in_production_2026';

/**
 * Verify JWT token and attach user to request
 * Checks: valid signature, not expired, not blacklisted, correct version
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Provide Bearer token.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
      version: decoded.version
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please refresh or login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Full authentication chain: verify JWT + check blacklist
 * Use this for protected routes
 */
async function requireAuth(req, res, next) {
  // First verify the JWT
  authenticateToken(req, res, async (err) => {
    if (err) return; // authenticateToken already sent response

    // If JWT is valid, check blacklist
    try {
      await checkTokenBlacklist(req, res, next);
    } catch (error) {
      console.error('Auth chain error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication check failed'
      });
    }
  });
}

/**
 * Optional auth — attaches user if token is present, but doesn't require it
 * Use for endpoints that behave differently for authenticated users
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
      version: decoded.version
    };
  } catch (error) {
    // Token invalid but optional — just continue without user
  }

  next();
}

/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
  const { generateJti } = require('../utils/security');

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      version: user.tokenVersion || 0,
      jti: generateJti()
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Generate JWT refresh token (longer-lived)
 */
function generateRefreshToken(user) {
  const { generateJti } = require('../utils/security');

  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
      version: user.tokenVersion || 0,
      jti: generateJti()
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * Decode a token without verification (for extracting claims from expired tokens)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  authenticateToken,
  requireAuth,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  decodeToken,
  JWT_SECRET
};
