# Shared Windows launcher functions. No action on import.
function Get-ProjectViteProcesses {
    param([Parameter(Mandatory=$true)][string]$Root)
    $expected = [IO.Path]::GetFullPath((Join-Path $Root 'node_modules\vite\bin\vite.js'))
    $pattern = '(?:"(?<path>[^"\r\n]*[\\/]vite[\\/]bin[\\/]vite\.js)"|(?<path>[^\s"]*[\\/]vite[\\/]bin[\\/]vite\.js))'
    foreach ($item in @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop)) {
        foreach ($match in [regex]::Matches([string]$item.CommandLine, $pattern)) {
            try { $candidate = [IO.Path]::GetFullPath($match.Groups['path'].Value.Replace('/', '\')) } catch { continue }
            if ($candidate -ieq $expected) { $item; break }
        }
    }
}

function Stop-ProjectVite {
    param([Parameter(Mandatory=$true)][string]$Root)
    foreach ($item in @(Get-ProjectViteProcesses -Root $Root)) {
        $viteProcess = Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
        if ($null -eq $viteProcess) { continue }
        Write-Host "Arret du serveur Vite de ce projet (PID $($item.ProcessId))..."
        $null = $viteProcess.Handle
        & (Join-Path $env:SystemRoot 'System32\taskkill.exe') /PID ([string]$item.ProcessId) /T /F
        if (($LASTEXITCODE -ne 0) -and -not $viteProcess.HasExited) { throw 'Arret du serveur Vite refuse par Windows.' }
        if (-not $viteProcess.WaitForExit(5000)) { throw 'Le serveur Vite ne s''est pas arrete.' }
    }
}

function Get-RequiredCommand {
    param([string]$Name)
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) { throw "$Name est introuvable dans le PATH." }
    return $command.Source
}

function Invoke-CheckedCommand {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command a echoue (code $LASTEXITCODE). Arret du lanceur." }
}

function Test-ProjectInstallation {
    param([string]$Root, [string]$Node)
    & $Node (Join-Path $Root 'scripts\check-installation.mjs') --quiet
    return ($LASTEXITCODE -eq 0)
}

function Install-ProjectDependencies {
    param([string]$Root, [string]$Node, [string]$Npm)
    Write-Host 'Installation des dependances du projet...'
    Invoke-CheckedCommand -Command $Npm -Arguments @('ci')
    if (-not (Test-ProjectInstallation -Root $Root -Node $Node)) {
        throw 'Installation incomplete apres npm ci. Aucun serveur n''a ete lance. Consulte le message npm ci au-dessus.'
    }
}
