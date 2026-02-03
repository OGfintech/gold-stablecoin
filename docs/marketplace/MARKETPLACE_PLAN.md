# Phase 2: STTAURX Marketplace App

**Last Updated:** February 1, 2026
**Status:** 🔄 In Progress
**Port:** 3003

---

## Overview

The STTAURX Marketplace is a B2B commodities trading platform that integrates with the gold-backed stablecoin ecosystem. It enables suppliers and buyers to trade commodities using Smart Letters of Credit with automated milestone-based payments.

### Key Features
- **Commodity Listings** - Suppliers list commodities with pricing in GOLD tokens
- **Smart Letters of Credit** - Automated 3-stage milestone payments (30%/50%/20%)
- **Document Verification** - On-chain verification of trade documents
- **Real-time Tracking** - Shipment and payment status tracking

---

## Development Checklist

### Phase 2.1: Core Setup ✅ COMPLETE

| Task | Status | File(s) |
|------|--------|---------|
| Create Next.js 14 app structure | ✅ | `marketplace/` |
| Configure Tailwind CSS | ✅ | `tailwind.config.ts` |
| Configure TypeScript | ✅ | `tsconfig.json` |
| Create type definitions | ✅ | `src/lib/types.ts` |
| Create API client | ✅ | `src/lib/api.ts` |
| Create Auth context | ✅ | `src/app/providers.tsx` |
| Create root layout | ✅ | `src/app/layout.tsx` |
| Create Navigation component | ✅ | `src/components/Navigation.tsx` |

### Phase 2.2: Public Pages ✅ COMPLETE

| Task | Status | File(s) |
|------|--------|---------|
| Landing page with hero | ✅ | `src/app/page.tsx` |
| Login page with demo accounts | ✅ | `src/app/login/page.tsx` |
| How It Works page | ✅ | `src/app/how-it-works/page.tsx` |
| Commodities browse page | ✅ | `src/app/commodities/page.tsx` |

### Phase 2.3: Supplier Portal ✅ MOSTLY COMPLETE

| Task | Status | File(s) |
|------|--------|---------|
| Supplier dashboard | ✅ | `src/app/supplier/page.tsx` |
| Create listing form | ✅ | `src/app/supplier/listings/new/page.tsx` |
| My listings page | ✅ | `src/app/supplier/listings/page.tsx` |
| Edit listing page | ⬜ | `src/app/supplier/listings/[id]/edit/page.tsx` |
| Orders received page | ✅ | `src/app/supplier/orders/page.tsx` |
| Order detail page | ⬜ | `src/app/supplier/orders/[id]/page.tsx` |
| Shipments management | ✅ | `src/app/supplier/shipments/page.tsx` |
| Create shipment form | ⬜ | `src/app/supplier/shipments/new/page.tsx` |
| Upload Bill of Lading | ⬜ | `src/components/UploadBOL.tsx` |
| Payment history | ⬜ | `src/app/supplier/payments/page.tsx` |

### Phase 2.4: Buyer Portal ✅ MOSTLY COMPLETE

| Task | Status | File(s) |
|------|--------|---------|
| Buyer dashboard | ✅ | `src/app/buyer/page.tsx` |
| Browse commodities (enhanced) | ⬜ | `src/app/buyer/browse/page.tsx` |
| Commodity detail page | ✅ | `src/app/commodities/[id]/page.tsx` |
| Create order / LC request | ✅ | `src/app/buyer/orders/new/page.tsx` |
| My orders page | ✅ | `src/app/buyer/orders/page.tsx` |
| Order detail + tracking | ⬜ | `src/app/buyer/orders/[id]/page.tsx` |
| Shipment tracking | ✅ | `src/app/buyer/shipments/page.tsx` |
| Payment history | ✅ | `src/app/buyer/payments/page.tsx` |
| Escrow status | ⬜ | `src/components/EscrowStatus.tsx` |

### Phase 2.5: Smart LC Components ⬜ PENDING

| Task | Status | File(s) |
|------|--------|---------|
| LC Creation wizard | ⬜ | `src/components/lc/CreateLC.tsx` |
| LC Status tracker | ⬜ | `src/components/lc/LCStatus.tsx` |
| Milestone progress | ⬜ | `src/components/lc/MilestoneProgress.tsx` |
| Document upload | ⬜ | `src/components/lc/DocumentUpload.tsx` |
| Payment release UI | ⬜ | `src/components/lc/PaymentRelease.tsx` |

### Phase 2.6: Shared Components ⬜ PENDING

| Task | Status | File(s) |
|------|--------|---------|
| Commodity card | ⬜ | `src/components/CommodityCard.tsx` |
| Order status badge | ⬜ | `src/components/OrderStatusBadge.tsx` |
| Price display (GOLD) | ⬜ | `src/components/PriceDisplay.tsx` |
| Document viewer | ⬜ | `src/components/DocumentViewer.tsx` |
| Shipment timeline | ⬜ | `src/components/ShipmentTimeline.tsx` |
| Notification toast | ⬜ | `src/components/Toast.tsx` |
| Modal component | ⬜ | `src/components/Modal.tsx` |
| Form components | ⬜ | `src/components/forms/` |

### Phase 2.7: Mock Server API Endpoints ✅ COMPLETE

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/v1/marketplace/commodities` | GET | ✅ | List all commodities |
| `/api/v1/marketplace/commodities/:id` | GET | ✅ | Get commodity detail |
| `/api/v1/marketplace/commodities` | POST | ✅ | Create commodity listing |
| `/api/v1/marketplace/commodities/:id` | PUT | ✅ | Update commodity |
| `/api/v1/marketplace/commodities/:id` | DELETE | ✅ | Delete commodity |
| `/api/v1/marketplace/orders` | GET | ✅ | List orders (filtered by role) |
| `/api/v1/marketplace/orders/:id` | GET | ✅ | Get order detail |
| `/api/v1/marketplace/orders` | POST | ✅ | Create order + LC |
| `/api/v1/marketplace/orders/:id/status` | PUT | ✅ | Update order status |
| `/api/v1/marketplace/lc` | GET | ✅ | List letters of credit |
| `/api/v1/marketplace/lc/:id` | GET | ✅ | Get LC detail |
| `/api/v1/marketplace/lc/:id/milestone` | POST | ✅ | Complete milestone |
| `/api/v1/marketplace/shipments` | GET | ✅ | List shipments |
| `/api/v1/marketplace/shipments/:id` | GET | ✅ | Get shipment detail |
| `/api/v1/marketplace/shipments` | POST | ✅ | Create shipment |
| `/api/v1/marketplace/shipments/:id/documents` | POST | ✅ | Upload document |
| `/api/v1/marketplace/payments` | GET | ✅ | Payment history |

---

## Data Models

### Commodity
```typescript
interface Commodity {
  id: string
  supplierId: string
  supplierName: string
  name: string
  category: 'gold' | 'coffee' | 'oil' | 'wheat' | 'copper' | 'cotton' | 'other'
  description: string
  quantity: number
  unit: 'kg' | 'MT' | 'barrel' | 'bushel' | 'lb'
  pricePerUnit: string  // GOLD tokens
  minOrderQuantity: number
  origin: string
  certifications: string[]
  images: string[]
  status: 'active' | 'paused' | 'sold_out'
  createdAt: string
  updatedAt: string
}
```

### Order
```typescript
interface Order {
  id: string
  commodityId: string
  buyerId: string
  buyerName: string
  supplierId: string
  supplierName: string
  quantity: number
  totalPrice: string  // GOLD tokens
  lcId: string
  status: 'pending' | 'lc_created' | 'shipped' | 'customs' | 'delivered' | 'completed' | 'disputed'
  createdAt: string
  updatedAt: string
}
```

### Letter of Credit (LC)
```typescript
interface LetterOfCredit {
  id: string
  orderId: string
  buyerId: string
  supplierId: string
  totalAmount: string
  escrowAddress: string
  milestones: Milestone[]
  status: 'pending' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
}

interface Milestone {
  stage: 1 | 2 | 3
  name: 'shipment' | 'customs' | 'delivery'
  percentage: number  // 30, 50, 20
  amount: string
  status: 'pending' | 'completed'
  completedAt?: string
  txHash?: string
  documents?: Document[]
}
```

### Shipment
```typescript
interface Shipment {
  id: string
  orderId: string
  lcId: string
  carrier: string
  trackingNumber: string
  origin: string
  destination: string
  estimatedDelivery: string
  status: 'preparing' | 'shipped' | 'in_transit' | 'customs' | 'delivered'
  events: ShipmentEvent[]
  documents: Document[]
}

interface ShipmentEvent {
  timestamp: string
  location: string
  status: string
  description: string
}

interface Document {
  id: string
  type: 'bill_of_lading' | 'certificate_of_origin' | 'quality_inspection' | 'customs_declaration'
  name: string
  url: string
  hash: string  // On-chain verification
  uploadedAt: string
  verifiedAt?: string
}
```

---

## User Flows

### Supplier Flow
1. **Register/Login** → Verify as supplier
2. **Create Listing** → Add commodity with price in GOLD
3. **Receive Order** → Buyer creates order with LC
4. **Ship Goods** → Upload Bill of Lading
5. **Receive 30%** → Auto-released on BOL verification
6. **Customs Clear** → Upload customs docs
7. **Receive 50%** → Auto-released on customs verification
8. **Delivery Confirm** → Buyer confirms receipt
9. **Receive 20%** → Final payment released

### Buyer Flow
1. **Register/Login** → Verify as buyer
2. **Browse Commodities** → Search and filter listings
3. **Create Order** → Select commodity and quantity
4. **Fund LC** → Deposit GOLD to escrow
5. **Track Shipment** → Monitor progress
6. **Verify Documents** → Review uploaded docs
7. **Confirm Delivery** → Release final payment
8. **Complete** → Rate supplier

---

## Integration Points

### Wallet Integration
- Connect STTAURX Wallet for payments
- Check GOLD balance before LC creation
- Sign transactions for escrow funding

### Explorer Integration
- Link to transaction details
- Verify document hashes on-chain
- View escrow contract status

### Mock Server Integration
- All API calls go through mock-server (port 3001)
- Add `/api/marketplace/*` endpoints
- Store data in memory (or JSON file)

---

## Startup Commands

```bash
# Terminal 1 - Mock Server (port 3001)
cd mock-server && node server.js

# Terminal 2 - Explorer (port 3000)
cd explorer && npm run dev

# Terminal 3 - Wallet (port 3002)
cd wallet && npm run dev

# Terminal 4 - Marketplace (port 3003)
cd marketplace && npm run dev
```

---

## Next Steps

1. **Phase 2.3** - Complete Supplier Portal pages
2. **Phase 2.4** - Build Buyer Portal pages
3. **Phase 2.5** - Create Smart LC components
4. **Phase 2.6** - Build shared components
5. **Phase 2.7** - Add mock-server API endpoints

---

## Related Documents

- [ONBOARDING_BUCKETS.md](../blockchain/ONBOARDING_BUCKETS.md) - Full user journey
- [WHITEPAPER.md](../whitepaper/WHITEPAPER.md) - Project overview
- [WHITEPAPER_FULL.md](../whitepaper/WHITEPAPER_FULL.md) - Detailed whitepaper

---

*This document tracks the Phase 2: Marketplace development progress.*
