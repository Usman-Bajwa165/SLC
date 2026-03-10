@echo off
title Stars Law College - System Setup
color 0B
echo.
echo ===================================================
echo     STARS LAW COLLEGE - INITIAL SYSTEM SETUP
echo ===================================================
echo.
echo Please ensure Docker Desktop is OPEN and RUNNING.
pause

echo.
echo [1/4] Installing Required Core Dependencies...
cd ..\..
call npm install
if %errorlevel% neq 0 (
    echo.
    color 0C
    echo ERROR: Failed to install Node.js dependencies.
    echo Please ensure Node.js is installed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Initializing Background Database Engines...
call npm run dev:infra
timeout /t 5 /nobreak > nul

echo.
echo [3/4] Preparing Database Schema...
call npx prisma generate
call npx prisma db push --accept-data-loss

echo.
echo [4/4] Setup Complete!
echo.
color 0A
echo ===================================================
echo   SYSTEM IS READY!
echo   You can now close this window and use the
echo   "Start SLC System" shortcut to launch the app.
echo ===================================================
echo.
pause
