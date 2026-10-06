[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'

function Wait-Port([int]$Port, [string]$Name, [int]$TimeoutSeconds = 120) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $iar = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(500) -and $tcp.Connected) {
                $tcp.Close()
                Write-Host "[$Name] READY :$Port" -ForegroundColor Green
                return
            }
            $tcp.Close()
        } catch {}
        Start-Sleep -Seconds 1
    }
    throw "$Name non prêt sur le port $Port après $TimeoutSeconds s"
}

function Port-Open([int]$Port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(400) -and $tcp.Connected
        $tcp.Close()
        return $ok
    } catch { return $false }
}

function Start-Server([string]$Name, [string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
    Write-Host "[$Name] lancement..." -ForegroundColor DarkCyan
    $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru
    Write-Host "[$Name] PID=$($process.Id)" -ForegroundColor DarkGray
    return $process
}

$WorldRoot = Split-Path -Parent $PSScriptRoot
$ObsidiaCandidates = @(
    $env:OBSIDIA_SOURCE_REPO,
    (Join-Path (Split-Path -Parent $WorldRoot) 'sources\obsidia-x108-proofs'),
    (Join-Path $env:USERPROFILE 'Desktop\OBSIDIA_WORLDS\sources\obsidia-x108-proofs')
) | Where-Object { $_ } | Select-Object -Unique
$Obsidia = $ObsidiaCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'runtime_terrain_bank_trading_gps\server.kernel.sealed.cjs') } | Select-Object -First 1
if (-not $Obsidia) { throw "Repo Obsidia introuvable. Candidats: $($ObsidiaCandidates -join ' | ')" }

$JarjarCandidates = @(
    $env:OBSIDIA_JARJAR_ROOT,
    (Join-Path $env:USERPROFILE 'Desktop\Jarvis-iron-obsidia-'),
    'C:\Users\User\Desktop\Jarvis-iron-obsidia-'
) | Where-Object { $_ } | Select-Object -Unique
$Jarjar = $JarjarCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'scripts\run_jarjar_live.py') } | Select-Object -First 1
if (-not $Jarjar) { throw "Repo Jarjar introuvable. Candidats: $($JarjarCandidates -join ' | ')" }

$JarjarPythonCandidates = @(
    $env:OBSIDIA_JARJAR_PYTHON,
    (Join-Path $Jarjar '.venv\Scripts\python.exe'),
    (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe')
) | Where-Object { $_ } | Select-Object -Unique
$JarjarPython = $JarjarPythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $JarjarPython) { throw "Python Jarjar introuvable. Candidats: $($JarjarPythonCandidates -join ' | ')" }

$KernelDir = Join-Path $Obsidia 'runtime_terrain_bank_trading_gps'

Write-Host ''
Write-Host '=== JARJAR SERVER ===' -ForegroundColor Cyan
Write-Host "Obsidia: $Obsidia"
Write-Host "Jarjar : $Jarjar"
Write-Host "Python : $JarjarPython"
Write-Host ''

if (-not (Test-Path -LiteralPath (Join-Path $KernelDir 'node_modules\express'))) {
    Write-Host '[1/6] Installation dépendances Kernel (npm ci)...' -ForegroundColor Yellow
    Push-Location $KernelDir
    try { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw "npm ci a échoué avec code $LASTEXITCODE" } }
    finally { Pop-Location }
} else { Write-Host '[1/6] Dépendances Kernel déjà présentes.' -ForegroundColor DarkGray }

if (-not (Port-Open 3001)) {
    Write-Host '[2/6] Démarrage Kernel X108 :3001...' -ForegroundColor Cyan
    $cmd = "Set-Location -LiteralPath '$($KernelDir.Replace("'","''"))'; node .\server.kernel.sealed.cjs"
    Start-Server 'JARJAR - KERNEL X108 - 3001' $cmd
} else { Write-Host '[2/6] Kernel X108 déjà actif.' -ForegroundColor DarkGray }
Wait-Port 3001 'KERNEL X108' 60

$ObsidiaPython = @(
    (Join-Path $Obsidia '.venv\Scripts\python.exe'),
    (Join-Path $Obsidia 'venv\Scripts\python.exe')
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $ObsidiaPython) {
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { throw 'Python Obsidia introuvable.' }
    $ObsidiaPython = $py.Source
}

if (-not (Port-Open 8000)) {
    Write-Host '[3/6] Démarrage API Obsidia/Brody :8000...' -ForegroundColor Cyan
    $cmd = "Set-Location -LiteralPath '$($Obsidia.Replace("'","''"))'; `$env:PYTHONPATH='$($Obsidia.Replace("'","''"))'; `$env:OBSIDIA_KERNEL_URL='http://127.0.0.1:3001/kernel/ragnarok'; & '$($ObsidiaPython.Replace("'","''"))' -m uvicorn apps.obsidia_api.main:app --host 127.0.0.1 --port 8000"
    Start-Server 'JARJAR - OBSIDIA API BRODY - 8000' $cmd
} else { Write-Host '[3/6] API Obsidia/Brody déjà active.' -ForegroundColor DarkGray }
Wait-Port 8000 'OBSIDIA API/BRODY' 120

if (-not (Port-Open 8080)) {
    Write-Host '[4/6] Démarrage Qwen texte :8080...' -ForegroundColor Cyan
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_text.ps1'
    if (-not (Test-Path $launcher)) { throw "Launcher Qwen texte absent: $launcher" }
    $cmd = "Set-Location -LiteralPath '$($Jarjar.Replace("'","''"))'; & '$($launcher.Replace("'","''"))'"
    Start-Server 'JARJAR - QWEN TEXT - 8080' $cmd
} else { Write-Host '[4/6] Qwen texte déjà actif.' -ForegroundColor DarkGray }
Wait-Port 8080 'QWEN TEXT' 600

if (-not (Port-Open 8081)) {
    Write-Host '[5/6] Démarrage Qwen-VL :8081...' -ForegroundColor Cyan
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_vl.ps1'
    if (-not (Test-Path $launcher)) { throw "Launcher Qwen-VL absent: $launcher" }
    $cmd = "Set-Location -LiteralPath '$($Jarjar.Replace("'","''"))'; & '$($launcher.Replace("'","''"))'"
    Start-Server 'JARJAR - QWEN-VL - 8081' $cmd
} else { Write-Host '[5/6] Qwen-VL déjà actif.' -ForegroundColor DarkGray }
Wait-Port 8081 'QWEN-VL' 600

Write-Host ''
Write-Host '====================================================' -ForegroundColor Green
Write-Host '[6/6] SERVEURS READY -> INTERFACE JARJAR' -ForegroundColor Green
Write-Host '====================================================' -ForegroundColor Green
$env:JARJAR_BOUNDED_STRUCTURED_ROUTING_V0='1'
$env:JARJAR_LOCAL_BRODY='1'
$env:JARJAR_OBSIDIA_CHAT_URL='http://127.0.0.1:8000/api/brody/chat'
$env:JARJAR_QWEN_URL='http://127.0.0.1:8080/v1/chat/completions'
$env:JARJAR_VISION_URL='http://127.0.0.1:8081/v1/chat/completions'
$env:JARJAR_KERNEL_URL='http://127.0.0.1:8000'
$env:PYTHONUTF8='1'
$env:PYTHONUNBUFFERED='1'
$env:PYTHONIOENCODING='utf-8'
Set-Location -LiteralPath $Jarjar
& $JarjarPython -m scripts.run_jarjar_live

Write-Host ''
Write-Host "Jarjar terminé. ExitCode=$LASTEXITCODE" -ForegroundColor Yellow
Read-Host 'Entrée pour fermer'