#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Clean Project ==="
echo "Xoa cac thu muc generated, giu lai source code"
echo

echo "[1/6] Xoa backend/node_modules..."
rm -rf backend/node_modules

echo "[2/6] Xoa frontend/node_modules..."
rm -rf frontend/node_modules

echo "[3/6] Xoa backend/dist..."
rm -rf backend/dist

echo "[4/6] Xoa frontend/dist..."
rm -rf frontend/dist

echo "[5/6] Xoa backend/Database, backups..."
rm -rf backend/Database backend/backups

echo "[6/6] Xoa Deploy folder..."
rm -rf Deploy

echo
echo "=== Clean xong! ==="
echo "Chay './start.sh' de setup lai."
