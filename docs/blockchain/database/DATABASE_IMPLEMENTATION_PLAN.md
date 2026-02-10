# STTAURX Database Implementation Plan

**Date:** February 3, 2026
**Status:** PLAN - Awaiting Approval
**Author:** Development Team

---

## Executive Summary

This plan addresses three critical questions before execution:

1. **Mock Data Testing** - How to support both mock mode and database mode
2. **Rust Compatibility** - Integration between Rust blockchain core and Node.js API
3. **Security Protocols** - SQL injection prevention and comprehensive security

---

## Current Architecture Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    STTAURX Platform Architecture                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTENDS (Next.js)                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Explorer │  │  Wallet  │  │Marketplace│                      │
│  │  :3000   │  │  :3002   │  │  :3003   │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
│       │             │             │                              │
│       └─────────────┴──────┬──────┘                              │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │  Mock Server  │  ◄── Node.js API Layer     │
│                    │    :3001      │      (Users, Wallets,      │
│                    └───────┬───────┘       Marketplace)          │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐          │
│  │ PostgreSQL  │   │    Redis    │   │ Rust Node   │          │
│  │  (NEW)      │   │   (NEW)     │   │ (RocksDB)   │          │
│  │             │   │             │   │             │          │
│  │ - Users     │   │ - Sessions  │   │ - Blocks    │          │
│  │ - Wallets   │   │ - Cache     │   │ - State     │          │
│  │ - Orders    │   │ - Pub/Sub   │   │ - Consensus │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight

Your **Rust core** uses **RocksDB** (key-value store) for blockchain state - this is correct for blockchain data (blocks, transactions, state trie).

The **PostgreSQL database** is for the **Node.js API layer** - user accounts, marketplace orders, KYC, etc. These are application-level concerns, not blockchain-level.

---

## Question 1: Mock Data Testing

### Problem
The current `server.js` uses in-memory mock data. We need both:
- **Mock Mode**: For quick testing without database setup
- **Database Mode**: For production and integration testing

### Solution: Hybrid Architecture with Feature Flags

```javascript
// Environment-based mode selection
USE_DATABASE=false  → Mock mode (in-memory data)
USE_DATABASE=true   → Database mode (PostgreSQL + Redis)
```

### Implementation Plan

```
mock-server/
├── server.js                    # Main server (unchanged)
├── config/
│   └── database.config.js       # Database configuration
├── database/
│   ├── db.js                    # Database connection layer
│   ├── schema.prisma            # Prisma schema
│   └── seeds/seed.js            # Seed data
├── services/                    # NEW: Business logic layer
│   ├── index.js                 # Service factory (mock vs db)
│   ├── mock/                    # Mock implementations
│   │   ├── userService.mock.js
│   │   ├── walletService.mock.js
│   │   └── transactionService.mock.js
│   └── db/                      # Database implementations
│       ├── userService.db.js
│       ├── walletService.db.js
│       └── transactionService.db.js
└── routes/                      # API routes (use services)
    ├── users.js
    ├── wallets.js
    └── transactions.js
```

### Service Factory Pattern

```javascript
// services/index.js
const useMockData = process.env.USE_DATABASE !== 'true';

module.exports = {
  userService: useMockData
    ? require('./mock/userService.mock')
    : require('./db/userService.db'),
  walletService: useMockData
    ? require('./mock/walletService.mock')
    : require('./db/walletService.db'),
  // ... etc
};
```

### Benefits
- ✅ Zero code changes to switch modes
- ✅ Test locally without database
- ✅ Same API contract for both modes
- ✅ Easy to add new services

---

## Question 2: Rust Compatibility

### Current Rust Architecture

Your Rust crates use:
- **RocksDB** for blockchain storage (blocks, state, transactions)
- **Axum** for HTTP API
- **ed25519-dalek** for cryptography

### Integration Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Flow Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Application Data                         │ │
│  │           (Users, KYC, Marketplace, Orders)                 │ │
│  │                                                              │ │
│  │  Node.js API  ──────▶  PostgreSQL + Redis                  │ │
│  │  (mock-server)         (Relational data)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ Sync via API calls                │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Blockchain Data                          │ │
│  │            (Blocks, Transactions, State)                    │ │
│  │                                                              │ │
│  │  Rust Node  ─────────▶  RocksDB                            │ │
│  │  (crates/*)             (Key-value store)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Option A: Keep Rust + Node.js Separate (Recommended for Phase 1)

```
Rust Node (Blockchain)          Node.js API (Application)
       │                               │
       │◄──────── HTTP/gRPC ──────────►│
       │                               │
   RocksDB                        PostgreSQL
   (Blockchain state)             (User data)
```

**Pros:**
- Clear separation of concerns
- Rust handles performance-critical blockchain ops
- Node.js handles user-facing API
- Each uses optimal database type

**Cons:**
- Two systems to maintain
- Need sync mechanism

### Option B: Add PostgreSQL to Rust (Future Phase)

If you want Rust to also use PostgreSQL for some data:

```toml
# Cargo.toml additions
[workspace.dependencies]
# SQLx (async, compile-time checked queries)
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }

# OR Diesel (sync, type-safe ORM)
diesel = { version = "2.1", features = ["postgres", "uuid", "chrono"] }
```

**SQLx Example (Async + Compile-time safety):**

```rust
use sqlx::postgres::PgPoolOptions;

// Connection pool
let pool = PgPoolOptions::new()
    .max_connections(20)
    .connect(&database_url)
    .await?;

// Parameterized query (SQL injection safe!)
let user = sqlx::query_as!(
    User,
    r#"
    SELECT id, email, full_name, role as "role: UserRole"
    FROM users
    WHERE email = $1
    "#,
    email
)
.fetch_one(&pool)
.await?;
```

### Recommendation

**Phase 1:** Keep Node.js for application API, Rust for blockchain core
**Phase 2:** Consider adding SQLx to Rust if you need direct DB access from blockchain

---

## Question 3: Security Protocols

### Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Layers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Network Security                                       │
│  ├── HTTPS/TLS encryption                                       │
│  ├── Firewall (UFW)                                             │
│  └── Rate limiting                                               │
│                                                                  │
│  Layer 2: Input Validation                                       │
│  ├── Request sanitization                                       │
│  ├── Schema validation (Joi/Zod)                                │
│  └── Parameter validation                                        │
│                                                                  │
│  Layer 3: SQL Injection Prevention                               │
│  ├── Parameterized queries (Prisma)                             │
│  ├── Input escaping                                              │
│  └── Query whitelisting                                          │
│                                                                  │
│  Layer 4: Authentication & Authorization                         │
│  ├── JWT tokens (signed, expiring)                              │
│  ├── Bcrypt password hashing (cost=12)                          │
│  ├── Role-based access control (RBAC)                           │
│  └── Session management                                          │
│                                                                  │
│  Layer 5: Data Protection                                        │
│  ├── Encryption at rest                                          │
│  ├── Encryption in transit                                       │
│  └── Sensitive data masking                                      │
│                                                                  │
│  Layer 6: Monitoring & Audit                                     │
│  ├── Audit logging                                               │
│  ├── Intrusion detection                                         │
│  └── Anomaly alerting                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### SQL Injection Prevention

#### How Prisma Prevents SQL Injection

```javascript
// ❌ VULNERABLE (raw string concatenation)
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
// Attack: userInput = "'; DROP TABLE users; --"

// ✅ SAFE (Prisma parameterized query)
const user = await prisma.user.findUnique({
  where: { email: userInput }  // Automatically parameterized
});

// ✅ SAFE (Prisma raw query with parameters)
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
// Prisma converts to: SELECT * FROM users WHERE email = $1
```

#### Input Validation Layer

```javascript
// Using Zod for schema validation
const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

// Middleware
const validateRequest = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};
```

### Security Implementation Checklist

#### 1. Authentication Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password hashing | bcrypt (cost=12) | 🟡 Planned |
| JWT tokens | RS256 signed, 24h expiry | 🟡 Planned |
| Refresh tokens | Secure, HTTP-only cookies | 🟡 Planned |
| Session invalidation | Redis-backed revocation | 🟡 Planned |
| 2FA | TOTP (optional) | 🔴 Future |

#### 2. Input Validation

| Feature | Implementation | Status |
|---------|---------------|--------|
| Schema validation | Zod/Joi | 🟡 Planned |
| SQL injection | Prisma parameterized | ✅ Built-in |
| XSS prevention | Input sanitization | 🟡 Planned |
| NoSQL injection | express-mongo-sanitize | ✅ Exists |

#### 3. API Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| Rate limiting | express-rate-limit | ✅ Exists |
| CORS | Whitelist origins | ✅ Exists |
| Helmet headers | helmet.js | ✅ Exists |
| HPP protection | hpp middleware | ✅ Exists |
| Request size limit | 10KB body limit | ✅ Exists |

#### 4. Database Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| Parameterized queries | Prisma ORM | ✅ Built-in |
| Connection encryption | SSL/TLS | 🟡 Planned |
| Least privilege | DB role permissions | 🟡 Planned |
| Backup encryption | pg_dump + GPG | 🟡 Planned |

### Security Middleware Stack

```javascript
// Recommended middleware order
app.use(helmet());                    // Security headers
app.use(hpp());                       // HTTP parameter pollution
app.use(mongoSanitize());            // NoSQL injection
app.use(cors(corsOptions));          // CORS whitelist
app.use(rateLimiter);                // Rate limiting
app.use(express.json({ limit: '10kb' })); // Body size limit
app.use(validateInput);              // Schema validation
app.use(authenticate);               // JWT verification
app.use(authorize);                  // RBAC check
app.use(auditLog);                   // Activity logging
```

---

## Implementation Phases

### Phase 1A: Mock Mode Enhancement (1 day)
- [ ] Create service factory pattern
- [ ] Refactor routes to use services
- [ ] Add `USE_DATABASE` flag
- [ ] Test mock mode still works

### Phase 1B: Database Integration (2-3 days)
- [ ] Set up PostgreSQL + Redis on droplet
- [ ] Run Prisma migrations
- [ ] Implement database services
- [ ] Add input validation (Zod)
- [ ] Test database mode

### Phase 1C: Security Hardening (1-2 days)
- [ ] Add authentication middleware
- [ ] Implement JWT with refresh tokens
- [ ] Add RBAC authorization
- [ ] Set up audit logging
- [ ] Security testing

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `config/database.config.js` | Database configuration |
| `middleware/auth.js` | JWT authentication |
| `middleware/validate.js` | Input validation |
| `middleware/authorize.js` | RBAC authorization |
| `services/index.js` | Service factory |
| `services/mock/*.js` | Mock service implementations |
| `services/db/*.js` | Database service implementations |
| `utils/security.js` | Security utilities |

### Modified Files

| File | Changes |
|------|---------|
| `server.js` | Add middleware, use services |
| `package.json` | Add new dependencies |
| `.env.example` | Add new config options |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mock mode breaks | High | Thorough testing before merge |
| SQL injection | Critical | Prisma + validation + testing |
| Performance regression | Medium | Caching with Redis |
| Data loss | Critical | Backup strategy + transactions |
| Auth bypass | Critical | Security audit + pen testing |

---

## Decision Points for You

### 1. Database Mode Default
- [ ] **Option A**: Default to mock mode (`USE_DATABASE=false`)
- [ ] **Option B**: Default to database mode (`USE_DATABASE=true`)

### 2. Authentication Strategy
- [ ] **Option A**: Simple JWT (faster to implement)
- [ ] **Option B**: JWT + Refresh Tokens (more secure)

### 3. Rust Integration
- [ ] **Option A**: Keep separate (Node.js API, Rust blockchain)
- [ ] **Option B**: Add SQLx to Rust for shared DB access

### 4. Deployment Strategy
- [ ] **Option A**: Local PostgreSQL on droplet
- [ ] **Option B**: DigitalOcean Managed Database

---

## Next Steps

Once you approve this plan:

1. **Implement Phase 1A** - Service factory + mock mode
2. **Deploy databases** - PostgreSQL + Redis on droplet
3. **Implement Phase 1B** - Database services
4. **Security hardening** - Auth + validation
5. **Testing** - Both modes, security audit

---

## Approval

Please confirm:
- [ ] Overall approach is acceptable
- [ ] Decision points selected
- [ ] Ready to proceed with Phase 1A

---

*Plan created: February 3, 2026*
