/**
 * STTAURX Audit Log Service
 * Hash-chained audit logs for tamper-evident record keeping
 *
 * Based on: Third-Party Security Audit
 * Fixes Issue #7 - Audit Log Mutability
 *
 * "If the database is compromised via an admin-level SQL account, an attacker
 * could potentially delete their own tracks from this table. For a 'Gold
 * Stablecoin Platform,' these logs should ideally be mirrored to an immutable
 * 'Sovereign Node' to ensure they cannot be tampered with."
 *
 * Implementation: Hash chain (mini-blockchain) + PostgreSQL deletion prevention triggers
 */

const { prisma } = require('../database/db');
const { sha256 } = require('../utils/security');

// Genesis hash for first audit log entry
const GENESIS_HASH = 'GENESIS';

/**
 * Create a new audit log entry with hash chain integrity
 *
 * @param {Object} data - Audit log data
 * @param {string} data.adminId - Admin/user who performed the action (optional)
 * @param {string} data.action - Action performed (e.g., "USER_CREATE", "KYC_APPROVE")
 * @param {string} data.entityType - Entity type (e.g., "user", "kyc_document", "wallet")
 * @param {string} data.entityId - Entity UUID
 * @param {Object} data.oldValues - Previous state (for updates)
 * @param {Object} data.newValues - New state (for creates/updates)
 * @param {string} data.ipAddress - IP address of requester
 * @param {string} data.userAgent - User agent string
 * @returns {Promise<Object>} - Created audit log entry
 */
async function createAuditLog(data) {
  // Get the most recent audit log for hash chaining
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { currentHash: true }
  });

  const previousHash = lastLog?.currentHash || GENESIS_HASH;
  const timestamp = new Date().toISOString();

  // Create hash of current entry (includes previous hash for chain integrity)
  const hashPayload = JSON.stringify({
    adminId: data.adminId || null,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    timestamp,
    previousHash
  });

  const currentHash = sha256(hashPayload);

  // Create the audit log entry
  const auditLog = await prisma.auditLog.create({
    data: {
      adminId: data.adminId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      previousHash,
      currentHash,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null
    }
  });

  return auditLog;
}

/**
 * Verify integrity of the audit log chain
 * Run periodically or on-demand to detect tampering
 *
 * @param {number} limit - Number of entries to verify (default: all)
 * @returns {Promise<Object>} - Verification result
 */
async function verifyAuditLogIntegrity(limit = null) {
  const queryOptions = {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      adminId: true,
      action: true,
      entityType: true,
      entityId: true,
      previousHash: true,
      currentHash: true,
      createdAt: true
    }
  };

  if (limit) {
    queryOptions.take = limit;
  }

  const logs = await prisma.auditLog.findMany(queryOptions);

  if (logs.length === 0) {
    return {
      verified: true,
      totalChecked: 0,
      errors: []
    };
  }

  const errors = [];
  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Verify previous hash matches
    if (log.previousHash !== expectedPreviousHash) {
      errors.push({
        type: 'CHAIN_BREAK',
        logId: log.id,
        message: `Chain break at log ${i + 1}: expected previous hash ${expectedPreviousHash.slice(0, 8)}..., got ${log.previousHash?.slice(0, 8)}...`
      });
    }

    // Recalculate and verify current hash
    const hashPayload = JSON.stringify({
      adminId: log.adminId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.createdAt.toISOString(),
      previousHash: log.previousHash
    });

    const recalculatedHash = sha256(hashPayload);

    if (log.currentHash !== recalculatedHash) {
      errors.push({
        type: 'HASH_MISMATCH',
        logId: log.id,
        message: `Hash mismatch at log ${i + 1}: entry may have been tampered with`
      });
    }

    expectedPreviousHash = log.currentHash;
  }

  return {
    verified: errors.length === 0,
    totalChecked: logs.length,
    errors
  };
}

/**
 * Predefined audit actions for consistency
 */
const AuditAction = {
  // User actions
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_SUSPEND: 'USER_SUSPEND',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
  USER_MFA_ENABLE: 'USER_MFA_ENABLE',
  USER_MFA_DISABLE: 'USER_MFA_DISABLE',

  // KYC actions
  KYC_SUBMIT: 'KYC_SUBMIT',
  KYC_APPROVE: 'KYC_APPROVE',
  KYC_REJECT: 'KYC_REJECT',
  KYC_REQUEST_RESUBMIT: 'KYC_REQUEST_RESUBMIT',

  // Wallet actions
  WALLET_CREATE: 'WALLET_CREATE',
  WALLET_FREEZE: 'WALLET_FREEZE',
  WALLET_UNFREEZE: 'WALLET_UNFREEZE',

  // Transaction actions
  TRANSACTION_CREATE: 'TRANSACTION_CREATE',
  TRANSACTION_APPROVE: 'TRANSACTION_APPROVE',
  TRANSACTION_REJECT: 'TRANSACTION_REJECT',
  TRANSACTION_COMPLETE: 'TRANSACTION_COMPLETE',
  TRANSACTION_FAIL: 'TRANSACTION_FAIL',

  // Admin actions
  ADMIN_CONFIG_CHANGE: 'ADMIN_CONFIG_CHANGE',
  ADMIN_FEE_UPDATE: 'ADMIN_FEE_UPDATE',
  ADMIN_ROLE_ASSIGN: 'ADMIN_ROLE_ASSIGN',
  ADMIN_PERMISSION_CHANGE: 'ADMIN_PERMISSION_CHANGE',

  // Security actions
  SECURITY_TOKEN_REVOKE: 'SECURITY_TOKEN_REVOKE',
  SECURITY_MASS_LOGOUT: 'SECURITY_MASS_LOGOUT',
  SECURITY_SUSPICIOUS_ACTIVITY: 'SECURITY_SUSPICIOUS_ACTIVITY'
};

/**
 * Entity types for audit logs
 */
const EntityType = {
  USER: 'user',
  KYC_DOCUMENT: 'kyc_document',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
  BLOCK: 'block',
  SYSTEM_SETTING: 'system_setting',
  FEE_CONFIG: 'fee_config',
  PERMISSION: 'permission',
  SESSION: 'session'
};

/**
 * Express middleware to auto-capture request context for audit logging
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function auditContext(req, res, next) {
  req.auditContext = {
    adminId: req.user?.userId || null,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'] || null
  };
  next();
}

/**
 * Helper to create audit log from request context
 *
 * @param {Object} req - Express request with auditContext
 * @param {string} action - Audit action
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {Object} oldValues - Previous state
 * @param {Object} newValues - New state
 * @returns {Promise<Object>} - Created audit log
 */
async function auditFromRequest(req, action, entityType, entityId, oldValues = null, newValues = null) {
  return createAuditLog({
    adminId: req.auditContext?.adminId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: req.auditContext?.ipAddress,
    userAgent: req.auditContext?.userAgent
  });
}

/**
 * Get audit logs with filtering and pagination
 *
 * @param {Object} filters - Filter options
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Paginated audit logs
 */
async function getAuditLogs(filters = {}, page = 1, limit = 50) {
  const where = {};

  if (filters.adminId) {
    where.adminId = filters.adminId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true
          }
        }
      }
    })
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  createAuditLog,
  verifyAuditLogIntegrity,
  auditContext,
  auditFromRequest,
  getAuditLogs,
  AuditAction,
  EntityType,
  GENESIS_HASH
};
