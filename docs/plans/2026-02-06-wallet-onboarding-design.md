# Wallet Onboarding + Staking Redesign

**Project:** STTAURX Gold Stablecoin Platform
**Date:** 2026-02-06
**Branch:** feature/phase-one
**Status:** Approved

---

## 1. Overview

Redesign the wallet experience with server-side custodial wallets on signup, 3-tier staking
with admin-configurable rates, auto-compound, and a dark-mode gold-accent "high-tech bank" UI.

---

## 2. User Onboarding Flow

### 2.1 Registration (no seed phrase)

1. Landing page: "Own Gold. Digitally." with [Sign Up] / [Log In]
2. Registration: email + password (strength validation per security.js)
3. Server creates: user record + custodial wallet (server-generated keypair)
4. JWT issued, user lands on dashboard immediately
5. Balance: 0.000 STTAURX, Status: "Basic"

### 2.2 Verification Tiers (Status-Based)

| Tier | Requirements | Capabilities | Daily Limit |
|------|-------------|-------------|-------------|
| Basic | Email only | Receive, view balance, view gold price | $0 (receive only) |
| Verified | Phone + Government ID | Buy, send, receive, stake | $10,000 |
| Premium | Enhanced docs (address proof) | Higher limits, priority support | $100,000 |
| Institutional | Source of funds, company docs | OTC desk, unlimited, physical redemption | Unlimited |

### 2.3 Admin KYC Override (for testing)

- Admin panel: "Approve KYC" button per user
- Endpoint: `PUT /api/v1/admin/users/:id/kyc-status` (ADMIN+)
- Body: `{ "status": "VERIFIED" | "PREMIUM" | "INSTITUTIONAL" }`
- Dev mode (`NODE_ENV=development`): auto-approve all KYC
- Admin can mock-mint tokens to any wallet for testing

### 2.4 Self-Custody Upgrade (optional, Verified+)

The existing 9-step onboarding flow (KeypairGeneration, SecretKeyBackup, etc.)
becomes the "Upgrade to Self-Custody" path. Available at Verified tier or above.
Users who want full key ownership can opt into this.

---

## 3. Staking System (3 Tiers)

### 3.1 Tier Configuration

| Tier | Lock Period | Default APY | Description |
|------|-----------|------------|-------------|
| Passive | None (0 days) | 0.5% | Auto-applied to all unstaked balance |
| Gold Lock | 90 days | 5.0% | Locked, yield at contracted rate |
| Platinum Lock | 180 days | 15.0% | Locked, highest yield |

### 3.2 Database Schema

New table: `staking_tier_configs`

```sql
CREATE TABLE staking_tier_configs (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name   TEXT NOT NULL UNIQUE,    -- 'passive', 'gold_lock', 'platinum_lock'
  lock_days   INTEGER NOT NULL,         -- 0, 90, 180
  apy_rate    DECIMAL(8,4) NOT NULL,    -- 0.0050, 0.0500, 0.1500
  min_stake   DECIMAL(36,18) DEFAULT 0,
  max_stake   DECIMAL(36,18),           -- NULL = unlimited
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  updated_by  TEXT REFERENCES users(id)
);
```

Seed data:
```sql
INSERT INTO staking_tier_configs (tier_name, lock_days, apy_rate, min_stake) VALUES
  ('passive',       0,   0.0050, 0),
  ('gold_lock',     90,  0.0500, 0),
  ('platinum_lock', 180, 0.1500, 0);
```

### 3.3 Staking Behavior

- **Passive yield**: Accrues automatically on all unstaked balance. No user action needed.
- **Locked stakes**: User explicitly stakes amount for 90d or 180d.
- **Contracted rate**: Each stake records the APY at time of creation. Rate changes
  only affect NEW stakes. Existing locked stakes keep their contracted rate.
- **Auto-compound**: Toggle per user. When ON, accrued yield is automatically
  re-staked into the same tier at current rate. Stored as `auto_compound` boolean
  on user preferences.
- **Lock expiry**: Locked stakes become unlockable after lock period expires.
  User must manually unstake (or auto-compound continues if enabled).

### 3.4 Admin Rate Management

**Endpoints:**

```
GET  /api/v1/admin/staking/tiers           -- List all tier configs
PUT  /api/v1/admin/staking/tiers/:id       -- Update tier config
     Body: { apy_rate?, min_stake?, max_stake?, is_active? }
     Auth: ADMIN+ with fee:manage permission
     Audit: Logged with old/new values
```

**UI (Admin Panel):**

```
Staking Rate Management
-----------------------
Passive Yield (no lock)
  APY: [0.5 %] [Save]

Gold Lock (90 days)
  APY: [5.0 %]  Min: [100 STTAURX] [Save]

Platinum Lock (180 days)
  APY: [15.0%]  Min: [500 STTAURX] [Save]

Note: Rate changes apply to NEW stakes only.
Existing locked stakes keep their contracted rate.
```

---

## 4. Purchase Flow

### 4.1 Methods

| Method | Flow | Settlement |
|--------|------|-----------|
| Bank Wire (ACH/SWIFT) | User submits wire details -> Admin confirms receipt -> Mint STTAURX | 1-3 business days |
| Crypto (USDT/USDC) | User sends stablecoin to deposit address -> Auto-detected -> Mint STTAURX | ~15 minutes |

### 4.2 Mock Purchase (for testing)

- Admin mints tokens directly to user wallet via `POST /api/v1/tokens/mint`
- Mock purchase page shows the flow UI without requiring real payment
- Gold certificate auto-generated on mint

---

## 5. Gold Certificate

Enhanced from existing GoldCertificate.tsx:

- Mock gold bar serial: `AU-2026-XXXXX`
- Weight: displayed in troy ounces and grams
- Purity: 99.99%
- Vault: "Brink's London Vault" (mockup)
- QR code: links to on-chain proof in explorer
- Download as PNG image
- Visible on main dashboard as a preview card

---

## 6. UI Design System

### 6.1 Color Palette

```
Backgrounds
  Base:        #0A0A0F    near-black, blue undertone
  Card:        #13131A    elevated surface
  Card Hover:  #1A1A24    subtle lift
  Modal:       #0D0D14    overlay panels

Gold (brand)
  Primary:     #D4A843    buttons, borders
  Gradient:    #C5963B to #E8C65D    balance card, headers
  Light:       #F5E6B8    gold text on dark
  Border:      rgba(212,168,67,0.15)    subtle gold-tint

Status
  Yield/Up:    #34D399    green
  Locked:      #FBBF24    amber
  Staking:     #8B5CF6    purple
  Danger:      #EF4444    red

Text
  Primary:     #F9FAFB
  Secondary:   #9CA3AF
  Muted:       #6B7280
```

### 6.2 Dashboard Layout

```
Top: Logo + notifications + settings
Hero: Balance card (gold gradient + shimmer)
  - Total balance in STTAURX, troy oz, USD
  - 24h change percentage
  - Verification status badge

Quick Actions: Buy | Send | Receive (icon buttons)

Yield Summary card:
  - Per-tier breakdown (passive, gold, platinum)
  - Estimated monthly yield
  - Auto-compound toggle

Gold Certificate preview card:
  - Mini gold bar image, serial, weight, purity
  - "View Full Certificate" link

Recent Activity:
  - Transaction list with icons (received, sent, staked, yield)
  - Dual denomination display

Bottom Nav: Portfolio | Staking | Activity
```

### 6.3 Design Patterns

- Glass morphism: `backdrop-blur-xl bg-white/5` for secondary cards
- Gold gradient text for primary headings
- Monospace for addresses and hashes
- Bottom sheet modals for all action flows on mobile
- Skeleton loading states on all data cards
- Count-up animation on balance display
- Subtle gold shimmer animation on balance card

---

## 7. Implementation Plan

### Phase 1: Backend (staking + admin)
1. Add StakingTierConfig model to Prisma schema
2. Migrate database, seed 3 default tiers
3. Replace in-memory globalYieldRate with DB-backed tier lookup
4. Add admin tier management endpoints (GET/PUT)
5. Add admin KYC override endpoint
6. Add passive yield calculation to balance endpoint
7. Add auto-compound flag to user preferences
8. Add custodial wallet creation on registration

### Phase 2: Wallet UI overhaul
1. Update Tailwind theme with new color palette
2. Redesign dashboard layout (balance card, yield summary, certificate)
3. Replace onboarding flow with email-only registration
4. Add verification tier UI with feature gates
5. Build staking page with 3-tier selection
6. Build mock purchase flow page
7. Enhance GoldCertificate component

### Phase 3: Admin panel
1. Build admin dashboard page
2. Staking rate management UI
3. User management + KYC approval UI
4. Mint/burn token controls
5. System statistics dashboard
