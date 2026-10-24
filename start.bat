@echo off
cd /d "%~dp0"
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
if not exist node_modules (
    call npm install
)
start "" "http://localhost:5173"
call npm run dev
