# STTAURX Deployment Guide

**Target:** DigitalOcean Droplet
**Last Updated:** February 3, 2026

---

## Server Information

| Item | Value |
|------|-------|
| **Provider** | DigitalOcean |
| **IP Address** | 164.92.116.28 |
| **User** | root |
| **Project Path** | /var/www/gold-stablecoin |
| **GitHub Repo** | https://github.com/OGfintech/gold-stablecoin.git |

---

## Quick Commands

### SSH Into Droplet
```bash
ssh root@164.92.116.28
```

### Deploy (Full)
```bash
./scripts/deploy.sh
```

### Quick Deploy (No Rebuild)
```bash
./scripts/deploy.sh --quick
```

### Restart Services
```bash
./scripts/deploy.sh --restart
```

### Check Status
```bash
./scripts/deploy.sh --status
```

---

## Production URLs

| Service | Port | URL |
|---------|------|-----|
| **Security Portal** | 3000 | http://164.92.116.28:3000/start |
| **Explorer** | 3000 | http://164.92.116.28:3000 |
| **Wallet** | 3002 | http://164.92.116.28:3002 |
| **Marketplace** | 3003 | http://164.92.116.28:3003 |
| **API** | 3001 | http://164.92.116.28:3001 |

---

## First-Time Setup

### 1. Add SSH Key
If you haven't already, add your SSH key to the droplet:
```bash
# On your local machine
cat ~/.ssh/id_rsa.pub

# Then add it to DigitalOcean dashboard
# Or: ssh-copy-id root@164.92.116.28
```

### 2. Setup Droplet
Run the setup script to install Node.js and PM2:
```bash
./scripts/deploy.sh --setup
```

This installs:
- Node.js 20.x
- PM2 (process manager)
- Creates project directory

### 3. Initial Deploy
```bash
./scripts/deploy.sh
```

---

## PM2 Commands (On Server)

```bash
# SSH into server first
ssh root@164.92.116.28
cd /var/www/gold-stablecoin

# Start all services
pm2 start ecosystem.config.js

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# View logs
pm2 logs                    # All logs
pm2 logs mock-server        # Specific service
pm2 logs explorer --lines 100

# Monitor
pm2 monit

# Status
pm2 status

# Save current state (auto-restart on reboot)
pm2 save

# Setup auto-start on server reboot
pm2 startup
```

---

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Push to GitHub
```bash
# On local machine
git add .
git commit -m "Deploy update"
git push origin main
```

### 2. Pull on Server
```bash
# SSH into server
ssh root@164.92.116.28
cd /var/www/gold-stablecoin
git pull origin main
```

### 3. Install & Build
```bash
# Install dependencies
cd mock-server && npm install && cd ..
cd explorer && npm install && npm run build && cd ..
cd wallet && npm install && npm run build && cd ..
cd marketplace && npm install && npm run build && cd ..
```

### 4. Restart Services
```bash
pm2 restart all
```

---

## Troubleshooting

### Cannot Connect via SSH
```bash
# Check if you can ping the server
ping 164.92.116.28

# Try with verbose mode
ssh -v root@164.92.116.28

# Make sure your SSH key is added
ssh-add ~/.ssh/id_rsa
```

### Services Not Starting
```bash
# SSH into server and check logs
ssh root@164.92.116.28
cd /var/www/gold-stablecoin
pm2 logs --lines 50

# Try starting manually to see errors
cd explorer && npm start
```

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :3000
kill -9 <PID>

# Or kill all node processes
pkill -f node
pm2 kill
pm2 start ecosystem.config.js
```

### Out of Memory
```bash
# Check memory usage
free -h

# Restart PM2 to free memory
pm2 restart all

# If still issues, restart the droplet from DigitalOcean dashboard
```

### Disk Full
```bash
# Check disk usage
df -h

# Clear npm cache
npm cache clean --force

# Remove old logs
pm2 flush
```

---

## Environment Variables

If you need environment variables, create `.env.production` files:

```bash
# On server
cd /var/www/gold-stablecoin

# For each app that needs env vars
echo "API_URL=http://164.92.116.28:3001" > explorer/.env.production
echo "API_URL=http://164.92.116.28:3001" > wallet/.env.production
echo "API_URL=http://164.92.116.28:3001" > marketplace/.env.production
```

---

## Nginx Setup (Optional)

If you want to use Nginx as a reverse proxy:

```bash
# Install Nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/sttaurx

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
ln -s /etc/nginx/sites-available/sttaurx /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## SSL/HTTPS (Optional)

To add SSL with Let's Encrypt:

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renew is set up automatically
```

---

## Backup

### Backup Database/Data
```bash
# On server
cd /var/www/gold-stablecoin
tar -czf backup-$(date +%Y%m%d).tar.gz mock-server/data/
```

### Download Backup
```bash
# On local machine
scp root@164.92.116.28:/var/www/gold-stablecoin/backup-*.tar.gz ./backups/
```

---

## Security Checklist

- [ ] SSH key authentication only (disable password auth)
- [ ] Firewall configured (UFW)
- [ ] Regular security updates
- [ ] PM2 auto-restart configured
- [ ] Backups scheduled
- [ ] SSL certificate installed (if using domain)

---

## Related Files

| File | Purpose |
|------|---------|
| `ecosystem.config.js` | PM2 configuration |
| `scripts/deploy.sh` | Deployment script |
| `scripts/setup.sh` | Initial setup script |
| `docs/STARTUP_LIST.md` | Local development startup |

---

*Document Version: 1.0*
