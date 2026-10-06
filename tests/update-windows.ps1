$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $projectRoot 'scripts\windows-common.ps1')
$node = Get-RequiredCommand 'node.exe'
$scratch = Join-Path $env:TEMP ('obsidia-updater-' + [guid]::NewGuid().ToString())
$first = Join-Path $scratch "monde l'agent"
$other = Join-Path $scratch 'autre monde'
$broken = Join-Path $scratch 'installation incomplete'
$priorPath = $env:PATH
function Assert-True { param([bool]$Value, [string]$Message); if (-not $Value) { throw $Message } }
function New-Fixture {
    param([string]$Directory, [switch]$Installed)
    $null = New-Item -ItemType Directory -Path (Join-Path $Directory 'scripts') -Force
    foreach ($name in @('windows-common.ps1','start-windows.ps1','update-windows.ps1','check-installation.mjs')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot ('scripts\' + $name)) -Destination (Join-Path $Directory 'scripts')
    }
    Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json') -Destination $Directory
    Copy-Item -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Destination $Directory
    Set-Content -LiteralPath (Join-Path $Directory 'index.html') -Value '<p>UPDATER TEST FIXTURE ONLY</p>' -Encoding ASCII
    if ($Installed) { $null = New-Item -ItemType Junction -Path (Join-Path $Directory 'node_modules') -Target (Join-Path $projectRoot 'node_modules') }
}
function Start-FixtureVite {
    param([string]$Directory)
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $fixturePort = $listener.LocalEndpoint.Port
    $listener.Stop()
    $arguments = @(('"' + (Join-Path $Directory 'node_modules\vite\bin\vite.js') + '"'), '--host', '127.0.0.1', '--port', [string]$fixturePort, '--strictPort')
    $child = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $Directory -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Directory 'vite.stdout.txt') -RedirectStandardError (Join-Path $Directory 'vite.stderr.txt')
    $null = $child.Handle
    $deadline = (Get-Date).AddSeconds(20)
    do {
        if ($child.HasExited) { throw ('Vite fixture a echoue : ' + (Get-Content (Join-Path $Directory 'vite.stderr.txt') -Raw)) }
        try {
            $reply = Invoke-WebRequest -Uri ('http://127.0.0.1:' + $fixturePort) -UseBasicParsing -TimeoutSec 1
            if ($reply.StatusCode -eq 200 -and $reply.Content -match 'UPDATER TEST FIXTURE ONLY') { return $child }
        } catch {}
        Start-Sleep -Milliseconds 100
    } while ((Get-Date) -lt $deadline)
    $stdout = Get-Content (Join-Path $Directory 'vite.stdout.txt') -Raw
    $stderr = Get-Content (Join-Path $Directory 'vite.stderr.txt') -Raw
    throw ('Vite fixture non pret. STDOUT: ' + $stdout + ' STDERR: ' + $stderr)
}
try {
    New-Fixture -Directory $first -Installed
    New-Fixture -Directory $other -Installed
    $firstProcess = Start-FixtureVite -Directory $first
    $otherProcess = Start-FixtureVite -Directory $other
    Assert-True (@(Get-ProjectViteProcesses -Root $first).Count -eq 1) 'Le Vite du projet avec espaces/apostrophe n''est pas identifie.'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $first 'scripts\update-windows.ps1') -SkipPull -NoLaunch
    Assert-True ($LASTEXITCODE -eq 0) 'La mise a jour d''une installation complete a echoue.'
    Assert-True $firstProcess.HasExited 'Le Vite cible tourne encore.'
    Assert-True (-not $otherProcess.HasExited) 'Le Vite d''un autre projet a ete arrete.'
    Assert-True (Test-Path (Join-Path $first 'node_modules\vite\bin\vite.js')) 'Les dependances completes ont ete detruites.'
    Write-Host 'PASS: vrai Vite arrete, autre Vite conserve, dependances completes conservees.'

    New-Fixture -Directory $broken
    $shim = Join-Path $scratch 'npm-shim'
    $null = New-Item -ItemType Directory -Path $shim
    $calls = Join-Path $scratch 'npm-calls.txt'
    $env:PATH = $shim + ';' + $priorPath
    foreach ($npmExit in @(23, 0)) {
        Remove-Item -LiteralPath $calls -ErrorAction SilentlyContinue
        @('@echo off', ('echo %* >> "' + $calls + '"'), ('exit /b ' + $npmExit)) | Set-Content -LiteralPath (Join-Path $shim 'npm.cmd') -Encoding ASCII
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $broken 'scripts\start-windows.ps1')
        Assert-True ($LASTEXITCODE -ne 0) "Lancement accepte apres une installation incomplete (npm code $npmExit)."
        $invocations = @(Get-Content -LiteralPath $calls)
        Assert-True ($invocations.Count -eq 1 -and $invocations[0].Trim() -eq 'ci') 'npm run dev a ete appele apres un echec.'
    }
    Write-Host 'PASS: npm echoue / faux succes sans dependances => arret, aucun lancement Vite.'
} finally {
    $env:PATH = $priorPath
    foreach ($directory in @($first,$other)) { if (Test-Path $directory) { Stop-ProjectVite -Root $directory } }
    & $node -e "require('node:fs').rmSync(process.argv[1],{recursive:true,force:true,maxRetries:3,retryDelay:100})" $scratch
    Assert-True (Test-Path (Join-Path $projectRoot 'node_modules\vite\bin\vite.js')) 'Le nettoyage des junctions a touche au vrai projet.'
}
