/**
 * STTAURX Authentication Routes
 * Login, Register, Refresh Token, Logout
 *
 * Security Hardening — Phase 2: Authentication Foundation
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../database/db');
const {
  hashPassword,
  verifyAndCheckRehash,
  validatePasswordStrength,
  generateJti,
  sanitizeInput
} = require('../utils/security');
const { generateAccessToken, generateRefreshToken, requireAuth, decodeToken } = require('../middleware/auth');
const { revokeToken, revokeAllUserTokens, RevocationReason } = require('../middleware/tokenBlacklist');
const { createAuditLog, AuditAction, EntityType } = require('../services/auditLog.service');

// Rate limiting for auth endpoints (stricter)
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordCheck.errors
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Hash password (bcrypt cost 14)
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName ? sanitizeInput(fullName) : null,
        phone: phone ? sanitizeInput(phone) : null,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: false
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Audit log
    await createAuditLog({
      action: AuditAction.USER_CREATE,
      entityType: EntityType.USER,
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Contact support.'
      });
    }

    // Verify password (and check if rehash needed)
    const { valid, needsRehash } = await verifyAndCheckRehash(password, user.passwordHash);

    if (!valid) {
      // Audit failed login
      await createAuditLog({
        action: AuditAction.USER_LOGIN,
        entityType: EntityType.USER,
        entityId: user.id,
        newValues: { success: false },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Transparently upgrade password hash if needed
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Audit successful login
    await createAuditLog({
      action: AuditAction.USER_LOGIN,
      entityType: EntityType.USER,
      entityId: user.id,
      newValues: { success: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          kycStatus: user.kycStatus
        },
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Exchange refresh token for new access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Decode and verify refresh token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'sttaurx_dev_jwt_secret_key_change_in_production_2026';

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'User not found or account inactive'
      });
    }

    // Check token version (mass revocation)
    if (decoded.version < user.tokenVersion) {
      return res.status(401).json({
        success: false,
        error: 'Token revoked. Please login again.',
        code: 'TOKEN_VERSION_MISMATCH'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Revoke current token
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const tokenId = req.user.jti;
    const userId = req.user.userId;

    // Revoke the token (24h TTL matching token expiry)
    await revokeToken(tokenId, 86400, RevocationReason.LOGOUT);

    // Audit log
    await createAuditLog({
      action: AuditAction.USER_LOGOUT,
      entityType: EntityType.SESSION,
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change password and revoke all existing tokens
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required'
      });
    }

    // Validate new password strength
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet requirements',
        details: passwordCheck.errors
      });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const { valid } = await verifyAndCheckRehash(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and increment token version (revokes all tokens)
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 }
      }
    });

    // Revoke all tokens for this user in Redis
    await revokeAllUserTokens(userId);

    // Generate new tokens
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const accessToken = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);

    // Audit log
    await createAuditLog({
      adminId: userId,
      action: AuditAction.USER_PASSWORD_CHANGE,
      entityType: EntityType.USER,
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        message: 'Password changed. All other sessions have been logged out.',
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        kycStatus: true,
        emailVerified: true,
        isMfaEnabled: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * POST /api/v1/auth/verify-portal
 * Server-side verification for the security portal password
 * Replaces the hardcoded client-side password check
 */
router.post('/verify-portal', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD || 'AUTrade88';

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (password !== PORTAL_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid portal password'
      });
    }

    // Generate a short-lived portal session token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'sttaurx_dev_jwt_secret_key_change_in_production_2026';
    const portalToken = jwt.sign(
      { type: 'portal', authenticated: true },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      success: true,
      data: {
        portalToken,
        message: 'Portal access granted'
      }
    });
  } catch (error) {
    console.error('Portal verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

module.exports = router;
