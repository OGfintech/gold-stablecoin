# STTAURX Platform - Documentation Index

**Last Updated:** February 3, 2026

---

## 📁 Folder Structure

Documentation is organized into three main areas:

```
docs/
├── README.md              # This file
├── STARTUP_LIST.md        # How to start all services
│
├── whitepaper/            # Whitepaper & research
│   ├── HANDOFF_SUMMARY.md # ← Start here for whitepaper work
│   ├── WHITEPAPER.md
│   ├── CUSTODY_MINTING_FLOW.md
│   ├── TOKENOMICS_REVIEW.md
│   ├── STAKING_YIELD_MODEL.md
│   ├── GLOBAL_TRADE_FLOWS.md
│   └── ...
│
├── marketplace/           # Marketplace app docs
│   ├── HANDOFF_SUMMARY.md # ← Start here for marketplace work
│   ├── MARKETPLACE_PLAN.md
│   └── README.md
│
└── blockchain/            # Wallet, Explorer, Security
    ├── HANDOFF_SUMMARY.md # ← Start here for blockchain work
    ├── ADMIN_WORKFLOW_PLAN.md
    ├── USER_ONBOARDING_PLAN.md
    ├── ONBOARDING_BUCKETS.md
    ├── SECURITY_PORTAL.md
    └── README.md
```

---

## 🎯 Quick Start by Area

### Whitepaper Work
```bash
# Read this first:
cat docs/whitepaper/HANDOFF_SUMMARY.md
```
**Focus:** Gold-backed stablecoin, HSBC custody, tokenomics, trade finance research, market analysis

### Marketplace Work
```bash
# Read this first:
cat docs/marketplace/HANDOFF_SUMMARY.md
```
**Focus:** B2B trading platform, Smart Letters of Credit, supplier/buyer portals (Port 3003)

### Blockchain/Wallet Work
```bash
# Read this first:
cat docs/blockchain/HANDOFF_SUMMARY.md
```
**Focus:** Explorer, Wallet, Security Portal, admin dashboard, onboarding

---

## 📋 New Session Quick Context

Copy the appropriate message into a new Claude session:

### Whitepaper
> "I'm working on the STTAURX whitepaper. All docs are in `/docs/whitepaper/`. Key decisions: HSBC custody model, no pre-mine (use equity), 5% staking yield from Smart LC fees. Read HANDOFF_SUMMARY.md for full context."

### Marketplace
> "I'm working on the STTAURX Marketplace - B2B commodities trading with Smart LCs. Port 3003, code in `/marketplace/`. Phases 2.1-2.4 mostly complete. Read `/docs/marketplace/HANDOFF_SUMMARY.md` for full context."

### Blockchain
> "I'm working on STTAURX blockchain apps - Explorer (3000), Wallet (3002), Security Portal. Read `/docs/blockchain/HANDOFF_SUMMARY.md` for full context."

---

## 🚀 Service Startup

### Quick Start (All Services)
```bash
# From project root:
python3 start-servers.py
# Or: ./start-servers.sh
```

### Manual Start
```bash
# Terminal 1 - Mock Server (START FIRST)
cd mock-server && node server.js

# Terminal 2 - Explorer
cd explorer && npm run dev

# Terminal 3 - Wallet
cd wallet && npm run dev

# Terminal 4 - Marketplace
cd marketplace && npm run dev
```

### URLs
| Service | Port | URL |
|---------|------|-----|
| **Security Portal** | 3000 | http://localhost:3000/start ⭐ |
| Explorer Dashboard | 3000 | http://localhost:3000 |
| Admin Panel | 3000 | http://localhost:3000/admin |
| Documentation | 3000 | http://localhost:3000/docs |
| Mock Server API | 3001 | http://localhost:3001 |
| Wallet | 3002 | http://localhost:3002 |
| Marketplace | 3003 | http://localhost:3003 |

---

## 📊 Area Status Overview

### Whitepaper
| Document | Status |
|----------|--------|
| Main Whitepaper | 🟡 In Progress |
| HSBC Custody Model | ✅ Complete |
| Tokenomics | ✅ Complete |
| Staking Yield Model | ✅ Complete |
| Global Trade Flows | ✅ Complete |

### Marketplace
| Phase | Status |
|-------|--------|
| Core Setup (2.1) | ✅ Complete |
| Public Pages (2.2) | ✅ Complete |
| Supplier Portal (2.3) | ✅ Mostly Complete |
| Buyer Portal (2.4) | ✅ Mostly Complete |
| Smart LC Components (2.5) | 🟡 In Progress |

### Blockchain
| Component | Status |
|-----------|--------|
| Security Portal | ✅ Complete |
| Wallet Onboarding Phase 1 | ✅ Complete |
| Admin Dashboard | 🟡 In Progress |
| User Buckets System | 🔵 Planning |

---

## 📂 Project Structure

```
gold-stablecoin-main/
├── docs/                    # 📚 Documentation (organized by area)
├── explorer/                # 🔍 Block explorer + Admin (port 3000)
│   └── src/app/start/       # 🔐 Security Portal
├── wallet/                  # 💰 User wallet (port 3002)
├── marketplace/             # 🛒 Commodities marketplace (port 3003)
├── mock-server/             # 🔌 Development API (port 3001)
├── crates/                  # 🦀 Rust blockchain core
└── scripts/                 # 🛠️ Utility scripts
```

---

*Keep this index updated when adding new documentation.*
