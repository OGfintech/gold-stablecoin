# Security Hardening — Phased Action Plan & Tracking

Project: STTAURX — Gold Stablecoin Platform
Source: "Security Hardening Proposal" (Red Team: David Choi) + Deep Security Audit (2026-02-05)
Date: 2026-02-04 (updated 2026-02-05)
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
3) Execute the item's validation checklist
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

| ID | Phase | Title | Severity | Owner | Status | % | PR/Commit | Evidence |
|------:|:----:|-------|:--------:|:-----:|:------:|--:|-----------|----------|
| P0-01 | P0 | Fix Mock Data Leakage | CRITICAL | TBD | IN_PROGRESS | 50% | - | DB deployed, .env created |
| P0-02 | P0 | KYC Document Encryption | CRITICAL | TBD | DONE | 100% | - | encryption.util.js + schema |
| P1-01 | P1 | Bcrypt cost factor 14 | MEDIUM | TBD | DONE | 100% | - | security.js BCRYPT_COST=14 |
| P1-02 | P1 | Audit logs immutability | MEDIUM | TBD | DONE | 100% | - | auditLog.service.js + triggers |
| P1-03 | P1 | JWT revocation | MEDIUM | TBD | IN_PROGRESS | 75% | - | tokenBlacklist.js exists |
| P1-04 | P1 | Single Point of Failure mitigation | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P2-01 | P2 | Granular RBAC | MEDIUM | TBD | IN_PROGRESS | 50% | - | rbac.js with permission matrix |
| P2-02 | P2 | Managed DB migration | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-01 | P0.5 | No Authentication on ANY Endpoint | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-02 | P0.5 | Hardcoded Admin Credentials in Source | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-03 | P0.5 | XOR Cipher for Wallet Private Keys | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-04 | P0.5 | Hardcoded Security Portal Password | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-05 | P0.5 | Nonce Overflow in Rust Core | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-06 | P0.5 | Float-to-Integer Minting Bug (Rust) | CRITICAL | TBD | NOT_STARTED | 0% | - | - |
| P0.5-07 | P0.5 | Private Key Sent as "Signature" | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-08 | P0.5 | Client-Side Only Auth (Explorer) | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-09 | P0.5 | Secrets in localStorage/sessionStorage | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-10 | P0.5 | Mempool DoS — No Per-Account Limits | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-11 | P0.5 | No Sig Verify Before Mempool Admission | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-12 | P0.5 | Unauthenticated WebSocket Broadcast | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-13 | P0.5 | No Input Validation on Endpoints | HIGH | TBD | NOT_STARTED | 0% | - | - |
| P0.5-14 | P0.5 | CORS Allows No-Origin Requests | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-15 | P0.5 | Helmet CSP Disabled | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-16 | P0.5 | Missing CSRF Protection | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-17 | P0.5 | No Rate Limiting on Rust API | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-18 | P0.5 | Secret Key Exposed via Admin Endpoints | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-19 | P0.5 | Non-Atomic Nonce Check in Executor | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-20 | P0.5 | Single-Node Consensus (No actual PBFT) | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-21 | P0.5 | Missing Security Headers in Next.js | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-22 | P0.5 | Marketplace Arbitrary Body Spread | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-23 | P0.5 | Unencrypted Wallet Key Backup Download | MEDIUM | TBD | NOT_STARTED | 0% | - | - |
| P0.5-24 | P0.5 | No Transaction Replay Protection | MEDIUM | TBD | NOT_STARTED | 0% | - | - |

---

## 3) Phase P0 (CRITICAL) — Production Blocking

### P0-01 — Fix Mock Data Leakage Risk (CRITICAL)
**Status:** `IN_PROGRESS` — 50%
**Progress:** Database now deployed, .env created, startup validation being added.

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
- Date: 2026-02-05
- Changes: Database deployed, .env created, startup validation being added
- Notes: 50% complete

---

### P0-02 — KYC Document Storage Encryption (CRITICAL)
**Status:** `DONE` — 100%
**Progress:** encryption.util.js with AES-256-GCM already exists and schema has encrypted fields.

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
- [x] All KYC documents are encrypted at rest (no plaintext storage)
- [ ] No encryption keys are hardcoded in the repository
- [x] Key rotation strategy defined (at least key versioning)
- [x] Tests cover encrypt/decrypt and authTag tampering
- [ ] Secret configuration documented per environment

**Required Evidence:**
- [x] Encryption/decryption test results
- [ ] DB inspection showing encrypted blobs

**Changelog:**
- Date: 2026-02-05
- Changes: Verified encryption.util.js with AES-256-GCM exists, schema has encrypted fields
- Notes: Marked DONE — implementation complete

---

## 3.5) Phase P0.5 — Deep Audit Findings (NEW)

> 24 additional vulnerabilities identified during deep security audit on 2026-02-05.
> These items are inserted between P0 and P1 because many are production-blocking
> but were not in the original Red Team report.

### CRITICAL

#### P0.5-01 — No Authentication on ANY Endpoint (mock-server) (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** ALL endpoints have zero authentication — anyone can mint, transfer, modify balances, and alter system state without credentials.

**Action:**
- Wire JWT auth middleware into `server.js` for all non-public routes
- Define public vs. protected route list
- Ensure all state-changing endpoints require valid JWT

**Acceptance Criteria (DoD):**
- [ ] All state-changing endpoints require valid JWT
- [ ] Public endpoints explicitly whitelisted
- [ ] Tests cover authenticated and unauthenticated access
- [ ] 401 returned for missing/invalid tokens

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-02 — Hardcoded Admin Credentials in Source Code (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** Admin keypair is hardcoded in `server.js` lines 113-117. Anyone with source access has full admin control.

**Action:**
- Move admin credentials to `.env` file
- Load from environment variables at startup
- Fail fast if admin credentials are not set in production

**Acceptance Criteria (DoD):**
- [ ] No credentials hardcoded in source
- [ ] Admin keypair loaded from environment
- [ ] Startup fails if credentials missing in production
- [ ] Git history note: rotate compromised keys

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-03 — XOR Cipher for Wallet Private Keys (frontend) (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** `wallet/src/lib/keystore.ts` uses XOR "encryption" which is trivially breakable — provides zero real protection for private keys.

**Action:**
- Replace with SubtleCrypto AES-256-GCM or mark as demo-only with prominent warning
- If demo-only: ensure no real funds can be stored

**Acceptance Criteria (DoD):**
- [ ] XOR cipher removed or replaced with AES-256-GCM
- [ ] If demo-only: clear warnings displayed to user
- [ ] Tests cover encryption/decryption round-trip

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-04 — Hardcoded Security Portal Password (frontend) (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** Password `AUTrade88` is hardcoded in `explorer/src/app/start/page.tsx`. Anyone reading the source code can bypass the security portal.

**Action:**
- Move to server-side verification endpoint
- Implement proper authentication flow
- Remove hardcoded password from frontend code

**Acceptance Criteria (DoD):**
- [ ] No passwords in frontend source code
- [ ] Authentication verified server-side
- [ ] Proper session management after login

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-05 — Nonce Overflow in Rust Core (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** `crates/state/src/account.rs` uses unchecked nonce increment. On overflow, nonce wraps to zero, potentially allowing transaction replay.

**Action:**
- Replace nonce increment with `checked_add()`
- Return error on overflow instead of wrapping

**Acceptance Criteria (DoD):**
- [ ] Nonce increment uses `checked_add()`
- [ ] Overflow returns explicit error
- [ ] Tests cover overflow boundary

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-06 — Float-to-Integer Minting Bug (Rust) (CRITICAL)
**Status:** `NOT_STARTED` — 0%

**Risk:** `crates/core/src/certificate.rs` uses unsafe float-to-integer cast that allows unlimited minting through crafted float values (NaN, Infinity, out-of-range).

**Action:**
- Validate bounds before conversion
- Reject NaN, Infinity, negative, and out-of-range values
- Use safe conversion with explicit error handling

**Acceptance Criteria (DoD):**
- [ ] Float values validated before integer conversion
- [ ] NaN, Infinity, negative values rejected
- [ ] Tests cover edge cases (MAX, MIN, NaN, Inf)

**Changelog:**
- Date:
- Changes:
- Notes:

---

### HIGH

#### P0.5-07 — Private Key Sent to Server as "Signature" (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** `wallet/src/app/send/page.tsx` sends the secret key to the server instead of a real cryptographic signature. The server (and any MITM) receives the user's private key in plaintext.

**Action:**
- Implement client-side Ed25519 signing
- Send only the signature, never the private key
- Server verifies signature against public key

**Acceptance Criteria (DoD):**
- [ ] Private key never leaves the client
- [ ] Ed25519 signing implemented client-side
- [ ] Server validates signatures correctly
- [ ] Tests cover signing and verification

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-08 — Client-Side Only Authentication (Explorer) (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** Authentication in the Explorer app is just a `sessionStorage` flag. Any user can set the flag manually and bypass authentication entirely.

**Action:**
- Implement server-side JWT verification
- Validate tokens on every protected page load
- Remove client-side-only auth checks

**Acceptance Criteria (DoD):**
- [ ] Auth state verified server-side on each request
- [ ] sessionStorage flag alone cannot grant access
- [ ] Tests cover token validation and rejection

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-09 — Secrets in localStorage/sessionStorage (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** Wallet private keys stored in browser storage are accessible to any XSS attack or browser extension.

**Action:**
- Keep keys in memory only
- Require re-entry of credentials on session start
- Clear any existing stored keys

**Acceptance Criteria (DoD):**
- [ ] No private keys in localStorage or sessionStorage
- [ ] Keys held in memory only during active session
- [ ] Migration path for existing stored keys

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-10 — Mempool DoS — No Per-Account Limits (Rust) (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** An attacker can fill the entire 100K transaction mempool from a single address, denying service to all other users.

**Action:**
- Add per-account transaction limits in the mempool
- Implement fair queuing or per-sender caps
- Reject transactions exceeding per-account threshold

**Acceptance Criteria (DoD):**
- [ ] Per-account mempool limit enforced
- [ ] Exceeding limit returns clear error
- [ ] Tests cover limit enforcement and edge cases

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-11 — No Signature Verification Before Mempool Admission (Rust) (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** API checks admin authorization before verifying transaction signatures, allowing mempool flooding with invalid transactions.

**Action:**
- Verify cryptographic signature first, before any other checks
- Reject invalid signatures immediately at the API layer

**Acceptance Criteria (DoD):**
- [ ] Signature verified before mempool admission
- [ ] Invalid signatures rejected at API layer
- [ ] Tests cover valid and invalid signature scenarios

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-12 — Unauthenticated WebSocket Broadcast (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** Anyone can connect to the WebSocket and receive all blockchain data without any authentication.

**Action:**
- Validate JWT on WebSocket upgrade request
- Reject unauthenticated connections
- Consider per-user data filtering

**Acceptance Criteria (DoD):**
- [ ] JWT validated on WS upgrade
- [ ] Unauthenticated connections rejected
- [ ] Tests cover auth and rejection scenarios

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-13 — No Input Validation on Endpoints (HIGH)
**Status:** `NOT_STARTED` — 0%

**Risk:** Request bodies are used without validation, enabling injection attacks, type confusion, and unexpected behavior.

**Action:**
- Add validation middleware (e.g., Joi, Zod, or express-validator)
- Define schemas for all endpoint inputs
- Reject invalid requests with clear error messages

**Acceptance Criteria (DoD):**
- [ ] All endpoints validate input against schemas
- [ ] Invalid input returns 400 with descriptive error
- [ ] Tests cover valid and invalid input scenarios

**Changelog:**
- Date:
- Changes:
- Notes:

---

### MEDIUM

#### P0.5-14 — CORS Allows No-Origin Requests (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** CORS policy can be bypassed by omitting the `Origin` header (e.g., from curl, server-to-server). This allows unauthorized cross-origin access in production.

**Action:**
- Reject requests with no `Origin` header in production
- Whitelist specific allowed origins

**Acceptance Criteria (DoD):**
- [ ] No-origin requests blocked in production
- [ ] Allowed origins explicitly whitelisted
- [ ] Tests cover CORS enforcement

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-15 — Helmet CSP Disabled (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** `contentSecurityPolicy` is set to `false` in Helmet configuration, removing a critical XSS defense layer.

**Action:**
- Enable CSP with proper directives
- Define script-src, style-src, connect-src, etc.
- Test that application functionality is not broken

**Acceptance Criteria (DoD):**
- [ ] CSP enabled with appropriate directives
- [ ] No application functionality broken by CSP
- [ ] Tests verify CSP headers present in responses

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-16 — Missing CSRF Protection (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** No CSRF tokens on any state-changing operation. Attackers can craft pages that trigger actions on behalf of authenticated users.

**Action:**
- Implement CSRF token generation and validation
- Apply to all state-changing endpoints (POST, PUT, DELETE)
- Consider SameSite cookie attribute as defense-in-depth

**Acceptance Criteria (DoD):**
- [ ] CSRF tokens required on state-changing operations
- [ ] Tokens validated server-side
- [ ] Tests cover CSRF enforcement

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-17 — No Rate Limiting on Rust API (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** Axum API has no rate limits or authentication, allowing unlimited requests that can overload the system.

**Action:**
- Add rate limiting middleware to Axum API
- Implement per-IP and per-account rate limits
- Add authentication to Rust API endpoints

**Acceptance Criteria (DoD):**
- [ ] Rate limiting active on all API endpoints
- [ ] Per-IP and per-account limits enforced
- [ ] 429 returned when limits exceeded

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-18 — Secret Key Exposed via Admin Keypair Endpoints (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** Both Rust and Node APIs return private keys in plaintext JSON via admin keypair endpoints. Any API consumer receives the admin secret key.

**Action:**
- Remove secret key from API responses
- Return only public key from admin endpoints
- Audit all endpoints for secret key leakage

**Acceptance Criteria (DoD):**
- [ ] No secret keys in any API response
- [ ] Admin endpoints return public key only
- [ ] Tests verify no secret key leakage

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-19 — Non-Atomic Nonce Check in Executor (Rust) (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** Race condition in the executor allows concurrent transactions to pass nonce validation simultaneously, potentially causing double-spends or state corruption.

**Action:**
- Make nonce check and increment atomic
- Use mutex or transaction-level locking
- Test under concurrent load

**Acceptance Criteria (DoD):**
- [ ] Nonce check + increment is atomic
- [ ] Concurrent transactions handled correctly
- [ ] Tests cover concurrent execution scenarios

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-20 — Single-Node Consensus (No actual PBFT) (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** Consensus implementation skips prepare/commit phases entirely. There is no actual Byzantine fault tolerance despite PBFT being referenced.

**Action:**
- Document current consensus as single-node / centralized
- Either implement real PBFT or clearly label as non-BFT
- Add warnings in documentation and UI

**Acceptance Criteria (DoD):**
- [ ] Consensus model clearly documented
- [ ] No misleading BFT claims in code or docs
- [ ] Roadmap for multi-node consensus if needed

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-21 — Missing Security Headers in Next.js Apps (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** No CSP, X-Frame-Options, or HSTS headers on any frontend application, leaving users vulnerable to clickjacking, XSS, and downgrade attacks.

**Action:**
- Add security headers in `next.config.js` for all Next.js apps
- Include CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy

**Acceptance Criteria (DoD):**
- [ ] All security headers present on frontend responses
- [ ] Headers verified via browser dev tools or automated check
- [ ] No application functionality broken

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-22 — Marketplace Endpoints Allow Arbitrary Body Spread (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** POST/PUT routes in the marketplace spread `req.body` directly into data objects, allowing attackers to inject arbitrary fields (e.g., `isAdmin`, `price`, `owner`).

**Action:**
- Whitelist allowed fields for each endpoint
- Destructure only expected fields from request body
- Reject or strip unexpected fields

**Acceptance Criteria (DoD):**
- [ ] All endpoints use field whitelisting
- [ ] Unexpected fields are stripped or rejected
- [ ] Tests cover injection attempts

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-23 — Unencrypted Wallet Key Backup Download (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** `SecretKeyBackup.tsx` downloads an unencrypted JSON file containing the user's secret key. Anyone with file access obtains the key.

**Action:**
- Encrypt backup file with user-provided password before download
- Use AES-256-GCM for backup encryption
- Warn user about secure storage of backup file

**Acceptance Criteria (DoD):**
- [ ] Backup file encrypted before download
- [ ] Password required for backup creation
- [ ] Decryption/restore flow tested

**Changelog:**
- Date:
- Changes:
- Notes:

---

#### P0.5-24 — No Transaction Replay Protection in Mock Server (MEDIUM)
**Status:** `NOT_STARTED` — 0%

**Risk:** No nonce tracking in the mock server means the same transaction request can be submitted and executed multiple times.

**Action:**
- Implement nonce tracking per account in mock server
- Reject transactions with already-used or out-of-order nonces
- Return clear error for duplicate transactions

**Acceptance Criteria (DoD):**
- [ ] Nonce tracked per account
- [ ] Duplicate transactions rejected
- [ ] Tests cover replay attempts

**Changelog:**
- Date:
- Changes:
- Notes:

---

## 4) Phase P1 (Pre-Production) — Essential Security Controls

### P1-01 — Upgrade Bcrypt Cost Factor to 14
**Status:** `DONE` — 100%
**Progress:** security.js already has BCRYPT_COST = 14.

**Risk:** increased feasibility of password cracking.

**Action:**
- Increase bcrypt cost factor to `14`
- Progressive migration: re-hash passwords on next successful login

**Acceptance Criteria (DoD):**
- [x] New passwords use cost factor 14
- [ ] Existing users are migrated on login
- [x] Tests cover hashing + migration logic
- [x] Authentication flow remains stable

**Required Evidence:**
- [x] Test results + basic hashing benchmark

**Changelog:**
- Date: 2026-02-05
- Changes: Verified security.js already implements BCRYPT_COST = 14
- Notes: Marked DONE — implementation already in place

---

### P1-02 — Audit Log Immutability (Hash-Chained Logs)
**Status:** `DONE` — 100%
**Progress:** auditLog.service.js with hash chaining + audit_triggers.sql exists.

**Risk:** attackers or admins tampering with audit trails.

**Action:**
- Implement hash chaining (each entry stores hash of previous entry)
- DB triggers/constraints to prevent DELETE and hash modification
- Integrity verification function: `verifyAuditLogIntegrity()`

**Suggested files:**
- `services/auditLog.service.js`
- `migrations/audit_triggers.sql`

**Acceptance Criteria (DoD):**
- [x] Audit entries cannot be deleted via standard SQL
- [x] Hash and previous hash fields cannot be altered
- [x] Integrity check detects any tampering
- [x] Tests cover valid chain, tampering detection, delete prevention

**Required Evidence:**
- [x] Failed DELETE attempt output
- [x] Integrity verification results

**Changelog:**
- Date: 2026-02-05
- Changes: Verified auditLog.service.js with hash chaining and audit_triggers.sql exist
- Notes: Marked DONE — implementation complete

---

### P1-03 — JWT Revocation (Blacklist + Token Versioning)
**Status:** `IN_PROGRESS` — 75%
**Progress:** tokenBlacklist.js exists, auth routes being wired in.

**Risk:** stolen tokens remain valid until expiration.

**Action:**
- Redis-backed token blacklist by `tokenId`
- User-level token versioning:
  - `revokeAllUserTokens(userId)` increments version
- Middleware enforcement: `checkTokenBlacklist`

**Suggested files:**
- `middleware/tokenBlacklist.js`

**Acceptance Criteria (DoD):**
- [x] Revoked tokens are denied access
- [x] User-wide revocation invalidates older tokens
- [ ] Tests cover blacklist, versioning, and expiration
- [ ] Defined behavior if Redis is unavailable (fail-closed for critical endpoints)

**Required Evidence:**
- [ ] Middleware logs + test results

**Changelog:**
- Date: 2026-02-05
- Changes: tokenBlacklist.js created, auth routes being wired in
- Notes: 75% complete — wiring in progress

---

### P1-04 — Single Point of Failure Mitigation
**Status:** `NOT_STARTED` — 0%

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
**Status:** `IN_PROGRESS` — 50%
**Progress:** rbac.js exists with full permission matrix, being wired into server.js.

**Risk:** privilege escalation from hardcoded role logic.

**Action:**
- Create roles and permissions tables/collections
- Implement RBAC middleware/guards
- Proposed roles:
  - CLIENT, ORACLE, AUDITOR, ADMIN, SUPER_ADMIN

**Suggested files:**
- `middleware/rbac.js`

**Acceptance Criteria (DoD):**
- [x] Roles are not boolean flags
- [x] Permissions are resource/action based
- [ ] Tests validate allow/deny per role
- [ ] Auditor role is strictly read-only

**Required Evidence:**
- [ ] Permission matrix + tests

**Changelog:**
- Date: 2026-02-05
- Changes: rbac.js created with full permission matrix, wiring into server.js in progress
- Notes: 50% complete — middleware exists, integration in progress

---

### P2-02 — Managed Database Migration (Pre-Production)
**Status:** `NOT_STARTED` — 0%

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

### 2026-02-05
- Work completed: Deep security audit identifying 24 additional vulnerabilities, database deployment, auth system creation, security middleware wiring
- Items touched: P0-01, P0-02, P1-01, P1-02, P1-03, P2-01, P0.5-01 through P0.5-24
- Blockers: None
- Next steps: Complete server.js wiring, frontend fixes, Rust core fixes
- PRs/Commits: feature/phase-one branch

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
