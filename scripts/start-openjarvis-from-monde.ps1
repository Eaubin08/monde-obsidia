param()

$ErrorActionPreference = 'Stop'
$desktop = Join-Path $env:USERPROFILE 'Desktop'
$candidates = @(
  (Join-Path $desktop 'obsidia-openjarvis-install-v0'),
  (Join-Path $desktop 'obsidia-openjarvis-g3'),
  (Join-Path $desktop 'obsidia-jarvis-advanced-integration-v0')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

$launcher = $null
foreach($root in $candidates){
  $direct = Join-Path $root 'start-openjarvis.ps1'
  if(Test-Path -LiteralPath $direct){ $launcher = $direct; break }
}

if(-not $launcher -and (Test-Path -LiteralPath $desktop)){
  $launcher = Get-ChildItem -LiteralPath $desktop -Recurse -File -Filter 'start-openjarvis.ps1' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match 'openjarvis|jarvis' } |
    Select-Object -ExpandProperty FullName -First 1
}

if(-not $launcher){
  throw "Open Jarvis launcher introuvable sous $desktop"
}

$root = Split-Path -Parent $launcher
Set-Location -LiteralPath $root
Write-Host "Open Jarvis launcher: $launcher" -ForegroundColor Cyan
& $launcher
