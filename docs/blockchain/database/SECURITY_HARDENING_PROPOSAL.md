# AUSRX Security Hardening Proposal

**Based on:** Third-Party Security Audit
**Date:** February 3, 2026
**Status:** Proposal - Awaiting Approval
**Priority:** Critical (Must address before production)

---

## Executive Summary

An independent security audit identified **7 vulnerabilities** in the current database implementation plan. This document provides a detailed breakdown of each issue and proposes specific fixes that must be implemented before production deployment.

**Overall Assessment:** "The infrastructure is generally robust for a Phase 1 deployment, particularly in its use of modern security standards like Prisma ORM for SQL injection prevention and Bcrypt for password hashing." However, critical gaps exist that could lead to data loss, identity theft, and audit tampering.

---

## Vulnerability Analysis

### 🔴 CRITICAL: Issue #1 - Mock Data Leakage Risk

**Audit Finding:**
> "The hybrid architecture uses a USE_DATABASE flag to switch between mock and production modes. If this flag is misconfigured in the .env file during a production deployment, the system could revert to in-memory mock data, leading to a massive data loss event where real transactions are 'stored' in volatile memory and vanish upon a server restart."

**Current Code Risk:**
```javascript
// Current: Environment variable can be wrong
const useMockData = process.env.USE_DATABASE !== 'true';
```

**The Problem:**
- If `.env` file is missing or corrupted → defaults to mock mode
- If someone sets `USE_DATABASE=false` by mistake → data loss
- No warning or safeguard in production

**Proposed Fix:**
```javascript
// NEW: Hardcode for production builds + fail-safe
const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'production' || NODE_ENV === 'mainnet') {
  // HARDCODED: Production ALWAYS uses database
  if (process.env.USE_DATABASE === 'false') {
    console.error('🚨 FATAL: Cannot disable database in production!');
    process.exit(1);
  }
  USE_DATABASE = true; // Forced
} else {
  USE_DATABASE = process.env.USE_DATABASE === 'true';
}
```

**Additional Safeguard:**
```javascript
// Startup check in production
if (NODE_ENV === 'production') {
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('🚨 FATAL: Database connection failed in production!');
    process.exit(1); // Don't start without DB
  }
}
```

---

### 🟡 MEDIUM: Issue #2 - Single Point of Failure (SPOF)

**Audit Finding:**
> "Hosting the PostgreSQL and Redis instances on the same single server as the API makes the entire platform vulnerable to a single hardware failure or a targeted Denial of Service (DoS) attack on that specific IP (164.92.116.28)."

**Current Architecture:**
```
┌─────────────────────────────────┐
│     Single Droplet (SPOF)       │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ API │ │ PG  │ │Redis│       │
│  └─────┘ └─────┘ └─────┘       │
│         164.92.116.28           │
└─────────────────────────────────┘
         ↑ Single point of failure
```

**Proposed Fix (Phased):**

**Phase 1 (Testnet):** Keep current setup, add automated backups
```bash
# Hourly backup to DigitalOcean Spaces
pg_dump sttaurx_mainnet | gzip > backup_$(date +%H).sql.gz
aws s3 cp backup_*.sql.gz s3://sttaurx-backups/
```

**Phase 2 (Pre-Production):** Migrate to DigitalOcean Managed Database
```
┌────────────────┐     ┌─────────────────────────┐
│   API Droplet  │────►│ DO Managed PostgreSQL   │
│  164.92.116.28 │     │ (Automatic failover)    │
└────────────────┘     │ (Daily backups)         │
                       └─────────────────────────┘
```

**Cost:** ~$15/month for basic managed DB

---

### 🟡 MEDIUM: Issue #3 - JWT Revocation Complexity

**Audit Finding:**
> "The document does not explicitly define a 'Blacklist' or 'Revocation' mechanism for compromised tokens. Without this, a stolen 7-day refresh token could allow an attacker persistent access until it naturally expires."

**Current State:** No revocation mechanism

**Proposed Fix: Redis Token Blacklist**

```javascript
// middleware/tokenBlacklist.js
const { redis } = require('../database/db');

const TOKEN_BLACKLIST_PREFIX = 'blacklist:';

// Add token to blacklist (called on logout or compromise)
async function revokeToken(tokenId, expiresInSeconds) {
  const key = `${TOKEN_BLACKLIST_PREFIX}${tokenId}`;
  await redis.setex(key, expiresInSeconds, 'revoked');
}

// Check if token is blacklisted
async function isTokenRevoked(tokenId) {
  const key = `${TOKEN_BLACKLIST_PREFIX}${tokenId}`;
  const result = await redis.get(key);
  return result === 'revoked';
}

// Middleware to check blacklist
async function checkTokenBlacklist(req, res, next) {
  const tokenId = req.user?.jti; // JWT ID from decoded token

  if (tokenId && await isTokenRevoked(tokenId)) {
    return res.status(401).json({
      success: false,
      error: 'Token has been revoked. Please login again.'
    });
  }
  next();
}

// Revoke all tokens for a user (password change, account compromise)
async function revokeAllUserTokens(userId) {
  // Store user's "token version" - increment to invalidate all existing tokens
  await redis.incr(`token_version:${userId}`);
}
```

**JWT Structure Update:**
```javascript
// Include jti (JWT ID) for revocation tracking
const token = jwt.sign(
  {
    userId,
    jti: crypto.randomUUID(), // Unique token ID
    version: await redis.get(`token_version:${userId}`) || 0
  },
  JWT_SECRET,
  { expiresIn: '15m' }
);
```

---

### 🟡 MEDIUM: Issue #4 - RBAC Specificity

**Audit Finding:**
> "The Phase 1 schema does not include a roles or permissions table. This suggests roles might be hardcoded (e.g., user.isAdmin = true), which is a common vulnerability that leads to 'Privilege Escalation' if the Boolean logic is bypassed in the API layer."

**Current Schema:**
```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}
// No granular permissions
```

**Proposed Fix: Enhanced Role System**

```prisma
enum UserRole {
  CLIENT        // Standard user (importer/exporter)
  ORACLE        // Logistics Agent / Digital Notary
  AUDITOR       // Read-only oversight (can view audit logs)
  ADMIN         // Platform administrator
  SUPER_ADMIN   // Emergency system control (Council member)
}

// NEW: Granular permissions table
model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique // e.g., "kyc:read", "audit:read", "user:write"
  description String?
  createdAt   DateTime @default(now())

  rolePermissions RolePermission[]

  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid()) @db.Uuid
  role         UserRole
  permissionId String     @db.Uuid
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@unique([role, permissionId])
  @@map("role_permissions")
}
```

**Default Permission Matrix:**

| Permission | CLIENT | ORACLE | AUDITOR | ADMIN | SUPER_ADMIN |
|------------|--------|--------|---------|-------|-------------|
| `wallet:read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `wallet:write` | ✓ | ✓ | ✗ | ✓ | ✓ |
| `kyc:submit` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `kyc:review` | ✗ | ✓ | ✗ | ✓ | ✓ |
| `audit:read` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `user:manage` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `system:config` | ✗ | ✗ | ✗ | ✗ | ✓ |

---

### 🟡 MEDIUM: Issue #5 - Bcrypt Cost Factor

**Audit Finding:**
> "A cost of 12 is currently acceptable (4,096 iterations), but for a gold-backed financial platform in 2026, it is on the lower end of the high-security spectrum. Modern standards often recommend 13 or 14."

**Current:** Cost 12 (~250ms hash time)
**Proposed:** Cost 14 (~1000ms hash time)

| Cost | Iterations | Hash Time | Recommendation |
|------|------------|-----------|----------------|
| 10 | 1,024 | ~65ms | Too weak |
| 12 | 4,096 | ~250ms | Current (acceptable) |
| **14** | **16,384** | **~1000ms** | **Proposed (recommended)** |
| 16 | 65,536 | ~4000ms | Future consideration |

**Code Change:**
```javascript
// utils/security.js
const BCRYPT_COST = 14; // Upgraded from 12

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}
```

**Migration Strategy:**
- New passwords: Use cost 14 immediately
- Existing passwords: Re-hash on next successful login
```javascript
// On login success, check if hash needs upgrade
const needsRehash = bcrypt.getRounds(storedHash) < BCRYPT_COST;
if (needsRehash) {
  const newHash = await hashPassword(password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
}
```

---

### 🔴 CRITICAL: Issue #6 - KYC Document Storage

**Audit Finding:**
> "The plan does not specify if these sensitive files (Passports, IDs) are stored as encrypted blobs in the database or as plain files on the droplet. Storing them unencrypted on a single droplet is a major compliance risk for a financial platform."

**Current Schema:**
```prisma
model KycDocument {
  documentUrl String // Plain URL - VULNERABLE
}
```

**Proposed Fix: AES-256-GCM Encrypted Storage**

```prisma
model KycDocument {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  documentType      DocumentType @map("document_type")

  // SECURITY FIX: Encrypted blob storage
  encryptedContent  Bytes     @map("encrypted_content")  // AES-256-GCM encrypted
  encryptionIv      Bytes     @map("encryption_iv")      // Initialization Vector
  authTag           Bytes     @map("auth_tag")           // GCM authentication tag

  // Metadata (not sensitive)
  fileSize          Int?      @map("file_size")
  mimeType          String?   @map("mime_type")
  originalFilename  String?   @map("original_filename")  // Encrypted separately

  status            DocumentStatus @default(PENDING)
  reviewedBy        String?   @map("reviewed_by") @db.Uuid
  reviewedAt        DateTime? @map("reviewed_at")
  rejectionReason   String?   @map("rejection_reason")
  notarizedAt       DateTime? @map("notarized_at")
  expiresAt         DateTime? @map("expires_at")
  createdAt         DateTime  @default(now()) @map("created_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewer          User?     @relation("KycReviewer", fields: [reviewedBy], references: [id])

  @@index([userId])
  @@index([status])
  @@map("kyc_documents")
}
```

**Encryption Flow:**
```
User uploads passport.pdf
        ↓
Server receives file buffer
        ↓
Fetch MASTER_KEY from HSM (or env for now)
        ↓
Generate random IV (12 bytes)
        ↓
Encrypt with AES-256-GCM
        ↓
Store: encryptedContent + IV + authTag
        ↓
Original file NEVER touches disk unencrypted
```

---

### 🟡 MEDIUM: Issue #7 - Audit Log Mutability

**Audit Finding:**
> "If the database is compromised via an admin-level SQL account, an attacker could potentially delete their own tracks from this table. For a 'Gold Stablecoin Platform,' these logs should ideally be mirrored to an immutable 'Sovereign Node' to ensure they cannot be tampered with."

**Proposed Fix: Hash-Chained Audit Logs**

```prisma
model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  adminId       String?  @map("admin_id") @db.Uuid
  action        String   @db.VarChar(100)
  entityType    String   @map("entity_type") @db.VarChar(50)
  entityId      String   @map("entity_id") @db.Uuid

  // INTEGRITY FIX: Hash chain (like a mini-blockchain)
  previousHash  String?  @map("previous_hash") @db.VarChar(64)
  currentHash   String   @map("current_hash") @db.VarChar(64)

  oldValues     Json?    @map("old_values") @db.JsonB
  newValues     Json?    @map("new_values") @db.JsonB
  ipAddress     String?  @map("ip_address") @db.Inet
  userAgent     String?  @map("user_agent") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  admin         User?    @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Hash Chain Logic:**
```javascript
// Each new audit log includes hash of previous log
const createAuditLog = async (data) => {
  // Get the last audit log
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  const previousHash = lastLog?.currentHash || 'GENESIS';

  // Create hash of current entry
  const hashPayload = JSON.stringify({
    adminId: data.adminId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    timestamp: new Date().toISOString(),
    previousHash
  });

  const currentHash = crypto
    .createHash('sha256')
    .update(hashPayload)
    .digest('hex');

  return prisma.auditLog.create({
    data: {
      ...data,
      previousHash,
      currentHash
    }
  });
};
```

**PostgreSQL Trigger (Prevent Deletion):**
```sql
-- Prevent ANY deletion from audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Deletion from audit_logs is not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_audit_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_deletion();

-- Prevent UPDATE on hash fields
CREATE OR REPLACE FUNCTION prevent_audit_hash_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_hash != NEW.current_hash OR OLD.previous_hash != NEW.previous_hash THEN
    RAISE EXCEPTION 'Modification of audit hash chain is not permitted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_audit_hash_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_hash_update();
```

---

## Implementation Priority

| Priority | Issue | Fix | Timeline |
|----------|-------|-----|----------|
| 🔴 P0 | Mock Data Leakage | Hardcode + startup check | Immediate |
| 🔴 P0 | KYC Encryption | AES-256-GCM | Before any KYC data |
| 🟡 P1 | Bcrypt Cost | Upgrade to 14 | Before production |
| 🟡 P1 | Audit Immutability | Hash chain + triggers | Before production |
| 🟡 P1 | JWT Revocation | Redis blacklist | Before production |
| 🟡 P2 | RBAC Granular | Permissions table | Phase 2 |
| 🟡 P2 | SPOF | Managed Database | Pre-production |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `database/schema.prisma` | Modify | Add security hardening fields |
| `utils/encryption.util.js` | Create | AES-256-GCM encryption utility |
| `utils/security.js` | Create | Bcrypt, hashing, security helpers |
| `middleware/tokenBlacklist.js` | Create | JWT revocation middleware |
| `middleware/rbac.js` | Create | Role-based access control |
| `services/auditLog.service.js` | Create | Hash-chained audit logging |
| `migrations/audit_triggers.sql` | Create | PostgreSQL deletion prevention |

---

## Approval Checklist

- [ ] Mock data leakage fix approved
- [ ] KYC encryption approach approved
- [ ] Bcrypt cost 14 approved
- [ ] Audit hash chain approved
- [ ] JWT blacklist approach approved
- [ ] RBAC enhancement timeline approved
- [ ] Managed DB migration timeline approved

---

*Based on Third-Party Security Audit*
*Document created: February 3, 2026*
