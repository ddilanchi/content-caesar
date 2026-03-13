@echo off
title Content Caesar
echo Starting Content Caesar...

:: Start backend
start "Content Caesar - Backend" /min cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Give backend a moment to start
timeout /t 3 /nobreak >nul

:: Start frontend
start "Content Caesar - Frontend" /min cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Give frontend a moment to start
timeout /t 3 /nobreak >nul

:: Open browser
start http://localhost:3000

echo.
echo Content Caesar is running.
echo Close this window to stop both servers.
echo.
pause >nul

:: When this window is closed, kill both servers
taskkill /FI "WINDOWTITLE eq Content Caesar - Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Content Caesar - Frontend" /F >nul 2>&1
