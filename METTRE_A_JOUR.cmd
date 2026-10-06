@echo off
cd /d "%~dp0"
git pull --ff-only
if errorlevel 1 (
 echo Mise a jour interrompue. Aucun fichier local n'a ete efface.
 pause
 exit /b 1
)
call npm.cmd ci
if errorlevel 1 (
 echo Installation interrompue.
 pause
 exit /b 1
)
call DEMARRER.cmd
