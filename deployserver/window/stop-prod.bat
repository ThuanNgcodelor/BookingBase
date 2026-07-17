@echo off
setlocal
chcp 65001 >nul

echo =======================================================
echo          BOOKINGBASE PRODUCTION STOP
echo =======================================================
echo.

echo [1/2] Tat cac cua so BookingBase production neu con mo...
taskkill /FI "WINDOWTITLE eq BookingBase - Backend PROD*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq BookingBase - Tunnel*" /T /F >nul 2>nul
echo.

echo [2/2] Dung database va redis container...
docker compose stop db redis
echo.

echo =======================================================
echo [OK] Da gui lenh dung production.
echo =======================================================
pause
