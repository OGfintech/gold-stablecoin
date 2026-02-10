# STTAURX Database Architecture Plan

**Created:** February 3, 2026
**Status:** Planning
**Database:** PostgreSQL
**Scale Target:** Phase 1 < 1,000 users
**Real-time:** Yes (WebSockets/Live updates)

---

## Overview

This document outlines the phased database implementation plan for the STTAURX Gold Stablecoin platform. The architecture uses PostgreSQL as the primary data store with Redis for caching and real-time pub/sub.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        STTAURX Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Explorer │  │  Wallet  │  │Marketplace│  │  Admin   │        │
│  │  :3000   │  │  :3002   │  │  :3003   │  │  :3000   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
│       └─────────────┴──────┬──────┴─────────────┘                │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │   API Server  │                            │
│                    │    :3001      │                            │
│                    └───────┬───────┘                            │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐          │
│  │ PostgreSQL  │   │    Redis    │   │  WebSocket  │          │
│  │  (Primary)  │   │   (Cache)   │   │   Server    │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Foundation (MVP)

**Timeline:** 2-3 weeks
**Goal:** Basic user management, wallet functionality, and transaction recording

### 1.1 Users Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user', -- user, admin, super_admin
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, banned
    email_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(50) DEFAULT 'none', -- none, pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE -- soft delete
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC documents
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- passport, drivers_license, id_card
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

### 1.2 Wallets Schema

```sql
-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) UNIQUE NOT NULL, -- blockchain address
    balance DECIMAL(20, 8) DEFAULT 0, -- STTAURX balance
    locked_balance DECIMAL(20, 8) DEFAULT 0, -- in escrow/pending
    status VARCHAR(50) DEFAULT 'active', -- active, frozen, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet balance history (for auditing)
CREATE TABLE wallet_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    previous_balance DECIMAL(20, 8) NOT NULL,
    new_balance DECIMAL(20, 8) NOT NULL,
    change_amount DECIMAL(20, 8) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- credit, debit, lock, unlock
    reference_type VARCHAR(50), -- transaction, order, admin_adjustment
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallet_history_wallet_id ON wallet_balance_history(wallet_id);
```

### 1.3 Blockchain/Transactions Schema

```sql
-- Blocks
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGINT UNIQUE NOT NULL,
    block_hash VARCHAR(255) UNIQUE NOT NULL,
    previous_hash VARCHAR(255) NOT NULL,
    merkle_root VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    size_bytes INTEGER,
    validator_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(255) UNIQUE NOT NULL,
    block_id UUID REFERENCES blocks(id),
    block_number BIGINT,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    tx_type VARCHAR(50) NOT NULL, -- transfer, mint, burn, escrow, release
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed
    confirmations INTEGER DEFAULT 0,
    metadata JSONB, -- additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Transaction receipts
CREATE TABLE transaction_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    receipt_hash VARCHAR(255) UNIQUE NOT NULL,
    gas_used BIGINT,
    status BOOLEAN NOT NULL, -- success/failure
    logs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_blocks_number ON blocks(block_number);
CREATE INDEX idx_blocks_hash ON blocks(block_hash);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_block ON transactions(block_id);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_to ON transactions(to_address);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);
```

---

## Phase 2: Marketplace & Orders

**Timeline:** 2-3 weeks
**Goal:** Buy/sell gold functionality, order management, escrow

### 2.1 Products/Listings Schema

```sql
-- Gold products/listings
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    gold_type VARCHAR(50) NOT NULL, -- bar, coin, jewelry, scrap
    purity DECIMAL(5, 2) NOT NULL, -- 99.99, 91.67 (22k), etc.
    weight_grams DECIMAL(10, 4) NOT NULL,
    price_per_gram DECIMAL(20, 8) NOT NULL,
    total_price DECIMAL(20, 8) NOT NULL,
    quantity_available INTEGER DEFAULT 1,
    images JSONB, -- array of image URLs
    certification_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, sold, expired, cancelled
    featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product-category mapping
CREATE TABLE product_category_map (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_gold_type ON products(gold_type);
CREATE INDEX idx_products_price ON products(total_price);
```

### 2.2 Orders Schema

```sql
-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- human-readable
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(20, 8) NOT NULL,
    subtotal DECIMAL(20, 8) NOT NULL,
    fees DECIMAL(20, 8) DEFAULT 0,
    total_amount DECIMAL(20, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, paid, escrow, shipped, delivered, completed, cancelled, disputed
    escrow_tx_id UUID REFERENCES transactions(id),
    release_tx_id UUID REFERENCES transactions(id),
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Order status history
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrow holdings
CREATE TABLE escrow_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'held', -- held, released, refunded
    held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    release_tx_id UUID REFERENCES transactions(id)
);

-- Indexes
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_number ON orders(order_number);
```

---

## Phase 3: Admin & Analytics

**Timeline:** 1-2 weeks
**Goal:** Admin dashboard, audit logs, reporting

### 3.1 Admin & Audit Schema

```sql
-- Admin audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- user.suspend, kyc.approve, order.cancel, etc.
    entity_type VARCHAR(50) NOT NULL, -- user, order, product, transaction
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee configuration
CREATE TABLE fee_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type VARCHAR(50) UNIQUE NOT NULL, -- transaction, marketplace, withdrawal
    percentage DECIMAL(5, 4), -- e.g., 0.0250 = 2.5%
    flat_fee DECIMAL(20, 8) DEFAULT 0,
    min_amount DECIMAL(20, 8) DEFAULT 0,
    max_amount DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### 3.2 Analytics Schema

```sql
-- Daily statistics (aggregated)
CREATE TABLE daily_stats (
    date DATE PRIMARY KEY,
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    transaction_volume DECIMAL(20, 8) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    order_volume DECIMAL(20, 8) DEFAULT 0,
    fees_collected DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- login, transaction, order, etc.
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created ON user_activity(created_at);
```

---

## Phase 4: Advanced Features

**Timeline:** 2-4 weeks
**Goal:** Notifications, messaging, reviews, disputes

### 4.1 Notifications Schema

```sql
-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- transaction, order, system, promotion
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- additional structured data
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_transactions BOOLEAN DEFAULT TRUE,
    email_orders BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    push_transactions BOOLEAN DEFAULT TRUE,
    push_orders BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### 4.2 Messaging Schema

```sql
-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    participant_1 UUID REFERENCES users(id),
    participant_2 UUID REFERENCES users(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_conversations_participants ON conversations(participant_1, participant_2);
```

### 4.3 Reviews & Disputes Schema

```sql
-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, reviewer_id)
);

-- Disputes
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB, -- array of document URLs
    status VARCHAR(50) DEFAULT 'open', -- open, under_review, resolved, escalated
    resolution VARCHAR(50), -- refund_buyer, release_seller, partial_refund
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

---

## Redis Cache Strategy

### Cached Data Types

```
# Session tokens
session:{token} -> user_id, expires_at (TTL: 24h)

# User data
user:{id} -> JSON user object (TTL: 5m)

# Wallet balances
wallet:{address} -> balance, locked (TTL: 30s)

# Real-time pub/sub channels
channel:transactions -> live transaction feed
channel:wallet:{address} -> wallet-specific updates
channel:orders:{user_id} -> order status updates

# Rate limiting
rate:{ip}:{endpoint} -> request count (TTL: 1m)

# Price cache
price:gold:spot -> current gold price (TTL: 1m)
```

---

## Migration Strategy

### Step 1: Development
```bash
# Generate migration files
npm run db:migration:generate -- --name init_users
npm run db:migration:generate -- --name init_wallets
npm run db:migration:generate -- --name init_blockchain
```

### Step 2: Staging
```bash
# Run migrations on staging
DATABASE_URL=staging_url npm run db:migrate
```

### Step 3: Production
```bash
# Backup first
pg_dump production_db > backup_$(date +%Y%m%d).sql

# Run migrations
DATABASE_URL=production_url npm run db:migrate
```

---

## Environment Variables

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/sttaurx
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Connection settings
DB_SSL=true
DB_TIMEOUT=30000
```

---

## Backup Strategy

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full backup | Daily | 30 days |
| Incremental | Hourly | 7 days |
| Transaction logs | Continuous | 7 days |

---

## Security Considerations

1. **Encryption at rest** - Enable PostgreSQL encryption
2. **Encryption in transit** - SSL/TLS for all connections
3. **Password hashing** - Use bcrypt with cost factor 12
4. **API keys** - Store hashed, never plain text
5. **PII** - Consider column-level encryption for sensitive data
6. **Audit logging** - Log all admin actions and data changes

---

## Next Steps

- [ ] Set up PostgreSQL on droplet or use managed service (DigitalOcean Managed Databases)
- [ ] Set up Redis for caching and real-time features
- [ ] Create database migration scripts
- [ ] Implement connection pooling (PgBouncer)
- [ ] Set up automated backups
- [ ] Create seed data for development

---

*Document created: February 3, 2026*
