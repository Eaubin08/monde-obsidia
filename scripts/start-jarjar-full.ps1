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
    throw "$Name non pret sur le port $Port apres $TimeoutSeconds s"
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

function Resolve-LlamaExecutable {
    foreach ($name in @('llama-server','llama')) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source) { return $cmd.Source }
    }

    $roots = @(
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'),
        (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'),
        (Join-Path $env:USERPROFILE 'AppData\Local\Microsoft\WinGet\Links'),
        (Join-Path $env:USERPROFILE 'AppData\Local\Microsoft\WinGet\Packages'),
        'C:\Users\User\AppData\Local\Microsoft\WinGet\Links',
        'C:\Users\User\AppData\Local\Microsoft\WinGet\Packages'
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

    foreach ($root in $roots) {
        foreach ($name in @('llama-server.exe','llama.exe')) {
            try {
                $hit = Get-ChildItem -LiteralPath $root -Filter $name -File -Recurse -ErrorAction SilentlyContinue |
                    Select-Object -First 1 -ExpandProperty FullName
                if ($hit) { return $hit }
            } catch {}
        }
    }
    return $null
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


function Wait-Service([int]$Port, [string]$Name, $Server, [int]$TimeoutSeconds = 120, [switch]$Optional) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Port-Open $Port) {
            Write-Host "[$Name] READY :$Port" -ForegroundColor Green
            return $true
        }
        if ($Server -and $Server.HasExited) {
            if ($Optional) {
                Write-Host "[$Name] process exited before port $Port opened." -ForegroundColor Yellow
                return $false
            }
            throw "$Name stopped before opening port $Port"
        }
        Start-Sleep -Seconds 1
    }
    if ($Optional) {
        Write-Host "[$Name] timeout - continuing without this optional service." -ForegroundColor Yellow
        return $false
    }
    throw "$Name not ready on port $Port after $TimeoutSeconds s"
}


function Start-OptionalService([int]$Port, [string]$Name, $Server, [int]$ProbeSeconds = 4) {
    $deadline = (Get-Date).AddSeconds($ProbeSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Port-Open $Port) {
            Write-Host "[$Name] READY :$Port" -ForegroundColor Green
            return 'READY'
        }
        if ($Server -and $Server.HasExited) {
            Write-Host "[$Name] OFFLINE - process exited before port $Port opened." -ForegroundColor Yellow
            return 'OFFLINE'
        }
        Start-Sleep -Milliseconds 500
    }
    Write-Host "[$Name] STARTING :$Port - Jarjar continue pendant le chargement." -ForegroundColor Cyan
    return 'STARTING'
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

$LlamaExecutable = Resolve-LlamaExecutable
if ($LlamaExecutable) {
    $LlamaDir = Split-Path -Parent $LlamaExecutable
    if (($env:PATH -split ';') -notcontains $LlamaDir) {
        $env:PATH = "$LlamaDir;$env:PATH"
    }
}


Write-Host ''
Write-Host '=== JARJAR SERVER ===' -ForegroundColor Cyan
Write-Host "Obsidia: $Obsidia"
Write-Host "Jarjar : $Jarjar"
Write-Host "Python : $JarjarPython"
if ($LlamaExecutable) {
    Write-Host "llama  : $LlamaExecutable" -ForegroundColor Green
} else {
    Write-Host "llama  : INTROUVABLE (Qwen restera optionnel)" -ForegroundColor Yellow
}
Write-Host ''

if (-not (Test-Path -LiteralPath (Join-Path $KernelDir 'node_modules\express'))) {
    Write-Host '[1/6] Installation dependances Kernel (npm ci)...' -ForegroundColor Yellow
    Push-Location $KernelDir
    try { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw "npm ci a echoue avec code $LASTEXITCODE" } }
    finally { Pop-Location }
} else { Write-Host '[1/6] Dependances Kernel deja presentes.' -ForegroundColor DarkGray }

if (-not (Port-Open 3001)) {
    Write-Host '[2/6] Kernel X108 OFFLINE :3001' -ForegroundColor Red
    Write-Host 'Lance Kernel depuis Monde > Workspace > Lancements pour ouvrir le terminal colore valide.' -ForegroundColor Yellow
    throw 'Kernel X108 doit etre lance depuis Monde avant Jarjar.'
}
Write-Host '[2/6] Kernel X108 deja actif. Reutilisation de :3001.' -ForegroundColor Green
$null = Wait-Service 3001 'KERNEL X108' $null 10

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
    Write-Host '[3/6] API Obsidia/Brody OFFLINE :8000' -ForegroundColor Red
    Write-Host 'Lance API depuis Monde > Workspace > Lancements pour ouvrir le terminal colore valide.' -ForegroundColor Yellow
    throw 'API Obsidia/Brody doit etre lancee depuis Monde avant Jarjar.'
}
Write-Host '[3/6] API Obsidia/Brody deja active. Reutilisation de :8000.' -ForegroundColor Green
$null = Wait-Service 8000 'OBSIDIA API/BRODY' $null 10

$qwenServer = $null
$qwenReady = $true
$obsidiaLocal = Join-Path $env:LOCALAPPDATA 'Obsidia'
New-Item -ItemType Directory -Path $obsidiaLocal -Force | Out-Null
$qwenTextLog = Join-Path $obsidiaLocal 'jarjar_qwen_text.log'

if (-not (Port-Open 8080)) {
    Write-Host '[4/6] Demarrage Qwen texte :8080...' -ForegroundColor Cyan
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_text.ps1'
    if (-not (Test-Path $launcher)) { throw "Launcher Qwen texte absent: $launcher" }
    Remove-Item -LiteralPath $qwenTextLog -Force -ErrorAction SilentlyContinue
    $launchCommand = "& '" + $launcher.Replace("'","''") + "' *>> '" + $qwenTextLog.Replace("'","''") + "'"
    $qwenServer = Start-Server 'QWEN TEXT' 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$launchCommand) $Jarjar
} else { Write-Host '[4/6] Qwen texte deja actif.' -ForegroundColor DarkGray }
$qwenState = Start-OptionalService 8080 'QWEN TEXT' $qwenServer 4

if ($qwenState -eq 'OFFLINE' -and -not (Port-Open 8080)) {
    Write-Host '[QWEN TEXT] Premier lancement echoue. Nouvelle tentative unique...' -ForegroundColor Yellow
    if (Test-Path -LiteralPath $qwenTextLog) {
        Get-Content -LiteralPath $qwenTextLog -Tail 12 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
    }
    Start-Sleep -Seconds 1
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_text.ps1'
    $launchCommand = "& '" + $launcher.Replace("'","''") + "' *>> '" + $qwenTextLog.Replace("'","''") + "'"
    $qwenServer = Start-Server 'QWEN TEXT RETRY' 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$launchCommand) $Jarjar
    $qwenState = Start-OptionalService 8080 'QWEN TEXT' $qwenServer 12
}

if ($qwenState -eq 'OFFLINE' -and (Test-Path -LiteralPath $qwenTextLog)) {
    Write-Host '[QWEN TEXT] Dernieres lignes du diagnostic :' -ForegroundColor Yellow
    Get-Content -LiteralPath $qwenTextLog -Tail 20 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
}

$qwenReady = ($qwenState -eq 'READY')

$visionServer = $null
$visionReady = $true
if (-not (Port-Open 8081)) {
    Write-Host '[5/6] Demarrage Qwen-VL :8081...' -ForegroundColor Cyan
    $launcher = Join-Path $Jarjar 'scripts\start_qwen_vl.ps1'
    if (-not (Test-Path $launcher)) { throw "Launcher Qwen-VL absent: $launcher" }
    $visionServer = Start-Server 'QWEN-VL' 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$launcher) $Jarjar
} else { Write-Host '[5/6] Qwen-VL deja actif.' -ForegroundColor DarkGray }
$visionState = Start-OptionalService 8081 'QWEN-VL' $visionServer 4
$visionReady = ($visionState -eq 'READY')

Write-Host ''
Write-Host '====================================================' -ForegroundColor Green
if ($qwenState -eq 'STARTING') { Write-Host 'QWEN TEXT: STARTING - chargement en arriere-plan.' -ForegroundColor Cyan }
elseif (-not $qwenReady) { Write-Host 'QWEN TEXT: OFFLINE - Jarjar continue sans route locale Qwen.' -ForegroundColor Yellow }
if ($visionState -eq 'STARTING') { Write-Host 'QWEN-VL: STARTING - chargement en arriere-plan.' -ForegroundColor Cyan }
elseif (-not $visionReady) { Write-Host 'QWEN-VL: OFFLINE - Jarjar continue sans vision locale.' -ForegroundColor Yellow }
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
Write-Host "Jarjar termine. ExitCode=$LASTEXITCODE" -ForegroundColor Yellow
Read-Host 'Entree pour fermer'