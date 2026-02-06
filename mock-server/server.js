/**
 * STTAURX Mock API Server — Security Hardened
 * Version 3.0.0 — February 2026
 *
 * Changes from v2.0.0:
 * - JWT authentication on all non-public routes
 * - RBAC middleware on admin routes
 * - Token blacklist integration
 * - Audit logging on state-changing operations
 * - Input validation on critical endpoints
 * - CORS hardened (no-origin rejection in production)
 * - Helmet CSP enabled
 * - Hardcoded credentials removed (loaded from .env)
 * - Database startup validation (P0-01)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// Security middleware & services
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { requirePermission, requireRole } = require('./middleware/rbac');
const { auditContext, auditFromRequest, AuditAction, EntityType } = require('./services/auditLog.service');
const { validateTransfer, validateMint, validateStake, validateUnstake, validateYieldRate, validateCommodity, validateOrder } = require('./middleware/validate');

// Database
const { checkDatabaseConnection, redis } = require('./database/db');

// Auth routes
const authRoutes = require('./routes/auth');

const app = express();

// ============================================
// P0-01: STARTUP VALIDATION
// ============================================
async function validateStartup() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Check JWT secret
  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters in production');
    process.exit(1);
  }

  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    if (isProduction) {
      console.error('FATAL: Database connection required in production. Exiting.');
      process.exit(1);
    } else {
      console.warn('WARNING: Database not connected. Running in mock-data mode.');
    }
  }

  // Check Redis
  try {
    await redis.connect();
    await redis.ping();
    console.log('✅ Redis connection established');
  } catch (err) {
    if (isProduction) {
      console.error('FATAL: Redis connection required in production. Exiting.');
      process.exit(1);
    } else {
      console.warn('WARNING: Redis not connected. Token blacklist disabled.');
    }
  }

  return dbConnected;
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers (CSP enabled)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws://localhost:*', 'http://localhost:*'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// HTTP Parameter Pollution protection
app.use(hpp());

// NoSQL Injection protection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Blocked potential injection attempt: ${key}`);
  }
}));

// CORS — Hardened: reject no-origin in production
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003').split(',');

app.use(cors({
  origin: function (origin, callback) {
    // In production, always require Origin header
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[SECURITY] Blocked request with no Origin header');
        return callback(new Error('Origin header required'));
      }
      // Allow no-origin in development (curl, Postman)
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many admin requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many sensitive requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Audit context middleware (captures IP, user agent for all requests)
app.use(auditContext);

// Request logging for security audit
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

const PORT = process.env.PORT || 3001;

// ============================================
// MOCK DATA (used when database is unavailable)
// ============================================

const randomHex = (length) => {
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Admin address loaded from environment (no hardcoded credentials)
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

// State
let currentHeight = 0;
let totalTransactions = 0;
let totalSupply = BigInt('50000000000000000000000');
let tps = 0;

// Generate mock blocks
const generateBlocks = (count) => {
  const blocks = [];
  for (let i = count - 1; i >= 0; i--) {
    const txCount = Math.floor(Math.random() * 100);
    blocks.push({
      hash: randomHex(64),
      height: currentHeight - i,
      previous_hash: randomHex(64),
      merkle_root: randomHex(64),
      state_root: randomHex(64),
      tx_count: txCount,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      producer: ADMIN_ADDRESS
    });
  }
  return blocks;
};

// Generate mock transactions
const generateTransactions = (count) => {
  const types = ['Transfer', 'Mint', 'Burn', 'RegisterCertificate'];
  const txs = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * 3)];
    txs.push({
      hash: randomHex(64),
      tx_type: type,
      from: randomHex(64),
      to: type !== 'Burn' && type !== 'RegisterCertificate' ? randomHex(64) : null,
      amount: type !== 'RegisterCertificate' ? (BigInt(Math.floor(Math.random() * 1000)) * BigInt('1000000000000000000')).toString() : null,
      nonce: Math.floor(Math.random() * 1000),
      timestamp: new Date(Date.now() - i * 5000).toISOString(),
      block_height: currentHeight - Math.floor(i / 10),
      success: true
    });
  }
  return txs;
};

// Mock certificates
const certificates = [
  {
    certificate_id: 'cert001' + randomHex(52),
    hsbc_reference: 'HSBC-2024-001',
    gold_amount_oz: 100.0,
    gold_amount_grams: 3110.35,
    issue_date: '2024-01-15T00:00:00Z',
    hsbc_branch: 'Hong Kong Main Branch',
    status: 'Active',
    minted_amount: '25000000000000000000000',
    max_mintable: '31103500000000000000000',
    remaining_mintable: '6103500000000000000000',
    registered_at: '2024-01-16T10:30:00Z'
  },
  {
    certificate_id: 'cert002' + randomHex(52),
    hsbc_reference: 'HSBC-2024-002',
    gold_amount_oz: 50.0,
    gold_amount_grams: 1555.175,
    issue_date: '2024-02-01T00:00:00Z',
    hsbc_branch: 'Singapore Branch',
    status: 'Active',
    minted_amount: '15000000000000000000000',
    max_mintable: '15551750000000000000000',
    remaining_mintable: '551750000000000000000',
    registered_at: '2024-02-02T14:20:00Z'
  },
  {
    certificate_id: 'cert003' + randomHex(52),
    hsbc_reference: 'HSBC-2024-003',
    gold_amount_oz: 25.0,
    gold_amount_grams: 777.5875,
    issue_date: '2024-03-10T00:00:00Z',
    hsbc_branch: 'London Branch',
    status: 'FullyMinted',
    minted_amount: '7775875000000000000000',
    max_mintable: '7775875000000000000000',
    remaining_mintable: '0',
    registered_at: '2024-03-11T09:15:00Z'
  }
];

// Simulate block production
setInterval(() => {
  currentHeight++;
  const newTxs = Math.floor(Math.random() * 500) + 100;
  totalTransactions += newTxs;
  tps = newTxs / 0.1;

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'NewBlock',
        data: {
          hash: randomHex(64),
          height: currentHeight,
          tx_count: newTxs,
          timestamp: new Date().toISOString()
        }
      }));
    }
  });
}, 1000);

// ============================================
// AUTH ROUTES (public)
// ============================================
app.use('/api/v1/auth', authRoutes);

// ============================================
// PUBLIC API ROUTES (no auth required)
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/v1/system/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      blocks_produced: currentHeight,
      total_transactions: totalTransactions,
      current_tps: Math.floor(tps),
      average_block_time_ms: 100,
      mempool_size: Math.floor(Math.random() * 1000),
      total_supply: totalSupply.toString(),
      total_supply_formatted: (Number(totalSupply) / 1e18).toFixed(2)
    }
  });
});

app.get('/api/v1/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      node_id: randomHex(16),
      version: '3.0.0',
      height: currentHeight,
      latest_block_hash: randomHex(64),
      total_accounts: 1250,
      total_certificates: certificates.length,
      uptime_seconds: Math.floor(process.uptime())
    }
  });
});

app.get('/api/v1/blocks', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  res.json({
    success: true,
    data: { blocks: generateBlocks(limit), total: currentHeight + 1, limit, offset }
  });
});

app.get('/api/v1/blocks/latest', (req, res) => {
  res.json({
    success: true,
    data: {
      hash: randomHex(64),
      height: currentHeight,
      previous_hash: randomHex(64),
      merkle_root: randomHex(64),
      state_root: randomHex(64),
      tx_count: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      producer: ADMIN_ADDRESS,
      transactions: generateTransactions(5)
    }
  });
});

app.get('/api/v1/blocks/:height', (req, res) => {
  const height = parseInt(req.params.height);
  res.json({
    success: true,
    data: {
      hash: randomHex(64),
      height,
      previous_hash: randomHex(64),
      merkle_root: randomHex(64),
      state_root: randomHex(64),
      tx_count: Math.floor(Math.random() * 100),
      timestamp: new Date(Date.now() - (currentHeight - height) * 1000).toISOString(),
      producer: ADMIN_ADDRESS,
      transactions: generateTransactions(10)
    }
  });
});

app.get('/api/v1/transactions', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  res.json({
    success: true,
    data: { transactions: generateTransactions(limit), total: totalTransactions, limit, offset }
  });
});

app.get('/api/v1/transactions/:hash', (req, res) => {
  res.json({
    success: true,
    data: {
      hash: req.params.hash,
      tx_type: 'Transfer',
      from: randomHex(64),
      to: randomHex(64),
      amount: '1000000000000000000',
      nonce: 42,
      timestamp: new Date().toISOString(),
      block_height: currentHeight - 1,
      success: true
    }
  });
});

// Certificates (public read)
app.get('/api/v1/certificates', (req, res) => {
  res.json({
    success: true,
    data: {
      certificates,
      total: certificates.length,
      stats: {
        total_certificates: certificates.length,
        active_certificates: certificates.filter(c => c.status === 'Active').length,
        total_gold_oz: certificates.reduce((sum, c) => sum + c.gold_amount_oz, 0),
        total_minted: '47775875000000000000000',
        total_mintable: '54431125000000000000000'
      }
    }
  });
});

app.get('/api/v1/certificates/:id', (req, res) => {
  // Fixed: use exact match instead of .includes()
  const cert = certificates.find(c =>
    c.certificate_id === req.params.id ||
    c.hsbc_reference === req.params.id
  );
  if (cert) {
    res.json({ success: true, data: cert });
  } else {
    res.status(404).json({ success: false, error: 'Certificate not found' });
  }
});

// Token supply (public)
app.get('/api/v1/tokens/supply', (req, res) => {
  res.json({
    success: true,
    data: {
      total_supply: totalSupply.toString(),
      total_supply_formatted: (Number(totalSupply) / 1e18).toFixed(2),
      total_minted: totalSupply.toString(),
      total_burned: '0',
      circulating: totalSupply.toString()
    }
  });
});

// ============================================
// AUTHENTICATED API ROUTES
// ============================================

// Submit transaction (requires auth)
app.post('/api/v1/transactions', requireAuth, (req, res) => {
  totalTransactions++;
  res.json({
    success: true,
    data: { tx_hash: randomHex(64), status: 'pending' }
  });
});

// Register certificate (requires auth + permission)
app.post('/api/v1/certificates', requireAuth, requirePermission('transaction:create'), (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      certificate_id: 'cert' + randomHex(60),
      status: 'pending'
    }
  });
});

// Mint tokens (ADMIN only — rate limited + validated)
app.post('/api/v1/tokens/mint', adminLimiter, requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), validateMint, async (req, res) => {
  try {
    await auditFromRequest(req, AuditAction.TRANSACTION_CREATE, EntityType.TRANSACTION, randomHex(32), null, {
      type: 'mint',
      amount: req.body.amount,
      admin: req.user.userId
    });
  } catch (e) { /* audit best-effort */ }

  res.json({
    success: true,
    data: { tx_hash: randomHex(64), status: 'pending' }
  });
});

// Transfer tokens (requires auth + validated)
app.post('/api/v1/tokens/transfer', requireAuth, validateTransfer, (req, res) => {
  totalTransactions++;
  res.json({
    success: true,
    data: { tx_hash: randomHex(64), status: 'pending' }
  });
});

// Burn tokens (requires auth + admin)
app.post('/api/v1/tokens/burn', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    success: true,
    data: { tx_hash: randomHex(64), status: 'pending' }
  });
});

// Wallet balance (requires auth)
app.get('/api/v1/wallet/:address/balance', requireAuth, (req, res) => {
  const isAdmin = req.params.address === ADMIN_ADDRESS;
  const balance = isAdmin ? '10000000000000000000000' : (BigInt(Math.floor(Math.random() * 10000)) * BigInt('1000000000000000000')).toString();

  res.json({
    success: true,
    data: {
      address: req.params.address,
      balance,
      balance_formatted: (Number(balance) / 1e18).toFixed(6),
      nonce: Math.floor(Math.random() * 100),
      is_admin: isAdmin
    }
  });
});

// Wallet transactions (requires auth)
app.get('/api/v1/wallet/:address/transactions', requireAuth, (req, res) => {
  const txs = generateTransactions(10).map(tx => ({
    ...tx,
    from: Math.random() > 0.5 ? req.params.address : tx.from,
    to: Math.random() > 0.5 ? req.params.address : tx.to
  }));
  res.json({
    success: true,
    data: { transactions: txs, total: txs.length }
  });
});

// Wallet certificates (requires auth)
app.get('/api/v1/wallet/:address/certificates', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      certificates,
      total_gold_oz: certificates.reduce((sum, c) => sum + c.gold_amount_oz, 0),
      total_gold_grams: certificates.reduce((sum, c) => sum + c.gold_amount_grams, 0)
    }
  });
});

// Wallet transfer (requires auth + validated + rate limited)
app.post('/api/v1/wallet/transfer', sensitiveLimiter, requireAuth, validateTransfer, (req, res) => {
  totalTransactions++;
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'pending',
      from: req.body.from,
      to: req.body.to,
      amount: req.body.amount
    }
  });
});

// Generate keypair (ADMIN only — rate limited)
app.post('/api/v1/admin/keypair', adminLimiter, requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    success: true,
    data: {
      address: randomHex(64),
      public_key: randomHex(64),
      // NOTE: In production, private keys should NEVER be returned via API
      // This is for development only
      secret_key: process.env.NODE_ENV !== 'production' ? randomHex(64) : undefined,
      warning: 'NEVER share your secret key! Store it securely.'
    }
  });
});

// ============================================
// STAKING SYSTEM (DB-backed tiers, requires auth)
// ============================================

const stakingPositions = new Map();
let totalStaked = BigInt(0);
let stakingPoolFees = BigInt(0);

const MAX_STAKES_PER_USER = 20;

// Cache of staking tier configs loaded from DB
let stakingTierCache = null;
let stakingTierCacheTime = 0;
const TIER_CACHE_TTL = 60000; // 1 minute

async function getStakingTiers() {
  const now = Date.now();
  if (stakingTierCache && (now - stakingTierCacheTime) < TIER_CACHE_TTL) {
    return stakingTierCache;
  }
  try {
    const { prisma } = require('./database/db');
    const tiers = await prisma.stakingTierConfig.findMany({
      where: { isActive: true },
      orderBy: { lockDays: 'asc' },
    });
    stakingTierCache = tiers;
    stakingTierCacheTime = now;
    return tiers;
  } catch (e) {
    // Fallback defaults if DB unavailable
    return [
      { tierName: 'passive', displayName: 'Passive', lockDays: 0, apyRate: 0.005, minStake: 0, maxStake: null },
      { tierName: 'gold_lock', displayName: 'Gold Lock', lockDays: 90, apyRate: 0.05, minStake: 0, maxStake: null },
      { tierName: 'platinum_lock', displayName: 'Platinum Lock', lockDays: 180, apyRate: 0.15, minStake: 0, maxStake: null },
    ];
  }
}

function getTierByLockDays(tiers, lockDays) {
  return tiers.find(t => t.lockDays === lockDays) || null;
}

function getPassiveRate(tiers) {
  const passive = tiers.find(t => t.lockDays === 0);
  return passive ? Number(passive.apyRate) : 0.005;
}

function getTiersMap(tiers) {
  const map = {};
  for (const t of tiers) {
    map[t.lockDays] = { name: t.displayName, apy: Number(t.apyRate) };
  }
  return map;
}

const calculateStakeYield = (stake) => {
  const now = Date.now();
  const elapsed = (now - stake.lastUpdateTime) / 1000;
  const annualSeconds = 365 * 24 * 60 * 60;
  const stakedBigInt = BigInt(stake.amount);
  const rate = stake.yieldRate || 0.005; // contracted rate, fallback to passive
  return (stakedBigInt * BigInt(Math.floor(rate * 10000)) * BigInt(Math.floor(elapsed))) / BigInt(annualSeconds * 10000);
};

const calculateAccruedYield = (position) => {
  if (!position.stakes || position.stakes.length === 0) {
    const now = Date.now();
    const elapsed = (now - position.lastUpdateTime) / 1000;
    const annualSeconds = 365 * 24 * 60 * 60;
    const stakedBigInt = BigInt(position.stakedAmount || '0');
    const rate = position.yieldRate || 0.005;
    return (stakedBigInt * BigInt(Math.floor(rate * 10000)) * BigInt(Math.floor(elapsed))) / BigInt(annualSeconds * 10000);
  }
  let totalYield = BigInt(0);
  for (const stake of position.stakes) {
    totalYield += calculateStakeYield(stake) + BigInt(stake.accumulatedYield || '0');
  }
  return totalYield;
};

const isStakeLocked = (stake) => {
  if (!stake.lockExpiry) return false;
  return Date.now() < stake.lockExpiry;
};

const getUnlockableAmount = (position) => {
  if (!position.stakes) return BigInt(position.stakedAmount || '0');
  let unlockable = BigInt(0);
  for (const stake of position.stakes) {
    if (!isStakeLocked(stake)) {
      unlockable += BigInt(stake.amount);
    }
  }
  return unlockable;
};

const getStakesSummary = (position) => {
  if (!position.stakes || position.stakes.length === 0) {
    const rate = position.yieldRate || 0.005;
    return [{
      amount: position.stakedAmount || '0',
      amountFormatted: (Number(position.stakedAmount || 0) / 1e18).toFixed(6),
      lockPeriod: 0,
      lockExpiry: null,
      isLocked: false,
      yieldRate: rate,
      yieldRateFormatted: (rate * 100).toFixed(2) + '%',
      tierName: position.tierName || 'passive',
      stakedAt: position.lastUpdateTime || Date.now()
    }];
  }
  return position.stakes.map(stake => ({
    amount: stake.amount,
    amountFormatted: (Number(stake.amount) / 1e18).toFixed(6),
    lockPeriod: stake.lockPeriod,
    lockExpiry: stake.lockExpiry,
    isLocked: isStakeLocked(stake),
    daysRemaining: stake.lockExpiry ? Math.max(0, Math.ceil((stake.lockExpiry - Date.now()) / (24 * 60 * 60 * 1000))) : 0,
    yieldRate: stake.yieldRate,
    yieldRateFormatted: (stake.yieldRate * 100).toFixed(2) + '%',
    tierName: stake.tierName || 'passive',
    autoCompound: stake.autoCompound || false,
    stakedAt: stake.stakedAt
  }));
};

// Get staking info (requires auth)
app.get('/api/v1/staking/:address', requireAuth, async (req, res) => {
  const address = req.params.address;
  let position = stakingPositions.get(address);
  const tiers = await getStakingTiers();
  const passiveRate = getPassiveRate(tiers);
  const tiersMap = getTiersMap(tiers);

  if (!position) {
    return res.json({
      success: true,
      data: {
        address,
        stakedAmount: '0',
        stakedAmountFormatted: '0.00',
        unlockableAmount: '0',
        unlockableAmountFormatted: '0.00',
        lockedAmount: '0',
        lockedAmountFormatted: '0.00',
        passiveYieldRate: passiveRate,
        passiveYieldRateFormatted: (passiveRate * 100).toFixed(2) + '%',
        accumulatedYield: '0',
        accumulatedYieldFormatted: '0.00',
        lastUpdateTime: Date.now(),
        stakes: [],
        stakingHistory: [],
        totalStaked: totalStaked.toString(),
        totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
        tiers: tiersMap
      }
    });
  }

  const totalYield = calculateAccruedYield(position);
  const unlockable = getUnlockableAmount(position);
  const totalStakedAmount = BigInt(position.totalStaked || position.stakedAmount || '0');
  const lockedAmount = totalStakedAmount - unlockable;

  res.json({
    success: true,
    data: {
      address,
      stakedAmount: totalStakedAmount.toString(),
      stakedAmountFormatted: (Number(totalStakedAmount) / 1e18).toFixed(6),
      unlockableAmount: unlockable.toString(),
      unlockableAmountFormatted: (Number(unlockable) / 1e18).toFixed(6),
      lockedAmount: lockedAmount.toString(),
      lockedAmountFormatted: (Number(lockedAmount) / 1e18).toFixed(6),
      passiveYieldRate: passiveRate,
      passiveYieldRateFormatted: (passiveRate * 100).toFixed(2) + '%',
      accumulatedYield: totalYield.toString(),
      accumulatedYieldFormatted: (Number(totalYield) / 1e18).toFixed(6),
      lastUpdateTime: Date.now(),
      stakes: getStakesSummary(position),
      stakingHistory: position.stakingHistory || [],
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
      tiers: tiersMap
    }
  });
});

// Stake tokens (requires auth + validated + rate limited)
app.post('/api/v1/staking/stake', sensitiveLimiter, requireAuth, validateStake, async (req, res) => {
  const { address, amount, lockPeriod = 0, autoCompound = false } = req.body;

  const amountBigInt = BigInt(amount);
  let position = stakingPositions.get(address);
  const tiers = await getStakingTiers();
  const tier = getTierByLockDays(tiers, lockPeriod);

  if (!tier) {
    return res.status(400).json({ success: false, error: `Invalid lock period. Available: ${tiers.map(t => t.lockDays).join(', ')} days` });
  }

  const effectiveYieldRate = Number(tier.apyRate);
  const tierName = tier.tierName;
  const now = Date.now();
  const lockExpiry = lockPeriod > 0 ? now + (lockPeriod * 24 * 60 * 60 * 1000) : null;

  // Check min stake
  if (tier.minStake && Number(amountBigInt) / 1e18 < Number(tier.minStake)) {
    return res.status(400).json({ success: false, error: `Minimum stake for ${tier.displayName}: ${tier.minStake} STTAURX` });
  }

  if (!position) {
    position = { stakes: [], totalStaked: '0', stakingHistory: [] };
  }

  if (!position.stakes) {
    position.stakes = [];
    if (position.stakedAmount && BigInt(position.stakedAmount) > 0) {
      position.stakes.push({
        amount: position.stakedAmount,
        yieldRate: position.yieldRate || 0.005,
        tierName: 'passive',
        lockPeriod: 0, lockExpiry: null,
        stakedAt: position.lastUpdateTime || now,
        accumulatedYield: position.accumulatedYield || '0',
        lastUpdateTime: position.lastUpdateTime || now
      });
    }
  }

  // Per-account stake limit
  if (position.stakes.length >= MAX_STAKES_PER_USER) {
    return res.status(400).json({ success: false, error: `Maximum ${MAX_STAKES_PER_USER} stake positions per account` });
  }

  position.stakes.push({
    amount: amount,
    yieldRate: effectiveYieldRate,  // Contracted rate at time of staking
    tierName,
    lockPeriod, lockExpiry,
    autoCompound,
    stakedAt: now,
    accumulatedYield: '0',
    lastUpdateTime: now
  });

  const newTotalStaked = BigInt(position.totalStaked || '0') + amountBigInt;
  position.totalStaked = newTotalStaked.toString();

  position.stakingHistory.push({
    type: 'stake', amount, lockPeriod, lockExpiry, tierName,
    yieldRate: effectiveYieldRate, autoCompound,
    timestamp: new Date().toISOString(),
    txHash: randomHex(64)
  });

  stakingPositions.set(address, position);
  totalStaked = totalStaked + amountBigInt;

  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'confirmed',
      stakedAmount: amount,
      stakedAmountFormatted: (Number(amount) / 1e18).toFixed(6),
      lockPeriod, lockExpiry, tierName,
      effectiveYieldRate,
      effectiveYieldRateFormatted: (effectiveYieldRate * 100).toFixed(2) + '%',
      autoCompound,
      message: lockPeriod > 0
        ? `Tokens staked in ${tier.displayName} (${lockPeriod}d) at ${(effectiveYieldRate * 100).toFixed(2)}% APY`
        : `Tokens earning passive yield at ${(effectiveYieldRate * 100).toFixed(2)}% APY`
    }
  });
});

// Unstake tokens (requires auth + validated)
app.post('/api/v1/staking/unstake', requireAuth, validateUnstake, (req, res) => {
  const { address, amount } = req.body;
  let position = stakingPositions.get(address);

  if (!position) {
    return res.status(400).json({ success: false, error: 'No staking position found' });
  }

  const amountBigInt = BigInt(amount);
  const unlockable = getUnlockableAmount(position);

  if (unlockable < amountBigInt) {
    const lockedAmount = BigInt(position.totalStaked || position.stakedAmount || '0') - unlockable;
    return res.status(400).json({
      success: false,
      error: `Insufficient unlocked balance. Available: ${(Number(unlockable) / 1e18).toFixed(6)} GOLD. Locked: ${(Number(lockedAmount) / 1e18).toFixed(6)} GOLD`
    });
  }

  let remainingToUnstake = amountBigInt;
  const now = Date.now();

  if (position.stakes) {
    const newStakes = [];
    for (const stake of position.stakes) {
      if (remainingToUnstake === BigInt(0)) { newStakes.push(stake); continue; }
      if (isStakeLocked(stake)) { newStakes.push(stake); continue; }
      const stakeAmount = BigInt(stake.amount);
      if (stakeAmount <= remainingToUnstake) {
        remainingToUnstake -= stakeAmount;
      } else {
        stake.amount = (stakeAmount - remainingToUnstake).toString();
        stake.accumulatedYield = (BigInt(stake.accumulatedYield || '0') + calculateStakeYield(stake)).toString();
        stake.lastUpdateTime = now;
        newStakes.push(stake);
        remainingToUnstake = BigInt(0);
      }
    }
    position.stakes = newStakes;
  } else {
    position.stakedAmount = (BigInt(position.stakedAmount) - amountBigInt).toString();
    position.lastUpdateTime = now;
  }

  const newTotalStaked = BigInt(position.totalStaked || position.stakedAmount || '0') - amountBigInt;
  position.totalStaked = newTotalStaked.toString();

  position.stakingHistory.push({
    type: 'unstake', amount,
    timestamp: new Date().toISOString(),
    txHash: randomHex(64)
  });

  stakingPositions.set(address, position);
  totalStaked = totalStaked - amountBigInt;

  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'confirmed',
      unstakedAmount: amount,
      unstakedAmountFormatted: (Number(amount) / 1e18).toFixed(6),
      remainingStake: position.totalStaked,
      remainingStakeFormatted: (Number(position.totalStaked) / 1e18).toFixed(6),
      message: 'Tokens unstaked successfully'
    }
  });
});

// Claim yield (requires auth)
app.post('/api/v1/staking/claim', requireAuth, (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ success: false, error: 'Address required' });
  }

  let position = stakingPositions.get(address);
  if (!position) {
    return res.status(400).json({ success: false, error: 'No staking position found' });
  }

  const totalYield = calculateAccruedYield(position);
  if (totalYield === BigInt(0)) {
    return res.status(400).json({ success: false, error: 'No yield to claim' });
  }

  const now = Date.now();
  if (position.stakes) {
    for (const stake of position.stakes) {
      stake.accumulatedYield = '0';
      stake.lastUpdateTime = now;
    }
  } else {
    position.accumulatedYield = '0';
    position.lastUpdateTime = now;
  }

  position.stakingHistory.push({
    type: 'claim', amount: totalYield.toString(),
    timestamp: new Date().toISOString(),
    txHash: randomHex(64)
  });

  stakingPositions.set(address, position);

  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'confirmed',
      claimedAmount: totalYield.toString(),
      claimedAmountFormatted: (Number(totalYield) / 1e18).toFixed(6),
      message: 'Yield claimed successfully'
    }
  });
});

// Admin: Get all staking tier configs
app.get('/api/v1/admin/staking/tiers', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const tiers = await getStakingTiers();
  res.json({
    success: true,
    data: { tiers: tiers.map(t => ({
      id: t.id, tierName: t.tierName, displayName: t.displayName,
      lockDays: t.lockDays, apyRate: Number(t.apyRate),
      apyFormatted: (Number(t.apyRate) * 100).toFixed(2) + '%',
      minStake: Number(t.minStake || 0), maxStake: t.maxStake ? Number(t.maxStake) : null,
      isActive: t.isActive
    }))}
  });
});

// Admin: Update a staking tier config (ADMIN only + fee:manage)
app.put('/api/v1/admin/staking/tiers/:tierName', adminLimiter, requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), requirePermission('fee:manage'), async (req, res) => {
  const { tierName } = req.params;
  const { apyRate, minStake, maxStake, isActive } = req.body;

  try {
    const { prisma } = require('./database/db');
    const existing = await prisma.stakingTierConfig.findUnique({ where: { tierName } });
    if (!existing) {
      return res.status(404).json({ success: false, error: `Tier "${tierName}" not found` });
    }

    // Validate rate if provided
    if (apyRate !== undefined) {
      if (typeof apyRate !== 'number' || apyRate < 0 || apyRate > 1) {
        return res.status(400).json({ success: false, error: 'apyRate must be between 0 and 1 (0%-100%)' });
      }
    }

    const updateData = {};
    if (apyRate !== undefined) updateData.apyRate = apyRate;
    if (minStake !== undefined) updateData.minStake = minStake;
    if (maxStake !== undefined) updateData.maxStake = maxStake;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedBy = req.user.userId;

    const oldValues = { apyRate: Number(existing.apyRate), minStake: Number(existing.minStake), isActive: existing.isActive };
    const updated = await prisma.stakingTierConfig.update({ where: { tierName }, data: updateData });

    // Invalidate cache
    stakingTierCache = null;

    try {
      await auditFromRequest(req, AuditAction.ADMIN_FEE_UPDATE, 'staking_tier', existing.id, oldValues, updateData);
    } catch (e) { /* audit best-effort */ }

    res.json({
      success: true,
      data: {
        tier: {
          id: updated.id, tierName: updated.tierName, displayName: updated.displayName,
          lockDays: updated.lockDays, apyRate: Number(updated.apyRate),
          apyFormatted: (Number(updated.apyRate) * 100).toFixed(2) + '%',
          minStake: Number(updated.minStake), maxStake: updated.maxStake ? Number(updated.maxStake) : null,
          isActive: updated.isActive
        },
        message: `Tier "${updated.displayName}" updated. Changes apply to NEW stakes only.`
      }
    });
  } catch (e) {
    console.error('Tier update error:', e);
    res.status(500).json({ success: false, error: 'Failed to update tier config' });
  }
});

// Admin: Get staking stats (ADMIN only)
app.get('/api/v1/admin/staking/stats', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  let totalAccumulatedYield = BigInt(0);
  stakingPositions.forEach((position) => {
    const newYield = calculateAccruedYield(position);
    totalAccumulatedYield += BigInt(position.accumulatedYield || '0') + newYield;
  });

  const tiers = await getStakingTiers();

  res.json({
    success: true,
    data: {
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
      totalStakers: stakingPositions.size,
      tiers: tiers.map(t => ({ tierName: t.tierName, displayName: t.displayName, lockDays: t.lockDays, apyRate: Number(t.apyRate) })),
      totalAccumulatedYield: totalAccumulatedYield.toString(),
      totalAccumulatedYieldFormatted: (Number(totalAccumulatedYield) / 1e18).toFixed(6),
      stakingPoolFees: stakingPoolFees.toString(),
      stakingPoolFeesFormatted: (Number(stakingPoolFees) / 1e18).toFixed(6)
    }
  });
});

// Admin: Override user KYC status
app.put('/api/v1/admin/users/:userId/kyc-status', adminLimiter, requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  const validStatuses = ['NONE', 'PENDING', 'VERIFIED', 'PREMIUM', 'INSTITUTIONAL', 'REJECTED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { prisma } = require('./database/db');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const oldStatus = user.kycStatus;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: status, status: status === 'REJECTED' ? 'SUSPENDED' : 'ACTIVE' },
      select: { id: true, email: true, fullName: true, role: true, kycStatus: true, status: true }
    });

    try {
      await auditFromRequest(req, 'KYC_STATUS_CHANGE', 'user', userId, { kycStatus: oldStatus }, { kycStatus: status });
    } catch (e) { /* audit best-effort */ }

    res.json({
      success: true,
      data: { user: updated, message: `KYC status updated: ${oldStatus} -> ${status}` }
    });
  } catch (e) {
    console.error('KYC update error:', e);
    res.status(500).json({ success: false, error: 'Failed to update KYC status' });
  }
});

// Admin: List all users (for admin panel)
app.get('/api/v1/admin/users', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { prisma } = require('./database/db');
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, fullName: true, role: true, status: true,
        kycStatus: true, emailVerified: true, autoCompound: true,
        createdAt: true, lastLoginAt: true,
        wallets: { select: { address: true, balance: true, lockedBalance: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: { users, total: users.length } });
  } catch (e) {
    console.error('User list error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// ============================================
// MARKETPLACE SYSTEM (mixed auth)
// ============================================

const commodities = [
  { id: 'CMD001', supplierId: 'supplier_001', supplierName: 'Colombian Coffee Exports', name: 'Premium Arabica Coffee Beans', category: 'coffee', description: 'High-altitude single origin coffee from Colombian highlands. Cupping score 85+.', quantity: 5000, unit: 'kg', pricePerUnit: '0.45', minOrderQuantity: 500, origin: 'Colombia', certifications: ['Organic Certified', 'Fair Trade', 'Rainforest Alliance'], images: [], status: 'active', views: 234, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-28T14:30:00Z' },
  { id: 'CMD002', supplierId: 'supplier_001', supplierName: 'Colombian Coffee Exports', name: 'Organic Raw Cotton', category: 'cotton', description: 'Premium organic cotton, suitable for high-end textile production.', quantity: 10000, unit: 'kg', pricePerUnit: '0.25', minOrderQuantity: 1000, origin: 'India', certifications: ['Organic Certified', 'GOTS'], images: [], status: 'active', views: 189, createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-25T11:00:00Z' },
  { id: 'CMD003', supplierId: 'supplier_002', supplierName: 'Chile Metals Corp', name: 'Grade A Copper Cathode', category: 'copper', description: 'LME Grade A copper cathode, 99.99% purity. Direct from Chilean mines.', quantity: 2500, unit: 'MT', pricePerUnit: '890', minOrderQuantity: 25, origin: 'Chile', certifications: ['LME Certified', 'ISO 9001'], images: [], status: 'active', views: 98, createdAt: '2026-01-25T09:00:00Z', updatedAt: '2026-01-30T10:00:00Z' },
  { id: 'CMD004', supplierId: 'supplier_003', supplierName: 'Gulf Oil Trading', name: 'Brent Crude Oil', category: 'oil', description: 'Light sweet crude oil, API gravity 38 degrees.', quantity: 50000, unit: 'barrel', pricePerUnit: '1.05', minOrderQuantity: 1000, origin: 'UAE', certifications: [], images: [], status: 'active', views: 456, createdAt: '2026-01-10T12:00:00Z', updatedAt: '2026-01-29T16:00:00Z' }
];

const orders = [
  { id: 'ORD-2026-001', commodityId: 'CMD001', commodityName: 'Premium Arabica Coffee Beans', buyerId: 'buyer_001', buyerName: 'Global Foods Inc.', supplierId: 'supplier_001', supplierName: 'Colombian Coffee Exports', quantity: 1000, unit: 'kg', pricePerUnit: '0.45', totalPrice: '450', lcId: 'LC-2026-001', status: 'shipped', createdAt: '2026-01-28T10:30:00Z', updatedAt: '2026-01-30T14:20:00Z' },
  { id: 'ORD-2026-002', commodityId: 'CMD001', commodityName: 'Premium Arabica Coffee Beans', buyerId: 'buyer_002', buyerName: 'European Traders Ltd.', supplierId: 'supplier_001', supplierName: 'Colombian Coffee Exports', quantity: 2000, unit: 'kg', pricePerUnit: '0.45', totalPrice: '900', lcId: 'LC-2026-002', status: 'lc_created', createdAt: '2026-01-30T09:15:00Z', updatedAt: '2026-01-30T09:15:00Z' },
  { id: 'ORD-2026-003', commodityId: 'CMD002', commodityName: 'Organic Raw Cotton', buyerId: 'buyer_003', buyerName: 'TextileCo Asia', supplierId: 'supplier_001', supplierName: 'Colombian Coffee Exports', quantity: 5000, unit: 'kg', pricePerUnit: '0.25', totalPrice: '1250', lcId: 'LC-2026-003', status: 'customs', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-29T16:45:00Z' }
];

const lettersOfCredit = [
  { id: 'LC-2026-001', orderId: 'ORD-2026-001', buyerId: 'buyer_001', supplierId: 'supplier_001', totalAmount: '450', escrowAddress: randomHex(64), status: 'in_progress', milestones: [{ stage: 1, name: 'shipment', percentage: 30, amount: '135', status: 'completed', completedAt: '2026-01-30T14:20:00Z', txHash: randomHex(64) }, { stage: 2, name: 'customs', percentage: 50, amount: '225', status: 'pending' }, { stage: 3, name: 'delivery', percentage: 20, amount: '90', status: 'pending' }], createdAt: '2026-01-28T10:35:00Z' },
  { id: 'LC-2026-002', orderId: 'ORD-2026-002', buyerId: 'buyer_002', supplierId: 'supplier_001', totalAmount: '900', escrowAddress: randomHex(64), status: 'funded', milestones: [{ stage: 1, name: 'shipment', percentage: 30, amount: '270', status: 'pending' }, { stage: 2, name: 'customs', percentage: 50, amount: '450', status: 'pending' }, { stage: 3, name: 'delivery', percentage: 20, amount: '180', status: 'pending' }], createdAt: '2026-01-30T09:20:00Z' },
  { id: 'LC-2026-003', orderId: 'ORD-2026-003', buyerId: 'buyer_003', supplierId: 'supplier_001', totalAmount: '1250', escrowAddress: randomHex(64), status: 'in_progress', milestones: [{ stage: 1, name: 'shipment', percentage: 30, amount: '375', status: 'completed', completedAt: '2026-01-25T10:00:00Z', txHash: randomHex(64) }, { stage: 2, name: 'customs', percentage: 50, amount: '625', status: 'completed', completedAt: '2026-01-29T16:45:00Z', txHash: randomHex(64) }, { stage: 3, name: 'delivery', percentage: 20, amount: '250', status: 'pending' }], createdAt: '2026-01-20T08:05:00Z' }
];

const shipments = [
  { id: 'SHP-2026-001', orderId: 'ORD-2026-001', lcId: 'LC-2026-001', commodityName: 'Premium Arabica Coffee Beans', buyerName: 'Global Foods Inc.', carrier: 'Maersk Line', trackingNumber: 'MSKU1234567', transportMode: 'sea', origin: 'Cartagena, Colombia', destination: 'Rotterdam, Netherlands', estimatedDelivery: '2026-02-15', status: 'in_transit', documents: [{ id: 'DOC001', type: 'bill_of_lading', name: 'Bill of Lading', hash: randomHex(64), uploadedAt: '2026-01-30T14:00:00Z', verifiedAt: '2026-01-30T14:15:00Z' }, { id: 'DOC002', type: 'certificate_of_origin', name: 'Certificate of Origin', hash: randomHex(64), uploadedAt: '2026-01-30T14:05:00Z' }], events: [{ timestamp: '2026-01-30T14:00:00Z', location: 'Cartagena, Colombia', status: 'shipped', description: 'Goods loaded onto vessel' }, { timestamp: '2026-01-31T08:00:00Z', location: 'Caribbean Sea', status: 'in_transit', description: 'Vessel departed port' }], createdAt: '2026-01-30T13:00:00Z' },
  { id: 'SHP-2026-002', orderId: 'ORD-2026-003', lcId: 'LC-2026-003', commodityName: 'Organic Raw Cotton', buyerName: 'TextileCo Asia', carrier: 'DHL Global Forwarding', trackingNumber: 'DHL9876543', transportMode: 'air', origin: 'Mumbai, India', destination: 'Shanghai, China', estimatedDelivery: '2026-02-05', status: 'customs', documents: [{ id: 'DOC003', type: 'bill_of_lading', name: 'Air Waybill', hash: randomHex(64), uploadedAt: '2026-01-25T09:00:00Z', verifiedAt: '2026-01-25T09:30:00Z' }, { id: 'DOC004', type: 'certificate_of_origin', name: 'Certificate of Origin', hash: randomHex(64), uploadedAt: '2026-01-25T09:15:00Z', verifiedAt: '2026-01-25T09:35:00Z' }, { id: 'DOC005', type: 'customs_declaration', name: 'Customs Declaration', hash: randomHex(64), uploadedAt: '2026-01-29T16:30:00Z', verifiedAt: '2026-01-29T16:45:00Z' }], events: [{ timestamp: '2026-01-25T09:00:00Z', location: 'Mumbai, India', status: 'shipped', description: 'Cargo departed' }, { timestamp: '2026-01-26T14:00:00Z', location: 'Shanghai, China', status: 'arrived', description: 'Arrived at destination airport' }, { timestamp: '2026-01-29T16:45:00Z', location: 'Shanghai, China', status: 'customs', description: 'Customs clearance completed' }], createdAt: '2026-01-25T08:00:00Z' }
];

const payments = [
  { id: 'PAY001', orderId: 'ORD-2026-001', lcId: 'LC-2026-001', stage: 1, stageName: 'Shipment', amount: '135', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-30T14:20:00Z' },
  { id: 'PAY002', orderId: 'ORD-2026-003', lcId: 'LC-2026-003', stage: 1, stageName: 'Shipment', amount: '375', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-25T10:05:00Z' },
  { id: 'PAY003', orderId: 'ORD-2026-003', lcId: 'LC-2026-003', stage: 2, stageName: 'Customs', amount: '625', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-29T16:50:00Z' }
];

// Commodities (public read, auth for write)
app.get('/api/v1/marketplace/commodities', (req, res) => {
  const { category, status, supplier, search } = req.query;
  let filtered = [...commodities];
  if (category) filtered = filtered.filter(c => c.category === category);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (supplier) filtered = filtered.filter(c => c.supplierId === supplier);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s) || c.origin.toLowerCase().includes(s));
  }
  res.json({ success: true, data: { commodities: filtered, total: filtered.length, categories: ['gold', 'coffee', 'oil', 'wheat', 'copper', 'cotton', 'other'] } });
});

app.get('/api/v1/marketplace/commodities/:id', (req, res) => {
  const commodity = commodities.find(c => c.id === req.params.id);
  if (!commodity) return res.status(404).json({ success: false, error: 'Commodity not found' });
  commodity.views++;
  res.json({ success: true, data: commodity });
});

// Create commodity (requires auth + validated — uses whitelist)
app.post('/api/v1/marketplace/commodities', requireAuth, validateCommodity, (req, res) => {
  const newCommodity = {
    id: 'CMD' + String(commodities.length + 1).padStart(3, '0'),
    supplierId: req.user.userId,
    supplierName: req.user.email,
    ...req.validatedBody,
    images: [],
    views: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  commodities.push(newCommodity);
  res.json({ success: true, data: newCommodity });
});

// Update commodity (requires auth — uses whitelist)
app.put('/api/v1/marketplace/commodities/:id', requireAuth, validateCommodity, (req, res) => {
  const index = commodities.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Commodity not found' });
  commodities[index] = { ...commodities[index], ...req.validatedBody, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: commodities[index] });
});

// Delete commodity (ADMIN only)
app.delete('/api/v1/marketplace/commodities/:id', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const index = commodities.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Commodity not found' });
  commodities.splice(index, 1);
  res.json({ success: true, data: { deleted: true } });
});

// Orders (requires auth)
app.get('/api/v1/marketplace/orders', requireAuth, (req, res) => {
  const { buyer, supplier, status } = req.query;
  let filtered = [...orders];
  if (buyer) filtered = filtered.filter(o => o.buyerId === buyer);
  if (supplier) filtered = filtered.filter(o => o.supplierId === supplier);
  if (status) filtered = filtered.filter(o => o.status === status);
  res.json({ success: true, data: { orders: filtered, total: filtered.length } });
});

app.get('/api/v1/marketplace/orders/:id', requireAuth, (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  const lc = lettersOfCredit.find(l => l.id === order.lcId);
  const shipment = shipments.find(s => s.orderId === order.id);
  res.json({ success: true, data: { ...order, lc, shipment } });
});

// Create order (requires auth + validated)
app.post('/api/v1/marketplace/orders', requireAuth, validateOrder, (req, res) => {
  const { commodityId, buyerId, buyerName, quantity } = req.body;
  const commodity = commodities.find(c => c.id === commodityId);
  if (!commodity) return res.status(404).json({ success: false, error: 'Commodity not found' });

  const totalPrice = (parseFloat(commodity.pricePerUnit) * quantity).toFixed(2);
  const orderId = 'ORD-2026-' + String(orders.length + 1).padStart(3, '0');
  const lcId = 'LC-2026-' + String(lettersOfCredit.length + 1).padStart(3, '0');

  const newOrder = {
    id: orderId, commodityId, commodityName: commodity.name,
    buyerId, buyerName: buyerName || req.user.email,
    supplierId: commodity.supplierId, supplierName: commodity.supplierName,
    quantity, unit: commodity.unit, pricePerUnit: commodity.pricePerUnit,
    totalPrice, lcId, status: 'lc_created',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  const newLC = {
    id: lcId, orderId, buyerId, supplierId: commodity.supplierId,
    totalAmount: totalPrice, escrowAddress: randomHex(64), status: 'funded',
    milestones: [
      { stage: 1, name: 'shipment', percentage: 30, amount: (parseFloat(totalPrice) * 0.3).toFixed(2), status: 'pending' },
      { stage: 2, name: 'customs', percentage: 50, amount: (parseFloat(totalPrice) * 0.5).toFixed(2), status: 'pending' },
      { stage: 3, name: 'delivery', percentage: 20, amount: (parseFloat(totalPrice) * 0.2).toFixed(2), status: 'pending' }
    ],
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  lettersOfCredit.push(newLC);
  res.json({ success: true, data: { order: newOrder, lc: newLC } });
});

// Update order status (requires auth)
app.put('/api/v1/marketplace/orders/:id/status', requireAuth, (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  order.status = req.body.status;
  order.updatedAt = new Date().toISOString();
  res.json({ success: true, data: order });
});

// Letters of Credit (requires auth)
app.get('/api/v1/marketplace/lc', requireAuth, (req, res) => {
  const { buyer, supplier, status } = req.query;
  let filtered = [...lettersOfCredit];
  if (buyer) filtered = filtered.filter(l => l.buyerId === buyer);
  if (supplier) filtered = filtered.filter(l => l.supplierId === supplier);
  if (status) filtered = filtered.filter(l => l.status === status);
  res.json({ success: true, data: { lettersOfCredit: filtered, total: filtered.length } });
});

app.get('/api/v1/marketplace/lc/:id', requireAuth, (req, res) => {
  const lc = lettersOfCredit.find(l => l.id === req.params.id);
  if (!lc) return res.status(404).json({ success: false, error: 'Letter of Credit not found' });
  res.json({ success: true, data: lc });
});

// Complete milestone (requires auth)
app.post('/api/v1/marketplace/lc/:id/milestone', requireAuth, (req, res) => {
  const { stage } = req.body;
  const lc = lettersOfCredit.find(l => l.id === req.params.id);
  if (!lc) return res.status(404).json({ success: false, error: 'Letter of Credit not found' });

  const milestone = lc.milestones.find(m => m.stage === stage);
  if (!milestone) return res.status(400).json({ success: false, error: 'Invalid milestone stage' });
  if (milestone.status === 'completed') return res.status(400).json({ success: false, error: 'Milestone already completed' });

  milestone.status = 'completed';
  milestone.completedAt = new Date().toISOString();
  milestone.txHash = randomHex(64);

  const allCompleted = lc.milestones.every(m => m.status === 'completed');
  lc.status = allCompleted ? 'completed' : 'in_progress';

  const order = orders.find(o => o.id === lc.orderId);
  if (order) {
    if (stage === 1) order.status = 'shipped';
    if (stage === 2) order.status = 'customs';
    if (stage === 3) order.status = 'completed';
    order.updatedAt = new Date().toISOString();
  }

  const payment = {
    id: 'PAY' + String(payments.length + 1).padStart(3, '0'),
    orderId: lc.orderId, lcId: lc.id, stage,
    stageName: milestone.name.charAt(0).toUpperCase() + milestone.name.slice(1),
    amount: milestone.amount, status: 'released',
    txHash: milestone.txHash, releasedAt: milestone.completedAt
  };
  payments.push(payment);

  res.json({
    success: true,
    data: { lc, payment, message: `Milestone ${stage} completed. ${milestone.amount} GOLD released.` }
  });
});

// Shipments (requires auth)
app.get('/api/v1/marketplace/shipments', requireAuth, (req, res) => {
  const { status } = req.query;
  let filtered = [...shipments];
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ success: true, data: { shipments: filtered, total: filtered.length } });
});

app.get('/api/v1/marketplace/shipments/:id', requireAuth, (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  res.json({ success: true, data: shipment });
});

app.post('/api/v1/marketplace/shipments', requireAuth, (req, res) => {
  const { orderId, carrier, trackingNumber, transportMode, origin, destination, estimatedDelivery } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  const newShipment = {
    id: 'SHP-2026-' + String(shipments.length + 1).padStart(3, '0'),
    orderId, lcId: order.lcId, commodityName: order.commodityName, buyerName: order.buyerName,
    carrier, trackingNumber, transportMode, origin, destination, estimatedDelivery,
    status: 'shipped', documents: [],
    events: [{ timestamp: new Date().toISOString(), location: origin, status: 'shipped', description: 'Shipment created' }],
    createdAt: new Date().toISOString()
  };
  shipments.push(newShipment);
  order.status = 'shipped';
  order.updatedAt = new Date().toISOString();
  res.json({ success: true, data: newShipment });
});

app.post('/api/v1/marketplace/shipments/:id/documents', requireAuth, (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  const { type, name } = req.body;
  const doc = { id: 'DOC' + String(Math.random()).slice(2, 8), type, name, hash: randomHex(64), uploadedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() };
  shipment.documents.push(doc);
  res.json({ success: true, data: doc });
});

app.put('/api/v1/marketplace/shipments/:id/status', requireAuth, (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
  const { status, location, description } = req.body;
  shipment.status = status;
  shipment.events.push({ timestamp: new Date().toISOString(), location: location || shipment.destination, status, description: description || `Status updated to ${status}` });
  res.json({ success: true, data: shipment });
});

// Payments (requires auth)
app.get('/api/v1/marketplace/payments', requireAuth, (req, res) => {
  const { order } = req.query;
  let filtered = [...payments];
  if (order) filtered = filtered.filter(p => p.orderId === order);
  res.json({
    success: true,
    data: {
      payments: filtered, total: filtered.length,
      totalReleased: filtered.filter(p => p.status === 'released').reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)
    }
  });
});

// ============================================
// START SERVER
// ============================================

const server = http.createServer(app);

// WebSocket server — with error logging
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);

  ws.send(JSON.stringify({ type: 'Subscribed', data: { channel: 'blocks' } }));
  ws.send(JSON.stringify({ type: 'Subscribed', data: { channel: 'metrics' } }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'Ping') {
        ws.send(JSON.stringify({ type: 'Pong' }));
      }
    } catch (error) {
      console.warn(`[SECURITY] Invalid WebSocket message from ${req.socket.remoteAddress}:`, error.message);
      ws.send(JSON.stringify({ type: 'Error', data: { message: 'Invalid message format' } }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast metrics every second
setInterval(() => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'Metrics',
        data: {
          height: currentHeight,
          tps: Math.floor(tps),
          mempool_size: Math.floor(Math.random() * 1000),
          total_supply: totalSupply.toString()
        }
      }));
    }
  });
}, 1000);

// Start with validation
validateStartup().then((dbConnected) => {
  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║      STTAURX — Mock API Server (Security Hardened)       ║');
    console.log('║                    Version 3.0.0                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`🔐 Database: ${dbConnected ? 'Connected' : 'Mock mode'}`);
    console.log('');
    console.log('🛡️  Security features:');
    console.log('   - JWT Authentication (Bearer tokens)');
    console.log('   - RBAC (Role-Based Access Control)');
    console.log('   - Token blacklist (Redis-backed)');
    console.log('   - Hash-chained audit logs');
    console.log('   - Input validation on critical endpoints');
    console.log('   - Helmet CSP + security headers');
    console.log('   - Rate limiting (3 tiers)');
    console.log('');
    console.log('🔑 Auth endpoints:');
    console.log('   POST /api/v1/auth/register');
    console.log('   POST /api/v1/auth/login');
    console.log('   POST /api/v1/auth/refresh');
    console.log('   POST /api/v1/auth/logout');
    console.log('   POST /api/v1/auth/change-password');
    console.log('   GET  /api/v1/auth/me');
    console.log('');
  });
}).catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
