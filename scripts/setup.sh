#!/bin/bash

# Gold Stablecoin Setup Script

set -e

echo "======================================"
echo "Gold Stablecoin Blockchain Setup"
echo "======================================"

# Check for Rust
if ! command -v cargo &> /dev/null; then
    echo "Rust is not installed. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm."
    exit 1
fi

echo ""
echo "Building Rust blockchain node..."
cd "$(dirname "$0")/.."
cargo build --release

echo ""
echo "Installing explorer dependencies..."
cd explorer
npm install

echo ""
echo "Installing wallet dependencies..."
cd ../wallet
npm install

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "To start the blockchain:"
echo "  1. Start the node:     cargo run --release -p gold-node"
echo "  2. Start the explorer: cd explorer && npm run dev"
echo "  3. Start the wallet:   cd wallet && npm run dev"
echo ""
echo "Access points:"
echo "  - Node API:    http://localhost:3001"
echo "  - Explorer:    http://localhost:3000"
echo "  - Wallet:      http://localhost:3002"
echo ""
