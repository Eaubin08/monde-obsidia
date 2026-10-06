$ErrorActionPreference = 'Stop'

$MONDE = Split-Path -Parent $PSScriptRoot
$X108 = Join-Path (Split-Path -Parent $MONDE) "sources\obsidia-x108-proofs"

if (-not (Test-Path $X108)) {
    $X108 = "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\sources\obsidia-x108-proofs"
}

if (-not (Test-Path $X108)) {
    $X108 = Get-ChildItem "$env:USERPROFILE\Desktop" -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq "obsidia-x108-proofs" -or $_.Name -like "obsidia-x108-proofs_*" } |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $X108 -or -not (Test-Path $X108)) {
    throw "Repo obsidia-x108-proofs introuvable."
}

$RT = Join-Path $X108 "runtime_terrain_bank_trading_gps"
$API = "http://127.0.0.1:8000"

Write-Host "OBSIDIA SOURCE = $X108" -ForegroundColor Cyan

# === 1. KERNEL X108 3001 ===
Start-Process powershell -ArgumentList "-NoExit","-Command","
    [Console]::Title='KERNEL X108 - 3001';
    Set-Location '$RT';
    node .\server.kernel.sealed.cjs
"

Start-Sleep 4

# === 2. API OBSIDIA / BRODY / NATIVE MEMORY 8000 ===
Start-Process powershell -ArgumentList "-NoExit","-Command","
    [Console]::Title='OBSIDIA API + BRODY + NATIVE MEMORY - 8000';
    Set-Location '$X108';
    `$env:PYTHONPATH='$X108';
    `$env:OBSIDIA_KERNEL_URL='http://127.0.0.1:3001/kernel/ragnarok';
    python -m uvicorn apps.obsidia_api.main:app --host 127.0.0.1 --port 8000
"

Start-Sleep 7

# === 3. GPS / DEFENSE / AVIATION ===
Start-Process powershell -ArgumentList "-NoExit","-Command","
    [Console]::Title='GPS DEFENSE AVIATION';
    Set-Location '$X108';
    `$env:PYTHONPATH='$X108';
    `$env:OBSIDIA_API_BASE='$API';
    python .\connectors\aviation_robo.py
"

# === 4. TRADING CONNECTOR X108 ===
Start-Process powershell -ArgumentList "-NoExit","-Command","
    [Console]::Title='TRADING -> X108';
    Set-Location '$X108';
    `$env:PYTHONPATH='$X108';
    `$env:OBSIDIA_API_BASE='$API';
    python .\connectors\trading_live.py
"

# === 5. BRODY ENRICHED ===
Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","
    [Console]::Title='BRODY ENRICHED';
    Set-Location '$X108';
    .\scripts\run_brody_terminal_enriched.ps1 -Base '$API'
"

# === 6. OBSIDURE DRY-RUN ===
Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command","
    [Console]::Title='OBSIDURE';
    Set-Location '$X108';
    .\scripts\run_agent_obsidure.ps1 -DryRun
"

# === 7. MONDE OBSIDIA ===
if (Test-Path $MONDE) {
    Start-Process cmd.exe -ArgumentList "/k","cd /d `"$MONDE`" && DEMARRER.cmd"
} else {
    Write-Warning "Monde Obsidia introuvable : $MONDE"
}

Write-Host ""
Write-Host "=== OBSIDIA LANCE ===" -ForegroundColor Green
Write-Host "Kernel       : http://127.0.0.1:3001/kernel/ragnarok"
Write-Host "API/Brody    : http://127.0.0.1:8000"
Write-Host "Native Memory: integree API/Brody"
Write-Host "GPS          : lance"
Write-Host "Trading      : lance"
Write-Host "Brody        : lance"
Write-Host "Obsidure     : lance en DryRun"
Write-Host "Monde        : lance"
