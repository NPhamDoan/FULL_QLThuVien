@echo off
echo === Thu Vien Management System ===
echo.

echo [1/3] Installing backend dependencies...
cd backend
call pnpm install

echo.
echo [2/3] Installing frontend dependencies...
cd ..\frontend
call pnpm install

echo.
echo [3/3] Starting backend + frontend...
cd ..\backend
pnpm run dev:all
