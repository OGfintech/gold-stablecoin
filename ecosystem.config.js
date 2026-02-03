/**
 * PM2 Ecosystem Configuration
 * STTAURX Gold Stablecoin Platform
 *
 * Deploy to DigitalOcean Droplet:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *
 * Monitor:
 *   pm2 status
 *   pm2 logs
 *   pm2 monit
 */

module.exports = {
  apps: [
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
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
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

  // Deployment Configuration
  deploy: {
    production: {
      user: 'root',
      host: '146.190.149.27',
      ref: 'origin/main',
      repo: 'https://github.com/OGfintech/gold-stablecoin.git',
      path: '/var/www/gold-stablecoin',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
