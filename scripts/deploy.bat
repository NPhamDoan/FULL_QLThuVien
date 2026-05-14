@echo off
echo === Deploying Library Management System ===
echo.

cd %~dp0..

cd backend
pnpm run build:deploy

echo.
echo === Deploy complete! Check the Deploy folder ===
