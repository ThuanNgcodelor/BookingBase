@echo off
setlocal
chcp 65001 >nul

set "ROOT=%~dp0"

echo =======================================================
echo          BOOKINGBASE PRODUCTION BUILD
echo =======================================================
echo.

echo [1/2] Build frontend dist...
cd /d "%ROOT%frontend"
call npm.cmd run build
if errorlevel 1 (
  echo [ERROR] Frontend build that bai.
  pause
  exit /b 1
)
echo.

echo [2/2] Build backend jar kem frontend dist...
cd /d "%ROOT%backend"
call mvnw.cmd clean package -DskipTests
if errorlevel 1 (
  echo [ERROR] Backend package that bai.
  pause
  exit /b 1
)
echo.

echo =======================================================
echo [OK] Build production xong.
echo Jar:
echo   %ROOT%backend\target\booking-system-0.0.1-SNAPSHOT.jar
echo.
echo Chay production:
echo   run.bat
echo =======================================================
pause
