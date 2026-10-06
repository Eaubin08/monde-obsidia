param([switch]$NoLaunch, [switch]$SkipPull)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
try {
    Set-Location -LiteralPath $projectRoot
    . (Join-Path $PSScriptRoot 'windows-common.ps1')
    $node = Get-RequiredCommand 'node.exe'
    $npm = Get-RequiredCommand 'npm.cmd'
    Stop-ProjectVite -Root $projectRoot
    $beforeLock = (Get-FileHash -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Algorithm SHA256).Hash
    if (-not $SkipPull) {
        $git = Get-RequiredCommand 'git.exe'
        Invoke-CheckedCommand -Command $git -Arguments @('fetch', 'origin', 'main')
        Invoke-CheckedCommand -Command $git -Arguments @('switch', 'main')
        Invoke-CheckedCommand -Command $git -Arguments @('pull', '--ff-only', 'origin', 'main')

        $jarjarCandidates = @(
            $env:OBSIDIA_JARJAR_ROOT,
            (Join-Path $env:USERPROFILE 'Desktop\Jarvis-iron-obsidia-'),
            'C:\Users\User\Desktop\Jarvis-iron-obsidia-'
        ) | Where-Object { $_ } | Select-Object -Unique
        $jarjarRoot = $jarjarCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ '.git') } | Select-Object -First 1
        if ($jarjarRoot) {
            Write-Host "Mise a jour Jarjar : $jarjarRoot"
            Push-Location -LiteralPath $jarjarRoot
            try {
                Invoke-CheckedCommand -Command $git -Arguments @('fetch', 'origin', 'main')
                Invoke-CheckedCommand -Command $git -Arguments @('switch', 'main')
                Invoke-CheckedCommand -Command $git -Arguments @('pull', '--ff-only', 'origin', 'main')
            } finally {
                Pop-Location
            }
        } else {
            Write-Host 'Repo Jarjar local non trouve ; mise a jour Monde continue sans Jarjar.' -ForegroundColor Yellow
        }
    }
    # Load the newly pulled helper before checking/installing dependencies.
    . (Join-Path $PSScriptRoot 'windows-common.ps1')
    $afterLock = (Get-FileHash -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Algorithm SHA256).Hash
    if (($beforeLock -ne $afterLock) -or -not (Test-ProjectInstallation -Root $projectRoot -Node $node)) {
        Install-ProjectDependencies -Root $projectRoot -Node $node -Npm $npm
    } else {
        Write-Host 'Dependances deja completes ; installation conservee.'
    }
    if (-not $NoLaunch) { & (Join-Path $PSScriptRoot 'start-windows.ps1'); exit $LASTEXITCODE }
    Write-Host 'Mise a jour verifiee.'
    exit 0
} catch {
    Write-Host "Mise a jour interrompue : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
