#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Building Library Management System ==="
echo

echo "[1/3] Installing backend dependencies..."
cd backend
pnpm install

echo
echo "[2/3] Installing frontend dependencies..."
cd ../frontend
pnpm install

echo
echo "[3/3] Building..."
cd ../backend
pnpm run build

echo
echo "=== Build complete! ==="
