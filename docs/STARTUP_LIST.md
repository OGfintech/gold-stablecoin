# STTAURX Platform - Startup List

**Project:** STTAURX (Strategic Trade Transmission & Arbitrage Risk X-ecution Solutions)
**Last Updated:** February 2, 2026

---

## Quick Start (All Services)

### Option 1: Python Script (Recommended)
Opens 4 separate terminal tabs, each labeled with the server name:
```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main
python3 start-servers.py
```

### Option 2: Shell Script
For macOS/Linux - opens Terminal tabs automatically:
```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main
./start-servers.sh
```

### Option 3: Demo Script (Legacy)
```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main
./start-demo.sh
```

All options start the 4 servers automatically. Press `Ctrl+C` in each terminal to stop.

---

## Individual Service Startup

### 1. Mock API Server (Required First)

**Port:** 3001
**Purpose:** Provides blockchain API endpoints for development

```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/mock-server
node server.js
```

**Verify:** http://localhost:3001/api/v1/system/metrics

**Endpoints Available:**
- `GET /api/v1/system/metrics` - System metrics
- `GET /api/v1/blocks` - List blocks
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/certificates` - List gold certificates
- `POST /api/v1/admin/keypair` - Generate keypair
- `POST /api/v1/certificates` - Register certificate
- `POST /api/v1/tokens/mint` - Mint tokens

---

### 2. Block Explorer

**Port:** 3000
**Purpose:** View blocks, transactions, certificates, and admin panel

```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/explorer
npm run dev
```

**Verify:** http://localhost:3000

**Pages:**
- `/start` - **Security Portal** (Recommended entry point)
- `/` - Dashboard
- `/dashboard` - Main dashboard (after security portal)
- `/blocks` - Block list
- `/transactions` - Transaction list
- `/certificates` - Gold certificates
- `/admin` - Admin panel

**Security Portal:** http://localhost:3000/start
- Activate with **Ctrl+Shift+A** or voice command **"Initialize Protocol OG"**
- Password: `AUTrade88`
- See [SECURITY_PORTAL.md](./blockchain/SECURITY_PORTAL.md) for full documentation

---

### 3. Wallet Application

**Port:** 3002
**Purpose:** User wallet for managing gold tokens

```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/wallet
npm run dev
```

**Verify:** http://localhost:3002

**Pages:**
- `/` - Wallet home / Onboarding
- `/send` - Send tokens
- `/certificate-preview` - Certificate mockup

---

### 4. Marketplace Application

**Port:** 3003
**Purpose:** B2B commodities trading platform with Smart Letters of Credit

```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/marketplace
npm run dev
```

**First Time Setup:**
```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/marketplace
npm install
npm run dev
```

**Verify:** http://localhost:3003

**Pages:**
- `/` - Marketplace landing
- `/login` - Login (demo accounts for buyer/supplier)
- `/commodities` - Browse commodity listings
- `/commodities/[id]` - Commodity detail page
- `/how-it-works` - Smart LC explanation

**Supplier Portal:**
- `/supplier` - Supplier dashboard
- `/supplier/listings` - My listings
- `/supplier/listings/new` - Create new listing
- `/supplier/orders` - Orders received
- `/supplier/shipments` - Shipment management
- `/supplier/payments` - Payment history

**Buyer Portal:**
- `/buyer` - Buyer dashboard
- `/buyer/orders` - My orders
- `/buyer/orders/new` - Create order
- `/buyer/shipments` - Track shipments
- `/buyer/payments` - Payment history

**API Endpoints (via Mock Server):**
- `GET /api/v1/marketplace/commodities` - List commodities
- `POST /api/v1/marketplace/orders` - Create order
- `GET /api/v1/marketplace/lc` - List Letters of Credit
- `POST /api/v1/marketplace/lc/:id/milestone` - Complete milestone
- `GET /api/v1/marketplace/shipments` - List shipments
- `GET /api/v1/marketplace/payments` - Payment history

---

## Terminal Setup (Recommended)

Open **5 terminal windows/tabs** for full development:

| Terminal | Purpose | Command |
|----------|---------|---------|
| **Terminal 1** | Mock Server | `cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/mock-server && node server.js` |
| **Terminal 2** | Explorer | `cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/explorer && npm run dev` |
| **Terminal 3** | Wallet | `cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/wallet && npm run dev` |
| **Terminal 4** | Marketplace | `cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/marketplace && npm run dev` |
| **Terminal 5** | Git/Commands | For running git commands, installs, etc. |

---

## DigitalOcean Droplet

**IP Address:** 146.190.149.27
**Purpose:** Production/staging deployment
**Full Guide:** [DEPLOYMENT.md](./blockchain/DEPLOYMENT.md)

### Quick Deploy
```bash
# From project root - full deploy
./scripts/deploy.sh

# Quick sync (no rebuild)
./scripts/deploy.sh --quick

# Restart services only
./scripts/deploy.sh --restart

# Check status
./scripts/deploy.sh --status
```

### SSH Access
```bash
ssh root@146.190.149.27
```

### Manual Server Commands
```bash
# SSH into droplet
ssh root@146.190.149.27

# Navigate to project
cd /var/www/gold-stablecoin

# Start with PM2 (production)
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Restart all services
pm2 restart all
```

### Production URLs
| Service | URL |
|---------|-----|
| Security Portal | http://146.190.149.27:3000/start |
| Explorer | http://146.190.149.27:3000 |
| Wallet | http://146.190.149.27:3002 |
| Marketplace | http://146.190.149.27:3003 |
| API | http://146.190.149.27:3001 |

---

## GitHub Repository

### Check Connection
```bash
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main
git remote -v
git status
```

### Push Changes
```bash
git add .
git commit -m "Your message"
git push origin main
```

---

## Dependency Installation

If `npm run dev` fails with missing dependencies:

```bash
# Explorer
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/explorer
npm install

# Wallet
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/wallet
npm install

# Marketplace
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/marketplace
npm install

# Mock Server
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/mock-server
npm install
```

---

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| Security Portal | 3000 | http://localhost:3000/start |
| Explorer | 3000 | http://localhost:3000 |
| Mock API | 3001 | http://localhost:3001 |
| Wallet | 3002 | http://localhost:3002 |
| Marketplace | 3003 | http://localhost:3003 |

**Recommended Entry Point:** Start at http://localhost:3000/start for the full security experience.

---

## Troubleshooting

### "Port already in use"
```bash
# Find process using port (e.g., 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### "next: command not found"
```bash
npm install
```

### "Cannot connect to API"
Make sure mock-server is running first on port 3001

### Page keeps refreshing
This was fixed - if still happening, restart the explorer:
```bash
# Kill existing
pkill -f "next dev"

# Restart
cd ~/Desktop/AU-GOLD-BLOCK/gold-stablecoin-main/explorer
npm run dev
```

---

## Startup Checklist

- [ ] Mock Server running on port 3001
- [ ] Explorer running on port 3000
- [ ] Wallet running on port 3002
- [ ] Marketplace running on port 3003
- [ ] Security Portal works: http://localhost:3000/start
  - [ ] Ctrl+Shift+A activates animation
  - [ ] Voice command "Initialize Protocol OG" works
  - [ ] Password `AUTrade88` grants access
- [ ] Can access http://localhost:3000 (Explorer)
- [ ] Can access http://localhost:3002 (Wallet)
- [ ] Can access http://localhost:3003 (Marketplace)
- [ ] Admin panel loads: http://localhost:3000/admin
- [ ] Docs page loads: http://localhost:3000/docs
- [ ] Git connected: `git status` works

---

## Demo Accounts (Marketplace)

| Role | Description |
|------|-------------|
| **Buyer** | Login at `/login` → Select "Login as Buyer" |
| **Supplier** | Login at `/login` → Select "Login as Supplier" |

---

## Smart LC Milestone Payments

The Marketplace uses Smart Letters of Credit with 3-stage milestone payments:

| Milestone | Percentage | Trigger |
|-----------|------------|---------|
| Stage 1 | 30% | Shipment confirmed (Bill of Lading uploaded) |
| Stage 2 | 50% | Customs cleared (Customs docs verified) |
| Stage 3 | 20% | Delivery confirmed (Buyer confirms receipt) |

---

*Document Version: 2.2 - Added startup scripts (Python & Shell)*
