$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
try {
    Set-Location -LiteralPath $projectRoot
    . (Join-Path $PSScriptRoot 'windows-common.ps1')
    $node = Get-RequiredCommand 'node.exe'
    $npm = Get-RequiredCommand 'npm.cmd'
    if (-not (Test-ProjectInstallation -Root $projectRoot -Node $node)) {
        Stop-ProjectVite -Root $projectRoot
        Install-ProjectDependencies -Root $projectRoot -Node $node -Npm $npm
    }
    Invoke-CheckedCommand -Command $npm -Arguments @('run', 'dev', '--', '--open')
    exit 0
} catch {
    Write-Host "Lancement interrompu : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
