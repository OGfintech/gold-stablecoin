# STTAURX Database Setup Guide

**Phase 1 Implementation**
**Last Updated:** February 3, 2026

---

## Overview

This guide covers setting up PostgreSQL and Redis for the STTAURX Gold Stablecoin platform on your DigitalOcean droplet (164.92.116.28).

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    STTAURX Stack                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Node.js API Server (:3001)           │   │
│  │                                                    │   │
│  │  ┌─────────────┐         ┌─────────────────────┐ │   │
│  │  │   Prisma    │         │  ioredis Client     │ │   │
│  │  │   Client    │         │  (Cache + Pub/Sub)  │ │   │
│  │  └──────┬──────┘         └──────────┬──────────┘ │   │
│  └─────────┼────────────────────────────┼───────────┘   │
│            │                            │                │
│  ┌─────────▼──────────┐     ┌──────────▼──────────┐    │
│  │   PostgreSQL 16    │     │      Redis 7        │    │
│  │   (:5432)          │     │      (:6379)        │    │
│  │                    │     │                     │    │
│  │  - Users           │     │  - Sessions         │    │
│  │  - Wallets         │     │  - Cache            │    │
│  │  - Transactions    │     │  - Rate Limiting    │    │
│  │  - Blocks          │     │  - Pub/Sub          │    │
│  └────────────────────┘     └─────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd mock-server
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (dev only)
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Start Server

```bash
npm run dev
```

---

## Production Deployment (DigitalOcean Droplet)

### Step 1: SSH into Droplet

```bash
ssh root@164.92.116.28
```

### Step 2: Run Setup Script

```bash
# Upload and run the setup script
cd /path/to/gold-stablecoin-main/mock-server
chmod +x database/setup-droplet.sh
sudo ./database/setup-droplet.sh
```

This script will:
- Install PostgreSQL 16
- Install Redis 7
- Create database and user
- Configure security settings
- Generate secure passwords
- Create `.env.database` with credentials

### Step 3: Configure Application

```bash
# Copy generated credentials to mock-server
cp ~/sttaurx/.env.database /path/to/mock-server/.env

# Add additional environment variables
cat >> .env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGINS=http://your-domain.com
EOF
```

### Step 4: Initialize Database Schema

```bash
cd mock-server

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Seed database
npm run db:seed
```

### Step 5: Start with PM2

```bash
# Start the server
pm2 start server.js --name sttaurx-api

# Save PM2 config
pm2 save

# View logs
pm2 logs sttaurx-api
```

---

## Database Commands Reference

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema (dev only) |
| `npm run db:migrate` | Create migration (dev) |
| `npm run db:migrate:deploy` | Apply migrations (prod) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:status` | Check migration status |

---

## Phase 1 Schema

### Tables Created

| Table | Description |
|-------|-------------|
| `users` | User accounts with auth |
| `user_sessions` | JWT session tracking |
| `kyc_documents` | KYC document storage |
| `wallets` | User wallets |
| `wallet_balance_history` | Balance audit trail |
| `blocks` | Blockchain blocks |
| `transactions` | All transactions |
| `transaction_receipts` | Transaction receipts |
| `audit_logs` | Admin activity logs |
| `system_settings` | Platform settings |
| `fee_config` | Fee configuration |

### Key Relationships

```
User ──┬── Wallet ──── Transaction
       │     └── BalanceHistory
       ├── Session
       └── KycDocument

Block ──── Transaction ──── Receipt
```

---

## Redis Cache Strategy

### Key Patterns

| Pattern | Purpose | TTL |
|---------|---------|-----|
| `session:{token}` | User sessions | 24h |
| `user:{id}` | User data cache | 5m |
| `wallet:{address}` | Balance cache | 30s |
| `rate:{ip}:{endpoint}` | Rate limiting | 1m |
| `price:gold:spot` | Gold price | 1m |

### Pub/Sub Channels

| Channel | Purpose |
|---------|---------|
| `channel:transactions` | Live transaction feed |
| `channel:wallet:{address}` | Wallet-specific updates |
| `channel:blocks` | New block announcements |
| `channel:metrics` | System metrics |

---

## Security Checklist

- [ ] PostgreSQL listening only on localhost
- [ ] Redis requires password authentication
- [ ] `.env` file permissions set to 600
- [ ] Database backups configured
- [ ] Firewall rules applied
- [ ] SSL/TLS enabled for production

---

## Backup Commands

### PostgreSQL Backup

```bash
# Create backup
pg_dump -U sttaurx_admin -h localhost sttaurx > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U sttaurx_admin -h localhost sttaurx < backup_file.sql
```

### Redis Backup

```bash
# Trigger RDB snapshot
redis-cli -a YOUR_PASSWORD BGSAVE

# Backup files located at
/var/lib/redis/dump.rdb
/var/lib/redis/appendonly.aof
```

---

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Test connection
psql -U sttaurx_admin -h localhost -d sttaurx
```

### Redis Connection Failed

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check logs
sudo tail -f /var/log/redis/redis-server.log

# Test connection
redis-cli -a YOUR_PASSWORD ping
```

### Prisma Issues

```bash
# Regenerate client after schema changes
npx prisma generate

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

---

## Test Credentials

After seeding, use these for testing:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sttaurx.io | Admin@STTAURX2026! |
| Demo User | alice@example.com | Demo@2026! |
| Demo User | bob@example.com | Demo@2026! |

---

## Next Steps

1. **Phase 2**: Marketplace & Orders schema
2. **Phase 3**: Admin & Analytics tables
3. **Phase 4**: Notifications & Messaging

See `DATABASE_PLAN.md` for the full roadmap.
