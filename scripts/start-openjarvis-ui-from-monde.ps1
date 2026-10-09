param()

$ErrorActionPreference = 'Stop'

$ojRoot = Join-Path $env:USERPROFILE 'Desktop\obsidia-openjarvis-install-v0'
$binding = Join-Path $ojRoot 'scripts\obsidia_jarvis_workspace_binding_v0.py'
$webBridge = Join-Path $ojRoot 'scripts\obsidia_openjarvis_native_web_bridge_v0.py'

$upstream = Join-Path $env:USERPROFILE 'Desktop\OpenJarvis-pinned-fbbdb23'
$frontend = Join-Path $upstream 'frontend'
$venv = Join-Path $ojRoot '.venv'
$python = Join-Path $venv 'Scripts\python.exe'

if(-not (Test-Path -LiteralPath $binding)){
  throw "Binding OpenJarvis introuvable: $binding"
}
if(-not (Test-Path -LiteralPath $webBridge)){
  throw "Bridge Web OpenJarvis introuvable: $webBridge"
}
if(-not (Test-Path -LiteralPath $python)){
  throw "Venv OpenJarvis introuvable. Lance d'abord la CLI Open Jarvis depuis Monde."
}
if(-not (Test-Path -LiteralPath $frontend)){
  throw "Frontend OpenJarvis introuvable: $frontend"
}

$env:OBSIDIA_OPENJARVIS_SOURCE = $upstream
$env:OBSIDIA_OPENJARVIS_COMMIT = 'fbbdb23c86627c18b859369b19746a9245f1ce0b'
$env:PYTHONPATH = "$ojRoot;$ojRoot\scripts;$upstream\src"
$env:OBSIDIA_OPENJARVIS_WEB_PORT = '8765'

$label = 'monde-openjarvis'
$listOut = & $python $binding list 2>&1
$sessionId = $null

if($LASTEXITCODE -eq 0){
  try {
    $items = (($listOut -join "`n") | ConvertFrom-Json)
    $match = @($items) | Where-Object { $_.workspace -eq $ojRoot } | Select-Object -First 1
    if($match){
      $sessionId = $match.session_id
    }
  } catch {}
}

if(-not $sessionId){
  $bindOut = & $python $binding bind $label $ojRoot 2>&1
  if($LASTEXITCODE -ne 0){
    Write-Host ($bindOut -join "`n") -ForegroundColor Red
    throw 'Impossible de creer la session OpenJarvis gouvernee'
  }
  try {
    $sessionId = (($bindOut -join "`n") | ConvertFrom-Json).session_id
  } catch {}
}

if(-not $sessionId){
  throw 'Session OpenJarvis gouvernee introuvable'
}

$env:OBSIDIA_JARVIS_SESSION_ID = $sessionId

$backendReady = $false
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8765/health' -TimeoutSec 2
  if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $backendReady = $true }
} catch {}

if(-not $backendReady){
  $backendCommand = @"
`$env:OBSIDIA_OPENJARVIS_SOURCE='$upstream'
`$env:OBSIDIA_OPENJARVIS_COMMIT='fbbdb23c86627c18b859369b19746a9245f1ce0b'
`$env:PYTHONPATH='$ojRoot;$ojRoot\scripts;$upstream\src'
`$env:OBSIDIA_JARVIS_SESSION_ID='$sessionId'
`$env:OBSIDIA_OPENJARVIS_WEB_PORT='8765'
Set-Location -LiteralPath '$ojRoot'
& '$python' '$webBridge'
"@
  Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$backendCommand) | Out-Null
}

if(-not (Test-Path -LiteralPath (Join-Path $frontend 'node_modules'))){
  Write-Host 'Installation dependances frontend OpenJarvis...' -ForegroundColor Yellow
  Push-Location $frontend
  try {
    npm install
    if($LASTEXITCODE -ne 0){ throw 'npm install OpenJarvis frontend impossible' }
  } finally {
    Pop-Location
  }
}

$frontendReady = $false
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173' -TimeoutSec 2
  if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $frontendReady = $true }
} catch {}

if(-not $frontendReady){
  $frontendCommand = @"
`$env:VITE_API_URL='http://127.0.0.1:8765'
Set-Location -LiteralPath '$frontend'
npm run dev -- --host 127.0.0.1 --port 5173
"@
  Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$frontendCommand) | Out-Null
}

$deadline = (Get-Date).AddSeconds(25)
while((Get-Date) -lt $deadline){
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173' -TimeoutSec 2
    if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){
      Write-Host 'OpenJarvis UI prete: http://127.0.0.1:5173' -ForegroundColor Green
      Start-Process 'http://127.0.0.1:5173'
      exit 0
    }
  } catch {}
  Start-Sleep -Milliseconds 500
}

throw 'OpenJarvis UI non prete apres 25 secondes'
