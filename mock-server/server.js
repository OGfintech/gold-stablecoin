const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

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

// Mint tokens
app.post('/api/v1/tokens/mint', (req, res) => {
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

// Wallet transfer
app.post('/api/v1/wallet/transfer', (req, res) => {
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

// Generate keypair
app.post('/api/v1/admin/keypair', (req, res) => {
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
  console.log('║         Gold Stablecoin - Mock API Server                ║');
  console.log('║                    Version 1.0.0                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  console.log('');
  console.log('📊 Simulating blockchain with:');
  console.log('   - Block production every 1 second');
  console.log('   - 100-500 transactions per block');
  console.log('   - 3 gold certificates registered');
  console.log('   - Real-time WebSocket updates');
  console.log('');
  console.log('🌐 Next steps:');
  console.log('   1. Open new terminal: cd explorer && npm run dev');
  console.log('   2. Open new terminal: cd wallet && npm run dev');
  console.log('   3. Open http://localhost:3000 (Explorer)');
  console.log('   4. Open http://localhost:3002 (Wallet)');
  console.log('');
});
