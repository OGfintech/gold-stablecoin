# STTAURX Deployment Environments

**Created:** February 3, 2026
**Status:** Active
**Approach:** Local → Testnet → Mainnet (Single Droplet)

---

## Overview

This document defines the 3-stage deployment workflow for STTAURX, ensuring code is tested locally before moving to testnet, and testnet is validated before mainnet deployment.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LOCAL (Your Mac)         TESTNET (Droplet)        MAINNET (Droplet)   │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│   │ Development │   ───►   │   Testing   │   ───►   │ Production  │    │
│   │             │          │             │          │             │    │
│   │ Mock Data   │          │ Test DB     │          │ Live DB     │    │
│   │ or SQLite   │          │ 100 users   │          │ Scalable    │    │
│   │             │          │             │          │             │    │
│   │ Port: 3001  │          │ Port: 4001  │          │ Port: 3001  │    │
│   └─────────────┘          └─────────────┘          └─────────────┘    │
│                                                                          │
│   ✓ Fast iteration         ✓ Real DB tests         ✓ Live users        │
│   ✓ No network needed      ✓ API validation        ✓ Full security     │
│   ✓ Mock mode              ✓ 100 user limit        ✓ Monitoring        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.local (Your Mac - Development)
NODE_ENV=development
USE_DATABASE=false                    # Mock mode by default
DATABASE_URL=""                       # Not needed for mock
REDIS_URL=""                          # Not needed for mock
API_PORT=3001
MAX_USERS=unlimited                   # Mock doesn't limit

# .env.testnet (Droplet - Testing)
NODE_ENV=testnet
USE_DATABASE=true
DATABASE_URL="postgresql://sttaurx_test:password@localhost:5432/sttaurx_testnet"
REDIS_URL="redis://:password@localhost:6379/1"      # DB 1 for testnet
API_PORT=4001                         # Different port from mainnet
MAX_USERS=100                         # Hard limit for testing
TESTNET_MODE=true                     # Enable testnet features

# .env.mainnet (Droplet - Production)
NODE_ENV=production
USE_DATABASE=true
DATABASE_URL="postgresql://sttaurx_prod:password@localhost:5432/sttaurx_mainnet"
REDIS_URL="redis://:password@localhost:6379/0"      # DB 0 for mainnet
API_PORT=3001
MAX_USERS=10000                       # Initial production limit
TESTNET_MODE=false
```

---

## Database Configuration (Single Droplet)

### PostgreSQL Setup (Two Databases)

```sql
-- Testnet Database (Small - 100 users)
CREATE DATABASE sttaurx_testnet;
CREATE USER sttaurx_test WITH ENCRYPTED PASSWORD 'test_password_here';
GRANT ALL PRIVILEGES ON DATABASE sttaurx_testnet TO sttaurx_test;

-- Mainnet Database (Scalable)
CREATE DATABASE sttaurx_mainnet;
CREATE USER sttaurx_prod WITH ENCRYPTED PASSWORD 'prod_password_here';
GRANT ALL PRIVILEGES ON DATABASE sttaurx_mainnet TO sttaurx_prod;
```

### Redis Setup (Separate DBs)

```
Redis DB 0 → Mainnet (production cache)
Redis DB 1 → Testnet (test cache)
```

### Resource Allocation (Small Test)

| Resource | Testnet | Mainnet (Initial) | Mainnet (Scaled) |
|----------|---------|-------------------|------------------|
| Max Users | 100 | 1,000 | 10,000+ |
| DB Connections | 10 | 20 | 50+ |
| Redis Memory | 64MB | 128MB | 512MB+ |
| PostgreSQL | 128MB shared_buffers | 256MB | 1GB+ |

---

## Stage 1: LOCAL Development

### What Happens Here
- Code on your Mac
- Use mock data (no database needed)
- Fast iteration, instant feedback
- All features work with simulated data

### Commands

```bash
# Start in mock mode (default)
cd mock-server
npm run dev

# Or explicitly set mock mode
USE_DATABASE=false npm run dev
```

### When to Move to Testnet
- [ ] Feature is code complete
- [ ] Works with mock data
- [ ] No console errors
- [ ] Basic manual testing done

---

## Stage 2: TESTNET (Droplet)

### What Happens Here
- Deploy to droplet on port 4001
- Real PostgreSQL + Redis (testnet databases)
- Limited to 100 users
- Test with real database operations
- Validate API responses
- Test error handling

### Setup Commands

```bash
# SSH to droplet
ssh root@164.92.116.28

# Start testnet server
cd /var/www/sttaurx/mock-server
NODE_ENV=testnet pm2 start server.js --name sttaurx-testnet -- --port 4001
```

### Testnet URL
```
http://164.92.116.28:4001/api/v1/...
```

### Testing Checklist
- [ ] Database migrations run successfully
- [ ] All API endpoints return expected data
- [ ] Error handling works correctly
- [ ] Rate limiting functions
- [ ] Authentication works
- [ ] 100 user limit enforced
- [ ] Performance acceptable

### When to Move to Mainnet
- [ ] All testnet tests pass
- [ ] No database errors
- [ ] Performance is acceptable
- [ ] Security audit passed
- [ ] Stakeholder approval

---

## Stage 3: MAINNET (Droplet)

### What Happens Here
- Production deployment on port 3001
- Real users, real data
- Full monitoring and alerting
- Backup systems active

### Deployment Commands

```bash
# SSH to droplet
ssh root@164.92.116.28

# Deploy to mainnet
cd /var/www/sttaurx/mock-server
NODE_ENV=production pm2 start server.js --name sttaurx-mainnet -- --port 3001

# Verify
pm2 status
curl http://localhost:3001/health
```

### Mainnet URL
```
http://164.92.116.28:3001/api/v1/...
https://api.sttaurx.io/api/v1/...  (with domain)
```

---

## User Limits Enforcement

### Implementation

```javascript
// middleware/userLimit.js
const MAX_USERS = parseInt(process.env.MAX_USERS) || 100;

async function enforceUserLimit(req, res, next) {
  if (req.path === '/api/v1/users' && req.method === 'POST') {
    const userCount = await prisma.user.count();

    if (userCount >= MAX_USERS) {
      return res.status(403).json({
        success: false,
        error: `User limit reached (${MAX_USERS}). This is a ${process.env.NODE_ENV} environment.`,
        currentUsers: userCount,
        maxUsers: MAX_USERS
      });
    }
  }
  next();
}
```

### Testnet Banner (Optional)

```javascript
// Add to all API responses in testnet
if (process.env.TESTNET_MODE === 'true') {
  res.set('X-Environment', 'testnet');
  res.set('X-User-Limit', process.env.MAX_USERS);
}
```

---

## Scaling Guide (Future)

### When to Scale

| Metric | Trigger | Action |
|--------|---------|--------|
| Users | >80% of limit | Increase MAX_USERS |
| DB Connections | >80% pool | Increase pool size |
| Response Time | >500ms avg | Add indexes, optimize queries |
| Memory | >80% usage | Increase Redis memory |

### How to Scale

```bash
# 1. Update environment variable
MAX_USERS=1000  # Increase limit

# 2. Update PostgreSQL config
sudo nano /etc/postgresql/16/main/conf.d/sttaurx.conf
# Change: max_connections = 200

# 3. Update Redis config
sudo nano /etc/redis/redis.conf
# Change: maxmemory 512mb

# 4. Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis-server
pm2 restart sttaurx-mainnet
```

### Scaling to DigitalOcean Managed DB (Future)

When you need more scale:

```bash
# 1. Create managed database in DO console
# 2. Update DATABASE_URL in .env.mainnet
DATABASE_URL="postgresql://user:pass@db-cluster.ondigitalocean.com:25060/sttaurx?sslmode=require"

# 3. Migrate data
pg_dump -h localhost sttaurx_mainnet | psql -h db-cluster.ondigitalocean.com sttaurx

# 4. Restart server
pm2 restart sttaurx-mainnet
```

---

## PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'sttaurx-testnet',
      script: 'server.js',
      args: '--port 4001',
      env: {
        NODE_ENV: 'testnet',
        USE_DATABASE: 'true',
        MAX_USERS: '100',
        TESTNET_MODE: 'true'
      }
    },
    {
      name: 'sttaurx-mainnet',
      script: 'server.js',
      args: '--port 3001',
      env: {
        NODE_ENV: 'production',
        USE_DATABASE: 'true',
        MAX_USERS: '10000',
        TESTNET_MODE: 'false'
      }
    }
  ]
};
```

---

## Quick Reference

| Environment | Port | Database | Redis DB | Max Users | Command |
|-------------|------|----------|----------|-----------|---------|
| Local | 3001 | Mock/None | None | Unlimited | `npm run dev` |
| Testnet | 4001 | sttaurx_testnet | 1 | 100 | `pm2 start sttaurx-testnet` |
| Mainnet | 3001 | sttaurx_mainnet | 0 | 10,000+ | `pm2 start sttaurx-mainnet` |

---

## Checklist: Moving Code Through Pipeline

### Local → Testnet
- [ ] Code works with mock data
- [ ] All tests pass locally
- [ ] Committed to git branch
- [ ] PR reviewed (if applicable)
- [ ] Deploy to testnet
- [ ] Run testnet tests

### Testnet → Mainnet
- [ ] All testnet tests pass
- [ ] Database migrations verified
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Backup mainnet DB first
- [ ] Deploy to mainnet
- [ ] Verify health check
- [ ] Monitor for errors

---

*Document created: February 3, 2026*
