@echo off
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
 echo Node.js et npm sont introuvables.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm.cmd ci
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
call npm.cmd run dev -- --open
pause
