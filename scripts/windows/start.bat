@echo off
title Stars Law College - Web Server
color 0A
echo.
echo ===================================================
echo     STARS LAW COLLEGE - STARTING SYSTEM
echo ===================================================
echo.

cd ..\..

echo Starting Background Database Services (Docker)...
call npm run dev:infra

echo.
echo Starting Application Engine...
echo (A browser window will open automatically in a few seconds)
echo (DO NOT CLOSE THIS WINDOW)
echo.

:: Open browser after 5 seconds
start "" cmd /c "timeout /t 5 /nobreak > nul && start http://localhost:3000"

:: Start the Next.js and NestJS servers in this window
call npm run dev
