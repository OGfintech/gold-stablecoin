# STTAURX Custody & Minting Flow

**Document Type:** Core Business Process
**Status:** Definitive
**Last Updated:** February 3, 2026

---

## Executive Summary

STTAURX uses a **certificate-triggered minting model** with HSBC as the institutional custodian. This creates a direct, auditable link between physical gold acquisition and token minting - a key differentiator from competitors who mint tokens from pooled reserves.

---

## The STTAURX Minting Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STTAURX MINTING PROCESS                               │
└─────────────────────────────────────────────────────────────────────────────┘

   USER                    STTAURX                 HSBC                 GOLD BROKER
    │                         │                      │                      │
    │  1. Deposit USD         │                      │                      │
    │ ───────────────────────>│                      │                      │
    │                         │                      │                      │
    │                         │  2. Transfer to      │                      │
    │                         │     Trust Account    │                      │
    │                         │ ────────────────────>│                      │
    │                         │                      │                      │
    │                         │                      │  3. Gold Purchase    │
    │                         │                      │     Order @ Spot     │
    │                         │                      │ ────────────────────>│
    │                         │                      │                      │
    │                         │                      │  4. Physical Gold    │
    │                         │                      │     Delivery         │
    │                         │                      │ <────────────────────│
    │                         │                      │                      │
    │                         │  5. Certificate      │                      │
    │                         │     Issued           │                      │
    │                         │ <────────────────────│                      │
    │                         │                      │                      │
    │                         │  6. TRIGGER:         │                      │
    │                         │     Mint Tokens      │                      │
    │                         │     @ Spot Price     │                      │
    │                         │                      │                      │
    │  7. Receive STTAURX     │                      │                      │
    │     Tokens              │                      │                      │
    │ <───────────────────────│                      │                      │
    │                         │                      │                      │
    ▼                         ▼                      ▼                      ▼
```

---

## Step-by-Step Process

### Step 1: User Deposit
- User initiates deposit via STTAURX platform
- Funds transferred to **STTAURX Trust Account at HSBC**
- KYC/AML verification completed
- Deposit amount recorded on blockchain

### Step 2: Trust Account Funding
- STTAURX Trust Account receives USD
- Funds held in segregated account
- HSBC confirms receipt

### Step 3: Gold Purchase Order
- HSBC creates purchase order at **current spot price**
- Order placed with **approved Gold Broker** (Top 6 globally)
- Spot price locked at time of order
- LBMA Good Delivery bars specified

### Step 4: Physical Gold Delivery
- Gold Broker delivers physical gold to HSBC vault
- Gold meets specifications:
  - Purity: 99.99% (four nines)
  - Standard: LBMA Good Delivery
  - Serial numbers recorded
- HSBC vault receives and verifies

### Step 5: Certificate Issuance
- HSBC issues **Gold Custody Certificate**
- Certificate contains:
  - Certificate ID
  - HSBC Reference Number
  - Gold amount (oz and grams)
  - Purity verification
  - Bar serial numbers
  - Vault location
  - Issue date
  - Spot price at purchase
  - Document hash

### Step 6: Token Minting (Certificate-Triggered)
- Certificate hash recorded on blockchain
- **Minting automatically triggered** by certificate
- Tokens minted at the **exact spot price** from Step 3
- 1:1 backing established and verifiable

### Step 7: Token Delivery
- STTAURX tokens credited to user wallet
- Transaction recorded on blockchain
- User can verify certificate backing

---

## Key Differentiators

### STTAURX vs. Competitors

| Aspect | PAXG (Paxos) | XAUT (Tether) | STTAURX |
|--------|--------------|---------------|---------|
| **Custodian** | Paxos Trust + Brink's | Tether + Swiss vaults | **HSBC (Tier-1 Bank)** |
| **Gold Source** | Market purchases | Market purchases | **Top-6 Global Broker** |
| **Minting Trigger** | Company discretion | Company discretion | **Certificate-triggered** |
| **Price Basis** | Market token price | Market token price | **Spot price at purchase** |
| **Transparency** | Monthly attestations | Quarterly reports | **Real-time certificate verification** |
| **User Journey** | Buy token → hope gold exists | Buy token → hope gold exists | **Deposit → Gold purchased → Certificate → Token** |
| **Ownership Clarity** | Ambiguous ("may own only token") | Ambiguous | **Certificate = Your Gold** |

### Why This Matters

#### 1. **Direct Acquisition Model**
> *"When you deposit USD, gold is purchased FOR YOU at that moment's spot price. You're not buying into a pooled reserve - you're triggering a real gold purchase."*

#### 2. **Certificate-Triggered Minting**
> *"Tokens are only minted when HSBC issues a certificate. No certificate = no tokens. This creates an auditable, 1:1 link between physical gold and digital tokens."*

#### 3. **Spot Price Locking**
> *"Your token value is based on the spot price when YOUR gold was purchased - not a floating market price determined by exchange trading."*

#### 4. **Tier-1 Bank Custody**
> *"HSBC is a globally systemically important bank (G-SIB). Your gold is held by one of the world's largest financial institutions, not a crypto company's vault partner."*

#### 5. **Institutional Supply Chain**
> *"Gold is sourced from top-6 global brokers through HSBC's institutional relationships - the same supply chain used by central banks and sovereign wealth funds."*

---

## Certificate Data Structure

```json
{
  "certificate": {
    "certificate_id": "STTAURX-2026-000001",
    "hsbc_reference": "HSBC-GC-HK-2026-12345",
    "timestamp": "2026-02-03T10:30:00Z",

    "gold_details": {
      "amount_oz": 10.000,
      "amount_grams": 311.035,
      "purity": "0.9999",
      "standard": "LBMA Good Delivery",
      "bar_serial_numbers": ["ABC123456", "ABC123457"],
      "vault_location": "HSBC Hong Kong"
    },

    "purchase_details": {
      "spot_price_usd": 4523.50,
      "total_value_usd": 45235.00,
      "broker": "Top-6 Gold Broker",
      "purchase_date": "2026-02-03"
    },

    "verification": {
      "document_hash": "sha256:abc123...",
      "hsbc_signature": "...",
      "blockchain_tx": "0x..."
    },

    "token_minting": {
      "tokens_minted": 311.035,
      "mint_price_per_gram": 145.43,
      "mint_transaction": "0x...",
      "mint_timestamp": "2026-02-03T10:31:00Z"
    }
  }
}
```

---

## Regulatory & Compliance Advantages

### 1. **Clear Ownership Structure**
- Certificate creates legal documentation of ownership
- User owns specific, identifiable gold (not pool share)
- Survives custodian bankruptcy (segregated assets)

### 2. **Audit Trail**
- Every token traceable to specific certificate
- Every certificate traceable to specific gold bars
- Every gold bar traceable to specific broker transaction

### 3. **CFTC Compliance Ready**
- Physical commodity backing (not synthetic)
- Regulated bank custodian
- Clear custody chain

### 4. **Anti-Fraud Protection**
- Cannot mint without certificate
- Cannot issue certificate without physical gold
- HSBC provides institutional-grade verification

---

## Comparison: Token Purchase Flows

### How PAXG/XAUT Works (Pooled Reserve Model)
```
User buys PAXG on Coinbase
        ↓
Paxos already has gold in reserve (hopefully)
        ↓
User receives token from existing supply
        ↓
User trusts that gold exists somewhere
        ↓
Quarterly attestation says "we have enough gold"
```

**Problems:**
- No direct link between YOUR purchase and gold acquisition
- Relying on company attestations
- Pooled reserve = shared ownership ambiguity
- Token price ≠ spot price (exchange determined)

### How STTAURX Works (Certificate-Triggered Model)
```
User deposits USD to STTAURX
        ↓
HSBC receives funds in Trust Account
        ↓
HSBC purchases gold at TODAY's spot price
        ↓
Gold Broker delivers physical gold to HSBC vault
        ↓
HSBC issues Certificate with YOUR gold's serial numbers
        ↓
Certificate triggers token minting at THAT spot price
        ↓
User receives tokens backed by THEIR certificate
```

**Advantages:**
- Direct causal link: your money → your gold → your certificate → your tokens
- Real-time verification (not quarterly)
- Allocated gold (specific bars, not pool share)
- Spot price locking (not exchange price)

---

## Gold Broker Relationship

### Requirements for Approved Brokers
- Top 6 global gold broker by volume
- LBMA member in good standing
- Established relationship with HSBC
- Ability to deliver Good Delivery bars
- Competitive pricing at spot

### Top Global Gold Brokers (Examples)
1. HSBC (also custodian)
2. JPMorgan
3. UBS
4. Standard Chartered
5. Scotiabank
6. Citibank

*Note: Specific broker partnerships to be finalized*

---

## Trust Account Structure

### STTAURX Trust Account at HSBC
- **Type:** Segregated Trust Account
- **Purpose:** Gold acquisition on behalf of users
- **Protection:** Assets segregated from STTAURX operating funds
- **Oversight:** Subject to banking regulations
- **Jurisdiction:** [To be determined - HK, Singapore, or London]

### Fund Flow
```
User USD → STTAURX Platform → HSBC Trust Account → Gold Purchase → HSBC Vault
```

### Key Protections
- Funds never commingled with operating capital
- Trust structure provides bankruptcy protection
- HSBC fiduciary responsibility
- Regular reconciliation and audits

---

## Summary: Why This Matters for the White Paper

### Core Message
> *"STTAURX doesn't ask you to trust that gold exists. When you deposit, HSBC purchases gold at that moment's spot price, receives it in their vault, and issues a certificate. Only then are your tokens minted. Every token has a certificate. Every certificate has gold. Every piece of gold has serial numbers you can verify."*

### Key Phrases for Marketing
- "Certificate-Triggered Minting"
- "Your Deposit = Your Gold = Your Certificate = Your Tokens"
- "HSBC Custody, Not Crypto Company Vaults"
- "Spot Price Locking, Not Exchange Price Gambling"
- "Top-6 Broker Supply Chain"
- "Real-Time Verification, Not Quarterly Attestations"

---

*Document Version: 1.0*
*Classification: Internal - Strategy*
