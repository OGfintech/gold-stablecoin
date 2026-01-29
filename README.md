# Gold-Backed Stablecoin Blockchain

A high-performance blockchain for a gold-backed stablecoin with HSBC certificate integration and web-based interfaces.

## Features

- **High Performance**: Target 100,000 TPS with PBFT consensus
- **Gold-Backed**: Every token is backed by physical gold certificates from HSBC
- **Full Suite**: Complete with block explorer and wallet applications
- **Rust Core**: Secure and fast blockchain implementation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER WALLET (Next.js)                   │
│  Balance | Send | Receive | Certificate Status | History    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    BLOCK EXPLORER (Next.js)                  │
│  Dashboard | Blocks | Transactions | Certificates | Admin   │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST + WebSocket
┌─────────────────────────┴───────────────────────────────────┐
│                      API LAYER (Axum)                        │
│  REST Endpoints | WebSocket (real-time) | Authentication    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                   BLOCKCHAIN CORE (Rust)                     │
│  Mempool → Executor → PBFT Consensus → Block Producer       │
│  State Manager | Certificate Registry | Token Ledger        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    STORAGE LAYER                             │
│  In-Memory (DashMap) | RocksDB (persistence) | WAL          │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
gold-stablecoin/
├── crates/
│   ├── core/           # Block, Transaction, Certificate structs
│   ├── crypto/         # Ed25519 signing, Merkle trees, hashing
│   ├── consensus/      # PBFT consensus engine
│   ├── mempool/        # Transaction pool and batching
│   ├── state/          # Account balances, token ledger
│   ├── storage/        # RocksDB, WAL, caching
│   ├── executor/       # Transaction execution (mint, transfer, burn)
│   ├── api/            # REST + WebSocket API (Axum)
│   └── node/           # Main node binary
├── explorer/           # Next.js block explorer
├── wallet/             # Next.js user wallet application
└── scripts/            # Setup and utility scripts
```

## Quick Start

### Prerequisites

- Rust 1.70+ (https://rustup.rs/)
- Node.js 18+ (https://nodejs.org/)
- npm or yarn

### Setup

```bash
# Clone and setup
cd gold-stablecoin
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Running

1. **Start the Node**
   ```bash
   cargo run --release -p gold-node
   ```

2. **Start the Explorer** (in a new terminal)
   ```bash
   cd explorer
   npm run dev
   ```

3. **Start the Wallet** (in a new terminal)
   ```bash
   cd wallet
   npm run dev
   ```

### Access Points

- **Node API**: http://localhost:3001
- **Block Explorer**: http://localhost:3000
- **Wallet**: http://localhost:3002

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/system/metrics` | GET | System metrics (TPS, blocks, etc.) |
| `/api/v1/blocks` | GET | List blocks |
| `/api/v1/blocks/:height` | GET | Get block by height |
| `/api/v1/transactions` | GET | List transactions |
| `/api/v1/transactions` | POST | Submit transaction |
| `/api/v1/certificates` | GET | List certificates |
| `/api/v1/certificates` | POST | Register certificate |
| `/api/v1/tokens/mint` | POST | Mint tokens |
| `/api/v1/tokens/transfer` | POST | Transfer tokens |
| `/api/v1/wallet/:address/balance` | GET | Get wallet balance |
| `/ws` | WS | WebSocket for real-time updates |

## Token Economics

- **Decimals**: 18 (1 token = 10^18 base units)
- **Backing**: 1 token = 1 gram of gold
- **Conversion**: 31.1035 grams = 1 troy ounce

## Security

- Ed25519 signatures for all transactions
- SHA256 hashing throughout
- Merkle trees for transaction verification
- Certificate verification through HSBC

## Testing

```bash
# Run all tests
cargo test

# Run benchmarks
cargo bench

# Run with verbose output
cargo test -- --nocapture
```

## Performance Optimizations

| Strategy | Implementation |
|----------|---------------|
| Transaction batching | 10,000-50,000 tx/block |
| Parallel validation | Rayon for multi-core |
| Ed25519 batch verification | 25% faster |
| DashMap concurrent state | Lock-free reads |
| Write-ahead logging | Async persistence |

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
