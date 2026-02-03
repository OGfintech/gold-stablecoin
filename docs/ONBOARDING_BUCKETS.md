# AU Gold Block - Onboarding Bucket System

**Project:** AU Gold Block (Gold-Backed Stablecoin)
**Module:** User & Admin Onboarding Flow
**Created:** February 1, 2026
**Status:** Planning

---

## Overview

This document defines the complete onboarding and minting workflow using a **4-Bucket System**. Users progress through buckets as they complete each stage. Admins manage user progression via a drag-and-drop interface with mandatory documentation for all state changes.

---

## Bucket System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY BUCKETS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   BUCKET 1   │───▶│   BUCKET 2   │───▶│   BUCKET 3   │───▶│  BUCKET 4  │ │
│  │              │    │              │    │              │    │            │ │
│  │   WALLET     │    │   DEPOSIT    │    │   MINTING    │    │ COMPLETED  │ │
│  │  ONBOARDING  │    │    FLOW      │    │   PROCESS    │    │   USERS    │ │
│  │              │    │              │    │              │    │            │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └────────────┘ │
│                                                                              │
│  • Create Wallet     • Select Deposit    • Admin Review    • Active User   │
│  • Email Verify        Type              • Batch Approval  • Can Trade     │
│  • KYC (optional)    • Submit Proof      • Mint Execution  • Full Access   │
│                      • Admin Confirm     • Coin Delivery                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BUCKET 1: Wallet Onboarding

**Purpose:** Get user set up with a secure wallet and verified identity

### User Steps

| Step | Action | Validation | Email Sent |
|------|--------|------------|------------|
| 1.1 | Create Wallet | Keypair generated | Welcome email |
| 1.2 | Backup Secret Key | User confirms backup | - |
| 1.3 | Verify Email | Click verification link | Verification email |
| 1.4 | Email Confirmed | Link clicked within 24hrs | Confirmation email |
| 1.5 | KYC Submission (Optional) | ID documents uploaded | KYC received email |

### Email Templates - Bucket 1

**1. Welcome Email**
```
Subject: Welcome to AU Gold Block - Your Wallet is Ready!

Hello [Name],

Your AU Gold Block wallet has been created successfully.

Wallet Address: [address_truncated]

IMPORTANT: Please ensure you have backed up your secret key securely.
You will need it to recover your wallet.

Next Steps:
1. Verify your email by clicking the button below
2. Complete your first deposit to start acquiring gold-backed tokens

[Verify Email Button]

Questions? Reply to this email.

- AU Gold Block Team
```

**2. Email Verification**
```
Subject: Verify Your Email - AU Gold Block

Please verify your email address by clicking the link below:

[Verification Link]

This link expires in 24 hours.

If you didn't create an AU Gold Block account, please ignore this email.
```

**3. Email Confirmed**
```
Subject: Email Verified ✓ - Ready for Deposits

Your email has been verified successfully!

Current Status: BUCKET 1 COMPLETE ✓

You can now proceed to make your first deposit.

[Start Deposit Button]
```

### Bucket 1 Database Schema

```typescript
interface Bucket1User {
  user_id: string
  wallet_address: string
  email: string
  email_verified: boolean
  email_verified_at: Date | null
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected'
  kyc_submitted_at: Date | null
  bucket: 1
  created_at: Date
  updated_at: Date
}
```

### Exit Criteria (Move to Bucket 2)
- [x] Wallet created
- [x] Secret key backup confirmed
- [x] Email verified
- [ ] KYC approved (if required by deposit amount)

---

## BUCKET 2: Deposit Flow

**Purpose:** Accept and verify user deposits before minting

### Deposit Types

| Type | Code | Process | Verification |
|------|------|---------|--------------|
| USDT Transfer | `USDT` | User sends USDT to designated address | Blockchain confirmation |
| Bank Wire Transfer | `BANK` | User sends wire with reference ID | Admin verifies bank statement |
| Screenshot Upload | `UPLOAD` | User uploads deposit proof to HSBC holding | Admin reviews documents |
| Cash Deposit | `CASH` | In-person cash deposit | Admin confirms receipt |

### User Flow by Deposit Type

#### Type A: USDT Transfer
```
User selects USDT → System shows deposit address → User sends USDT
→ System detects transaction → Auto-confirm → Move to queue
```

#### Type B: Bank Wire Transfer
```
User selects Bank Wire → System generates reference ID (e.g., AUGB-[USER_ID]-[TIMESTAMP])
→ User makes transfer with reference → User enters transfer details
→ Admin verifies against bank records → Confirm/Reject
```

#### Type C: Screenshot/Document Upload
```
User selects Upload → User uploads:
  - Bank transfer receipt
  - HSBC deposit slip
  - Transaction confirmation screenshot
→ User fills deposit details form → Admin reviews documents → Confirm/Reject
```

#### Type D: Cash Deposit (Admin Initiated)
```
User contacts support → Arranges cash deposit
→ Admin creates deposit record → User confirms amount
→ Admin verifies cash received → Confirm
```

### Deposit States

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  INITIATED  │────▶│   PENDING   │────▶│  CONFIRMED  │────▶│  IN QUEUE   │
│             │     │   REVIEW    │     │             │     │ FOR MINTING │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  REJECTED   │
                    └─────────────┘
```

### Deposit Submission Form

```typescript
interface DepositSubmission {
  user_id: string
  deposit_type: 'USDT' | 'BANK' | 'UPLOAD' | 'CASH'
  amount_usd: number
  amount_gold_oz: number  // Calculated: amount_usd / gold_price

  // For USDT
  usdt_tx_hash?: string
  usdt_network?: 'ETH' | 'TRX' | 'BSC'

  // For Bank Transfer
  bank_reference_id?: string
  bank_name?: string
  transfer_date?: Date

  // For Upload
  uploaded_documents?: {
    file_name: string
    file_url: string
    file_type: 'receipt' | 'slip' | 'screenshot' | 'other'
    uploaded_at: Date
  }[]
  deposit_notes?: string

  // For Cash
  cash_location?: string
  cash_received_by?: string  // Admin who received

  // Status
  status: 'initiated' | 'pending_review' | 'confirmed' | 'rejected' | 'in_queue'

  // Admin fields
  reviewed_by?: string
  review_notes?: string
  reviewed_at?: Date
  rejection_reason?: string

  created_at: Date
  updated_at: Date
}
```

### Email Templates - Bucket 2

**1. Deposit Initiated**
```
Subject: Deposit Initiated - Reference #[REF_ID]

Your deposit request has been initiated.

Deposit Type: [TYPE]
Amount: $[AMOUNT] USD
Gold Equivalent: [OZ] oz (at current price)
Reference ID: [REF_ID]

[Instructions based on deposit type]

Current Status: PENDING REVIEW

We'll notify you once your deposit is confirmed.
```

**2. Deposit Confirmed**
```
Subject: Deposit Confirmed ✓ - In Queue for Minting

Great news! Your deposit has been confirmed.

Deposit Reference: [REF_ID]
Amount Confirmed: $[AMOUNT] USD
Gold Equivalent: [OZ] oz
Tokens to Mint: [TOKENS] GOLD

Current Status: IN QUEUE FOR MINTING

Your tokens will be minted in the next batch. We'll notify you when complete.

Queue Position: #[POSITION]
Estimated Processing: [TIME]
```

**3. Deposit Rejected**
```
Subject: Deposit Issue - Action Required

We were unable to verify your deposit.

Deposit Reference: [REF_ID]
Reason: [REJECTION_REASON]

Please [instructions to resolve] or contact support.

[Contact Support Button]
```

### Exit Criteria (Move to Bucket 3)
- [x] Deposit submitted
- [x] Documents/proof provided
- [x] Admin confirmed deposit
- [x] Status changed to "In Queue for Minting"

---

## BUCKET 3: Minting Process

**Purpose:** Admin-controlled batch minting with full visibility

### Minting Queue View (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MINTING QUEUE                          [Mint Batch] │
├─────────────────────────────────────────────────────────────────────────────┤
│  □ Select All                                    Total: 15,000 GOLD tokens  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ☑ User: john@email.com     | $10,000 | 5.2 oz | 5,200 GOLD | Bank Wire    │
│  ☑ User: jane@email.com     | $25,000 | 13 oz  | 13,000 GOLD| USDT         │
│  ☑ User: bob@email.com      | $5,000  | 2.6 oz | 2,600 GOLD | Upload       │
│  ☐ User: alice@email.com    | $50,000 | 26 oz  | 26,000 GOLD| Bank Wire    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Selected: 3 users | 20.8 oz gold | 20,800 GOLD tokens                      │
│                                                                              │
│  Certificate: HSBC-2024-001 (Available: 25,000 GOLD remaining)              │
│                                                                              │
│  [Preview Batch] [Execute Mint]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Batch Minting Flow

```
Admin selects users from queue → Preview batch details
→ Confirm certificate has capacity → Execute mint
→ Blockchain transaction created → Tokens distributed
→ Users notified → Move to Bucket 4
```

### Pre-Mint Checklist (Admin Must Verify)

- [ ] Total mint amount within certificate capacity
- [ ] All deposits verified and documented
- [ ] User KYC status appropriate for amount
- [ ] No duplicate mint requests
- [ ] Certificate is Active status

### Mint Batch Record

```typescript
interface MintBatch {
  batch_id: string
  certificate_id: string

  mints: {
    user_id: string
    wallet_address: string
    deposit_ref: string
    gold_oz: number
    tokens: string  // BigInt as string
    status: 'pending' | 'minted' | 'failed'
    tx_hash?: string
  }[]

  total_gold_oz: number
  total_tokens: string

  created_by: string  // Admin who created batch
  executed_by?: string  // Admin who executed
  executed_at?: Date

  status: 'draft' | 'pending' | 'executing' | 'completed' | 'partial_failure'

  created_at: Date
  updated_at: Date
}
```

### Email Templates - Bucket 3

**1. Minting In Progress**
```
Subject: Your Tokens Are Being Minted 🪙

Your gold-backed tokens are now being minted!

Deposit Reference: [REF_ID]
Tokens Being Minted: [TOKENS] GOLD

Current Status: MINTING IN PROGRESS

You'll receive a confirmation email once your tokens are in your wallet.
```

**2. Minting Complete**
```
Subject: Tokens Minted ✓ - [TOKENS] GOLD Now in Your Wallet!

Congratulations! Your gold-backed tokens have been minted and delivered.

Transaction Details:
- Tokens Minted: [TOKENS] GOLD
- Gold Backing: [OZ] oz
- Transaction Hash: [TX_HASH]
- Certificate: [CERT_REF]

Your new balance: [BALANCE] GOLD

[View in Wallet Button] [View Transaction Button]

You now have full access to send, receive, and manage your gold-backed tokens.

Welcome to AU Gold Block!
```

### Exit Criteria (Move to Bucket 4)
- [x] Included in mint batch
- [x] Batch executed successfully
- [x] Tokens delivered to wallet
- [x] Transaction confirmed on blockchain

---

## BUCKET 4: Completed Users

**Purpose:** Active users with full platform access

### User Capabilities
- ✅ Send GOLD tokens to any address
- ✅ Receive GOLD tokens
- ✅ View gold certificate backing
- ✅ Track transaction history
- ✅ Make additional deposits (returns to Bucket 2)
- ✅ Redeem tokens for physical gold (future feature)

### Ongoing Notifications
- Monthly statement email
- Gold price alerts (optional)
- New feature announcements
- Security alerts

### Re-Entry Points
- **New Deposit:** User returns to Bucket 2
- **KYC Update Required:** User returns to Bucket 1
- **Account Issue:** Admin can move user backward with documentation

---

## Admin Management System

### Drag-and-Drop Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADMIN: USER BUCKET MANAGEMENT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  BUCKET 1   │  │  BUCKET 2   │  │  BUCKET 3   │  │  BUCKET 4   │        │
│  │  Onboarding │  │  Deposits   │  │  Minting    │  │  Completed  │        │
│  │  (12 users) │  │  (8 users)  │  │  (3 users)  │  │  (156 users)│        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │        │
│  │ │ John D. │ │  │ │ Jane S. │ │  │ │ Bob K.  │ │  │ │ Alice M.│ │        │
│  │ │ Email ✓ │ │  │ │$10k Pend│ │  │ │ Queue#1 │ │  │ │ Active  │ │        │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │             │  │ ┌─────────┐ │        │
│  │ │ Mary P. │ │  │ │ Tom R.  │ │  │             │  │ │ Chris L.│ │        │
│  │ │ KYC Pend│ │  │ │$5k Conf │ │  │             │  │ │ Active  │ │        │
│  │ └─────────┘ │  │ └─────────┘ │  │             │  │ └─────────┘ │        │
│  │     ...     │  │     ...     │  │             │  │     ...     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  [Drag user cards between buckets - triggers action modal]                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Action Modal (On Drag)

When admin drags a user from one bucket to another, a modal appears:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOVE USER                            [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User: john.doe@email.com                                        │
│  Current Bucket: BUCKET 1 (Onboarding)                          │
│  Moving To: BUCKET 2 (Deposits)                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Reason for Move: *                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ○ Email verified - ready for deposits                   │    │
│  │ ○ KYC approved                                          │    │
│  │ ○ Manual override (explain below)                       │    │
│  │ ○ User request                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Additional Notes:                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  □ Send notification email to user                              │
│  □ Flag for review                                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│                              [Cancel]  [Confirm Move]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Move Reasons by Transition

| From | To | Valid Reasons |
|------|-----|---------------|
| Bucket 1 → 2 | Email verified, KYC approved, Manual override |
| Bucket 2 → 3 | Deposit confirmed, Documents verified |
| Bucket 3 → 4 | Tokens minted, Manual delivery confirmed |
| Bucket 2 → 1 | KYC required, Additional verification needed |
| Bucket 3 → 2 | Mint failed, Re-verification required |
| Any → Bucket 1 | Account issue, Security concern, User request |

### Admin Action Log

Every bucket move is logged:

```typescript
interface AdminActionLog {
  action_id: string
  admin_id: string
  admin_email: string

  user_id: string
  user_email: string

  action_type: 'bucket_move' | 'deposit_confirm' | 'deposit_reject' | 'mint_execute'

  from_bucket?: number
  to_bucket?: number

  reason_code: string
  reason_text: string
  additional_notes?: string

  send_notification: boolean
  flagged_for_review: boolean

  ip_address: string
  user_agent: string

  created_at: Date
}
```

---

## Email Notification System

### Trigger Points

| Event | User Email | Admin Email |
|-------|------------|-------------|
| Wallet Created | Welcome | - |
| Email Verification | Verify Link | - |
| Email Verified | Confirmed | - |
| Deposit Initiated | Received | New Deposit Alert |
| Deposit Confirmed | Confirmed | - |
| Deposit Rejected | Rejection Notice | - |
| In Minting Queue | Queue Notification | - |
| Tokens Minted | Success! | Batch Complete |
| Bucket Move (by admin) | Status Update | Action Logged |

### Email Service Integration

```typescript
interface EmailService {
  // Templates
  sendWelcome(user: User): Promise<void>
  sendVerification(user: User, token: string): Promise<void>
  sendEmailConfirmed(user: User): Promise<void>

  sendDepositInitiated(user: User, deposit: Deposit): Promise<void>
  sendDepositConfirmed(user: User, deposit: Deposit): Promise<void>
  sendDepositRejected(user: User, deposit: Deposit, reason: string): Promise<void>

  sendMintingStarted(user: User, batch: MintBatch): Promise<void>
  sendMintingComplete(user: User, mint: MintRecord): Promise<void>

  sendBucketMoveNotification(user: User, from: number, to: number, reason: string): Promise<void>

  // Admin
  sendNewDepositAlert(admins: Admin[], deposit: Deposit): Promise<void>
  sendBatchCompleteNotification(admin: Admin, batch: MintBatch): Promise<void>
}
```

---

## Implementation Phases

### Phase 1: Core Bucket System (Week 1-2)
- [ ] Database schema for buckets and users
- [ ] User bucket tracking
- [ ] Basic admin view of buckets
- [ ] Manual bucket transitions

### Phase 2: Deposit Flow (Week 2-3)
- [ ] Deposit type selection UI
- [ ] Document upload system
- [ ] Bank transfer reference generation
- [ ] USDT deposit detection (mock for now)
- [ ] Admin deposit review interface

### Phase 3: Minting System (Week 3-4)
- [ ] Minting queue view
- [ ] Batch selection interface
- [ ] Pre-mint verification checklist
- [ ] Mint execution with blockchain
- [ ] Post-mint user notification

### Phase 4: Admin Drag-Drop (Week 4-5)
- [ ] Drag-and-drop UI component
- [ ] Action modal with reasons
- [ ] Admin action logging
- [ ] Audit trail view

### Phase 5: Email System (Week 5-6)
- [ ] Email service integration (SendGrid/SES)
- [ ] Template creation
- [ ] Trigger automation
- [ ] Email tracking and delivery confirmation

---

## Technical Requirements

### Frontend Components Needed

```
/wallet/src/components/onboarding/
  ├── BucketProgress.tsx         # Shows user's current bucket
  ├── DepositTypeSelector.tsx    # Deposit type selection
  ├── DocumentUpload.tsx         # File upload for proofs
  ├── DepositForm.tsx            # Deposit details form
  ├── DepositStatus.tsx          # Current deposit status
  └── MintingStatus.tsx          # Minting progress

/explorer/src/app/admin/
  ├── buckets/
  │   ├── page.tsx               # Drag-drop bucket view
  │   └── components/
  │       ├── BucketColumn.tsx   # Single bucket column
  │       ├── UserCard.tsx       # Draggable user card
  │       ├── MoveModal.tsx      # Action confirmation modal
  │       └── ActionLog.tsx      # Admin action history
  ├── deposits/
  │   ├── page.tsx               # Deposit review queue
  │   └── [id]/page.tsx          # Single deposit review
  └── minting/
      ├── page.tsx               # Minting queue
      └── batch/[id]/page.tsx    # Batch details
```

### API Endpoints Needed

```
# User endpoints
POST   /api/v1/deposits                    # Create deposit
GET    /api/v1/deposits/:id                # Get deposit status
POST   /api/v1/deposits/:id/documents      # Upload documents
GET    /api/v1/user/bucket-status          # Get current bucket

# Admin endpoints
GET    /api/v1/admin/buckets               # Get all buckets with users
POST   /api/v1/admin/bucket-move           # Move user between buckets
GET    /api/v1/admin/deposits/pending      # Pending deposits
POST   /api/v1/admin/deposits/:id/confirm  # Confirm deposit
POST   /api/v1/admin/deposits/:id/reject   # Reject deposit
GET    /api/v1/admin/minting/queue         # Minting queue
POST   /api/v1/admin/minting/batch         # Create mint batch
POST   /api/v1/admin/minting/batch/:id/execute  # Execute batch
GET    /api/v1/admin/actions               # Action log
```

---

## Success Metrics

- **Bucket 1 → 2 Conversion:** Target 80% within 48 hours
- **Deposit Confirmation Time:** Target < 24 hours for bank, < 1 hour for USDT
- **Minting Completion:** Target < 4 hours after queue entry
- **User Satisfaction:** Track via post-mint survey

---

## Notes

- All bucket transitions require admin action (except automated USDT detection)
- Every admin action must have a documented reason
- Email notifications are critical for user trust - never skip them
- Audit log retention: Minimum 7 years for financial compliance
- Consider adding SMS notifications for high-value deposits

---

*Document Version: 1.0*
*Last Updated: February 1, 2026*
