[CmdletBinding()]
param(
    [switch]$StatusOnly
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'

function Port-Open([int]$Port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(400) -and $tcp.Connected
        $tcp.Close()
        return $ok
    } catch { return $false }
}

function Get-Json([string]$Url, [int]$TimeoutSeconds = 2) {
    try {
        return Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSeconds -ErrorAction Stop
    } catch { return $null }
}

function Service-Record([string]$Name, [string]$State, [bool]$Required, [string]$Evidence, [hashtable]$Extra = @{}) {
    [pscustomobject](@{ name=$Name; state=$State; required=$Required; evidence=$Evidence } + $Extra)
}

function Assert-ObsidiaApiIdentity([string]$Base) {
    $data = Get-Json "$Base/"
    $ready = $data -and $data.service -eq 'obsidia-api' -and $data.decision_authority -eq 'KX108_ONLY'
    if ($ready) { return Service-Record 'obsidia-api' 'READY' $true 'HTTP_ROOT_OBSIDIA_API_KX108_ONLY' @{ base=$Base; version=$data.version; mode=$data.mode } }
    if ($data) { return Service-Record 'obsidia-api' 'BLOCKED' $true 'BLOCKED_WRONG_SERVICE_IDENTITY' @{ base=$Base; service=$data.service; decision_authority=$data.decision_authority } }
    return Service-Record 'obsidia-api' 'OFFLINE' $true 'HTTP_ROOT_UNAVAILABLE' @{ base=$Base }
}

function Assert-QwenTextIdentity([string]$Base) {
    $data = Get-Json "$Base/models"
    $models = @($data.data)
    $model = $models | Where-Object { "$($_.id) $($_.path)" -match 'qwen' } | Select-Object -First 1
    if ($model) { return Service-Record 'qwen-text' 'READY' $false 'OPENAI_MODELS_QWEN_TEXT' @{ base=$Base; model_id=$model.id; owned_by=$model.owned_by } }
    if ($data) { return Service-Record 'qwen-text' 'BLOCKED' $false 'BLOCKED_WRONG_SERVICE_IDENTITY' @{ base=$Base } }
    return Service-Record 'qwen-text' 'OFFLINE' $false 'OPTIONAL_UNAVAILABLE' @{ base=$Base }
}

function Resolve-Executable([string]$FilePath) {
    if (Test-Path -LiteralPath $FilePath) { return (Resolve-Path -LiteralPath $FilePath).Path }
    $command = Get-Command $FilePath -ErrorAction SilentlyContinue
    if ($command -and $command.Source) { return $command.Source }
    if ($FilePath -ieq 'powershell.exe') {
        $candidate = Join-Path $PSHOME 'powershell.exe'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    throw "Executable introuvable: $FilePath"
}

function Quote-Arg([string]$Value) {
    if ($null -eq $Value) { return '""' }
    $escaped = $Value.Replace('\','\\').Replace('"','\"')
    return '"' + $escaped + '"'
}

function Start-Server([string]$Name, [string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
    Write-Host "[$Name] lancement..." -ForegroundColor DarkCyan
    $resolvedFile = Resolve-Executable $FilePath
    $argLine = (@($Arguments) | Where-Object { $null -ne $_ } | ForEach-Object { Quote-Arg ([string]$_) }) -join ' '
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $resolvedFile
    $psi.Arguments = $argLine
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $process = [System.Diagnostics.Process]::Start($psi)
    if (-not $process) { throw "Impossible de lancer $Name" }
    Write-Host "[$Name] PID=$($process.Id)" -ForegroundColor DarkGray
    return $process
}

function Wait-Service([scriptblock]$Probe, [string]$Name, $Server, [int]$TimeoutSeconds = 120, [switch]$Optional) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $record = & $Probe
        if ($record.state -eq 'READY') { Write-Host "[$Name] READY" -ForegroundColor Green; return $record }
        if ($record.state -eq 'BLOCKED') { if ($Optional) { return $record }; throw "$Name BLOCKED: $($record.evidence)" }
        if ($Server -and $Server.HasExited) { if ($Optional) { return $record }; throw "$Name stopped before ready" }
        Start-Sleep -Seconds 1
    }
    if ($Optional) { return & $Probe }
    throw "$Name not ready after $TimeoutSeconds s"
}

$WorldRoot = Split-Path -Parent $PSScriptRoot
$ObsidiaCandidates = @(
    $env:OBSIDIA_SOURCE_REPO,
    (Join-Path (Split-Path -Parent $WorldRoot) 'sources\obsidia-x108-proofs'),
    (Join-Path $env:USERPROFILE 'Desktop\obsidia-openjarvis-install-v0'),
    (Join-Path $env:USERPROFILE 'Desktop\obsidia-f7-r10-isolated'),
    (Join-Path $env:USERPROFILE 'Desktop\OBSIDIA_WORLDS\sources\obsidia-x108-proofs')
) | Where-Object { $_ } | Select-Object -Unique
$Obsidia = $ObsidiaCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'apps\obsidia_api\main.py') } | Select-Object -First 1
if (-not $Obsidia) { throw "BLOCKED_OBSIDIA_API_SOURCE_MISSING. Candidats: $($ObsidiaCandidates -join ' | ')" }

$JarjarCandidates = @(
    $env:OBSIDIA_JARJAR_ROOT,
    (Join-Path $env:USERPROFILE 'Desktop\Jarvis-iron-obsidia-'),
    'C:\Users\User\Desktop\Jarvis-iron-obsidia-'
) | Where-Object { $_ } | Select-Object -Unique
$Jarjar = $JarjarCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $Jarjar) { throw "BLOCKED_JARJAR_REPO_MISSING. Candidats: $($JarjarCandidates -join ' | ')" }
$JarjarEntrypoint = Join-Path $Jarjar 'scripts\run_jarjar_live.py'

$JarjarPythonCandidates = @(
    $env:OBSIDIA_JARJAR_PYTHON,
    (Join-Path $Jarjar '.venv\Scripts\python.exe'),
    (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe')
) | Where-Object { $_ } | Select-Object -Unique
$JarjarPython = $JarjarPythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $JarjarPython) { throw "BLOCKED_JARJAR_PYTHON_MISSING. Candidats: $($JarjarPythonCandidates -join ' | ')" }

$KernelRequired = $env:OBSIDIA_JARJAR_REQUIRE_KERNEL -eq '1'
$KernelDir = Join-Path $Obsidia 'runtime_terrain_bank_trading_gps'
$KernelScript = Join-Path $KernelDir 'server.kernel.sealed.cjs'
$KernelRecord = if (Port-Open 3001) { Service-Record 'kernel-x108' 'READY' $KernelRequired 'PORT_3001_OBSERVED_KERNEL_CONTRACT' @{ port=3001 } } elseif ($KernelRequired) { Service-Record 'kernel-x108' 'BLOCKED' $true 'KERNEL_REQUIRED_BUT_OFFLINE' @{ port=3001 } } else { Service-Record 'kernel-x108' 'OPTIONAL_OFFLINE' $false 'OPTIONAL_NOT_REQUIRED_FOR_R12_PREPARE' @{ port=3001 } }
$ApiBase = ($env:OBSIDIA_API_BASE, 'http://127.0.0.1:8000' | Where-Object { $_ } | Select-Object -First 1).TrimEnd('/')
$QwenBase = ($env:JARJAR_QWEN_BASE, 'http://127.0.0.1:8080/v1' | Where-Object { $_ } | Select-Object -First 1).TrimEnd('/')
$ApiRecord = Assert-ObsidiaApiIdentity $ApiBase
$QwenRecord = Assert-QwenTextIdentity $QwenBase
$VisionRecord = if (Port-Open 8081) { Service-Record 'qwen-vl' 'READY' $false 'PORT_8081_OBSERVED_OPTIONAL' @{ port=8081 } } else { Service-Record 'qwen-vl' 'OPTIONAL_OFFLINE' $false 'OPTIONAL_NOT_REQUIRED' @{ port=8081 } }
$EntrypointRecord = if (Test-Path -LiteralPath $JarjarEntrypoint) { Service-Record 'jarjar-entrypoint' 'READY' $true 'RUN_JARJAR_LIVE_PRESENT' @{ path=$JarjarEntrypoint } } else { Service-Record 'jarjar-entrypoint' 'BLOCKED' $true 'RUN_JARJAR_LIVE_MISSING' @{ path=$JarjarEntrypoint } }
$records = @($KernelRecord,$ApiRecord,$QwenRecord,$VisionRecord,$EntrypointRecord)
$blocked = @($records | Where-Object { $_.state -eq 'BLOCKED' -and ($_.required -or $_.name -in @('obsidia-api','qwen-text')) })
$overall = if ($blocked.Count) { 'BLOCKED' } elseif ($records | Where-Object { $_.state -like '*OFFLINE' }) { 'PARTIAL' } else { 'READY' }

Write-Host ''
Write-Host '=== JARJAR RUNTIME ALIGNMENT J1 ===' -ForegroundColor Cyan
Write-Host "Obsidia: $Obsidia"
Write-Host "Jarjar : $Jarjar"
Write-Host "Python : $JarjarPython"
foreach ($record in $records) {
    $color = if ($record.state -eq 'READY') { 'Green' } elseif ($record.state -eq 'BLOCKED') { 'Red' } else { 'Yellow' }
    Write-Host ("{0}: {1} [{2}]" -f $record.name,$record.state,$record.evidence) -ForegroundColor $color
}
Write-Host "OVERALL: $overall" -ForegroundColor $(if ($overall -eq 'READY') {'Green'} elseif ($overall -eq 'BLOCKED') {'Red'} else {'Yellow'})

if ($StatusOnly) { return }
if ($blocked.Count) { throw "JARJAR_RUNTIME_BLOCKED: $($blocked.evidence -join ', ')" }

$apiServer = $null
if ($ApiRecord.state -ne 'READY') {
    Write-Host '[API] Demarrage Obsidia/Brody :8000...' -ForegroundColor Cyan
    $ObsidiaPython = @((Join-Path $Obsidia '.venv\Scripts\python.exe'), (Join-Path $Obsidia 'venv\Scripts\python.exe')) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $ObsidiaPython) { $py = Get-Command python -ErrorAction SilentlyContinue; if (-not $py) { throw 'Python Obsidia introuvable.' }; $ObsidiaPython = $py.Source }
    $env:PYTHONPATH = $Obsidia
    if ($KernelRecord.state -eq 'READY') { $env:OBSIDIA_KERNEL_URL = 'http://127.0.0.1:3001/kernel/ragnarok' }
    $apiServer = Start-Server 'OBSIDIA API/BRODY' $ObsidiaPython @('-m','uvicorn','apps.obsidia_api.main:app','--host','127.0.0.1','--port','8000') $Obsidia
    $ApiRecord = Wait-Service { Assert-ObsidiaApiIdentity $ApiBase } 'OBSIDIA API/BRODY' $apiServer 120
}

if ($QwenRecord.state -eq 'OFFLINE') {
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_text.ps1'
    if (Test-Path -LiteralPath $launcher) {
        $qwenServer = Start-Server 'QWEN TEXT' 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$launcher) $Jarjar
        $QwenRecord = Wait-Service { Assert-QwenTextIdentity $QwenBase } 'QWEN TEXT' $qwenServer 20 -Optional
    } else {
        Write-Host "[QWEN TEXT] PARTIAL: launcher absent, service optionnel non lancé: $launcher" -ForegroundColor Yellow
    }
}

if ($KernelRequired -and $KernelRecord.state -ne 'READY') {
    if (-not (Test-Path -LiteralPath $KernelScript)) { throw "KERNEL_REQUIRED_BUT_SCRIPT_MISSING: $KernelScript" }
    $kernelServer = Start-Server 'KERNEL X108' 'node.exe' @('.\server.kernel.sealed.cjs') $KernelDir
    $KernelRecord = Wait-Service { if (Port-Open 3001) { Service-Record 'kernel-x108' 'READY' $true 'PORT_3001_OBSERVED_KERNEL_CONTRACT' @{ port=3001 } } else { Service-Record 'kernel-x108' 'OFFLINE' $true 'KERNEL_REQUIRED_BUT_OFFLINE' @{ port=3001 } } } 'KERNEL X108' $kernelServer 60
}

if (-not (Test-Path -LiteralPath $JarjarEntrypoint)) { throw "JARJAR_BLOCKED_RUN_JARJAR_LIVE_MISSING: $JarjarEntrypoint" }

Write-Host ''
Write-Host '====================================================' -ForegroundColor Green
Write-Host '[J1] RUNTIME ALIGNMENT READY -> INTERFACE JARJAR' -ForegroundColor Green
Write-Host '====================================================' -ForegroundColor Green
$env:JARJAR_BOUNDED_STRUCTURED_ROUTING_V0='1'
$env:JARJAR_LOCAL_BRODY='1'
$env:JARJAR_OBSIDIA_CHAT_URL="$ApiBase/api/brody/chat"
$env:JARJAR_QWEN_URL="$QwenBase/chat/completions"
$env:JARJAR_VISION_URL='http://127.0.0.1:8081/v1/chat/completions'
$env:JARJAR_KERNEL_URL=$ApiBase
$env:PYTHONUTF8='1'
$env:PYTHONUNBUFFERED='1'
$env:PYTHONIOENCODING='utf-8'
Set-Location -LiteralPath $Jarjar
& $JarjarPython -m scripts.run_jarjar_live

Write-Host ''
Write-Host "Jarjar termine. ExitCode=$LASTEXITCODE" -ForegroundColor Yellow
Read-Host 'Entree pour fermer'
