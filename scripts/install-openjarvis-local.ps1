param()

$ErrorActionPreference = 'Stop'

$desktop = Join-Path $env:USERPROFILE 'Desktop'
$root = Join-Path $desktop 'OpenJarvis-Obsidia'
$obsidiaRepo = 'https://github.com/Eaubin08/obsidia-x108-proofs.git'
$obsidiaBranch = 'build/openjarvis-full-install'
$upstreamRepo = 'https://github.com/open-jarvis/OpenJarvis.git'
$upstreamCommit = 'fbbdb23c86627c18b859369b19746a9245f1ce0b'
$upstreamDir = Join-Path $root 'OpenJarvis-pinned-fbbdb23'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' OPEN JARVIS / OBSIDIA - INSTALLATION LOCALE' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

if(-not (Get-Command git.exe -ErrorAction SilentlyContinue)){
  throw 'git.exe introuvable'
}

if(-not (Test-Path -LiteralPath $root)){
  Write-Host "Clone Obsidia OpenJarvis -> $root" -ForegroundColor Yellow
  git clone --branch $obsidiaBranch --single-branch $obsidiaRepo $root
  if($LASTEXITCODE -ne 0){ throw 'Clone obsidia-x108-proofs impossible' }
}else{
  Write-Host "Dossier existant: $root" -ForegroundColor Green

  $gitDir = Join-Path $root '.git'
  if(-not (Test-Path -LiteralPath $gitDir)){
    $backup = "$root.partial-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Write-Host "Dossier partiel non Git detecte. Sauvegarde -> $backup" -ForegroundColor Yellow
    Move-Item -LiteralPath $root -Destination $backup
    git clone --branch $obsidiaBranch --single-branch $obsidiaRepo $root
    if($LASTEXITCODE -ne 0){ throw 'Clone obsidia-x108-proofs impossible apres sauvegarde du dossier partiel' }
  }else{
    $originUrl = (git -C $root remote get-url origin 2>$null)
    if($LASTEXITCODE -ne 0 -or -not $originUrl){
      Write-Host "Remote origin absent: ajout de $obsidiaRepo" -ForegroundColor Yellow
      git -C $root remote add origin $obsidiaRepo
      if($LASTEXITCODE -ne 0){ throw 'Impossible d ajouter le remote origin OpenJarvis Obsidia' }
    }elseif($originUrl.Trim() -ne $obsidiaRepo){
      Write-Host "Remote origin corrige -> $obsidiaRepo" -ForegroundColor Yellow
      git -C $root remote set-url origin $obsidiaRepo
      if($LASTEXITCODE -ne 0){ throw 'Impossible de corriger le remote origin OpenJarvis Obsidia' }
    }

    git -C $root fetch origin ($obsidiaBranch + ':refs/remotes/origin/' + $obsidiaBranch)
    if($LASTEXITCODE -ne 0){ throw 'git fetch OpenJarvis Obsidia impossible' }

    git -C $root show-ref --verify --quiet "refs/heads/$obsidiaBranch"
    if($LASTEXITCODE -eq 0){
      git -C $root switch $obsidiaBranch
      if($LASTEXITCODE -ne 0){ throw "Impossible de basculer sur $obsidiaBranch" }
    }else{
      git -C $root switch -c $obsidiaBranch --track "origin/$obsidiaBranch"
      if($LASTEXITCODE -ne 0){ throw "Impossible de creer la branche locale $obsidiaBranch depuis origin/$obsidiaBranch" }
    }

    git -C $root pull --ff-only origin $obsidiaBranch
    if($LASTEXITCODE -ne 0){ throw 'git pull OpenJarvis Obsidia impossible' }
  }
}

$bridge = Join-Path $root 'apps\openjarvis_obsidia_bridge'
if(-not (Test-Path -LiteralPath $bridge)){
  throw "Bridge OpenJarvis/Obsidia introuvable apres clone: $bridge"
}

if(-not (Test-Path -LiteralPath $upstreamDir)){
  Write-Host "Clone OpenJarvis upstream -> $upstreamDir" -ForegroundColor Yellow
  git clone $upstreamRepo $upstreamDir
  if($LASTEXITCODE -ne 0){ throw 'Clone OpenJarvis upstream impossible' }
}

git -C $upstreamDir fetch --all --tags
if($LASTEXITCODE -ne 0){ throw 'Fetch OpenJarvis upstream impossible' }
git -C $upstreamDir checkout --detach $upstreamCommit
if($LASTEXITCODE -ne 0){ throw "Commit OpenJarvis fbbdb23c introuvable" }

$observed = (git -C $upstreamDir rev-parse HEAD).Trim()
if($observed -ne $upstreamCommit){
  throw "OpenJarvis commit mismatch: $observed"
}

Write-Host ''
Write-Host 'INSTALLATION SOURCE OK' -ForegroundColor Green
Write-Host "Obsidia branch : $obsidiaBranch" -ForegroundColor Green
Write-Host "OpenJarvis pin  : $observed" -ForegroundColor Green
Write-Host "Root            : $root" -ForegroundColor Green
Write-Host "Bridge          : $bridge" -ForegroundColor Green
Write-Host ''
Write-Host 'Aucune inference directe et aucune autorite ne sont activees par ce script.' -ForegroundColor DarkGray
