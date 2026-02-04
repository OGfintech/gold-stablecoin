# AUSRX Staking Yield Model

**Document Type:** Core Business Model
**Status:** Definitive
**Date:** February 3, 2026
**Classification:** CONFIDENTIAL

---

## Executive Summary

The AUSRX 5% APY staking yield is generated through **Smart Letter of Credit (Smart LC) facilitation** for large commodity trades between corporations and countries. This is a sustainable, real-world yield source based on trade finance fees—not token inflation or unsustainable subsidies.

---

## The Yield Source: Smart Letters of Credit

### What is a Letter of Credit?

A **Letter of Credit (LC)** is a financial instrument used in international trade that guarantees payment from a buyer to a seller. It's essentially a promise from a bank that the seller will receive payment as long as certain conditions are met.

### Traditional LC Market

| Metric | Value |
|--------|-------|
| Global LC Market Size | ~$3 trillion annually |
| Typical LC Fee | 0.5% - 3% of transaction value |
| Common Users | Commodity traders, importers/exporters, governments |
| Key Use Cases | Oil, gold, agricultural commodities, metals |

### Why LCs Are Essential

```
WITHOUT Letter of Credit:
┌─────────┐                              ┌─────────┐
│  BUYER  │  "Send goods first"          │ SELLER  │
│         │ ──────────────────────────── │         │
│         │  "No, send payment first"    │         │
│         │ ◄──────────────────────────  │         │
└─────────┘                              └─────────┘
         DEADLOCK - Neither trusts the other

WITH Letter of Credit:
┌─────────┐     ┌─────────┐     ┌─────────┐
│  BUYER  │ ──► │   LC    │ ──► │ SELLER  │
│         │     │  BANK   │     │         │
└─────────┘     └─────────┘     └─────────┘
    │               │               │
    │  Deposits     │  Guarantees   │  Ships goods
    │  funds/       │  payment      │  with confidence
    │  collateral   │               │
    ▼               ▼               ▼
         TRUST ESTABLISHED - Trade executes
```

---

## AUSRX Smart Letter of Credit Model

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUSRX SMART LC TRADE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

   BUYER              AUSRX             STAKING POOL           SELLER
     │                PLATFORM            (AUSRX Tokens)          │
     │                    │                     │                   │
     │  1. Request LC     │                     │                   │
     │ ──────────────────►│                     │                   │
     │                    │                     │                   │
     │                    │  2. Lock tokens     │                   │
     │                    │    as collateral    │                   │
     │                    │ ───────────────────►│                   │
     │                    │                     │                   │
     │                    │  3. Issue Smart LC  │                   │
     │                    │ ────────────────────────────────────────►
     │                    │                     │                   │
     │                    │                     │    4. Ship goods  │
     │ ◄────────────────────────────────────────────────────────────│
     │                    │                     │                   │
     │  5. Confirm        │                     │                   │
     │     receipt        │                     │                   │
     │ ──────────────────►│                     │                   │
     │                    │                     │                   │
     │                    │  6. Execute payment │                   │
     │                    │ ────────────────────────────────────────►
     │                    │                     │                   │
     │                    │  7. Release tokens  │                   │
     │                    │    + distribute     │                   │
     │                    │    LC fees to       │                   │
     │                    │    stakers          │                   │
     │                    │ ◄───────────────────│                   │
     │                    │                     │                   │
     ▼                    ▼                     ▼                   ▼
```

### Multiple LCs Per Transaction

It's common for large commodity trades to require **two or more Letters of Credit** for different aspects:

| LC Type | Purpose | Typical Fee |
|---------|---------|-------------|
| **Payment LC** | Guarantees payment to seller upon delivery | 1-2% |
| **Performance LC** | Guarantees seller will deliver as specified | 0.5-1% |
| **Advance Payment LC** | Guarantees refund if seller fails to deliver | 0.5-1% |
| **Shipping LC** | Covers transportation and insurance | 0.25-0.5% |

**Example: $10M Gold Trade**
- Payment LC: 1.5% = $150,000
- Performance LC: 0.75% = $75,000
- **Total LC Fees: $225,000**
- **Distributed to stakers after successful trade completion**

---

## Yield Calculation

### How 5% APY is Achieved

```
Assumptions:
- Total staked AUSRX: $100 million
- Annual trade volume through Smart LCs: $2 billion
- Average LC fee: 1.5%
- Platform's share of fees: 50% (rest to liquidity providers)

Calculation:
- Total LC fees generated: $2B × 1.5% = $30 million
- Platform's share: $30M × 50% = $15 million
- Staker rewards: $15M ÷ $100M staked = 15% gross
- After platform operating costs: ~5% APY to stakers
```

### Yield Sustainability

| Factor | Impact on Yield |
|--------|-----------------|
| **More trade volume** | ↑ Higher yields possible |
| **More stakers** | ↓ Yield diluted across more participants |
| **Larger trades** | ↑ More fees generated |
| **Market conditions** | ↔ Trade volume fluctuates |

**Key Point:** Yield is variable based on actual trade volume, not guaranteed. This should be disclosed.

---

## Smart Contract Implementation

### Smart LC Contract Structure

```solidity
// Simplified Smart LC Structure
struct SmartLC {
    bytes32 lcId;
    address buyer;
    address seller;
    uint256 tradeAmount;
    uint256 collateralLocked;      // AUSRX tokens from staking pool
    uint256 lcFeePercent;          // e.g., 150 = 1.5%

    LCType lcType;                 // Payment, Performance, etc.
    LCStatus status;               // Pending, Active, Completed, Disputed

    uint256 shipmentDeadline;
    uint256 paymentDeadline;

    bytes32 documentsHash;         // Hash of shipping docs
    bool buyerConfirmed;
    bool sellerConfirmed;
}

enum LCType { Payment, Performance, AdvancePayment, Shipping }
enum LCStatus { Pending, Active, Completed, Disputed, Cancelled }
```

### Fee Distribution Logic

```
On LC Completion:
1. Calculate total LC fee
2. Distribute to staking pool pro-rata
3. Update staker reward balances
4. Release locked collateral back to pool
```

---

## Risk Management

### What Happens If Trade Fails?

| Scenario | Outcome |
|----------|---------|
| **Seller doesn't ship** | Collateral released back to buyer; no LC fee earned |
| **Buyer doesn't pay** | Collateral covers seller payment; trade completes |
| **Goods don't match spec** | Dispute resolution; collateral held until resolved |
| **Shipping damage** | Insurance LC covers losses |

### Collateralization Ratio

| Trade Risk Level | Collateral Required |
|------------------|---------------------|
| Low (trusted parties) | 100% of trade value |
| Medium (new parties) | 110% of trade value |
| High (new + large) | 125% of trade value |

**Staking pool only participates in trades up to its total staked value.**

---

## Competitive Advantage

### Why This Model Wins

| Traditional LC | AUSRX Smart LC |
|----------------|------------------|
| 3-5 days to issue | Minutes (smart contract) |
| Paper-based documents | Digital, on-chain verification |
| Bank intermediaries | Direct peer-to-peer |
| High bank fees (2-4%) | Lower fees (1-2%) |
| Limited transparency | Full blockchain transparency |
| Manual dispute resolution | Smart contract arbitration |

### Market Opportunity

```
Traditional LC Market: ~$3 trillion/year
If AUSRX captures 0.1%: $3 billion in trades
At 1.5% average fee: $45 million in fees
Distributed to stakers: Sustainable 5%+ APY
```

---

## Whitepaper Statement

> *"AUSRX staking rewards are generated through Smart Letter of Credit facilitation for international commodity trades. When corporations or countries execute large trades through our platform, staked tokens serve as collateral backing these Letters of Credit. The LC fees—typically 1-2% of trade value—are distributed to stakers proportionally. This creates a sustainable yield tied to real economic activity, not token inflation."*

---

## Key Messages for Investors

1. **"Real Yield, Not Ponzi-nomics"**
   - Yield comes from actual trade finance fees
   - Not from printing new tokens
   - Not from unsustainable company subsidies

2. **"$3 Trillion Market Opportunity"**
   - Letters of Credit are essential to global trade
   - We're digitizing and democratizing access

3. **"Stakers = Trade Finance Providers"**
   - Your staked tokens back real commodity trades
   - You earn what banks currently earn
   - Lower fees for traders, better yields for stakers

4. **"Smart Contracts = Trust"**
   - Automatic execution when conditions met
   - No bank bureaucracy
   - Transparent, auditable, fast

---

## Disclosure Requirements

For regulatory compliance, the following must be disclosed:

1. **Yield is variable** - Based on trade volume, not guaranteed
2. **Collateral risk** - Staked tokens may be locked during active LCs
3. **Smart contract risk** - Code bugs could affect trades
4. **Counterparty risk** - Trade disputes may delay fee distribution
5. **Market risk** - Trade volume fluctuates with economic conditions

---

## Summary

| Question | Answer |
|----------|--------|
| **Where does 5% come from?** | Smart Letter of Credit fees from commodity trades |
| **Is it sustainable?** | Yes - based on real trade volume, not inflation |
| **Who pays the yield?** | Buyers/sellers pay LC fees (industry standard) |
| **What backs it?** | Staked tokens serve as trade collateral |
| **What's the risk?** | Variable yield based on trade volume |

---

*Document Version: 1.0*
*Classification: CONFIDENTIAL - For Founders Only*
