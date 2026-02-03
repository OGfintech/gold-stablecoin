# STTAURX Platform - Security Scan Report

**Scan Date:** February 2, 2026
**Scanned By:** Automated Security Audit
**Status:** ⚠️ Issues Found - Action Required

---

## Executive Summary

| Category | Status | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| Dependencies | ❌ FAIL | 1 | 15 | 0 | 0 |
| Authentication | ⚠️ WARN | 0 | 2 | 1 | 0 |
| Input Validation | ⚠️ WARN | 0 | 1 | 2 | 0 |
| CORS Configuration | ⚠️ WARN | 0 | 1 | 0 | 0 |
| Secrets Management | ⚠️ WARN | 0 | 1 | 1 | 0 |
| XSS Prevention | ✅ PASS | 0 | 0 | 0 | 0 |
| Exposed Files | ✅ PASS | 0 | 0 | 0 | 0 |

**Overall Risk Level:** HIGH - Requires immediate attention before production deployment

---

## 1. Dependency Vulnerabilities

### Critical: Next.js Vulnerabilities

**Affected Apps:** Explorer, Wallet, Marketplace (all 3 frontends)

```
Package: next@14.0.4
Severity: CRITICAL
Vulnerabilities: 15+
```

**Vulnerabilities Found:**
| CVE/Advisory | Severity | Description |
|--------------|----------|-------------|
| GHSA-fr5h-rqp8-mj6g | Critical | Server-Side Request Forgery in Server Actions |
| GHSA-gp8f-8m3g-qvj9 | Critical | Cache Poisoning |
| GHSA-7gfc-8cq8-jh5f | High | Authorization Bypass |
| GHSA-f82v-jwr5-mffw | High | Authorization Bypass in Middleware |
| GHSA-4342-x723-ch2f | High | SSRF via Middleware Redirect |
| GHSA-g77x-44xx-532m | High | DoS in Image Optimization |
| GHSA-7m27-7ghc-44w9 | High | DoS with Server Actions |

**Recommended Fix:**
```bash
# Run in each app directory (explorer, wallet, marketplace)
npm audit fix --force
# Or upgrade Next.js manually
npm install next@14.2.35
```

### Mock Server Dependencies
```
Package: express, cors, ws
Severity: ✅ PASS (0 vulnerabilities)
```

---

## 2. Authentication & Authorization Issues

### HIGH: No API Authentication
**Location:** `mock-server/server.js`
**Issue:** All API endpoints are publicly accessible without authentication

**Affected Endpoints:**
- `POST /api/v1/admin/keypair` - Generates keypairs (should be admin only)
- `POST /api/v1/admin/staking/set-rate` - Changes staking rates (should be admin only)
- `POST /api/v1/tokens/mint` - Mints new tokens (should be admin only)
- `POST /api/v1/certificates` - Registers certificates (should be admin only)
- All marketplace endpoints - No buyer/supplier verification

**Risk:** Anyone can call admin functions, mint tokens, or impersonate users

**Recommended Fix:**
```javascript
// Add authentication middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !validateApiKey(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Apply to admin routes
app.use('/api/v1/admin', authMiddleware);
```

### HIGH: Session Storage for Secret Keys
**Location:** `wallet/src/app/providers.tsx`
**Lines:** 83, 107

```typescript
sessionStorage.setItem('wallet_secret', secretKey)
```

**Risk:** Secret keys stored in browser sessionStorage are vulnerable to:
- XSS attacks (if any XSS vulnerability exists)
- Browser extensions
- Shared computer access

**Recommended Fix:**
- Never store secret keys client-side
- Use hardware wallet integration
- Implement secure key derivation with user password

### MEDIUM: Demo Credentials in Code
**Location:** `mock-server/server.js` (line 26-31)

```javascript
const ADMIN = {
  address: 'a1b2c3d4e5f6789012345678901234567890abcdef...',
  publicKey: '1234567890abcdef...',
  secretKey: 'secret1234567890abcdef...'
};
```

**Risk:** Hardcoded credentials visible in source code

**Recommended Fix:**
- Move to environment variables
- Never commit secrets to git

---

## 3. Input Validation Issues

### HIGH: No Request Body Validation
**Location:** `mock-server/server.js`
**Issue:** All POST endpoints accept raw JSON without schema validation

**Example (line 614):**
```javascript
app.post('/api/v1/staking/stake', (req, res) => {
  const { address, amount, lockPeriod = 0 } = req.body;
  // No validation of address format
  // No validation of amount (could be negative)
  // No validation of lockPeriod beyond whitelist
```

**Risk:**
- Malformed data could crash the server
- Negative amounts could drain accounts
- Invalid addresses could cause undefined behavior

**Recommended Fix:**
```javascript
const { z } = require('zod');

const stakeSchema = z.object({
  address: z.string().length(64).regex(/^[0-9a-f]+$/),
  amount: z.string().regex(/^\d+$/).refine(v => BigInt(v) > 0),
  lockPeriod: z.number().refine(v => [0, 30, 60, 90].includes(v))
});

app.post('/api/v1/staking/stake', (req, res) => {
  const result = stakeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  // ... proceed with validated data
});
```

### MEDIUM: No SQL/NoSQL Injection Protection
**Location:** `mock-server/server.js`
**Issue:** No express-mongo-sanitize or input sanitization middleware

**Risk:** If connected to a real database, vulnerable to injection attacks

**Recommended Fix:**
```bash
npm install express-mongo-sanitize helmet hpp
```

```javascript
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');

app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());
```

---

## 4. CORS Configuration

### HIGH: Wide Open CORS
**Location:** `mock-server/server.js` (line 7)

```javascript
app.use(cors());
```

**Risk:** Any website can make requests to your API, enabling:
- Data theft
- CSRF attacks
- Unauthorized access from malicious sites

**Recommended Fix:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Explorer
    'http://localhost:3002',  // Wallet
    'http://localhost:3003',  // Marketplace
    'https://yourdomain.com'  // Production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

---

## 5. Rate Limiting

### HIGH: No Rate Limiting
**Location:** `mock-server/server.js`
**Issue:** No rate limiting on any endpoints

**Risk:**
- DoS attacks
- Brute force attacks on sensitive endpoints
- API abuse

**Recommended Fix:**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

app.use(limiter);

// Stricter limit for sensitive endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});
app.use('/api/v1/admin', adminLimiter);
```

---

## 6. Security Headers

### MEDIUM: Missing Security Headers
**Location:** `mock-server/server.js`
**Issue:** No security headers configured

**Missing Headers:**
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Strict-Transport-Security`

**Recommended Fix:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 7. Positive Findings

### ✅ No XSS Vulnerabilities in Source Code
- No `dangerouslySetInnerHTML` usage found
- No `eval()` in source code (only in build artifacts)
- No `innerHTML` direct assignments

### ✅ No Exposed Sensitive Files
- No `.env` files found in repository
- No `.pem` or `.key` files exposed
- No credentials in config files

### ✅ React Auto-Escaping
- All user inputs properly escaped by React's default behavior

### ✅ TypeScript Type Safety
- TypeScript helps prevent type-related vulnerabilities

---

## 8. Remediation Priority

### Immediate (Before Any Deployment)

1. **Update Next.js** in all frontends
   ```bash
   cd explorer && npm audit fix --force
   cd wallet && npm audit fix --force
   cd marketplace && npm audit fix --force
   ```

2. **Add rate limiting** to mock-server

3. **Restrict CORS** to known origins only

### Short-term (Within 1 Week)

4. **Add API authentication** for admin endpoints

5. **Implement input validation** with Zod or Joi

6. **Add security headers** via helmet

7. **Move secrets** to environment variables

### Medium-term (Before Production)

8. **Implement proper key management** - remove sessionStorage for secrets

9. **Add request logging** and monitoring

10. **Set up security scanning** in CI/CD

---

## 9. Quick Fix Commands

```bash
# Update all dependencies
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main

# Fix explorer
cd explorer && npm audit fix --force

# Fix wallet
cd ../wallet && npm audit fix --force

# Fix marketplace
cd ../marketplace && npm audit fix --force

# Add security packages to mock-server
cd ../mock-server
npm install express-rate-limit helmet hpp express-mongo-sanitize
```

---

## 10. Security Testing Commands

```bash
# Test for open CORS
curl -H "Origin: http://evil.com" -I http://localhost:3001/api/v1/blocks

# Test rate limiting (should be blocked after many requests)
for i in {1..20}; do curl -s http://localhost:3001/api/v1/blocks > /dev/null && echo "Request $i: OK"; done

# Test admin endpoint (should require auth)
curl -X POST http://localhost:3001/api/v1/admin/keypair

# Check response headers
curl -I http://localhost:3001/api/v1/blocks | grep -E "(X-|Content-Security|Access-Control)"
```

---

## Appendix: Files Scanned

| Directory | Files Scanned | Issues Found |
|-----------|---------------|--------------|
| explorer/src | 45 | 0 |
| wallet/src | 38 | 1 |
| marketplace/src | 32 | 0 |
| mock-server | 1 | 8 |
| docs | 6 | 0 |

---

*Report generated automatically. Review findings with security team before taking action.*
*Next scan recommended: After implementing fixes*
