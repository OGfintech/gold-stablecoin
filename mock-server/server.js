const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for dev, enable in production
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

// CORS - Restrict to known origins
const allowedOrigins = [
  'http://localhost:3000',  // Explorer
  'http://localhost:3002',  // Wallet
  'http://localhost:3003',  // Marketplace
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc) in development
    if (!origin) return callback(null, true);
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

// Rate limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Rate limiting - Strict for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 admin requests per window
  message: { success: false, error: 'Too many admin requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - Very strict for sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 sensitive requests per window
  message: { success: false, error: 'Too many sensitive requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parser with size limit
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb

// Request logging for security audit
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

const PORT = 3001;

// ============================================
// MOCK DATA
// ============================================

// Generate random hex string
const randomHex = (length) => {
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Admin keypair (fixed for demo)
const ADMIN = {
  address: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  publicKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  secretKey: 'secret1234567890abcdef1234567890abcdef1234567890abcdef12345678'
};

// State
let currentHeight = 0;
let totalTransactions = 0;
let totalSupply = BigInt('50000000000000000000000'); // 50,000 tokens
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
      producer: ADMIN.publicKey
    });
  }
  return blocks;
};

// Generate mock transactions
const generateTransactions = (count) => {
  const types = ['Transfer', 'Mint', 'Burn', 'RegisterCertificate'];
  const txs = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * 3)]; // Mostly transfers
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
  tps = newTxs / 0.1; // 100ms blocks

  // Broadcast to WebSocket clients
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
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// System metrics
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

// System status
app.get('/api/v1/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      node_id: randomHex(16),
      version: '0.1.0',
      height: currentHeight,
      latest_block_hash: randomHex(64),
      total_accounts: 1250,
      total_certificates: certificates.length,
      uptime_seconds: Math.floor(process.uptime())
    }
  });
});

// List blocks
app.get('/api/v1/blocks', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  res.json({
    success: true,
    data: {
      blocks: generateBlocks(limit),
      total: currentHeight + 1,
      limit,
      offset
    }
  });
});

// Get latest block
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
      producer: ADMIN.publicKey,
      transactions: generateTransactions(5)
    }
  });
});

// Get block by height
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
      producer: ADMIN.publicKey,
      transactions: generateTransactions(10)
    }
  });
});

// List transactions
app.get('/api/v1/transactions', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  res.json({
    success: true,
    data: {
      transactions: generateTransactions(limit),
      total: totalTransactions,
      limit,
      offset
    }
  });
});

// Get transaction
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

// Submit transaction
app.post('/api/v1/transactions', (req, res) => {
  totalTransactions++;
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'pending'
    }
  });
});

// List certificates
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

// Get certificate
app.get('/api/v1/certificates/:id', (req, res) => {
  const cert = certificates.find(c =>
    c.certificate_id.includes(req.params.id) ||
    c.hsbc_reference === req.params.id
  );

  if (cert) {
    res.json({ success: true, data: cert });
  } else {
    res.status(404).json({ success: false, error: 'Certificate not found' });
  }
});

// Register certificate
app.post('/api/v1/certificates', (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      certificate_id: 'cert' + randomHex(60),
      status: 'pending'
    }
  });
});

// Token supply
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

// Mint tokens (Admin - rate limited)
app.post('/api/v1/tokens/mint', adminLimiter, (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'pending'
    }
  });
});

// Transfer tokens
app.post('/api/v1/tokens/transfer', (req, res) => {
  totalTransactions++;
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'pending'
    }
  });
});

// Burn tokens
app.post('/api/v1/tokens/burn', (req, res) => {
  res.json({
    success: true,
    data: {
      tx_hash: randomHex(64),
      status: 'pending'
    }
  });
});

// Wallet balance
app.get('/api/v1/wallet/:address/balance', (req, res) => {
  const isAdmin = req.params.address === ADMIN.address;
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

// Wallet transactions
app.get('/api/v1/wallet/:address/transactions', (req, res) => {
  const txs = generateTransactions(10).map(tx => ({
    ...tx,
    from: Math.random() > 0.5 ? req.params.address : tx.from,
    to: Math.random() > 0.5 ? req.params.address : tx.to
  }));

  res.json({
    success: true,
    data: {
      transactions: txs,
      total: txs.length
    }
  });
});

// Wallet certificates
app.get('/api/v1/wallet/:address/certificates', (req, res) => {
  res.json({
    success: true,
    data: {
      certificates,
      total_gold_oz: certificates.reduce((sum, c) => sum + c.gold_amount_oz, 0),
      total_gold_grams: certificates.reduce((sum, c) => sum + c.gold_amount_grams, 0)
    }
  });
});

// Wallet transfer (Sensitive - rate limited)
app.post('/api/v1/wallet/transfer', sensitiveLimiter, (req, res) => {
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

// Generate keypair (Admin - rate limited)
app.post('/api/v1/admin/keypair', adminLimiter, (req, res) => {
  res.json({
    success: true,
    data: {
      address: randomHex(64),
      public_key: randomHex(64),
      secret_key: randomHex(64),
      warning: 'NEVER share your secret key! Store it securely.'
    }
  });
});

// ============================================
// STAKING SYSTEM
// ============================================

// Staking state
const stakingPositions = new Map(); // address -> StakingPosition
let globalYieldRate = 0.05; // 5% APY default (flexible staking)
let totalStaked = BigInt(0);
let stakingPoolFees = BigInt(0); // Accumulated fees from marketplace

// Lock period yield bonuses (multipliers on base rate)
const LOCK_PERIOD_BONUSES = {
  0: 1.0,    // Flexible: base rate (5%)
  30: 1.5,   // 30 days: 1.5x (7.5%)
  60: 2.0,   // 60 days: 2x (10%)
  90: 2.5,   // 90 days: 2.5x (12.5%)
};

// StakingPosition structure:
// {
//   stakes: [{ amount, yieldRate, lockPeriod, lockExpiry, stakedAt, accumulatedYield, lastUpdateTime }],
//   totalStaked: string,
//   stakingHistory: []
// }

// Helper: Calculate yield for a single stake based on time elapsed
const calculateStakeYield = (stake) => {
  const now = Date.now();
  const elapsed = (now - stake.lastUpdateTime) / 1000; // seconds
  const annualSeconds = 365 * 24 * 60 * 60;
  const stakedBigInt = BigInt(stake.amount);
  const yieldAmount = (stakedBigInt * BigInt(Math.floor(stake.yieldRate * 10000)) * BigInt(Math.floor(elapsed))) / BigInt(annualSeconds * 10000);
  return yieldAmount;
};

// Helper: Calculate total yield across all stakes
const calculateAccruedYield = (position) => {
  if (!position.stakes || position.stakes.length === 0) {
    // Legacy position format - use old calculation
    const now = Date.now();
    const elapsed = (now - position.lastUpdateTime) / 1000;
    const annualSeconds = 365 * 24 * 60 * 60;
    const stakedBigInt = BigInt(position.stakedAmount || '0');
    return (stakedBigInt * BigInt(Math.floor((position.yieldRate || globalYieldRate) * 10000)) * BigInt(Math.floor(elapsed))) / BigInt(annualSeconds * 10000);
  }

  let totalYield = BigInt(0);
  for (const stake of position.stakes) {
    totalYield += calculateStakeYield(stake) + BigInt(stake.accumulatedYield || '0');
  }
  return totalYield;
};

// Helper: Check if stake is locked
const isStakeLocked = (stake) => {
  if (!stake.lockExpiry) return false;
  return Date.now() < stake.lockExpiry;
};

// Helper: Get unlockable amount
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

// Helper: Get stakes summary
const getStakesSummary = (position) => {
  if (!position.stakes || position.stakes.length === 0) {
    return [{
      amount: position.stakedAmount || '0',
      amountFormatted: (Number(position.stakedAmount || 0) / 1e18).toFixed(6),
      lockPeriod: 0,
      lockExpiry: null,
      isLocked: false,
      yieldRate: position.yieldRate || globalYieldRate,
      yieldRateFormatted: ((position.yieldRate || globalYieldRate) * 100).toFixed(2) + '%',
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
    stakedAt: stake.stakedAt
  }));
};

// Get staking info for address
app.get('/api/v1/staking/:address', (req, res) => {
  const address = req.params.address;
  let position = stakingPositions.get(address);

  if (!position) {
    // Return empty position
    res.json({
      success: true,
      data: {
        address,
        stakedAmount: '0',
        stakedAmountFormatted: '0.00',
        unlockableAmount: '0',
        unlockableAmountFormatted: '0.00',
        lockedAmount: '0',
        lockedAmountFormatted: '0.00',
        baseYieldRate: globalYieldRate,
        baseYieldRateFormatted: (globalYieldRate * 100).toFixed(2) + '%',
        accumulatedYield: '0',
        accumulatedYieldFormatted: '0.00',
        lastUpdateTime: Date.now(),
        stakes: [],
        stakingHistory: [],
        totalStaked: totalStaked.toString(),
        totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
        lockPeriodBonuses: LOCK_PERIOD_BONUSES
      }
    });
    return;
  }

  // Calculate totals
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
      baseYieldRate: globalYieldRate,
      baseYieldRateFormatted: (globalYieldRate * 100).toFixed(2) + '%',
      accumulatedYield: totalYield.toString(),
      accumulatedYieldFormatted: (Number(totalYield) / 1e18).toFixed(6),
      lastUpdateTime: Date.now(),
      stakes: getStakesSummary(position),
      stakingHistory: position.stakingHistory || [],
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
      lockPeriodBonuses: LOCK_PERIOD_BONUSES
    }
  });
});

// Stake tokens (Sensitive - rate limited)
app.post('/api/v1/staking/stake', sensitiveLimiter, (req, res) => {
  const { address, amount, lockPeriod = 0 } = req.body;

  if (!address || !amount) {
    return res.status(400).json({ success: false, error: 'Address and amount required' });
  }

  // Validate lock period
  const validLockPeriods = [0, 30, 60, 90];
  if (!validLockPeriods.includes(lockPeriod)) {
    return res.status(400).json({ success: false, error: 'Invalid lock period. Use 0, 30, 60, or 90 days.' });
  }

  const amountBigInt = BigInt(amount);
  let position = stakingPositions.get(address);

  // Calculate yield rate with lock bonus
  const bonus = LOCK_PERIOD_BONUSES[lockPeriod] || 1.0;
  const effectiveYieldRate = globalYieldRate * bonus;

  // Calculate lock expiry
  const now = Date.now();
  const lockExpiry = lockPeriod > 0 ? now + (lockPeriod * 24 * 60 * 60 * 1000) : null;

  if (!position) {
    position = {
      stakes: [],
      totalStaked: '0',
      stakingHistory: []
    };
  }

  // Ensure stakes array exists (migrate legacy positions)
  if (!position.stakes) {
    position.stakes = [];
    if (position.stakedAmount && BigInt(position.stakedAmount) > 0) {
      // Migrate old stake to new format
      position.stakes.push({
        amount: position.stakedAmount,
        yieldRate: position.yieldRate || globalYieldRate,
        lockPeriod: 0,
        lockExpiry: null,
        stakedAt: position.lastUpdateTime || now,
        accumulatedYield: position.accumulatedYield || '0',
        lastUpdateTime: position.lastUpdateTime || now
      });
    }
  }

  // Add new stake
  const newStake = {
    amount: amount,
    yieldRate: effectiveYieldRate,
    lockPeriod: lockPeriod,
    lockExpiry: lockExpiry,
    stakedAt: now,
    accumulatedYield: '0',
    lastUpdateTime: now
  };
  position.stakes.push(newStake);

  // Update total
  const newTotalStaked = BigInt(position.totalStaked || '0') + amountBigInt;
  position.totalStaked = newTotalStaked.toString();

  // Add to history
  position.stakingHistory.push({
    type: 'stake',
    amount: amount,
    lockPeriod: lockPeriod,
    lockExpiry: lockExpiry,
    yieldRate: effectiveYieldRate,
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
      lockPeriod: lockPeriod,
      lockExpiry: lockExpiry,
      effectiveYieldRate: effectiveYieldRate,
      effectiveYieldRateFormatted: (effectiveYieldRate * 100).toFixed(2) + '%',
      message: lockPeriod > 0
        ? `Tokens staked with ${lockPeriod}-day lock at ${(effectiveYieldRate * 100).toFixed(2)}% APY`
        : 'Tokens staked successfully (flexible)'
    }
  });
});

// Unstake tokens
app.post('/api/v1/staking/unstake', (req, res) => {
  const { address, amount } = req.body;

  if (!address || !amount) {
    return res.status(400).json({ success: false, error: 'Address and amount required' });
  }

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

  // Remove from unlocked stakes (FIFO - oldest first)
  let remainingToUnstake = amountBigInt;
  const now = Date.now();

  if (position.stakes) {
    // Process stakes array
    const newStakes = [];
    for (const stake of position.stakes) {
      if (remainingToUnstake === BigInt(0)) {
        newStakes.push(stake);
        continue;
      }

      if (isStakeLocked(stake)) {
        // Keep locked stakes
        newStakes.push(stake);
        continue;
      }

      // Unlocked stake - can unstake from it
      const stakeAmount = BigInt(stake.amount);
      if (stakeAmount <= remainingToUnstake) {
        // Fully unstake this position
        remainingToUnstake -= stakeAmount;
        // Accrue final yield before removing
        const finalYield = calculateStakeYield(stake);
        if (finalYield > BigInt(0)) {
          position.stakingHistory.push({
            type: 'yield_accrued',
            amount: finalYield.toString(),
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Partially unstake
        const newAmount = stakeAmount - remainingToUnstake;
        stake.amount = newAmount.toString();
        // Accrue yield before partial unstake
        stake.accumulatedYield = (BigInt(stake.accumulatedYield || '0') + calculateStakeYield(stake)).toString();
        stake.lastUpdateTime = now;
        newStakes.push(stake);
        remainingToUnstake = BigInt(0);
      }
    }
    position.stakes = newStakes;
  } else {
    // Legacy format
    const newStakedAmount = BigInt(position.stakedAmount) - amountBigInt;
    position.stakedAmount = newStakedAmount.toString();
    position.lastUpdateTime = now;
  }

  // Update total
  const newTotalStaked = BigInt(position.totalStaked || position.stakedAmount || '0') - amountBigInt;
  position.totalStaked = newTotalStaked.toString();

  position.stakingHistory.push({
    type: 'unstake',
    amount: amount,
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

// Claim yield
app.post('/api/v1/staking/claim', (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, error: 'Address required' });
  }

  let position = stakingPositions.get(address);

  if (!position) {
    return res.status(400).json({ success: false, error: 'No staking position found' });
  }

  // Calculate total yield across all stakes
  const totalYield = calculateAccruedYield(position);

  if (totalYield === BigInt(0)) {
    return res.status(400).json({ success: false, error: 'No yield to claim' });
  }

  // Reset accumulated yield on all stakes
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
    type: 'claim',
    amount: totalYield.toString(),
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

// Admin: Set global yield rate (Admin - rate limited)
app.post('/api/v1/admin/staking/set-rate', adminLimiter, (req, res) => {
  const { rate } = req.body;

  if (rate === undefined || rate < 0 || rate > 1) {
    return res.status(400).json({ success: false, error: 'Rate must be between 0 and 1 (e.g., 0.05 for 5%)' });
  }

  globalYieldRate = rate;

  // Update all positions to new rate (for new calculations)
  stakingPositions.forEach((position, address) => {
    // Accrue at old rate first
    const newYield = calculateAccruedYield(position);
    position.accumulatedYield = (BigInt(position.accumulatedYield) + newYield).toString();
    position.yieldRate = rate;
    position.lastUpdateTime = Date.now();
    stakingPositions.set(address, position);
  });

  res.json({
    success: true,
    data: {
      newRate: rate,
      newRateFormatted: (rate * 100).toFixed(2) + '%',
      message: 'Global yield rate updated'
    }
  });
});

// Admin: Get staking stats
app.get('/api/v1/admin/staking/stats', (req, res) => {
  let totalAccumulatedYield = BigInt(0);

  stakingPositions.forEach((position) => {
    const newYield = calculateAccruedYield(position);
    totalAccumulatedYield += BigInt(position.accumulatedYield) + newYield;
  });

  res.json({
    success: true,
    data: {
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: (Number(totalStaked) / 1e18).toFixed(2),
      totalStakers: stakingPositions.size,
      globalYieldRate: globalYieldRate,
      globalYieldRateFormatted: (globalYieldRate * 100).toFixed(2) + '%',
      totalAccumulatedYield: totalAccumulatedYield.toString(),
      totalAccumulatedYieldFormatted: (Number(totalAccumulatedYield) / 1e18).toFixed(6),
      stakingPoolFees: stakingPoolFees.toString(),
      stakingPoolFeesFormatted: (Number(stakingPoolFees) / 1e18).toFixed(6)
    }
  });
});

// ============================================
// MARKETPLACE SYSTEM
// ============================================

// Mock data storage
const commodities = [
  {
    id: 'CMD001',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    name: 'Premium Arabica Coffee Beans',
    category: 'coffee',
    description: 'High-altitude single origin coffee from Colombian highlands. Cupping score 85+.',
    quantity: 5000,
    unit: 'kg',
    pricePerUnit: '0.45',
    minOrderQuantity: 500,
    origin: 'Colombia',
    certifications: ['Organic Certified', 'Fair Trade', 'Rainforest Alliance'],
    images: [],
    status: 'active',
    views: 234,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-28T14:30:00Z'
  },
  {
    id: 'CMD002',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    name: 'Organic Raw Cotton',
    category: 'cotton',
    description: 'Premium organic cotton, suitable for high-end textile production.',
    quantity: 10000,
    unit: 'kg',
    pricePerUnit: '0.25',
    minOrderQuantity: 1000,
    origin: 'India',
    certifications: ['Organic Certified', 'GOTS'],
    images: [],
    status: 'active',
    views: 189,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-25T11:00:00Z'
  },
  {
    id: 'CMD003',
    supplierId: 'supplier_002',
    supplierName: 'Chile Metals Corp',
    name: 'Grade A Copper Cathode',
    category: 'copper',
    description: 'LME Grade A copper cathode, 99.99% purity. Direct from Chilean mines.',
    quantity: 2500,
    unit: 'MT',
    pricePerUnit: '890',
    minOrderQuantity: 25,
    origin: 'Chile',
    certifications: ['LME Certified', 'ISO 9001'],
    images: [],
    status: 'active',
    views: 98,
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-01-30T10:00:00Z'
  },
  {
    id: 'CMD004',
    supplierId: 'supplier_003',
    supplierName: 'Gulf Oil Trading',
    name: 'Brent Crude Oil',
    category: 'oil',
    description: 'Light sweet crude oil, API gravity 38 degrees.',
    quantity: 50000,
    unit: 'barrel',
    pricePerUnit: '1.05',
    minOrderQuantity: 1000,
    origin: 'UAE',
    certifications: [],
    images: [],
    status: 'active',
    views: 456,
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-29T16:00:00Z'
  }
];

const orders = [
  {
    id: 'ORD-2026-001',
    commodityId: 'CMD001',
    commodityName: 'Premium Arabica Coffee Beans',
    buyerId: 'buyer_001',
    buyerName: 'Global Foods Inc.',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    quantity: 1000,
    unit: 'kg',
    pricePerUnit: '0.45',
    totalPrice: '450',
    lcId: 'LC-2026-001',
    status: 'shipped',
    createdAt: '2026-01-28T10:30:00Z',
    updatedAt: '2026-01-30T14:20:00Z'
  },
  {
    id: 'ORD-2026-002',
    commodityId: 'CMD001',
    commodityName: 'Premium Arabica Coffee Beans',
    buyerId: 'buyer_002',
    buyerName: 'European Traders Ltd.',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    quantity: 2000,
    unit: 'kg',
    pricePerUnit: '0.45',
    totalPrice: '900',
    lcId: 'LC-2026-002',
    status: 'lc_created',
    createdAt: '2026-01-30T09:15:00Z',
    updatedAt: '2026-01-30T09:15:00Z'
  },
  {
    id: 'ORD-2026-003',
    commodityId: 'CMD002',
    commodityName: 'Organic Raw Cotton',
    buyerId: 'buyer_003',
    buyerName: 'TextileCo Asia',
    supplierId: 'supplier_001',
    supplierName: 'Colombian Coffee Exports',
    quantity: 5000,
    unit: 'kg',
    pricePerUnit: '0.25',
    totalPrice: '1250',
    lcId: 'LC-2026-003',
    status: 'customs',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-29T16:45:00Z'
  }
];

const lettersOfCredit = [
  {
    id: 'LC-2026-001',
    orderId: 'ORD-2026-001',
    buyerId: 'buyer_001',
    supplierId: 'supplier_001',
    totalAmount: '450',
    escrowAddress: randomHex(64),
    status: 'in_progress',
    milestones: [
      { stage: 1, name: 'shipment', percentage: 30, amount: '135', status: 'completed', completedAt: '2026-01-30T14:20:00Z', txHash: randomHex(64) },
      { stage: 2, name: 'customs', percentage: 50, amount: '225', status: 'pending' },
      { stage: 3, name: 'delivery', percentage: 20, amount: '90', status: 'pending' }
    ],
    createdAt: '2026-01-28T10:35:00Z'
  },
  {
    id: 'LC-2026-002',
    orderId: 'ORD-2026-002',
    buyerId: 'buyer_002',
    supplierId: 'supplier_001',
    totalAmount: '900',
    escrowAddress: randomHex(64),
    status: 'funded',
    milestones: [
      { stage: 1, name: 'shipment', percentage: 30, amount: '270', status: 'pending' },
      { stage: 2, name: 'customs', percentage: 50, amount: '450', status: 'pending' },
      { stage: 3, name: 'delivery', percentage: 20, amount: '180', status: 'pending' }
    ],
    createdAt: '2026-01-30T09:20:00Z'
  },
  {
    id: 'LC-2026-003',
    orderId: 'ORD-2026-003',
    buyerId: 'buyer_003',
    supplierId: 'supplier_001',
    totalAmount: '1250',
    escrowAddress: randomHex(64),
    status: 'in_progress',
    milestones: [
      { stage: 1, name: 'shipment', percentage: 30, amount: '375', status: 'completed', completedAt: '2026-01-25T10:00:00Z', txHash: randomHex(64) },
      { stage: 2, name: 'customs', percentage: 50, amount: '625', status: 'completed', completedAt: '2026-01-29T16:45:00Z', txHash: randomHex(64) },
      { stage: 3, name: 'delivery', percentage: 20, amount: '250', status: 'pending' }
    ],
    createdAt: '2026-01-20T08:05:00Z'
  }
];

const shipments = [
  {
    id: 'SHP-2026-001',
    orderId: 'ORD-2026-001',
    lcId: 'LC-2026-001',
    commodityName: 'Premium Arabica Coffee Beans',
    buyerName: 'Global Foods Inc.',
    carrier: 'Maersk Line',
    trackingNumber: 'MSKU1234567',
    transportMode: 'sea',
    origin: 'Cartagena, Colombia',
    destination: 'Rotterdam, Netherlands',
    estimatedDelivery: '2026-02-15',
    status: 'in_transit',
    documents: [
      { id: 'DOC001', type: 'bill_of_lading', name: 'Bill of Lading', hash: randomHex(64), uploadedAt: '2026-01-30T14:00:00Z', verifiedAt: '2026-01-30T14:15:00Z' },
      { id: 'DOC002', type: 'certificate_of_origin', name: 'Certificate of Origin', hash: randomHex(64), uploadedAt: '2026-01-30T14:05:00Z' }
    ],
    events: [
      { timestamp: '2026-01-30T14:00:00Z', location: 'Cartagena, Colombia', status: 'shipped', description: 'Goods loaded onto vessel' },
      { timestamp: '2026-01-31T08:00:00Z', location: 'Caribbean Sea', status: 'in_transit', description: 'Vessel departed port' }
    ],
    createdAt: '2026-01-30T13:00:00Z'
  },
  {
    id: 'SHP-2026-002',
    orderId: 'ORD-2026-003',
    lcId: 'LC-2026-003',
    commodityName: 'Organic Raw Cotton',
    buyerName: 'TextileCo Asia',
    carrier: 'DHL Global Forwarding',
    trackingNumber: 'DHL9876543',
    transportMode: 'air',
    origin: 'Mumbai, India',
    destination: 'Shanghai, China',
    estimatedDelivery: '2026-02-05',
    status: 'customs',
    documents: [
      { id: 'DOC003', type: 'bill_of_lading', name: 'Air Waybill', hash: randomHex(64), uploadedAt: '2026-01-25T09:00:00Z', verifiedAt: '2026-01-25T09:30:00Z' },
      { id: 'DOC004', type: 'certificate_of_origin', name: 'Certificate of Origin', hash: randomHex(64), uploadedAt: '2026-01-25T09:15:00Z', verifiedAt: '2026-01-25T09:35:00Z' },
      { id: 'DOC005', type: 'customs_declaration', name: 'Customs Declaration', hash: randomHex(64), uploadedAt: '2026-01-29T16:30:00Z', verifiedAt: '2026-01-29T16:45:00Z' }
    ],
    events: [
      { timestamp: '2026-01-25T09:00:00Z', location: 'Mumbai, India', status: 'shipped', description: 'Cargo departed' },
      { timestamp: '2026-01-26T14:00:00Z', location: 'Shanghai, China', status: 'arrived', description: 'Arrived at destination airport' },
      { timestamp: '2026-01-29T16:45:00Z', location: 'Shanghai, China', status: 'customs', description: 'Customs clearance completed' }
    ],
    createdAt: '2026-01-25T08:00:00Z'
  }
];

const payments = [
  { id: 'PAY001', orderId: 'ORD-2026-001', lcId: 'LC-2026-001', stage: 1, stageName: 'Shipment', amount: '135', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-30T14:20:00Z' },
  { id: 'PAY002', orderId: 'ORD-2026-003', lcId: 'LC-2026-003', stage: 1, stageName: 'Shipment', amount: '375', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-25T10:05:00Z' },
  { id: 'PAY003', orderId: 'ORD-2026-003', lcId: 'LC-2026-003', stage: 2, stageName: 'Customs', amount: '625', status: 'released', txHash: randomHex(64), releasedAt: '2026-01-29T16:50:00Z' }
];

// === COMMODITIES API ===

// List all commodities
app.get('/api/v1/marketplace/commodities', (req, res) => {
  const { category, status, supplier, search } = req.query;
  let filtered = [...commodities];

  if (category) filtered = filtered.filter(c => c.category === category);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (supplier) filtered = filtered.filter(c => c.supplierId === supplier);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s) ||
      c.origin.toLowerCase().includes(s)
    );
  }

  res.json({
    success: true,
    data: {
      commodities: filtered,
      total: filtered.length,
      categories: ['gold', 'coffee', 'oil', 'wheat', 'copper', 'cotton', 'other']
    }
  });
});

// Get single commodity
app.get('/api/v1/marketplace/commodities/:id', (req, res) => {
  const commodity = commodities.find(c => c.id === req.params.id);
  if (!commodity) {
    return res.status(404).json({ success: false, error: 'Commodity not found' });
  }
  // Increment views
  commodity.views++;
  res.json({ success: true, data: commodity });
});

// Create commodity
app.post('/api/v1/marketplace/commodities', (req, res) => {
  const newCommodity = {
    id: 'CMD' + String(commodities.length + 1).padStart(3, '0'),
    ...req.body,
    views: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  commodities.push(newCommodity);
  res.json({ success: true, data: newCommodity });
});

// Update commodity
app.put('/api/v1/marketplace/commodities/:id', (req, res) => {
  const index = commodities.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Commodity not found' });
  }
  commodities[index] = { ...commodities[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: commodities[index] });
});

// Delete commodity
app.delete('/api/v1/marketplace/commodities/:id', (req, res) => {
  const index = commodities.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Commodity not found' });
  }
  commodities.splice(index, 1);
  res.json({ success: true, data: { deleted: true } });
});

// === ORDERS API ===

// List orders
app.get('/api/v1/marketplace/orders', (req, res) => {
  const { buyer, supplier, status } = req.query;
  let filtered = [...orders];

  if (buyer) filtered = filtered.filter(o => o.buyerId === buyer);
  if (supplier) filtered = filtered.filter(o => o.supplierId === supplier);
  if (status) filtered = filtered.filter(o => o.status === status);

  res.json({
    success: true,
    data: {
      orders: filtered,
      total: filtered.length
    }
  });
});

// Get single order
app.get('/api/v1/marketplace/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  const lc = lettersOfCredit.find(l => l.id === order.lcId);
  const shipment = shipments.find(s => s.orderId === order.id);
  res.json({ success: true, data: { ...order, lc, shipment } });
});

// Create order (and LC)
app.post('/api/v1/marketplace/orders', (req, res) => {
  const { commodityId, buyerId, buyerName, quantity } = req.body;
  const commodity = commodities.find(c => c.id === commodityId);

  if (!commodity) {
    return res.status(404).json({ success: false, error: 'Commodity not found' });
  }

  const totalPrice = (parseFloat(commodity.pricePerUnit) * quantity).toFixed(2);
  const orderId = 'ORD-2026-' + String(orders.length + 1).padStart(3, '0');
  const lcId = 'LC-2026-' + String(lettersOfCredit.length + 1).padStart(3, '0');

  const newOrder = {
    id: orderId,
    commodityId,
    commodityName: commodity.name,
    buyerId,
    buyerName,
    supplierId: commodity.supplierId,
    supplierName: commodity.supplierName,
    quantity,
    unit: commodity.unit,
    pricePerUnit: commodity.pricePerUnit,
    totalPrice,
    lcId,
    status: 'lc_created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newLC = {
    id: lcId,
    orderId,
    buyerId,
    supplierId: commodity.supplierId,
    totalAmount: totalPrice,
    escrowAddress: randomHex(64),
    status: 'funded',
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

// Update order status
app.put('/api/v1/marketplace/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  order.status = req.body.status;
  order.updatedAt = new Date().toISOString();
  res.json({ success: true, data: order });
});

// === LETTERS OF CREDIT API ===

// List LCs
app.get('/api/v1/marketplace/lc', (req, res) => {
  const { buyer, supplier, status } = req.query;
  let filtered = [...lettersOfCredit];

  if (buyer) filtered = filtered.filter(l => l.buyerId === buyer);
  if (supplier) filtered = filtered.filter(l => l.supplierId === supplier);
  if (status) filtered = filtered.filter(l => l.status === status);

  res.json({
    success: true,
    data: {
      lettersOfCredit: filtered,
      total: filtered.length
    }
  });
});

// Get LC detail
app.get('/api/v1/marketplace/lc/:id', (req, res) => {
  const lc = lettersOfCredit.find(l => l.id === req.params.id);
  if (!lc) {
    return res.status(404).json({ success: false, error: 'Letter of Credit not found' });
  }
  res.json({ success: true, data: lc });
});

// Complete milestone (release payment)
app.post('/api/v1/marketplace/lc/:id/milestone', (req, res) => {
  const { stage } = req.body;
  const lc = lettersOfCredit.find(l => l.id === req.params.id);

  if (!lc) {
    return res.status(404).json({ success: false, error: 'Letter of Credit not found' });
  }

  const milestone = lc.milestones.find(m => m.stage === stage);
  if (!milestone) {
    return res.status(400).json({ success: false, error: 'Invalid milestone stage' });
  }

  if (milestone.status === 'completed') {
    return res.status(400).json({ success: false, error: 'Milestone already completed' });
  }

  milestone.status = 'completed';
  milestone.completedAt = new Date().toISOString();
  milestone.txHash = randomHex(64);

  // Update LC status
  const allCompleted = lc.milestones.every(m => m.status === 'completed');
  lc.status = allCompleted ? 'completed' : 'in_progress';

  // Update order status
  const order = orders.find(o => o.id === lc.orderId);
  if (order) {
    if (stage === 1) order.status = 'shipped';
    if (stage === 2) order.status = 'customs';
    if (stage === 3) order.status = 'completed';
    order.updatedAt = new Date().toISOString();
  }

  // Create payment record
  const payment = {
    id: 'PAY' + String(payments.length + 1).padStart(3, '0'),
    orderId: lc.orderId,
    lcId: lc.id,
    stage,
    stageName: milestone.name.charAt(0).toUpperCase() + milestone.name.slice(1),
    amount: milestone.amount,
    status: 'released',
    txHash: milestone.txHash,
    releasedAt: milestone.completedAt
  };
  payments.push(payment);

  res.json({
    success: true,
    data: {
      lc,
      payment,
      message: `Milestone ${stage} completed. ${milestone.amount} GOLD released.`
    }
  });
});

// === SHIPMENTS API ===

// List shipments
app.get('/api/v1/marketplace/shipments', (req, res) => {
  const { supplier, buyer, status } = req.query;
  let filtered = [...shipments];

  if (status) filtered = filtered.filter(s => s.status === status);

  res.json({
    success: true,
    data: {
      shipments: filtered,
      total: filtered.length
    }
  });
});

// Get shipment detail
app.get('/api/v1/marketplace/shipments/:id', (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }
  res.json({ success: true, data: shipment });
});

// Create shipment
app.post('/api/v1/marketplace/shipments', (req, res) => {
  const { orderId, carrier, trackingNumber, transportMode, origin, destination, estimatedDelivery } = req.body;

  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const newShipment = {
    id: 'SHP-2026-' + String(shipments.length + 1).padStart(3, '0'),
    orderId,
    lcId: order.lcId,
    commodityName: order.commodityName,
    buyerName: order.buyerName,
    carrier,
    trackingNumber,
    transportMode,
    origin,
    destination,
    estimatedDelivery,
    status: 'shipped',
    documents: [],
    events: [
      { timestamp: new Date().toISOString(), location: origin, status: 'shipped', description: 'Shipment created' }
    ],
    createdAt: new Date().toISOString()
  };

  shipments.push(newShipment);

  // Update order status
  order.status = 'shipped';
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, data: newShipment });
});

// Upload document to shipment
app.post('/api/v1/marketplace/shipments/:id/documents', (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const { type, name } = req.body;
  const doc = {
    id: 'DOC' + String(Math.random()).slice(2, 8),
    type,
    name,
    hash: randomHex(64),
    uploadedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString()
  };

  shipment.documents.push(doc);

  res.json({ success: true, data: doc });
});

// Update shipment status
app.put('/api/v1/marketplace/shipments/:id/status', (req, res) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const { status, location, description } = req.body;
  shipment.status = status;
  shipment.events.push({
    timestamp: new Date().toISOString(),
    location: location || shipment.destination,
    status,
    description: description || `Status updated to ${status}`
  });

  res.json({ success: true, data: shipment });
});

// === PAYMENTS API ===

// List payments
app.get('/api/v1/marketplace/payments', (req, res) => {
  const { supplier, buyer, order } = req.query;
  let filtered = [...payments];

  if (order) filtered = filtered.filter(p => p.orderId === order);

  res.json({
    success: true,
    data: {
      payments: filtered,
      total: filtered.length,
      totalReleased: filtered.filter(p => p.status === 'released').reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)
    }
  });
});

// ============================================
// START SERVER
// ============================================

const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  // Send initial subscription confirmations
  ws.send(JSON.stringify({ type: 'Subscribed', data: { channel: 'blocks' } }));
  ws.send(JSON.stringify({ type: 'Subscribed', data: { channel: 'metrics' } }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'Ping') {
        ws.send(JSON.stringify({ type: 'Pong' }));
      }
    } catch (e) {}
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

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           STTAURX - Mock API Server                      ║');
  console.log('║                    Version 2.0.0                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  console.log('');
  console.log('📊 Features enabled:');
  console.log('   - Blockchain simulation (blocks, transactions)');
  console.log('   - Gold certificates & token minting');
  console.log('   - Staking system with lock periods');
  console.log('   - Marketplace (commodities, orders, shipments)');
  console.log('   - Smart Letters of Credit');
  console.log('');
  console.log('🌐 Applications:');
  console.log('   - Explorer:    http://localhost:3000');
  console.log('   - Mock API:    http://localhost:3001');
  console.log('   - Wallet:      http://localhost:3002');
  console.log('   - Marketplace: http://localhost:3003');
  console.log('');
});
