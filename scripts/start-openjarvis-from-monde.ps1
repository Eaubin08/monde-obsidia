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

function Get-CompatiblePython {
  if(Get-Command py.exe -ErrorAction SilentlyContinue){
    foreach($version in @('3.13','3.12','3.11','3.10')){
      & py.exe "-$version" -c "import sys" 2>$null
      if($LASTEXITCODE -eq 0){
        return [pscustomobject]@{
          File = 'py.exe'
          Args = @("-$version")
          Version = $version
        }
      }
    }
  }

  if(Get-Command python.exe -ErrorAction SilentlyContinue){
    $ver = (& python.exe -c "import sys; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor))" 2>$null | Select-Object -First 1)
    if($LASTEXITCODE -eq 0 -and $ver){
      $ver = $ver.Trim()
      if($ver -match '^3\.(10|11|12|13)$'){
        return [pscustomobject]@{
          File = 'python.exe'
          Args = @()
          Version = $ver
        }
      }
    }
  }

  return $null
}

$venvCompatible = $false
if(Test-Path -LiteralPath $python){
  $venvVersion = (& $python -c "import sys; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor))" 2>$null | Select-Object -First 1)
  if($LASTEXITCODE -eq 0 -and $venvVersion){
    $venvVersion = $venvVersion.Trim()
    if($venvVersion -match '^3\\.(10|11|12|13)
$obsidiaRequirements = Join-Path $ojRoot 'requirements.txt'
if(-not (Test-Path -LiteralPath $obsidiaRequirements)){
  throw "Requirements Obsidia introuvables: $obsidiaRequirements"
}

& $python -c "import fastapi, pydantic, requests, yaml" 2>$null
if($LASTEXITCODE -ne 0){
  Write-Host "Installation des dependances runtime Obsidia dans le venv OpenJarvis..." -ForegroundColor Yellow
  & $python -m pip install --disable-pip-version-check -r $obsidiaRequirements
  if($LASTEXITCODE -ne 0){
    throw 'Installation des dependances runtime Obsidia impossible'
  }
}

& $python -c "import openjarvis, fastapi; print('OPENJARVIS_OBSIDIA_IMPORT_OK')"
if($LASTEXITCODE -ne 0){
  throw 'Import OpenJarvis/Obsidia impossible apres installation'
}

$env:OBSIDIA_OPENJARVIS_SOURCE = $upstream
$env:OBSIDIA_OPENJARVIS_COMMIT = $upstreamCommit
$env:PYTHONPATH = "$ojRoot;$ojRoot\scripts;$upstream\src"

$label = 'monde-openjarvis'
$bindOut = & $python $binding bind $label $ojRoot 2>&1
$bindCode = $LASTEXITCODE
$sessionId = $null

if($bindCode -eq 0){
  try {
    $sessionId = (($bindOut -join "`n") | ConvertFrom-Json).session_id
  } catch {}
}else{
  $listOut = & $python $binding list 2>&1
  if($LASTEXITCODE -eq 0){
    try {
      $items = (($listOut -join "`n") | ConvertFrom-Json)
      $match = @($items) | Where-Object { $_.workspace -eq $ojRoot } | Select-Object -First 1
      if($match){
        $sessionId = $match.session_id
      }
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
){
      $venvCompatible = $true
      Write-Host ("Venv OpenJarvis compatible: Python " + $venvVersion) -ForegroundColor Green
    } else {
      Write-Host ("Venv OpenJarvis incompatible: Python " + $venvVersion + " -> recreation ciblee") -ForegroundColor Yellow
    }
  }
}

if(-not $venvCompatible){
  $runtime = Get-CompatiblePython
  if(-not $runtime){
    throw 'Aucun Python compatible OpenJarvis trouve. Installe Python 3.10, 3.11, 3.12 ou 3.13.'
  }

  if(Test-Path -LiteralPath $venv){
    Remove-Item -LiteralPath $venv -Recurse -Force
  }

  Write-Host ("Creation du venv OpenJarvis avec Python " + $runtime.Version + "...") -ForegroundColor Yellow
  & $runtime.File @($runtime.Args) -m venv $venv
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $python)){
    throw 'Impossible de recreer le venv OpenJarvis avec un Python compatible'
  }
}

$openJarvisImportOk = $false
& $python -c "import openjarvis" 2>$null
if($LASTEXITCODE -eq 0){
  $openJarvisImportOk = $true
}

if(-not $openJarvisImportOk){
  Write-Host "Installation OpenJarvis dans le venv compatible..." -ForegroundColor Yellow
  & $python -m pip install --disable-pip-version-check -e $upstream
  if($LASTEXITCODE -ne 0){
    throw 'Installation Python OpenJarvis impossible'
  }
} else {
  Write-Host "OpenJarvis deja installe dans le venv." -ForegroundColor Green
}

$obsidiaRequirements = Join-Path $ojRoot 'requirements.txt'
if(-not (Test-Path -LiteralPath $obsidiaRequirements)){
  throw "Requirements Obsidia introuvables: $obsidiaRequirements"
}

& $python -c "import fastapi, pydantic, requests, yaml" 2>$null
if($LASTEXITCODE -ne 0){
  Write-Host "Installation des dependances runtime Obsidia dans le venv OpenJarvis..." -ForegroundColor Yellow
  & $python -m pip install --disable-pip-version-check -r $obsidiaRequirements
  if($LASTEXITCODE -ne 0){
    throw 'Installation des dependances runtime Obsidia impossible'
  }
}

& $python -c "import openjarvis, fastapi; print('OPENJARVIS_OBSIDIA_IMPORT_OK')"
if($LASTEXITCODE -ne 0){
  throw 'Import OpenJarvis/Obsidia impossible apres installation'
}

$env:OBSIDIA_OPENJARVIS_SOURCE = $upstream
$env:OBSIDIA_OPENJARVIS_COMMIT = $upstreamCommit
$env:PYTHONPATH = "$ojRoot;$ojRoot\scripts;$upstream\src"

$label = 'monde-openjarvis'
$bindOut = & $python $binding bind $label $ojRoot 2>&1
$bindCode = $LASTEXITCODE
$sessionId = $null

if($bindCode -eq 0){
  try {
    $sessionId = (($bindOut -join "`n") | ConvertFrom-Json).session_id
  } catch {}
}else{
  $listOut = & $python $binding list 2>&1
  if($LASTEXITCODE -eq 0){
    try {
      $items = (($listOut -join "`n") | ConvertFrom-Json)
      $match = @($items) | Where-Object { $_.workspace -eq $ojRoot } | Select-Object -First 1
      if($match){
        $sessionId = $match.session_id
      }
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
