@echo off
REM TranzartX one-click dev server launcher.
REM Double-click this file. A black window stays open running the server.
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Install it from https://nodejs.org, then try again.
  pause
  exit /b 1
)

echo ============================================
echo  TranzartX dev server
echo ============================================
echo  Freeing port 3000 if a leftover server holds it...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { taskkill /F /PID $_.OwningProcess }" >nul 2>&1
echo  Clearing stale build cache (OneDrive corrupts it — always rebuild fresh)...
if exist .next rmdir /s /q .next
echo  Starting... wait for the "Ready" line below, then open:
echo    http://127.0.0.1:3000
echo  First load takes ~1 minute while pages compile. Be patient,
echo  then hard-refresh once with Ctrl+Shift+R if styling looks off.
echo  Run this file only ONCE (a second copy breaks pages).
echo ============================================
start "" /min cmd /c "timeout /t 45 /nobreak >nul & start http://127.0.0.1:3000"
npm run dev
echo.
echo  Server stopped. Press any key to close.
pause >nul
