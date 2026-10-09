param()

$ErrorActionPreference = 'Stop'

$ojRoot = Join-Path $env:USERPROFILE 'Desktop\obsidia-openjarvis-install-v0'
$bridge = Join-Path $ojRoot 'scripts\obsidia_openjarvis_native_cli_bridge_v0.py'
$binding = Join-Path $ojRoot 'scripts\obsidia_jarvis_workspace_binding_v0.py'
$upstream = Join-Path $env:USERPROFILE 'Desktop\OpenJarvis-pinned-fbbdb23'
$upstreamRepo = 'https://github.com/open-jarvis/OpenJarvis.git'
$upstreamCommit = 'fbbdb23c86627c18b859369b19746a9245f1ce0b'
$venv = Join-Path $ojRoot '.venv'
$python = Join-Path $venv 'Scripts\python.exe'

if(-not (Test-Path -LiteralPath $bridge)){
  throw "Bridge OpenJarvis courant introuvable: $bridge"
}
if(-not (Test-Path -LiteralPath $binding)){
  throw "Workspace binding OpenJarvis introuvable: $binding"
}

if(-not (Test-Path -LiteralPath $upstream)){
  Write-Host "Installation source OpenJarvis pinned..." -ForegroundColor Yellow
  git clone $upstreamRepo $upstream
  if($LASTEXITCODE -ne 0){ throw 'Clone OpenJarvis upstream impossible' }
}

git -C $upstream fetch --all --tags
if($LASTEXITCODE -ne 0){ throw 'Fetch OpenJarvis upstream impossible' }
git -C $upstream checkout --detach $upstreamCommit
if($LASTEXITCODE -ne 0){ throw "Commit OpenJarvis pinned introuvable: $upstreamCommit" }

$observed = (git -C $upstream rev-parse HEAD).Trim()
if($observed -ne $upstreamCommit){
  throw "OpenJarvis commit mismatch: $observed"
}

if(-not (Test-Path -LiteralPath $python)){
  Write-Host "Creation du venv OpenJarvis..." -ForegroundColor Yellow

  $created = $false
  if(Get-Command py.exe -ErrorAction SilentlyContinue){
    & py.exe -3.12 -m venv $venv
    if($LASTEXITCODE -eq 0){ $created = $true }
  }
  if(-not $created -and (Get-Command python.exe -ErrorAction SilentlyContinue)){
    & python.exe -m venv $venv
    if($LASTEXITCODE -eq 0){ $created = $true }
  }
  if(-not $created -or -not (Test-Path -LiteralPath $python)){
    throw 'Impossible de creer le venv OpenJarvis (Python 3.10-3.13 requis)'
  }
}

$importCheck = & $python -c "import openjarvis; print('OK')" 2>$null
if($LASTEXITCODE -ne 0 -or $importCheck -notcontains 'OK'){
  Write-Host "Installation OpenJarvis dans le venv..." -ForegroundColor Yellow
  & $python -m pip install --disable-pip-version-check -e $upstream
  if($LASTEXITCODE -ne 0){ throw 'Installation Python OpenJarvis impossible' }
}

$env:OBSIDIA_OPENJARVIS_SOURCE = $upstream
$env:OBSIDIA_OPENJARVIS_COMMIT = $upstreamCommit
$env:PYTHONPATH = "$ojRoot;$($ojRoot)\scripts;$($upstream)\src"

$label = 'monde-openjarvis'
$bindOut = & $python $binding bind $label $ojRoot 2>&1
$bindCode = $LASTEXITCODE
$sessionId = $null

if($bindCode -eq 0){
  try { $sessionId = (($bindOut -join "`n") | ConvertFrom-Json).session_id } catch {}
}else{
  $listOut = & $python $binding list 2>&1
  if($LASTEXITCODE -eq 0){
    try {
      $items = (($listOut -join "`n") | ConvertFrom-Json)
      $match = @($items) | Where-Object { $_.workspace -eq $ojRoot } | Select-Object -First 1
      if($match){ $sessionId = $match.session_id }
    } catch {}
  }
}

if(-not $sessionId){
  Write-Host ($bindOut -join "`n") -ForegroundColor Red
  throw 'Impossible de creer ou reutiliser la session OpenJarvis gouvernee'
}

$env:OBSIDIA_JARVIS_SESSION_ID = $sessionId

Write-Host ''
Write-Host 'OPEN JARVIS / OBSIDIA' -ForegroundColor Cyan
Write-Host "Session: $sessionId" -ForegroundColor Green
Write-Host "Source : $upstream" -ForegroundColor Green
Write-Host 'Authority: NONE | Decision authority: KX108_ONLY' -ForegroundColor DarkGray
Write-Host ''

Set-Location -LiteralPath $ojRoot
& $python $bridge
exit $LASTEXITCODE
