#!/bin/bash
#
# STTAURX Server Startup Script (macOS/Linux)
# Opens 4 terminal tabs with all servers running
#
# Usage:
#   chmod +x start-servers.sh
#   ./start-servers.sh
#

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           STTAURX Server Startup Script                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - Opening Terminal tabs..."
    echo ""

    # Open Terminal with all 4 tabs
    osascript <<EOF
    tell application "Terminal"
        activate

        -- Tab 1: Mock Server
        do script "echo '═══ MOCK SERVER (Port 3001) ═══' && cd '$SCRIPT_DIR/mock-server' && node server.js"

        -- Tab 2: Explorer
        tell application "System Events" to keystroke "t" using command down
        delay 0.5
        do script "echo '═══ EXPLORER (Port 3000) ═══' && cd '$SCRIPT_DIR/explorer' && npm run dev" in front window

        -- Tab 3: Wallet
        tell application "System Events" to keystroke "t" using command down
        delay 0.5
        do script "echo '═══ WALLET (Port 3002) ═══' && cd '$SCRIPT_DIR/wallet' && npm run dev" in front window

        -- Tab 4: Marketplace
        tell application "System Events" to keystroke "t" using command down
        delay 0.5
        do script "echo '═══ MARKETPLACE (Port 3003) ═══' && cd '$SCRIPT_DIR/marketplace' && npm run dev" in front window
    end tell
EOF

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux - Opening terminal windows..."
    echo ""

    # Try gnome-terminal, then xterm
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="MOCK-SERVER (3001)" -- bash -c "echo '═══ MOCK SERVER ═══' && cd '$SCRIPT_DIR/mock-server' && node server.js; exec bash" &
        sleep 0.3
        gnome-terminal --title="EXPLORER (3000)" -- bash -c "echo '═══ EXPLORER ═══' && cd '$SCRIPT_DIR/explorer' && npm run dev; exec bash" &
        sleep 0.3
        gnome-terminal --title="WALLET (3002)" -- bash -c "echo '═══ WALLET ═══' && cd '$SCRIPT_DIR/wallet' && npm run dev; exec bash" &
        sleep 0.3
        gnome-terminal --title="MARKETPLACE (3003)" -- bash -c "echo '═══ MARKETPLACE ═══' && cd '$SCRIPT_DIR/marketplace' && npm run dev; exec bash" &
    elif command -v xterm &> /dev/null; then
        xterm -title "MOCK-SERVER (3001)" -e "cd '$SCRIPT_DIR/mock-server' && node server.js; bash" &
        xterm -title "EXPLORER (3000)" -e "cd '$SCRIPT_DIR/explorer' && npm run dev; bash" &
        xterm -title "WALLET (3002)" -e "cd '$SCRIPT_DIR/wallet' && npm run dev; bash" &
        xterm -title "MARKETPLACE (3003)" -e "cd '$SCRIPT_DIR/marketplace' && npm run dev; bash" &
    else
        echo "❌ No supported terminal emulator found (gnome-terminal or xterm)"
        exit 1
    fi
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo ""
echo "✅ All servers starting!"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  URLs:                                                    ║"
echo "║    🔐 Security Portal: http://localhost:3000/start        ║"
echo "║    🔍 Explorer:        http://localhost:3000              ║"
echo "║    💰 Wallet:          http://localhost:3002              ║"
echo "║    🛒 Marketplace:     http://localhost:3003              ║"
echo "║    🔌 API:             http://localhost:3001              ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Activate Security Portal:                                ║"
echo "║    • Keyboard: Ctrl+Shift+A                               ║"
echo "║    • Voice:    \"Initialize Protocol OG\"                   ║"
echo "║    • Password: AUTrade88                                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
