#!/bin/bash
# ============================================
# STTAURX Database Setup Script
# For DigitalOcean Droplet (Ubuntu 24.04)
# ============================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     STTAURX Database Setup - Phase 1                     ║"
echo "║     PostgreSQL 16 + Redis 7                              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-sttaurx}"
DB_USER="${DB_USER:-sttaurx_admin}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24)}"

# ============================================
# 1. SYSTEM UPDATES
# ============================================
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# ============================================
# 2. INSTALL POSTGRESQL 16
# ============================================
echo -e "${YELLOW}[2/6] Installing PostgreSQL 16...${NC}"

# Add PostgreSQL APT repository
sudo apt install -y wget gnupg2 lsb-release
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo -e "${GREEN}✅ PostgreSQL 16 installed${NC}"

# ============================================
# 3. CONFIGURE POSTGRESQL
# ============================================
echo -e "${YELLOW}[3/6] Configuring PostgreSQL...${NC}"

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE ${DB_NAME};

-- Create user with password
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOF

# Configure PostgreSQL for remote connections (optional, for managed tools)
# Only enable if you need remote access - be careful with security!
# sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
# echo "host    ${DB_NAME}    ${DB_USER}    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf

# Optimize for Phase 1 scale (< 1,000 users)
sudo tee -a /etc/postgresql/16/main/conf.d/sttaurx.conf << EOF
# STTAURX Performance Settings
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 128MB
work_mem = 16MB
max_connections = 100
random_page_cost = 1.1
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
EOF

sudo systemctl restart postgresql

echo -e "${GREEN}✅ PostgreSQL configured${NC}"

# ============================================
# 4. INSTALL REDIS 7
# ============================================
echo -e "${YELLOW}[4/6] Installing Redis 7...${NC}"

# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt update
sudo apt install -y redis-server

echo -e "${GREEN}✅ Redis 7 installed${NC}"

# ============================================
# 5. CONFIGURE REDIS
# ============================================
echo -e "${YELLOW}[5/6] Configuring Redis...${NC}"

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 24)

# Configure Redis
sudo tee /etc/redis/redis.conf << EOF
# STTAURX Redis Configuration

# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Security
requirepass ${REDIS_PASSWORD}

# Persistence (RDB + AOF for durability)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
tcp-keepalive 300
timeout 0
EOF

# Start and enable Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

echo -e "${GREEN}✅ Redis configured${NC}"

# ============================================
# 6. CREATE .ENV FILE
# ============================================
echo -e "${YELLOW}[6/6] Creating environment configuration...${NC}"

ENV_FILE="/home/$(whoami)/sttaurx/.env.database"

mkdir -p /home/$(whoami)/sttaurx

cat > ${ENV_FILE} << EOF
# STTAURX Database Configuration
# Generated: $(date)
# ================================

# PostgreSQL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DATABASE_POOL_SIZE=20
DB_SSL=false
DB_TIMEOUT=30000

# Redis
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0
EOF

chmod 600 ${ENV_FILE}

# ============================================
# SUMMARY
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              SETUP COMPLETE!                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}PostgreSQL 16 Configuration:${NC}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo "  Port: 5432"
echo ""
echo -e "${GREEN}Redis 7 Configuration:${NC}"
echo "  Host: localhost"
echo "  Port: 6379"
echo "  Password: ${REDIS_PASSWORD}"
echo ""
echo -e "${GREEN}Environment file created:${NC}"
echo "  ${ENV_FILE}"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy ${ENV_FILE} to your mock-server directory"
echo "  2. Run: npx prisma migrate deploy"
echo "  3. Run: npx prisma db seed"
echo ""
