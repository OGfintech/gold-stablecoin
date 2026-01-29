#!/bin/bash

# ================================================
# Gold Stablecoin - Demo Startup Script
# ================================================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         Gold-Backed Stablecoin Blockchain                ║"
echo "║                   Demo Launcher                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "   Installing mock-server dependencies..."
cd mock-server && npm install --silent 2>/dev/null
cd ..

echo "   Installing explorer dependencies..."
cd explorer && npm install --silent 2>/dev/null
cd ..

echo "   Installing wallet dependencies..."
cd wallet && npm install --silent 2>/dev/null
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""

# Start services
echo "🚀 Starting services..."
echo ""

# Start mock server in background
cd mock-server
node server.js &
MOCK_PID=$!
cd ..

sleep 2

# Start explorer in background
cd explorer
npm run dev &
EXPLORER_PID=$!
cd ..

sleep 2

# Start wallet in background
cd wallet
npm run dev &
WALLET_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Open these URLs in your browser:"
echo ""
echo "   📊 Block Explorer:  http://localhost:3000"
echo "   💰 Wallet:          http://localhost:3002"
echo "   🔌 API:             http://localhost:3001"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $MOCK_PID $EXPLORER_PID $WALLET_PID 2>/dev/null; exit" INT
wait
