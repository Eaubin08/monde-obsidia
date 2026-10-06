param(
  [Parameter(Mandatory=$true)][string]$Service,
  [Parameter(Mandatory=$true)][string]$Root
)
$ErrorActionPreference = 'Continue'

chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
$env:PYTHONUNBUFFERED = '1'
$env:OBSIDIA_TERMINAL_COLOR = '1'
$env:OBSIDURE_COLOR = '1'
$Api = 'http://127.0.0.1:8000'

function Write-ServiceLine {
  param([string]$Line,[string]$Kind)
  if ($null -eq $Line) { return }
  switch ($Kind) {
    'api' {
      if ($Line -match 'ERROR|Traceback|Exception|failed|FAIL') { Write-Host $Line -ForegroundColor Red }
      elseif ($Line -match 'WARNING|WARN') { Write-Host $Line -ForegroundColor Yellow }
      elseif ($Line -match 'Started|Application startup complete|Uvicorn running|200 OK|INFO') { Write-Host $Line -ForegroundColor Green }
      else { Write-Host $Line -ForegroundColor Gray }
    }
    'gps' {
      if ($Line -match 'ERROR|Connection error|BLOCK|FAIL') { Write-Host $Line -ForegroundColor Red }
      elseif ($Line -match 'HOLD|WARNING|WARN|Accumulation') { Write-Host $Line -ForegroundColor Yellow }
      elseif ($Line -match 'ALLOW|PASS|READY|OK') { Write-Host $Line -ForegroundColor Green }
      else { Write-Host $Line -ForegroundColor Blue }
    }
    'trading' {
      if ($Line -match 'ERROR|Connection error|BLOCK|FAIL') { Write-Host $Line -ForegroundColor Red }
      elseif ($Line -match 'HOLD|WARNING|WARN|Accumulation') { Write-Host $Line -ForegroundColor Yellow }
      elseif ($Line -match 'ALLOW|PASS|READY|OK') { Write-Host $Line -ForegroundColor Green }
      else { Write-Host $Line -ForegroundColor Magenta }
    }
    default { Write-Host $Line }
  }
}

Set-Location -LiteralPath $Root

switch ($Service) {
  'obsidia-api' {
    [Console]::Title = 'OBSIDIA API 8000 - LIVE KERNEL BRIDGE'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' OBSIDIA API 8000 - LIVE KERNEL BRIDGE' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "Root   : $Root" -ForegroundColor DarkGray
    Write-Host 'Kernel : http://127.0.0.1:3001/kernel/ragnarok' -ForegroundColor DarkGray
    Write-Host ''
    $env:PYTHONPATH = $Root
    $env:OBSIDIA_KERNEL_URL = 'http://127.0.0.1:3001/kernel/ragnarok'
    & cmd.exe /d /s /c "python -m uvicorn apps.obsidia_api.main:app --host 127.0.0.1 --port 8000 2>&1" | ForEach-Object { Write-ServiceLine ([string]$_) 'api' }
  }
  'gps-defense' {
    [Console]::Title = 'GPS/AVIATION LIVE -> KERNEL BRIDGE'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Blue
    Write-Host ' GPS / AVIATION LIVE -> KERNEL BRIDGE' -ForegroundColor Blue
    Write-Host '============================================================' -ForegroundColor Blue
    Write-Host "API : $Api" -ForegroundColor DarkGray
    Write-Host ''
    $env:PYTHONPATH = $Root
    $env:OBSIDIA_API_BASE = $Api
    & python .\connectors\aviation_robo.py 2>&1 | ForEach-Object { Write-ServiceLine ([string]$_) 'gps' }
  }
  'trading-x108' {
    [Console]::Title = 'TRADING LIVE -> KERNEL BRIDGE'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Magenta
    Write-Host ' TRADING LIVE -> KERNEL BRIDGE' -ForegroundColor Magenta
    Write-Host '============================================================' -ForegroundColor Magenta
    Write-Host "API : $Api" -ForegroundColor DarkGray
    Write-Host ''
    $env:PYTHONPATH = $Root
    $env:OBSIDIA_API_BASE = $Api
    & python .\connectors\trading_live.py 2>&1 | ForEach-Object { Write-ServiceLine ([string]$_) 'trading' }
  }
  'brody-enriched' {
    [Console]::Title = 'BRODY ENRICHED'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' BRODY ENRICHED' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host "API : $Api" -ForegroundColor DarkGray
    Write-Host ''
    & .\scripts\run_brody_terminal_enriched.ps1 -Base $Api
  }
  'obsidure-dry' {
    [Console]::Title = 'OBSIDURE - DRY RUN'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' OBSIDURE - DRY RUN' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host 'Kernel authority : KX108_ONLY' -ForegroundColor Yellow
    Write-Host ''
    & .\scripts\run_agent_obsidure.ps1 -DryRun
  }
  default { throw "Service non supporte: $Service" }
}
