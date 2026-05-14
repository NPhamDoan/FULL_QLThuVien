const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = path.join(__dirname, '..', 'Deploy');

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || path.join(__dirname, '..') });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('=== Building Library Management System ===\n');

// 1. Install dependencies
console.log('[1/5] Installing backend dependencies...');
run('pnpm install', path.join(__dirname, '..', 'backend'));

console.log('\n[2/5] Installing frontend dependencies...');
run('pnpm install', path.join(__dirname, '..', 'frontend'));

// 3. Build backend
console.log('\n[3/5] Building backend...');
run('npx tsc', path.join(__dirname, '..', 'backend'));

// 4. Build frontend
console.log('\n[4/5] Building frontend...');
run('pnpm run build', path.join(__dirname, '..', 'frontend'));

// 5. Clean and create Deploy folder
console.log('\n[5/5] Creating Deploy folder...');
if (fs.existsSync(DEPLOY_DIR)) {
  try {
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  } catch (err) {
    console.error(`\nERROR: Cannot delete Deploy folder.`);
    console.error(`Make sure no terminal, explorer, or process is open inside "${DEPLOY_DIR}"`);
    console.error(`Then try again.\n`);
    process.exit(1);
  }
}
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

// Copy backend/dist/ (backend compiled)
copyDir(path.join(__dirname, '..', 'backend', 'dist'), path.join(DEPLOY_DIR, 'backend', 'dist'));

// Copy frontend/dist/ 
fs.mkdirSync(path.join(DEPLOY_DIR, 'frontend'), { recursive: true });
copyDir(path.join(__dirname, '..', 'frontend', 'dist'), path.join(DEPLOY_DIR, 'frontend', 'dist'));

// Copy package.json + package-lock.json (production only)
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'package.json'), 'utf-8'));
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'backend/dist/index.js',
  scripts: {
    start: 'node --no-deprecation backend/dist/index.js',
    seed: 'node backend/dist/seed.js',
  },
  dependencies: pkg.dependencies,
};
fs.writeFileSync(path.join(DEPLOY_DIR, 'package.json'), JSON.stringify(prodPkg, null, 2));

if (fs.existsSync(path.join(__dirname, '..', 'backend', 'package-lock.json'))) {
  fs.copyFileSync(
    path.join(__dirname, '..', 'backend', 'package-lock.json'),
    path.join(DEPLOY_DIR, 'package-lock.json')
  );
}

// Create start scripts

// Windows batch file
fs.writeFileSync(path.join(DEPLOY_DIR, 'start.bat'),
`@echo off
echo === Thu Vien Management System ===
echo.

if not exist node_modules (
  echo Installing dependencies...
  call pnpm install --prod
  echo.
)

echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop
echo.
node --no-deprecation backend/dist/index.js
`);
fs.writeFileSync(path.join(DEPLOY_DIR, 'start.sh'),
`#!/bin/bash
echo "=== Thu Vien Management System ==="
echo

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install --prod
  echo
fi

echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo
node --no-deprecation backend/dist/index.js
`);

// README
fs.writeFileSync(path.join(DEPLOY_DIR, 'README.txt'),
`=== Hệ thống Quản lý Thư viện ===

YÊU CẦU: Node.js >= 18

CÁCH CHẠY:
  Windows: click đúp start.bat
  Linux/Mac: chmod +x start.sh && ./start.sh

Hoặc chạy thủ công:
  pnpm install --prod
  pnpm run seed    (tạo data mẫu, chỉ lần đầu)
  pnpm start

Mở trình duyệt: http://localhost:3000

TÀI KHOẢN MẪU:
  Thủ thư:       thuthu / 123456
  Quản trị viên: admin / 123456
`);

console.log('\n=== Build complete! ===');
console.log(`Deploy folder: ${DEPLOY_DIR}`);
console.log('Copy folder "Deploy" cho người khác, chạy start.bat (Windows) hoặc start.sh (Linux/Mac)');
