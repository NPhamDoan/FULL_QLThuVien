@echo off
echo === Building Library Management System ===
echo.

cd %~dp0..

echo [1/3] Installing backend dependencies...
cd backend
call pnpm install

echo.
echo [2/3] Installing frontend dependencies...
cd ..\frontend
call pnpm install

echo.
echo [3/3] Building...
cd ..\backend
pnpm run build

echo.
echo === Build complete! ===
