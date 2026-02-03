#!/usr/bin/env python3
"""
STTAURX Server Startup Script
Automatically opens terminal windows for all services.

Usage:
    python3 start-servers.py

Or make executable:
    chmod +x start-servers.py
    ./start-servers.py
"""

import subprocess
import platform
import os
import time

# Configuration - Update these paths if needed
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

SERVERS = [
    {
        "name": "MOCK-SERVER",
        "path": "mock-server",
        "command": "node server.js",
        "port": 3001,
        "color": "yellow"
    },
    {
        "name": "EXPLORER",
        "path": "explorer",
        "command": "npm run dev",
        "port": 3000,
        "color": "green"
    },
    {
        "name": "WALLET",
        "path": "wallet",
        "command": "npm run dev",
        "port": 3002,
        "color": "blue"
    },
    {
        "name": "MARKETPLACE",
        "path": "marketplace",
        "command": "npm run dev",
        "port": 3003,
        "color": "magenta"
    }
]

def get_full_path(relative_path):
    return os.path.join(PROJECT_ROOT, relative_path)

def start_macos():
    """Start servers in separate Terminal.app tabs on macOS"""
    print("🍎 Starting servers on macOS...")

    for i, server in enumerate(SERVERS):
        full_path = get_full_path(server["path"])

        # AppleScript to open new tab and run command
        script = f'''
        tell application "Terminal"
            if {i} = 0 then
                do script "echo '=== {server["name"]} (Port {server["port"]}) ===' && cd \\"{full_path}\\" && {server["command"]}"
            else
                tell application "System Events" to keystroke "t" using command down
                delay 0.5
                do script "echo '=== {server["name"]} (Port {server["port"]}) ===' && cd \\"{full_path}\\" && {server["command"]}" in front window
            end if
            activate
        end tell
        '''

        subprocess.run(["osascript", "-e", script])
        time.sleep(1)  # Wait between tabs
        print(f"  ✅ {server['name']} starting on port {server['port']}")

def start_linux():
    """Start servers in separate gnome-terminal tabs on Linux"""
    print("🐧 Starting servers on Linux...")

    for server in SERVERS:
        full_path = get_full_path(server["path"])
        title = f"{server['name']} (Port {server['port']})"
        cmd = f"cd '{full_path}' && echo '=== {server['name']} ===' && {server['command']}"

        # Try gnome-terminal first, then xterm
        try:
            subprocess.Popen([
                "gnome-terminal",
                f"--title={title}",
                "--",
                "bash", "-c", f"{cmd}; exec bash"
            ])
        except FileNotFoundError:
            try:
                subprocess.Popen([
                    "xterm",
                    "-title", title,
                    "-e", f"bash -c '{cmd}; exec bash'"
                ])
            except FileNotFoundError:
                print(f"  ⚠️ No terminal emulator found. Install gnome-terminal or xterm.")
                return

        print(f"  ✅ {server['name']} starting on port {server['port']}")
        time.sleep(0.5)

def start_windows():
    """Start servers in separate cmd windows on Windows"""
    print("🪟 Starting servers on Windows...")

    for server in SERVERS:
        full_path = get_full_path(server["path"])
        title = f"{server['name']} (Port {server['port']})"

        # Use 'start' command to open new window
        cmd = f'start "{title}" cmd /k "cd /d {full_path} && echo === {server["name"]} === && {server["command"]}"'
        subprocess.Popen(cmd, shell=True)

        print(f"  ✅ {server['name']} starting on port {server['port']}")
        time.sleep(0.5)

def main():
    print("""
╔═══════════════════════════════════════════════════════════╗
║           STTAURX Server Startup Script                   ║
║                                                           ║
║  Starting 4 servers:                                      ║
║    • Mock Server  (API)        - Port 3001               ║
║    • Explorer     (Security)   - Port 3000               ║
║    • Wallet                    - Port 3002               ║
║    • Marketplace               - Port 3003               ║
╚═══════════════════════════════════════════════════════════╝
    """)

    system = platform.system()

    if system == "Darwin":
        start_macos()
    elif system == "Linux":
        start_linux()
    elif system == "Windows":
        start_windows()
    else:
        print(f"❌ Unsupported platform: {system}")
        return

    print("""
╔═══════════════════════════════════════════════════════════╗
║  🚀 All servers starting!                                 ║
║                                                           ║
║  URLs:                                                    ║
║    Security Portal: http://localhost:3000/start ⭐        ║
║    Explorer:        http://localhost:3000                 ║
║    Wallet:          http://localhost:3002                 ║
║    Marketplace:     http://localhost:3003                 ║
║    API:             http://localhost:3001                 ║
║                                                           ║
║  Press Ctrl+Shift+A or say "Initialize Protocol OG"      ║
╚═══════════════════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    main()
