/**
 * STTAURX Database Connection Layer
 * PostgreSQL (Prisma) + Redis
 * ===================================
 */

const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

// ============================================
// PRISMA (PostgreSQL) CLIENT
// ============================================

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
});

// Connection health check
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connection established');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// ============================================
// REDIS CLIENT
// ============================================

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Redis connection established');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// ============================================
// REDIS CACHE HELPERS
// ============================================

const cache = {
  // Session management
  async setSession(token, userId, expiresInSeconds = 86400) {
    const key = `session:${token}`;
    await redis.setex(key, expiresInSeconds, JSON.stringify({ userId, createdAt: Date.now() }));
  },

  async getSession(token) {
    const key = `session:${token}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async deleteSession(token) {
    const key = `session:${token}`;
    await redis.del(key);
  },

  // User cache
  async setUser(userId, userData, ttl = 300) {
    const key = `user:${userId}`;
    await redis.setex(key, ttl, JSON.stringify(userData));
  },

  async getUser(userId) {
    const key = `user:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async invalidateUser(userId) {
    const key = `user:${userId}`;
    await redis.del(key);
  },

  // Wallet balance cache (short TTL for consistency)
  async setWalletBalance(address, balance, ttl = 30) {
    const key = `wallet:${address}`;
    await redis.setex(key, ttl, JSON.stringify(balance));
  },

  async getWalletBalance(address) {
    const key = `wallet:${address}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async invalidateWalletBalance(address) {
    const key = `wallet:${address}`;
    await redis.del(key);
  },

  // Rate limiting
  async incrementRateLimit(ip, endpoint, windowSeconds = 60) {
    const key = `rate:${ip}:${endpoint}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current;
  },

  async getRateLimit(ip, endpoint) {
    const key = `rate:${ip}:${endpoint}`;
    const count = await redis.get(key);
    return parseInt(count) || 0;
  },

  // Gold price cache
  async setGoldPrice(price, ttl = 60) {
    await redis.setex('price:gold:spot', ttl, JSON.stringify(price));
  },

  async getGoldPrice() {
    const data = await redis.get('price:gold:spot');
    return data ? JSON.parse(data) : null;
  },

  // Generic cache methods
  async set(key, value, ttl = 300) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async del(key) {
    await redis.del(key);
  },

  async keys(pattern) {
    return redis.keys(pattern);
  },
};

// ============================================
// REDIS PUB/SUB FOR REAL-TIME UPDATES
// ============================================

const pubsub = {
  publisher: redis.duplicate(),

  // Create subscriber (returns new connection)
  createSubscriber() {
    return redis.duplicate();
  },

  // Publish transaction update
  async publishTransaction(transaction) {
    await this.publisher.publish('channel:transactions', JSON.stringify({
      type: 'NewTransaction',
      data: transaction,
    }));
  },

  // Publish wallet update
  async publishWalletUpdate(address, update) {
    await this.publisher.publish(`channel:wallet:${address}`, JSON.stringify({
      type: 'WalletUpdate',
      data: update,
    }));
  },

  // Publish block update
  async publishBlock(block) {
    await this.publisher.publish('channel:blocks', JSON.stringify({
      type: 'NewBlock',
      data: block,
    }));
  },

  // Publish metrics
  async publishMetrics(metrics) {
    await this.publisher.publish('channel:metrics', JSON.stringify({
      type: 'Metrics',
      data: metrics,
    }));
  },
};

// ============================================
// DATABASE UTILITIES
// ============================================

// Generate random hex string (for addresses, hashes)
function randomHex(length = 64) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate wallet address
function generateWalletAddress() {
  return randomHex(64);
}

// Generate transaction hash
function generateTxHash() {
  return randomHex(64);
}

// Generate block hash
function generateBlockHash() {
  return randomHex(64);
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function disconnect() {
  console.log('Disconnecting database connections...');
  await prisma.$disconnect();
  await redis.quit();
  await pubsub.publisher.quit();
  console.log('Database connections closed');
}

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  prisma,
  redis,
  cache,
  pubsub,
  checkDatabaseConnection,
  disconnect,
  // Utilities
  randomHex,
  generateWalletAddress,
  generateTxHash,
  generateBlockHash,
};
