# Security Hardening — Phased Action Plan & Tracking

Project: STTAURX — Gold Stablecoin Platform  
Source: "Security Hardening Proposal" (Red Team: David Choi)  
Date: 2026-02-04  
Priority: **CRITICAL — must be completed before production**

---

## 0) Purpose

Implement and track all security hardening actions identified by the Red Team analysis, using a clear, auditable workflow that and the engineering team can:

- implement each fix,
- validate acceptance criteria,
- attach evidence,
- and keep progress visible and measurable per phase.

---

## 1) How to Use This Document (Codex Workflow)

**Rule:** each action item has a unique **ID** (e.g. `P0-01`).  
For every item:

1) Create a branch or PR (if applicable)  
2) Implement changes (code + tests)  
3) Execute the item’s validation checklist  
4) Attach evidence (logs, screenshots, test results)  
5) Update status and completion percentage  
6) Record notes in the item changelog

**Allowed statuses:**
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `IN_REVIEW`
- `DONE`

---

## 2) Progress Board (Summary)

> Update this table at the end of each working session.

| ID    | Phase | Title | Severity | Owner | Status | % | PR/Commit | Evidence |
|------:|:----:|-------|:--------:|:-----:|:------:|--:|-----------|----------|
| P0-01 | P0   | Fix Mock Data Leakage | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0-02 | P0   | KYC Document Encryption | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P1-01 | P1   | Bcrypt cost factor 14 | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P1-02 | P1   | Audit logs immutability | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P1-03 | P1   | JWT revocation | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P2-01 | P2   | Granular RBAC | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P2-02 | P2   | Managed DB migration | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P1-04 | P1   | Single Point of Failure mitigation | MEDIUM | TBD | NOT_STARTED | 0% | - | - |

---

## 3) Phase P0 (CRITICAL) — Production Blocking

### P0-01 — Fix Mock Data Leakage Risk (CRITICAL)
**Risk:** catastrophic data loss if the system runs in mock/in-memory mode in production.

**Action:**
- Force `USE_DATABASE=true` when `NODE_ENV=production`
- Startup validation:
  - if database connection fails → **fail fast** (do not start)
- Add explicit warnings/logs when `USE_DATABASE=false` in non-prod environments

**Suggested implementation:**
- Config module: `config/env.ts|js` or equivalent
- Startup DB health check (ping)
- Tests: unit + integration (startup behavior)

**Acceptance Criteria (DoD):**
- [ ] Production can never start with `USE_DATABASE=false`
- [ ] Service does not start if DB is unavailable or misconfigured
- [ ] Logs clearly explain startup failure (no secrets leaked)
- [ ] Tests cover production override + startup failure scenarios
- [ ] Documentation updated (README / runbook)

**Required Evidence:**
- [ ] Test suite output
- [ ] Production or staging startup logs

**Changelog:**
- Date:
- Changes:
- Notes:

---

### P0-02 — KYC Document Storage Encryption (CRITICAL)
**Risk:** identity theft and regulatory violations from storing sensitive documents unencrypted.

**Action:**
- Implement AES-256-GCM encrypted storage
- Persist:
  - `encryptedContent`
  - `encryptionIv`
  - `authTag`
- Secure key management (KMS / Secrets Manager / protected ENV)
- Prevent plaintext storage of sensitive files on disk

**Files suggested by proposal:**
- `utils/encryption.util.js`
- Schema changes: `database/schema.prisma` or DB migrations

**Acceptance Criteria (DoD):**
- [ ] All KYC documents are encrypted at rest (no plaintext storage)
- [ ] No encryption keys are hardcoded in the repository
- [ ] Key rotation strategy defined (at least key versioning)
- [ ] Tests cover encrypt/decrypt and authTag tampering
- [ ] Secret configuration documented per environment

**Required Evidence:**
- [ ] Encryption/decryption test results
- [ ] DB inspection showing encrypted blobs

**Changelog:**
- Date:
- Changes:
- Notes:

---

## 4) Phase P1 (Pre-Production) — Essential Security Controls

### P1-01 — Upgrade Bcrypt Cost Factor to 14
**Risk:** increased feasibility of password cracking.

**Action:**
- Increase bcrypt cost factor to `14`
- Progressive migration: re-hash passwords on next successful login

**Acceptance Criteria (DoD):**
- [ ] New passwords use cost factor 14
- [ ] Existing users are migrated on login
- [ ] Tests cover hashing + migration logic
- [ ] Authentication flow remains stable

**Required Evidence:**
- [ ] Test results + basic hashing benchmark

**Changelog:**
- Date:
- Changes:
- Notes:

---

### P1-02 — Audit Log Immutability (Hash-Chained Logs)
**Risk:** attackers or admins tampering with audit trails.

**Action:**
- Implement hash chaining (each entry stores hash of previous entry)
- DB triggers/constraints to prevent DELETE and hash modification
- Integrity verification function: `verifyAuditLogIntegrity()`

**Suggested files:**
- `services/auditLog.service.js`
- `migrations/audit_triggers.sql`

**Acceptance Criteria (DoD):**
- [ ] Audit entries cannot be deleted via standard SQL
- [ ] Hash and previous hash fields cannot be altered
- [ ] Integrity check detects any tampering
- [ ] Tests cover valid chain, tampering detection, delete prevention

**Required Evidence:**
- [ ] Failed DELETE attempt output
- [ ] Integrity verification results

**Changelog:**
- Date:
- Changes:
- Notes:

---

### P1-03 — JWT Revocation (Blacklist + Token Versioning)
**Risk:** stolen tokens remain valid until expiration.

**Action:**
- Redis-backed token blacklist by `tokenId`
- User-level token versioning:
  - `revokeAllUserTokens(userId)` increments version
- Middleware enforcement: `checkTokenBlacklist`

**Suggested files:**
- `middleware/tokenBlacklist.js`

**Acceptance Criteria (DoD):**
- [ ] Revoked tokens are denied access
- [ ] User-wide revocation invalidates older tokens
- [ ] Tests cover blacklist, versioning, and expiration
- [ ] Defined behavior if Redis is unavailable (fail-closed for critical endpoints)

**Required Evidence:**
- [ ] Middleware logs + test results

**Changelog:**
- Date:
- Changes:
- Notes:

---

### P1-04 — Single Point of Failure Mitigation
**Risk:** downtime from DoS or single-node failures.

**Action (P1 minimum):**
- Document critical dependencies
- Implement health/readiness checks
- Define backup and restore strategy
- (If applicable) separate managed DB from application node

**Acceptance Criteria (DoD):**
- [ ] Recovery runbook with RTO/RPO defined
- [ ] Automated backups verified in staging
- [ ] Basic alerts (uptime, DB connectivity)

**Required Evidence:**
- [ ] Documentation + restore test (if applicable)

**Changelog:**
- Date:
- Changes:
- Notes:

---

## 5) Phase P2 (Phase 2) — Structural Improvements

### P2-01 — Granular RBAC (Roles & Permissions)
**Risk:** privilege escalation from hardcoded role logic.

**Action:**
- Create roles and permissions tables/collections
- Implement RBAC middleware/guards
- Proposed roles:
  - CLIENT, ORACLE, AUDITOR, ADMIN, SUPER_ADMIN

**Suggested files:**
- `middleware/rbac.js`

**Acceptance Criteria (DoD):**
- [ ] Roles are not boolean flags
- [ ] Permissions are resource/action based
- [ ] Tests validate allow/deny per role
- [ ] Auditor role is strictly read-only

**Required Evidence:**
- [ ] Permission matrix + tests

**Changelog:**
- Date:
- Changes:
- Notes:

---

### P2-02 — Managed Database Migration (Pre-Production)
**Risk:** operational and security exposure from self-managed DB.

**Action:**
- Define migration plan to managed DB service
- Validate: encryption at rest, backups, failover, networking, IAM
- Execute dry-run migration in staging

**Acceptance Criteria (DoD):**
- [ ] Migration plan with rollback steps
- [ ] Successful staging migration
- [ ] Private networking + least-privilege access

**Required Evidence:**
- [ ] Migration checklist and logs

**Changelog:**
- Date:
- Changes:
- Notes:

---

## 6) Progress Log (Work Journal)

> Add chronological entries per implementation session.

### 2026-__-__
- Work completed:
- Items touched:
- Blockers:
- Next steps:
- PRs/Commits:

---

## 7) Global Definition of Done

An item is marked `DONE` only when:
- [ ] Code implemented
- [ ] Tests added and passing
- [ ] Evidence attached (logs/results)
- [ ] Documentation updated
- [ ] Reviewed/approved (if PR-based)
- [ ] No regressions detected (basic smoke tests)

---

## 8) Operational Security Notes

- Never commit secrets or encryption keys.
- Use secure secret storage (KMS / Secrets Manager / protected ENV).
- Logs must never expose sensitive data (tokens, PII, KYC).

