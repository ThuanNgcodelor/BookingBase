@echo off
setlocal
chcp 65001 >nul

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "JAR=%BACKEND_DIR%\target\booking-system-0.0.1-SNAPSHOT.jar"
set "CLOUDFLARED=C:\Program Files (x86)\cloudflared\cloudflared.exe"
set "TUNNEL_ID=745ab8be-c55c-4e72-b985-d918206ca82f"
set "JAVA_OPTS=-Xms256m -Xmx768m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Dfile.encoding=UTF-8"

echo =======================================================
echo          BOOKINGBASE PRODUCTION START
echo =======================================================
echo.

if not exist "%JAR%" (
  echo [ERROR] Khong tim thay backend jar:
  echo         %JAR%
  echo.
  echo Hay build production truoc bang:
  echo   build-prod.bat
  echo.
  pause
  exit /b 1
)

echo [1/3] Khoi dong database va redis...
docker compose up -d db redis
if errorlevel 1 (
  echo [ERROR] Docker compose khoi dong that bai.
  pause
  exit /b 1
)
echo.

echo [2/3] Khoi dong Spring Boot production jar...
echo       RAM Java: %JAVA_OPTS%
start "BookingBase - Backend PROD" cmd /k "cd /d ""%BACKEND_DIR%"" && java %JAVA_OPTS% -jar ""%JAR%"" --spring.profiles.active=prod"
echo.

echo [3/3] Khoi dong Cloudflare Tunnel...
if exist "%CLOUDFLARED%" (
  start "BookingBase - Tunnel" cmd /k """%CLOUDFLARED%"" tunnel --config ""%ROOT%cloudflared-config.yml"" run %TUNNEL_ID%"
) else (
  echo [WARN] Khong tim thay cloudflared tai:
  echo        %CLOUDFLARED%
  echo        Bo qua tunnel, app van chay local tai http://localhost:8080
)

echo.
echo =======================================================
echo [OK] Production da duoc khoi dong.
echo - Web + API local: http://localhost:8080
echo - Domain qua tunnel: https://cfcbooking.io.vn
echo - API domain qua tunnel: https://api.cfcbooking.io.vn
echo.
echo Luu y:
echo - run.bat khong build va khong npm install de tiet kiem RAM/CPU.
echo - Khi code thay doi, hay chay build-prod.bat truoc roi moi chay run.bat.
echo =======================================================
pause
