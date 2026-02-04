#!/bin/bash
#
# STTAURX Deployment Script
# Deploys to DigitalOcean Droplet
#
# Usage:
#   ./scripts/deploy.sh              # Full deploy
#   ./scripts/deploy.sh --quick      # Quick sync (no build)
#   ./scripts/deploy.sh --restart    # Restart services only
#

# Configuration
DROPLET_IP="164.92.116.28"
DROPLET_USER="root"
REMOTE_PATH="/var/www/gold-stablecoin"
LOCAL_PATH="$(cd "$(dirname "$0")/.." && pwd)"
SSH_KEY="$HOME/.ssh/digitalocean"
SSH_OPTS="-i ${SSH_KEY}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           STTAURX Deployment Script                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check SSH connection
check_connection() {
    echo -e "${YELLOW}Checking SSH connection to droplet...${NC}"
    if ssh ${SSH_OPTS} -o ConnectTimeout=5 ${DROPLET_USER}@${DROPLET_IP} "echo 'Connected'" 2>/dev/null; then
        echo -e "${GREEN}✓ SSH connection successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to droplet at ${DROPLET_IP}${NC}"
        echo "  Make sure:"
        echo "    1. Your SSH key is added to the droplet"
        echo "    2. The droplet is running"
        echo "    3. The IP address is correct"
        return 1
    fi
}

# Restart services on droplet
restart_services() {
    echo -e "${YELLOW}Restarting services on droplet...${NC}"
    ssh ${SSH_OPTS} ${DROPLET_USER}@${DROPLET_IP} << 'EOF'
cd /var/www/gold-stablecoin
pm2 restart all || pm2 start ecosystem.config.js
pm2 save
EOF
    echo -e "${GREEN}✓ Services restarted${NC}"
}

# Quick sync (rsync without rebuild)
quick_sync() {
    echo -e "${YELLOW}Syncing files to droplet...${NC}"

    rsync -avz --progress \
        -e "ssh ${SSH_OPTS}" \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude '.env.local' \
        ${LOCAL_PATH}/ ${DROPLET_USER}@${DROPLET_IP}:${REMOTE_PATH}/

    echo -e "${GREEN}✓ Files synced${NC}"
}

# Full deployment
full_deploy() {
    echo -e "${YELLOW}Starting full deployment...${NC}"

    # Step 1: Sync files
    quick_sync

    # Step 2: Install dependencies and build on server
    echo -e "${YELLOW}Installing dependencies and building on server...${NC}"
    ssh ${SSH_OPTS} ${DROPLET_USER}@${DROPLET_IP} << 'EOF'
cd /var/www/gold-stablecoin

echo "Installing mock-server dependencies..."
cd mock-server && npm install --production && cd ..

echo "Installing explorer dependencies..."
cd explorer && npm install && npm run build && cd ..

echo "Installing wallet dependencies..."
cd wallet && npm install && npm run build && cd ..

echo "Installing marketplace dependencies..."
cd marketplace && npm install && npm run build && cd ..

echo "Build complete!"
EOF

    # Step 3: Restart services
    restart_services

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ Deployment Complete!                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  URLs:"
    echo "    Security Portal: http://${DROPLET_IP}:3000/start"
    echo "    Explorer:        http://${DROPLET_IP}:3000"
    echo "    Wallet:          http://${DROPLET_IP}:3002"
    echo "    Marketplace:     http://${DROPLET_IP}:3003"
    echo "    API:             http://${DROPLET_IP}:3001"
    echo ""
}

# Setup droplet from scratch
setup_droplet() {
    echo -e "${YELLOW}Setting up droplet from scratch...${NC}"
    ssh ${SSH_OPTS} ${DROPLET_USER}@${DROPLET_IP} << 'EOF'
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create project directory
mkdir -p /var/www/gold-stablecoin
cd /var/www/gold-stablecoin

# Setup PM2 startup
pm2 startup systemd -u root --hp /root

echo "Droplet setup complete!"
EOF
    echo -e "${GREEN}✓ Droplet setup complete${NC}"
}

# Show status
show_status() {
    echo -e "${YELLOW}Checking droplet status...${NC}"
    ssh ${SSH_OPTS} ${DROPLET_USER}@${DROPLET_IP} << 'EOF'
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Disk Usage ==="
df -h /

echo ""
echo "=== Memory Usage ==="
free -h
EOF
}

# Parse arguments
case "$1" in
    --quick)
        check_connection && quick_sync && restart_services
        ;;
    --restart)
        check_connection && restart_services
        ;;
    --status)
        check_connection && show_status
        ;;
    --setup)
        check_connection && setup_droplet
        ;;
    --help)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (none)      Full deploy (sync, build, restart)"
        echo "  --quick     Quick sync (no rebuild)"
        echo "  --restart   Restart services only"
        echo "  --status    Show droplet status"
        echo "  --setup     Initial droplet setup"
        echo "  --help      Show this help"
        ;;
    *)
        check_connection && full_deploy
        ;;
esac
