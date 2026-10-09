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

function Test-ServicePort {
  param([int]$Port)
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(400) -and $tcp.Connected
    $tcp.Close()
    return $ok
  } catch { return $false }
}

function Resolve-JarjarRoot {
  $candidates = @(
    $env:OBSIDIA_JARJAR_ROOT,
    (Join-Path $env:USERPROFILE 'Desktop\Jarvis-iron-obsidia-github'),
    (Join-Path $env:USERPROFILE 'Desktop\Jarvis-iron-obsidia-'),
    'C:\Users\Aubin\Desktop\Jarvis-iron-obsidia-github',
    'C:\Users\Aubin\Desktop\Jarvis-iron-obsidia-',
    'C:\Users\User\Desktop\Jarvis-iron-obsidia-github',
    'C:\Users\User\Desktop\Jarvis-iron-obsidia-'
  ) | Where-Object { $_ } | Select-Object -Unique
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

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
  'qwen-text' {
    [Console]::Title = 'QWEN TEXT 8080 - LOCAL GGUF'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' QWEN TEXT 8080 - LOCAL GGUF' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    if (Test-ServicePort 8080) {
      Write-Host 'Qwen texte deja actif sur :8080.' -ForegroundColor Green
      while (Test-ServicePort 8080) { Start-Sleep -Seconds 2 }
      return
    }
    $llama = Join-Path $env:USERPROFILE 'Desktop\llama-b11193\llama-server.exe'
    if (-not (Test-Path -LiteralPath $llama)) { throw "llama-server gele introuvable: $llama" }
    $modelCandidates = @(
      $env:OBSIDIA_QWEN_TEXT_MODEL,
      (Join-Path $env:USERPROFILE 'Desktop\MODELS\QWEN\qwen2.5-3b-instruct-q4_k_m.gguf')
    ) | Where-Object { $_ } | Select-Object -Unique
    $model = $modelCandidates | Where-Object {
      if (-not (Test-Path -LiteralPath $_)) { return $false }
      try { (Get-Item -LiteralPath $_).Length -gt 1000000000 } catch { $false }
    } | Select-Object -First 1
    if (-not $model) { throw 'Qwen texte local complet introuvable. Aucun telechargement automatique.' }
    $logDir = Join-Path $env:LOCALAPPDATA 'Obsidia'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $log = Join-Path $logDir 'jarjar_qwen_text_llama.log'
    & $llama -m $model --host 127.0.0.1 --port 8080 -c 4096 --log-file $log --log-verbosity 5 --log-colors off
  }
  'qwen-vl' {
    [Console]::Title = 'QWEN-VL 8081 - VISION LOCAL'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' QWEN-VL 8081 - VISION LOCAL' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
    if (Test-ServicePort 8081) {
      Write-Host 'Qwen-VL deja actif sur :8081.' -ForegroundColor Green
      while (Test-ServicePort 8081) { Start-Sleep -Seconds 2 }
      return
    }
    $jarjar = Resolve-JarjarRoot
    if (-not $jarjar) { throw 'Repo Jarjar introuvable pour Qwen-VL.' }
    $launcher = Join-Path $jarjar 'scripts\start_qwen_vl.ps1'
    if (-not (Test-Path -LiteralPath $launcher)) { throw "Launcher Qwen-VL introuvable: $launcher" }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $launcher
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
