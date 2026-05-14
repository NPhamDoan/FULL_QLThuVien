@echo off
echo === Clean Project ===
echo Xoa cac thu muc generated, giu lai source code
echo.

cd %~dp0..

echo [1/6] Xoa backend\node_modules...
if exist backend\node_modules rmdir /s /q backend\node_modules

echo [2/6] Xoa frontend\node_modules...
if exist frontend\node_modules rmdir /s /q frontend\node_modules

echo [3/6] Xoa backend\dist...
if exist backend\dist rmdir /s /q backend\dist

echo [4/6] Xoa frontend\dist...
if exist frontend\dist rmdir /s /q frontend\dist

echo [5/6] Xoa backend\Database, backups...
if exist backend\Database rmdir /s /q backend\Database
if exist backend\backups rmdir /s /q backend\backups

echo [6/6] Xoa Deploy folder...
if exist Deploy rmdir /s /q Deploy

echo.
echo === Clean xong! ===
echo Chay 'start.bat' de setup lai.
