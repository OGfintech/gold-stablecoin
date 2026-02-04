#!/bin/bash
# ============================================
# STTAURX Multi-Environment Database Setup
# Creates: Testnet (100 users) + Mainnet (scalable)
# For DigitalOcean Droplet (Ubuntu 24.04)
# ============================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   STTAURX Database Setup - Multi-Environment             ║"
echo "║   Testnet (100 users) + Mainnet (scalable)               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Generate passwords
TESTNET_DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
MAINNET_DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
REDIS_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)

# ============================================
# 1. INSTALL POSTGRESQL 16 (if not exists)
# ============================================
echo -e "${YELLOW}[1/5] Checking PostgreSQL...${NC}"

if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL 16..."
    sudo apt update
    sudo apt install -y wget gnupg2 lsb-release
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
    sudo apt update
    sudo apt install -y postgresql-16 postgresql-contrib-16
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

# ============================================
# 2. CREATE DATABASES & USERS
# ============================================
echo -e "${YELLOW}[2/5] Creating databases...${NC}"

sudo -u postgres psql << EOF
-- Drop existing (for clean setup) - comment out if you want to preserve data
-- DROP DATABASE IF EXISTS sttaurx_testnet;
-- DROP DATABASE IF EXISTS sttaurx_mainnet;
-- DROP USER IF EXISTS sttaurx_test;
-- DROP USER IF EXISTS sttaurx_prod;

-- Create Testnet Database (Small - 100 users)
CREATE DATABASE sttaurx_testnet;
CREATE USER sttaurx_test WITH ENCRYPTED PASSWORD '${TESTNET_DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE sttaurx_testnet TO sttaurx_test;

-- Create Mainnet Database (Production)
CREATE DATABASE sttaurx_mainnet;
CREATE USER sttaurx_prod WITH ENCRYPTED PASSWORD '${MAINNET_DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE sttaurx_mainnet TO sttaurx_prod;

-- Grant schema permissions for Testnet
\c sttaurx_testnet
GRANT ALL ON SCHEMA public TO sttaurx_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema permissions for Mainnet
\c sttaurx_mainnet
GRANT ALL ON SCHEMA public TO sttaurx_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

echo -e "${GREEN}✅ Databases created${NC}"

# ============================================
# 3. CONFIGURE POSTGRESQL (Small Scale)
# ============================================
echo -e "${YELLOW}[3/5] Configuring PostgreSQL for small scale...${NC}"

# Small scale config (testnet focused)
sudo tee /etc/postgresql/16/main/conf.d/sttaurx.conf << 'EOF'
# STTAURX Small Scale Settings
# Optimized for testnet (100 users) + light mainnet

# Memory (conservative)
shared_buffers = 128MB
effective_cache_size = 384MB
maintenance_work_mem = 64MB
work_mem = 8MB

# Connections (small pool)
max_connections = 50

# Performance
random_page_cost = 1.1
checkpoint_completion_target = 0.9
wal_buffers = 8MB
default_statistics_target = 100

# Logging
log_min_duration_statement = 1000
EOF

sudo systemctl restart postgresql
echo -e "${GREEN}✅ PostgreSQL configured${NC}"

# ============================================
# 4. INSTALL & CONFIGURE REDIS
# ============================================
echo -e "${YELLOW}[4/5] Setting up Redis...${NC}"

if ! command -v redis-server &> /dev/null; then
    curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
    sudo apt update
    sudo apt install -y redis-server
fi

# Small scale Redis config
sudo tee /etc/redis/redis.conf << EOF
# STTAURX Redis - Small Scale

bind 127.0.0.1
port 6379
protected-mode yes
requirepass ${REDIS_PASS}

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Memory (small - 128MB total, split between DBs)
maxmemory 128mb
maxmemory-policy allkeys-lru

# Databases
# DB 0 = Mainnet
# DB 1 = Testnet
databases 16

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

tcp-keepalive 300
timeout 0
EOF

sudo systemctl restart redis-server
sudo systemctl enable redis-server
echo -e "${GREEN}✅ Redis configured${NC}"

# ============================================
# 5. CREATE ENVIRONMENT FILES
# ============================================
echo -e "${YELLOW}[5/5] Creating environment files...${NC}"

mkdir -p /home/$(whoami)/sttaurx

# Testnet environment
cat > /home/$(whoami)/sttaurx/.env.testnet << EOF
# STTAURX Testnet Environment
# Generated: $(date)
# Max Users: 100 (enforced)
# ================================

NODE_ENV=testnet
USE_DATABASE=true
TESTNET_MODE=true
MAX_USERS=100

# API Server
API_PORT=4001
HOST=0.0.0.0

# PostgreSQL (Testnet DB)
DATABASE_URL="postgresql://sttaurx_test:${TESTNET_DB_PASS}@localhost:5432/sttaurx_testnet?schema=public"
DATABASE_POOL_SIZE=10

# Redis (DB 1 for testnet)
REDIS_URL="redis://:${REDIS_PASS}@localhost:6379/1"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASS}
REDIS_DB=1

# JWT (use different secrets per environment!)
JWT_SECRET=testnet_$(openssl rand -hex 16)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003

# Rate Limiting (relaxed for testing)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Mainnet environment
cat > /home/$(whoami)/sttaurx/.env.mainnet << EOF
# STTAURX Mainnet Environment
# Generated: $(date)
# Max Users: 1000 (initial, scalable)
# ================================

NODE_ENV=production
USE_DATABASE=true
TESTNET_MODE=false
MAX_USERS=1000

# API Server
API_PORT=3001
HOST=0.0.0.0

# PostgreSQL (Mainnet DB)
DATABASE_URL="postgresql://sttaurx_prod:${MAINNET_DB_PASS}@localhost:5432/sttaurx_mainnet?schema=public"
DATABASE_POOL_SIZE=20

# Redis (DB 0 for mainnet)
REDIS_URL="redis://:${REDIS_PASS}@localhost:6379/0"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASS}
REDIS_DB=0

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET=mainnet_$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (update with your domain)
CORS_ORIGINS=https://sttaurx.io,https://app.sttaurx.io

# Rate Limiting (strict for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
EOF

# Local development environment (mock mode)
cat > /home/$(whoami)/sttaurx/.env.local << EOF
# STTAURX Local Development
# Generated: $(date)
# Mock Mode - No database needed
# ================================

NODE_ENV=development
USE_DATABASE=false
TESTNET_MODE=false
MAX_USERS=unlimited

# API Server
API_PORT=3001
HOST=localhost

# Database (not used in mock mode)
DATABASE_URL=""
REDIS_URL=""

# JWT
JWT_SECRET=local_dev_secret_not_for_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003

# Rate Limiting (disabled for dev)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
EOF

chmod 600 /home/$(whoami)/sttaurx/.env.*

# ============================================
# SUMMARY
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              SETUP COMPLETE!                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}PostgreSQL Databases:${NC}"
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │ TESTNET                                             │"
echo "  │   Database: sttaurx_testnet                         │"
echo "  │   User: sttaurx_test                                │"
echo "  │   Password: ${TESTNET_DB_PASS}                      │"
echo "  │   Max Users: 100                                    │"
echo "  ├─────────────────────────────────────────────────────┤"
echo "  │ MAINNET                                             │"
echo "  │   Database: sttaurx_mainnet                         │"
echo "  │   User: sttaurx_prod                                │"
echo "  │   Password: ${MAINNET_DB_PASS}                      │"
echo "  │   Max Users: 1,000 (scalable)                       │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
echo -e "${CYAN}Redis:${NC}"
echo "  Password: ${REDIS_PASS}"
echo "  DB 0: Mainnet cache"
echo "  DB 1: Testnet cache"
echo ""
echo -e "${CYAN}Environment Files:${NC}"
echo "  /home/$(whoami)/sttaurx/.env.local    (Mock mode)"
echo "  /home/$(whoami)/sttaurx/.env.testnet  (100 users)"
echo "  /home/$(whoami)/sttaurx/.env.mainnet  (Production)"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "  1. Copy env files: cp ~/.sttaurx/.env.testnet ./mock-server/.env"
echo "  2. Run migrations: npm run db:migrate:deploy"
echo "  3. Seed testnet:   npm run db:seed"
echo "  4. Start testnet:  pm2 start ecosystem.config.js --only sttaurx-testnet"
echo ""
