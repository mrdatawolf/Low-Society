#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  Low Society - Startup"
echo "========================================"

# Check Node.js
echo
echo "[CHECK] Node.js..."
if ! command -v node &>/dev/null; then
    echo "[FAIL]  Node.js not found. Install v18+ from https://nodejs.org/"
    exit 1
fi
NODE_VER=$(node --version)
NODE_MAJOR="${NODE_VER#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "[FAIL]  Node.js v18+ required. Found $NODE_VER"
    exit 1
fi
echo "[OK]    Node.js $NODE_VER"

# Check npm
echo "[CHECK] npm..."
if ! command -v npm &>/dev/null; then
    echo "[FAIL]  npm not found."
    exit 1
fi
echo "[OK]    npm $(npm --version)"

# Server dependencies
echo "[CHECK] Server dependencies..."
if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    echo "[INFO]  Not found - running npm install in server/..."
    (cd "$SCRIPT_DIR/server" && npm install)
fi
echo "[OK]    server/node_modules present"

# Client dependencies
echo "[CHECK] Client dependencies..."
if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
    echo "[INFO]  Not found - running npm install in client/..."
    (cd "$SCRIPT_DIR/client" && npm install)
fi
echo "[OK]    client/node_modules present"

# Port checks (warnings only)
if command -v lsof &>/dev/null; then
    lsof -Pi :3003 -sTCP:LISTEN -t &>/dev/null && echo "[WARN]  Port 3003 already in use - server may fail to start" || true
    lsof -Pi :3004 -sTCP:LISTEN -t &>/dev/null && echo "[WARN]  Port 3004 already in use - client may fail to start" || true
elif command -v ss &>/dev/null; then
    ss -tlnp | grep -q ':3003 ' && echo "[WARN]  Port 3003 already in use" || true
    ss -tlnp | grep -q ':3004 ' && echo "[WARN]  Port 3004 already in use" || true
fi

echo
echo "========================================"
echo "  Checks passed - launching app"
echo "========================================"
echo
echo "  Server  >  http://localhost:3003"
echo "  Client  >  http://localhost:3004"
echo
echo "  Press Ctrl+C to stop both services."
echo

cleanup() {
    echo
    echo "Stopping..."
    kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
    wait "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
    echo "Done."
    exit 0
}
trap cleanup INT TERM

(cd "$SCRIPT_DIR/server" && npm start) &
SERVER_PID=$!

sleep 2

(cd "$SCRIPT_DIR/client" && npm start) &
CLIENT_PID=$!

echo "Open http://localhost:3004 in your browser."

wait "$SERVER_PID" "$CLIENT_PID"
