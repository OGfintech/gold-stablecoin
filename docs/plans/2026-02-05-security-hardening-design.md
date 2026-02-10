# Security Hardening — Implementation Design

**Date:** 2026-02-05
**Status:** EXECUTING
**Branch:** `feature/phase-one`

---

## Key Discovery

The Red Team identified 8 security items. Our deep audit found **41 real vulnerabilities** across the mock-server, frontends, and Rust blockchain core. However, we also discovered that **most security infrastructure already exists** — it's just never wired into `server.js`.

### Already Built (Not Connected)
- `middleware/rbac.js` — Full RBAC with 14 permissions, 5 roles
- `middleware/tokenBlacklist.js` — Redis-backed JWT revocation
- `utils/security.js` — Bcrypt cost 14, password validation, sanitization
- `utils/encryption.util.js` — AES-256-GCM for KYC documents
- `services/auditLog.service.js` — Hash-chained tamper-proof audit logs
- `database/schema.prisma` — Full PostgreSQL schema with all models
- `database/db.js` — Prisma + Redis connection layer
- `database/seeds/seed.js` — Admin user, demo users, permissions
- `database/migrations/audit_triggers.sql` — PostgreSQL triggers

### Missing (Must Build)
- JWT verification middleware
- Auth routes (login, register, refresh, logout)
- Wiring of all middleware into server.js
- Input validation schemas on endpoints
- Environment-based security config

---

## Implementation Phases

### Phase 1: Database Deployment
- Ensure PostgreSQL is running
- Create `sttaurx` database
- Run `npx prisma migrate dev`
- Run `npx prisma db seed`
- Verify tables and seed data

### Phase 2: Auth System
- Create `middleware/auth.js` — JWT verification middleware
- Create `routes/auth.js` — Login, register, refresh, logout endpoints
- Wire token blacklist into auth middleware
- Create `.env` from `.env.example` with secure defaults

### Phase 3: Wire Security Into server.js
- Import auth, RBAC, tokenBlacklist, auditLog
- Apply auth middleware to all non-public routes
- Apply RBAC to admin routes (mint, set-rate, keypair, user management)
- Apply audit logging to state-changing operations
- Fix hardcoded admin credentials (use .env)
- Add startup database validation (P0-01)

### Phase 4: Input Validation
- Add validation schemas for critical endpoints:
  - Token transfer (address format, amount range)
  - Staking (amount, lock period)
  - Marketplace (commodity fields, order fields)
  - Admin operations (mint amount bounds, rate bounds)

### Phase 5: Config & Headers Hardening
- Fix CORS no-origin bypass
- Enable Helmet CSP for production
- Add security headers to all Next.js apps
- Environment-based config enforcement

### Phase 6: Frontend Critical Fixes
- Move security portal password to server-side validation
- Replace XOR cipher stub with proper encryption note
- Add security headers to Next.js configs

---

## Out of Scope (Future Work)
- Rust blockchain core fixes (nonce overflow, float conversion, mempool limits)
- Full database migration of in-memory data arrays to Prisma queries
- Client-side Ed25519 transaction signing
- MFA implementation
- Managed database migration (P2-02)
