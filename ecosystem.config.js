/**
 * PM2 Ecosystem Configuration
 * STTAURX Gold Stablecoin Platform
 *
 * Environments:
 *   - Testnet: Port 4001 (100 user limit)
 *   - Mainnet: Port 3001 (production)
 *
 * Commands:
 *   pm2 start ecosystem.config.js                    # Start all
 *   pm2 start ecosystem.config.js --only sttaurx-testnet  # Testnet only
 *   pm2 start ecosystem.config.js --only sttaurx-mainnet  # Mainnet only
 *   pm2 start ecosystem.config.js --env production   # Production mode
 *
 * Monitor:
 *   pm2 status
 *   pm2 logs
 *   pm2 monit
 */

module.exports = {
  apps: [
    // ============================================
    // API SERVERS
    // ============================================
    {
      name: 'sttaurx-testnet',
      cwd: './mock-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'testnet',
        PORT: 4001,
        USE_DATABASE: 'true',
        TESTNET_MODE: 'true',
        MAX_USERS: 100
      }
    },
    {
      name: 'sttaurx-mainnet',
      cwd: './mock-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        USE_DATABASE: 'true',
        TESTNET_MODE: 'false',
        MAX_USERS: 1000
      }
    },
    // Legacy name for backwards compatibility
    {
      name: 'mock-server',
      cwd: './mock-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        USE_DATABASE: 'false'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        USE_DATABASE: 'true'
      }
    },

    // ============================================
    // FRONTEND APPS
    // ============================================
    {
      name: 'explorer',
      cwd: './explorer',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'wallet',
      cwd: './wallet',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'marketplace',
      cwd: './marketplace',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ],

  // ============================================
  // DEPLOYMENT CONFIGURATION
  // ============================================
  deploy: {
    // Testnet deployment
    testnet: {
      user: 'root',
      host: '164.92.116.28',
      ref: 'origin/develop',
      repo: 'https://github.com/OGfintech/gold-stablecoin.git',
      path: '/var/www/sttaurx-testnet',
      'post-deploy': 'cd mock-server && npm install && npm run db:migrate:deploy && pm2 reload ecosystem.config.js --only sttaurx-testnet'
    },
    // Production deployment
    production: {
      user: 'root',
      host: '164.92.116.28',
      ref: 'origin/main',
      repo: 'https://github.com/OGfintech/gold-stablecoin.git',
      path: '/var/www/sttaurx',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
