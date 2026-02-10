#!/usr/bin/env python3
"""
STTAURX Gold Stablecoin — Start All Services
=============================================
Launches all 4 services in parallel with colored output.

Services:
  Mock Server  → http://localhost:3001  (API backend)
  Explorer     → http://localhost:3000  (Block explorer)
  Wallet       → http://localhost:3002  (Wallet app)
  Marketplace  → http://localhost:3003  (Marketplace)

Admin Panel:   http://localhost:3002/admin
  Login:       admin@sttaurx.io / Admin@STTAURX2026!

Usage:
  python3 start-all.py           # Start all services
  python3 start-all.py --only mock-server wallet  # Start specific services
  Ctrl+C to stop all
"""

import subprocess
import sys
import os
import signal
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()

SERVICES = {
    "mock-server": {
        "dir": BASE_DIR / "mock-server",
        "cmd": ["node", "server.js"],
        "port": 3001,
        "color": "\033[33m",  # Yellow
        "label": "API",
    },
    "explorer": {
        "dir": BASE_DIR / "explorer",
        "cmd": ["npx", "next", "dev", "--port", "3000"],
        "port": 3000,
        "color": "\033[36m",  # Cyan
        "label": "EXPLORER",
    },
    "wallet": {
        "dir": BASE_DIR / "wallet",
        "cmd": ["npx", "next", "dev", "--port", "3002"],
        "port": 3002,
        "color": "\033[35m",  # Magenta
        "label": "WALLET",
    },
    "marketplace": {
        "dir": BASE_DIR / "marketplace",
        "cmd": ["npx", "next", "dev", "-p", "3003"],
        "port": 3003,
        "color": "\033[32m",  # Green
        "label": "MARKET",
    },
}

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

processes: list[subprocess.Popen] = []


def print_banner(selected: list[str]):
    print(f"""
{BOLD}\033[33m╔══════════════════════════════════════════════════════╗
║          STTAURX Gold Stablecoin Platform             ║
╚══════════════════════════════════════════════════════╝{RESET}
""")
    for name in selected:
        svc = SERVICES[name]
        print(f"  {svc['color']}{svc['label']:>10}{RESET}  →  http://localhost:{svc['port']}")
    print(f"\n  {DIM}Admin Panel →  http://localhost:3002/admin{RESET}")
    print(f"  {DIM}Login: admin@sttaurx.io / Admin@STTAURX2026!{RESET}")
    print(f"\n  {DIM}Press Ctrl+C to stop all services{RESET}\n")


def start_service(name: str):
    svc = SERVICES[name]
    label = svc["label"]
    color = svc["color"]

    proc = subprocess.Popen(
        svc["cmd"],
        cwd=svc["dir"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        preexec_fn=os.setsid,
    )
    processes.append(proc)

    import threading

    def stream_output():
        try:
            for line in proc.stdout:
                line = line.rstrip()
                if line:
                    print(f"  {color}[{label:>8}]{RESET} {line}")
        except (ValueError, OSError):
            pass

    t = threading.Thread(target=stream_output, daemon=True)
    t.start()
    return proc


def shutdown(sig=None, frame=None):
    print(f"\n{BOLD}\033[31m  Shutting down all services...{RESET}")
    for proc in processes:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except (ProcessLookupError, OSError):
            pass
    for proc in processes:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
            except (ProcessLookupError, OSError):
                pass
    print(f"  {DIM}All services stopped.{RESET}\n")
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="Start STTAURX services")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=list(SERVICES.keys()),
        help="Start only specific services",
    )
    args = parser.parse_args()

    selected = args.only if args.only else list(SERVICES.keys())

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print_banner(selected)

    # Start mock-server first if selected (other services depend on it)
    if "mock-server" in selected:
        start_service("mock-server")
        import time
        time.sleep(2)  # Give the API a head start

    for name in selected:
        if name != "mock-server":
            start_service(name)

    # Wait for all processes
    try:
        for proc in processes:
            proc.wait()
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
