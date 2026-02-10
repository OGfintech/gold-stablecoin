# Gold Chain Platform - Security Checklist

> **Last Updated:** February 2026
> **Version:** 2.0
> **Run this checklist:** Before every deployment, after adding new features, and during security audits.

---

## Quick Start - Startup Security Check

Run these commands at system startup to verify security status:

```bash
# 1. Check all services are running on correct ports
curl -s http://localhost:3001/health || echo "❌ Mock Server DOWN"
curl -s http://localhost:3000 > /dev/null && echo "✅ Explorer UP" || echo "❌ Explorer DOWN"
curl -s http://localhost:3002 > /dev/null && echo "✅ Wallet UP" || echo "❌ Wallet DOWN"

# 2. Verify no exposed sensitive files
find . -name "*.env" -o -name "*.pem" -o -name "*.key" | head -5

# 3. Check for hardcoded secrets in code
grep -r "password\|secret\|api_key\|private_key" --include="*.ts" --include="*.js" | grep -v node_modules | head -10

# 4. Verify CORS settings
curl -I http://localhost:3001/blocks 2>/dev/null | grep -i "access-control"

# 5. Test rate limiting
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/blocks; echo ""; done
```

---

## 📋 Master Security Checklist

### Legend
- ⬜ = Not checked
- ✅ = Passed
- ❌ = Failed / Needs attention
- ⚠️ = Warning / Review needed

---

## 1. API Security

### 1.1 Authentication & Authorization
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | API Key Validation | All admin endpoints require valid API keys |
| ⬜ | JWT Token Expiry | Tokens expire within reasonable timeframe (15-60 min) |
| ⬜ | Refresh Token Rotation | Refresh tokens are single-use and rotated |
| ⬜ | Role-Based Access | Admin vs User roles properly enforced |
| ⬜ | Session Management | Sessions invalidated on logout |
| ⬜ | Password Hashing | Passwords use bcrypt/argon2 (min 12 rounds) |

### 1.2 Input Validation
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Request Body Validation | All inputs validated with schema (Zod/Joi) |
| ⬜ | SQL Injection Prevention | Parameterized queries only |
| ⬜ | NoSQL Injection Prevention | MongoDB operators sanitized |
| ⬜ | XSS Prevention | All user input escaped/sanitized |
| ⬜ | Path Traversal | File paths validated, no `../` allowed |
| ⬜ | Type Coercion | Strict type checking on all inputs |
| ⬜ | Size Limits | Request body size limits enforced |

### 1.3 Rate Limiting & DoS Protection
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Global Rate Limit | Max requests per IP per minute |
| ⬜ | Endpoint Rate Limits | Sensitive endpoints have stricter limits |
| ⬜ | Brute Force Protection | Login attempts limited (5 per 15 min) |
| ⬜ | Request Timeout | All requests timeout after 30s max |
| ⬜ | Payload Size Limit | Max request body size enforced |

### 1.4 API Response Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Error Message Sanitization | No stack traces or internal info in errors |
| ⬜ | Sensitive Data Filtering | Private keys, passwords never returned |
| ⬜ | Response Headers | Security headers set (see Section 5) |
| ⬜ | Pagination Limits | Max page size enforced |

---

## 2. Blockchain & Wallet Security

### 2.1 Private Key Management
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Key Storage | Private keys encrypted at rest |
| ⬜ | Key Generation | Cryptographically secure RNG used |
| ⬜ | Key Never Logged | Private keys never in logs/console |
| ⬜ | Key Never in URL | Keys never passed via query params |
| ⬜ | Memory Clearing | Keys cleared from memory after use |
| ⬜ | Backup Encryption | Wallet backups encrypted |

### 2.2 Transaction Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Transaction Signing | All txs signed client-side |
| ⬜ | Amount Validation | Amounts checked against balance |
| ⬜ | Address Validation | Recipient addresses validated |
| ⬜ | Replay Protection | Nonce/timestamp prevents replays |
| ⬜ | Double-Spend Prevention | Balance checks before processing |
| ⬜ | Transaction Confirmation | Pending state until confirmed |

### 2.3 Signature Verification
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Signature Required | All state-changing ops require sig |
| ⬜ | Signature Verification | Server verifies all signatures |
| ⬜ | Timestamp Validation | Signed timestamp within 5 min |
| ⬜ | Message Format | Standardized signing message format |

---

## 3. Staking & Financial Security

### 3.1 Staking Operations
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Balance Verification | Cannot stake more than balance |
| ⬜ | Lock Period Enforcement | Locked funds cannot be withdrawn |
| ⬜ | Yield Calculation | Server-side yield calculation only |
| ⬜ | APY Rate Limits | Admin APY changes within bounds |
| ⬜ | Withdrawal Limits | Optional daily withdrawal limits |
| ⬜ | Atomic Operations | Stake/unstake are atomic transactions |

### 3.2 Financial Calculations
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Decimal Precision | Use BigNumber/Decimal.js for amounts |
| ⬜ | Overflow Protection | Check for integer overflow |
| ⬜ | Rounding Consistent | Consistent rounding (floor for payouts) |
| ⬜ | Fee Calculation | Fees calculated server-side |

---

## 4. Trade Finance Security

### 4.1 Letter of Credit
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Escrow Protection | Funds locked until conditions met |
| ⬜ | Document Verification | Document hashes verified on-chain |
| ⬜ | Multi-Party Approval | Critical actions need multiple approvals |
| ⬜ | State Machine | LC follows strict state transitions |
| ⬜ | Timeout Handling | Expired LCs handled correctly |

### 4.2 Document Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | File Type Validation | Only allowed file types accepted |
| ⬜ | File Size Limits | Max file size enforced |
| ⬜ | Virus Scanning | Uploaded files scanned |
| ⬜ | Storage Encryption | Documents encrypted at rest |
| ⬜ | Access Control | Documents only visible to parties |

---

## 5. Infrastructure Security

### 5.1 HTTP Security Headers
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Content-Security-Policy | CSP header configured |
| ⬜ | X-Content-Type-Options | Set to `nosniff` |
| ⬜ | X-Frame-Options | Set to `DENY` or `SAMEORIGIN` |
| ⬜ | X-XSS-Protection | Set to `1; mode=block` |
| ⬜ | Strict-Transport-Security | HSTS enabled in production |
| ⬜ | Referrer-Policy | Set to `strict-origin-when-cross-origin` |

### 5.2 CORS Configuration
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Allowed Origins | Whitelist specific origins only |
| ⬜ | Credentials | Only allow with specific origins |
| ⬜ | Methods | Only allow needed HTTP methods |
| ⬜ | Headers | Restrict allowed headers |

### 5.3 Environment & Secrets
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | .env in .gitignore | Environment files not in git |
| ⬜ | No Hardcoded Secrets | All secrets from env vars |
| ⬜ | Secret Rotation | Credentials rotated regularly |
| ⬜ | Different Env Keys | Prod/staging use different keys |

### 5.4 Logging & Monitoring
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | No Sensitive Data Logged | Keys, passwords never logged |
| ⬜ | Request Logging | All requests logged with IP/timestamp |
| ⬜ | Error Logging | Errors logged with context |
| ⬜ | Audit Trail | Admin actions logged |
| ⬜ | Log Retention | Logs retained per policy |

---

## 6. Frontend Security

### 6.1 Client-Side Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | XSS Prevention | React auto-escaping, no dangerouslySetInnerHTML |
| ⬜ | CSRF Protection | CSRF tokens on state-changing requests |
| ⬜ | Secure Storage | Sensitive data not in localStorage |
| ⬜ | Input Sanitization | User inputs sanitized before display |
| ⬜ | URL Validation | External URLs validated before navigation |

### 6.2 Dependency Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | npm audit | No high/critical vulnerabilities |
| ⬜ | Lock Files | package-lock.json committed |
| ⬜ | Dependency Updates | Dependencies updated regularly |
| ⬜ | License Compliance | All licenses reviewed |

---

## 7. Security Portal Access

### 7.0 Security Portal (/start)
| Status | Check | Description |
|--------|-------|-------------|
| ✅ | Voice Activation | "Initialize Protocol OG" triggers sequence |
| ✅ | Keyboard Shortcut | Ctrl+Shift+A activates portal |
| ✅ | Voice Disabled After Start | Recognition destroyed after activation |
| ✅ | Password Protection | AUTrade88 required for access |
| ✅ | Max Attempts | 5 attempts before lockout |
| ✅ | Session Storage | Auth stored in sessionStorage only |
| ✅ | Full-Screen Overlay | No bypass via navigation |
| ⬜ | Admin Password Change | Backend admin controls for password |
| ⬜ | Admin Phrase Change | Backend admin controls for voice phrase |
| ⬜ | Failed Attempt Logging | Log failed password attempts |

**Files:**
- `explorer/src/app/start/page.tsx` - Main portal component
- `explorer/src/app/start/layout.tsx` - Minimal layout (no nav)
- `docs/blockchain/SECURITY_PORTAL.md` - Full documentation

---

## 7. Admin & User Management

### 7.1 Admin Controls
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Admin Authentication | Strong auth for admin access |
| ⬜ | Admin Actions Logged | All admin actions in audit log |
| ⬜ | Principle of Least Privilege | Admins have minimum needed access |
| ⬜ | Admin Session Timeout | Short session timeout (15 min) |
| ⬜ | IP Whitelist | Admin access from approved IPs only |

### 7.2 User Bucket Management
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Status Transitions | Only valid bucket transitions allowed |
| ⬜ | KYC Data Protection | KYC data encrypted and access-controlled |
| ⬜ | Rejection Reasons | Clear reasons logged for rejections |
| ⬜ | Appeal Process | User appeal mechanism exists |

---

## 8. Data Protection

### 8.1 Data at Rest
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Database Encryption | Database encrypted |
| ⬜ | Backup Encryption | Backups encrypted |
| ⬜ | Key Management | Encryption keys properly managed |
| ⬜ | Data Classification | Sensitive data identified and protected |

### 8.2 Data in Transit
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | TLS 1.2+ | All connections use TLS 1.2+ |
| ⬜ | Certificate Validation | TLS certs validated |
| ⬜ | No Mixed Content | No HTTP resources on HTTPS pages |

### 8.3 Data Retention
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Retention Policy | Data retention policy defined |
| ⬜ | Deletion Process | Secure deletion when required |
| ⬜ | Right to Erasure | GDPR deletion requests handled |

---

## 9. DDoS & Network Attack Protection

### 9.1 DDoS Mitigation
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | CDN/WAF Enabled | Cloudflare, AWS Shield, or similar active |
| ⬜ | Rate Limiting Active | express-rate-limit or similar configured |
| ⬜ | Connection Limits | Max concurrent connections per IP |
| ⬜ | Nginx Hardening | limit_conn and limit_req configured |
| ⬜ | Slowloris Protection | client_body_timeout and client_header_timeout set |
| ⬜ | SYN Flood Protection | TCP SYN cookies enabled |
| ⬜ | Geographic Blocking | High-risk regions blocked if needed |
| ⬜ | Bandwidth Throttling | Per-IP bandwidth limits configured |

### 9.2 Network Security
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Firewall Rules | Only required ports open (3000, 3001, 3002) |
| ⬜ | Port Scan Detection | Fail2ban or similar monitors port scans |
| ⬜ | SSH Hardening | Key-only auth, no root login |
| ⬜ | VPN for Admin | Admin access via VPN only |
| ⬜ | Network Segmentation | Database not publicly accessible |
| ⬜ | Intrusion Detection | IDS/IPS monitoring active |

### 9.3 Application Layer Protection
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Bot Detection | CAPTCHA or challenge on sensitive endpoints |
| ⬜ | User-Agent Filtering | Block known bad bots |
| ⬜ | Request Fingerprinting | Detect automated attacks |
| ⬜ | Honeypot Endpoints | Fake endpoints to detect attackers |

### 9.4 DDoS Monitoring Tools
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Real-time Dashboard | Live attack visualization enabled |
| ⬜ | Alert Thresholds | Alerts trigger at abnormal traffic levels |
| ⬜ | Traffic Analysis | Baseline traffic patterns established |
| ⬜ | Incident Playbook | DDoS response procedures documented |

**Recommended DDoS Protection Services:**
- Cloudflare DDoS Protection
- AWS Shield
- Akamai Kona Site Defender
- Radware DefensePro

**Implementation Checklist:**
```javascript
// Express.js Rate Limiting Setup
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all requests
app.use(limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});
app.use('/api/auth', authLimiter);
```

---

## 10. Database Injection Protection

### 10.1 SQL Injection Prevention
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Parameterized Queries | All queries use prepared statements |
| ⬜ | ORM Usage | Use TypeORM/Prisma/Sequelize properly |
| ⬜ | No String Concatenation | Never concat user input into queries |
| ⬜ | Stored Procedures | Use stored procs for complex operations |
| ⬜ | Least Privilege | DB user has minimal required permissions |
| ⬜ | Input Type Validation | Validate types before query execution |

### 10.2 NoSQL Injection Prevention (MongoDB)
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | express-mongo-sanitize | Middleware installed and active |
| ⬜ | No $where Operator | Avoid JavaScript execution in queries |
| ⬜ | No mapReduce | Avoid unless absolutely necessary |
| ⬜ | Operator Blacklist | Block $gt, $ne, $in from user input |
| ⬜ | Type Checking | Ensure strings are strings, not objects |
| ⬜ | Depth Limiting | Limit JSON nesting depth in requests |
| ⬜ | Schema Validation | Mongoose schema enforced |

### 10.3 Common Attack Patterns to Block
| Attack Pattern | Example | Prevention |
|---------------|---------|------------|
| Login Bypass | `{"username": {"$gt": ""}}` | Type checking, sanitization |
| Data Extraction | `{"$where": "this.password"}` | Disable $where operator |
| Regex DoS | `{"field": {"$regex": "^(a+)+$"}}` | Regex validation, timeouts |
| Array Injection | `{"$or": [{}, {"a": 1}]}` | Operator whitelist |
| Prototype Pollution | `{"__proto__": {"admin": true}}` | Object.freeze, sanitize keys |

### 10.4 Implementation Code

```javascript
// 1. Install protection middleware
// npm install express-mongo-sanitize helmet hpp

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');

// Apply security middleware
app.use(helmet()); // Security headers
app.use(hpp()); // HTTP Parameter Pollution protection
app.use(mongoSanitize({
  replaceWith: '_', // Replace $ and . with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`Blocked NoSQL injection attempt: ${key}`);
  }
}));

// 2. Custom input validation middleware
const validateInput = (req, res, next) => {
  const checkForInjection = (obj, path = '') => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      // Block dangerous keys
      if (key.startsWith('$') || key.includes('.')) {
        throw new Error(`Invalid key: ${path}${key}`);
      }
      // Check nested objects
      if (typeof obj[key] === 'object') {
        checkForInjection(obj[key], `${path}${key}.`);
      }
    }
  };

  try {
    checkForInjection(req.body);
    checkForInjection(req.query);
    checkForInjection(req.params);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid input detected' });
  }
};

app.use(validateInput);

// 3. Mongoose schema validation example
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^[a-zA-Z0-9_]+$/.test(v),
      message: 'Invalid username format'
    }
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  }
});
```

### 10.5 Testing for Injection Vulnerabilities
```bash
# Test for NoSQL injection on login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": {"$gt": ""}, "password": {"$gt": ""}}'
# Should return 400, not 200

# Test for operator injection
curl -X GET "http://localhost:3001/users?role[\$ne]=admin"
# Should return 400 or filter the operator

# Test for $where injection
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"query": {"$where": "sleep(5000)"}}'
# Should timeout or be blocked
```

---

## 11. Real-Time Threat Monitoring

### 11.1 Threat Intelligence Sources
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Threat Map Dashboard | Live attack visualization embedded |
| ⬜ | IP Reputation Feeds | AbuseIPDB or similar integrated |
| ⬜ | Threat Intel Platform | MISP or OpenCTI connected |
| ⬜ | Blocklist Updates | Automated blocklist refresh |

### 11.2 Available Threat Map Embeds

**Kaspersky Cyberthreat Map (Recommended for Embed)**
```html
<!-- Kaspersky Widget - Customizable -->
<iframe
  src="https://cybermap.kaspersky.com/widget/dynamic/dark"
  width="100%"
  height="400"
  frameborder="0"
  title="Kaspersky Cyberthreat Map">
</iframe>
```
- Widget builder: https://cybermap.kaspersky.com/widget
- Customizable size, language, and theme
- Shows: OAS, ODS, WAV, IDS, VUL, KAS detections

**Alternative Threat Maps:**

| Provider | URL | Embed Support |
|----------|-----|---------------|
| Kaspersky | cybermap.kaspersky.com | ✅ Widget available |
| Check Point | threatmap.checkpoint.com | ⚠️ Limited |
| Fortinet | threatmap.fortiguard.com | ❌ View only |
| Radware | livethreatmap.radware.com | ❌ View only |
| Bitdefender | threatmap.bitdefender.com | ⚠️ Limited |

### 11.3 Internal Monitoring Setup
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Request Logging | All requests logged with metadata |
| ⬜ | Failed Auth Tracking | Track failed login attempts by IP |
| ⬜ | Anomaly Alerts | Alert on traffic spikes |
| ⬜ | Geographic Analysis | Track request origins |
| ⬜ | Attack Pattern DB | Log and analyze attack patterns |

### 11.4 Open Source Threat Intelligence
| Tool | Purpose | URL |
|------|---------|-----|
| MISP | Threat sharing platform | misp-project.org |
| OpenCTI | Cyber threat intelligence | opencti.io |
| AbuseIPDB | IP reputation database | abuseipdb.com |
| Shodan | Attack surface monitoring | shodan.io |
| GreyNoise | Internet scanner detection | greynoise.io |

---

## 12. Testing Requirements

### 12.1 Security Testing
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Penetration Testing | Regular pen tests scheduled |
| ⬜ | Vulnerability Scanning | Automated scanning in CI/CD |
| ⬜ | Code Review | Security-focused code reviews |
| ⬜ | Fuzz Testing | Input fuzzing for APIs |
| ⬜ | Injection Testing | SQLMap/NoSQLMap scans |

### 12.2 Test Coverage
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Auth Tests | Authentication edge cases tested |
| ⬜ | Authorization Tests | Permission checks tested |
| ⬜ | Input Validation Tests | Invalid input handling tested |
| ⬜ | Financial Calculation Tests | Money math edge cases tested |
| ⬜ | Rate Limit Tests | Verify limits are enforced |
| ⬜ | Injection Tests | All injection vectors tested |

---

## 13. Incident Response

### 13.1 Preparation
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Incident Plan | Written incident response plan |
| ⬜ | Contact List | Security team contacts documented |
| ⬜ | Rollback Plan | Quick rollback procedure documented |
| ⬜ | Communication Plan | User notification process defined |

### 13.2 Detection
| Status | Check | Description |
|--------|-------|-------------|
| ⬜ | Alerting | Alerts for suspicious activity |
| ⬜ | Anomaly Detection | Unusual patterns flagged |
| ⬜ | Failed Login Monitoring | Brute force attempts detected |
| ⬜ | DDoS Detection | Traffic spike alerts configured |
| ⬜ | Injection Attempt Alerts | Log and alert on blocked attacks |

---

## Endpoint Security Matrix

### Mock Server Endpoints (Port 3001)

| Endpoint | Auth Required | Rate Limited | Input Validated | Audit Logged |
|----------|---------------|--------------|-----------------|--------------|
| `GET /blocks` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /blocks/:id` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /transactions` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /transactions` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /wallets/:address` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /wallets` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /certificates` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /certificates` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /staking/:address` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /staking/stake` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /staking/unstake` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /staking/claim` | ⬜ | ⬜ | ⬜ | ⬜ |
| `GET /admin/users` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /admin/users/:id/bucket` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /admin/mint` | ⬜ | ⬜ | ⬜ | ⬜ |
| `POST /admin/staking/set-rate` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Security Review Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Security Lead | | | |
| Project Manager | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 2026 | System | Initial checklist |
| 2.0 | Feb 2026 | System | Added DDoS, NoSQL injection, threat monitoring |
| 2.1 | Feb 2026 | System | Added Security Portal section (7.0) |

---

## Quick Reference Commands

```bash
# Check for vulnerabilities in dependencies
npm audit --audit-level=high

# Scan for secrets in codebase
grep -rn "password\|secret\|key\|token" --include="*.ts" --include="*.js" . | grep -v node_modules

# Test CORS configuration
curl -H "Origin: http://evil.com" -I http://localhost:3001/blocks

# Test rate limiting (run multiple times quickly)
for i in {1..20}; do curl -s http://localhost:3001/blocks > /dev/null && echo "Request $i: OK"; done

# Check for open ports
netstat -tlnp | grep LISTEN

# Verify no debug endpoints exposed
curl http://localhost:3001/debug 2>/dev/null && echo "⚠️ Debug endpoint exposed!"

# Test for NoSQL injection
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": {"$gt": ""}, "password": {"$gt": ""}}'

# Check response headers
curl -I http://localhost:3001/blocks | grep -E "(X-|Content-Security|Strict-Transport)"

# Monitor failed auth attempts (if logging enabled)
tail -f /var/log/app/auth.log | grep "failed"

# Check TLS certificate (production)
# openssl s_client -connect yourserver.com:443 -servername yourserver.com
```

---

## Notes

- This checklist should be reviewed and updated with each major feature addition
- All ⬜ items should be ✅ before production deployment
- Any ❌ items should block deployment until resolved
- Keep a copy of completed checklists for compliance records
- Review threat dashboard daily for emerging attack patterns
