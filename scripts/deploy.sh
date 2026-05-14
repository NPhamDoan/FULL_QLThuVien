#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Deploying Library Management System ==="
echo

cd backend
pnpm run build:deploy

echo
echo "=== Deploy complete! Check the Deploy folder ==="
