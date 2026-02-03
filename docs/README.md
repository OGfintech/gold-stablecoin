# STTAURX Platform - Documentation Index

**Last Updated:** February 2, 2026

---

## Quick Start

**Before starting development, read this first:**

1. **[STARTUP_LIST.md](./STARTUP_LIST.md)** - How to start all services
2. Run the services in order: Mock Server → Explorer → Wallet

---

## Documentation Files

### Startup & Operations
| File | Description | Priority |
|------|-------------|----------|
| [STARTUP_LIST.md](./STARTUP_LIST.md) | Complete startup sequence, ports, troubleshooting | 🔴 Read First |

### Onboarding & User Flows
| File | Description | Status |
|------|-------------|--------|
| [ONBOARDING_BUCKETS.md](./ONBOARDING_BUCKETS.md) | Master onboarding flow with bucket system | 📋 Planning |
| [USER_ONBOARDING_PLAN.md](./USER_ONBOARDING_PLAN.md) | Wallet UI onboarding phases | Phase 1 ✅ |

### Business & Legal
| File | Description | Status |
|------|-------------|--------|
| [WHITEPAPER.md](./WHITEPAPER.md) | Project whitepaper with 14 sections | 📋 Template |

### Marketplace & Trade
| File | Description | Status |
|------|-------------|--------|
| [MARKETPLACE_PLAN.md](./MARKETPLACE_PLAN.md) | Phase 2: Marketplace app development | Phase 2.4 ✅ |

### Security
| File | Description | Status |
|------|-------------|--------|
| [SECURITY_PORTAL.md](./SECURITY_PORTAL.md) | Security portal with voice/keyboard activation | ✅ Complete |
| [SECURITY_ADMIN_PLAN.md](./SECURITY_ADMIN_PLAN.md) | Admin controls for portal settings | 📋 Planned |
| [SECURITY_SCAN_REPORT.md](./SECURITY_SCAN_REPORT.md) | Latest security audit results | ✅ Complete |

### Admin & Backend
| File | Description | Status |
|------|-------------|--------|
| [ADMIN_WORKFLOW_PLAN.md](./ADMIN_WORKFLOW_PLAN.md) | Admin dashboard implementation phases | Phase 1 🔄 |

---

## Startup Sequence (Quick Reference)

### Automatic (Recommended)
```bash
# Opens all 4 terminal tabs automatically
python3 start-servers.py

# Or use shell script
./start-servers.sh
```

### Manual
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

## URLs
| Service | URL |
|---------|-----|
| **Security Portal** | http://localhost:3000/start ⭐ |
| Explorer Dashboard | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin |
| Mock Server API | http://localhost:3001 |
| Wallet | http://localhost:3002 |
| Marketplace | http://localhost:3003 |

**Recommended:** Start at `/start` for the full security experience (Ctrl+Shift+A or voice: "Initialize Protocol OG")

---

## Project Structure

```
gold-stablecoin-main/
├── start-servers.py         # 🚀 Auto-start all servers (Python)
├── start-servers.sh         # 🚀 Auto-start all servers (Shell)
├── docs/                    # 📚 Documentation (you are here)
├── explorer/                # 🔍 Block explorer + Admin panel (port 3000)
│   └── src/app/start/       # 🔐 Security Portal
├── wallet/                  # 💰 User wallet application (port 3002)
├── marketplace/             # 🛒 Commodities marketplace (port 3003)
├── mock-server/             # 🔌 Development API server (port 3001)
├── crates/                  # 🦀 Rust blockchain core
└── scripts/                 # 🛠️ Utility scripts
```

---

## Development Workflow

1. **Start Services** → Follow STARTUP_LIST.md
2. **User Features** → Reference USER_ONBOARDING_PLAN.md
3. **Admin Features** → Reference ADMIN_WORKFLOW_PLAN.md
4. **Full Flow** → Reference ONBOARDING_BUCKETS.md

---

*Keep this index updated when adding new documentation.*
