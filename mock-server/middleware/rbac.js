/**
 * STTAURX Role-Based Access Control (RBAC) Middleware
 * Granular permission system with role-permission mapping
 *
 * Based on: Third-Party Security Audit
 * Fixes Issue #4 - RBAC Specificity
 *
 * "Roles might be hardcoded (e.g., user.isAdmin = true), which is a common
 * vulnerability that leads to 'Privilege Escalation' if the Boolean logic
 * is bypassed in the API layer."
 */

const { prisma } = require('../database/db');
const { redis } = require('../database/db');

// Cache TTL for permissions (5 minutes)
const PERMISSION_CACHE_TTL = 300;

/**
 * Default permission matrix
 * This is seeded into the database on first run
 *
 * | Permission    | CLIENT | ORACLE | AUDITOR | ADMIN | SUPER_ADMIN |
 * |---------------|--------|--------|---------|-------|-------------|
 * | wallet:read   |   ✓    |   ✓    |    ✓    |   ✓   |      ✓      |
 * | wallet:write  |   ✓    |   ✓    |    ✗    |   ✓   |      ✓      |
 * | kyc:submit    |   ✓    |   ✓    |    ✗    |   ✗   |      ✗      |
 * | kyc:review    |   ✗    |   ✓    |    ✗    |   ✓   |      ✓      |
 * | audit:read    |   ✗    |   ✗    |    ✓    |   ✓   |      ✓      |
 * | user:manage   |   ✗    |   ✗    |    ✗    |   ✓   |      ✓      |
 * | system:config |   ✗    |   ✗    |    ✗    |   ✗   |      ✓      |
 */
const DEFAULT_PERMISSIONS = {
  CLIENT: ['wallet:read', 'wallet:write', 'kyc:submit', 'transaction:read', 'transaction:create'],
  ORACLE: ['wallet:read', 'wallet:write', 'kyc:submit', 'kyc:review', 'transaction:read', 'transaction:create', 'notary:sign'],
  AUDITOR: ['wallet:read', 'transaction:read', 'audit:read', 'kyc:read', 'user:read'],
  ADMIN: ['wallet:read', 'wallet:write', 'kyc:review', 'audit:read', 'user:read', 'user:manage', 'transaction:read', 'fee:manage'],
  SUPER_ADMIN: ['wallet:read', 'wallet:write', 'kyc:review', 'audit:read', 'user:read', 'user:manage', 'system:config', 'transaction:read', 'fee:manage', 'role:assign']
};

/**
 * Permission definitions for seeding
 */
const PERMISSION_DEFINITIONS = [
  { name: 'wallet:read', description: 'View wallet balances and history' },
  { name: 'wallet:write', description: 'Create wallets and initiate transfers' },
  { name: 'kyc:submit', description: 'Submit KYC documents for verification' },
  { name: 'kyc:read', description: 'View KYC documents and status' },
  { name: 'kyc:review', description: 'Review and approve/reject KYC documents' },
  { name: 'audit:read', description: 'View audit logs and system activity' },
  { name: 'user:read', description: 'View user profiles and accounts' },
  { name: 'user:manage', description: 'Create, update, suspend user accounts' },
  { name: 'system:config', description: 'Modify system settings and configuration' },
  { name: 'transaction:read', description: 'View transaction history' },
  { name: 'transaction:create', description: 'Create new transactions' },
  { name: 'fee:manage', description: 'Configure fee structures' },
  { name: 'role:assign', description: 'Assign roles to users' },
  { name: 'notary:sign', description: 'Sign documents as digital notary' }
];

/**
 * Get permissions for a role (with Redis caching)
 *
 * @param {string} role - User role
 * @returns {Promise<string[]>} - Array of permission names
 */
async function getPermissionsForRole(role) {
  const cacheKey = `rbac:permissions:${role}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true }
  });

  const permissions = rolePermissions.map(rp => rp.permission.name);

  // If no permissions in DB, use defaults
  if (permissions.length === 0 && DEFAULT_PERMISSIONS[role]) {
    return DEFAULT_PERMISSIONS[role];
  }

  // Cache for 5 minutes
  await redis.setex(cacheKey, PERMISSION_CACHE_TTL, JSON.stringify(permissions));

  return permissions;
}

/**
 * Check if a role has a specific permission
 *
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>}
 */
async function hasPermission(role, permission) {
  const permissions = await getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Middleware factory: require specific permission
 *
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHENTICATED'
        });
      }

      const allowed = await hasPermission(userRole, permission);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${permission} required`,
          code: 'FORBIDDEN',
          requiredPermission: permission,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware factory: require ANY of the listed permissions
 *
 * @param {string[]} permissions - Array of permissions (any one grants access)
 * @returns {Function} Express middleware
 */
function requireAnyPermission(permissions) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userPermissions = await getPermissionsForRole(userRole);
      const hasAny = permissions.some(p => userPermissions.includes(p));

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          requiredPermissions: permissions,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware factory: require ALL listed permissions
 *
 * @param {string[]} permissions - Array of permissions (all required)
 * @returns {Function} Express middleware
 */
function requireAllPermissions(permissions) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userPermissions = await getPermissionsForRole(userRole);
      const hasAll = permissions.every(p => userPermissions.includes(p));

      if (!hasAll) {
        const missing = permissions.filter(p => !userPermissions.includes(p));
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          missingPermissions: missing,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware factory: require specific role(s)
 *
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role privileges',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
}

/**
 * Invalidate permission cache for a role
 * Call this when permissions are updated
 *
 * @param {string} role - Role to invalidate
 */
async function invalidatePermissionCache(role) {
  await redis.del(`rbac:permissions:${role}`);
}

/**
 * Seed default permissions into database
 * Run once during initial setup
 */
async function seedPermissions() {
  console.log('Seeding RBAC permissions...');

  // Create permissions
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm
    });
  }

  // Create role-permission mappings
  for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const permName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            role,
            permissionId: permission.id
          }
        });
      }
    }
  }

  // Clear cache
  const roles = Object.keys(DEFAULT_PERMISSIONS);
  for (const role of roles) {
    await invalidatePermissionCache(role);
  }

  console.log('RBAC permissions seeded successfully');
}

module.exports = {
  getPermissionsForRole,
  hasPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  invalidatePermissionCache,
  seedPermissions,
  DEFAULT_PERMISSIONS,
  PERMISSION_DEFINITIONS
};
