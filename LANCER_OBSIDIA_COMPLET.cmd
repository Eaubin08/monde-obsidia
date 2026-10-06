@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-obsidia-kept.ps1"
set "obsidiaExit=%errorlevel%"
if not "%obsidiaExit%"=="0" pause
exit /b %obsidiaExit%
