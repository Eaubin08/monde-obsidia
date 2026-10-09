# C5.4 — Raccordement local, sans mutation de Monde

Le PC fixe dispose d'un clone Obsidia sous `$env:USERPROFILE\Desktop\obsidia-openjarvis-install-v0`, branche `build/openjarvis-full-install`, commit observé `6331f4c7`. Cela **n'atteste ni du runtime ni des preuves locales**.

## Préflight

Depuis `$env:TEMP\monde-c5-readonly` :
```powershell
$ErrorActionPreference='Stop'
$source=Join-Path $env:USERPROFILE 'Desktop\obsidia-openjarvis-install-v0'
if (!(Test-Path (Join-Path $source '.git'))) { throw 'Source Obsidia absente' }
$env:OBSIDIA_SOURCE_REPO=$source
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'Pull C5 failed' }
node --test tests/universal-c54-readiness.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'C5.4 tests failed' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Monde regression failed' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Monde build failed' }
git restore --source=HEAD --worktree -- public/data/local-inventory.json
git status --short
```
Le prébuild peut lire uniquement les métadonnées Git et le registre documentaire de la source. Aucune mission ni runtime ne doit être lancé pour ce préflight.

## Observation live (optionnelle)

Toujours depuis ce clone et dans la même console PowerShell :
```powershell
$env:OBSIDIA_SOURCE_REPO=Join-Path $env:USERPROFILE 'Desktop\obsidia-openjarvis-install-v0'
npm.cmd run dev
```
Dans **une autre** console PowerShell :
```powershell
Invoke-RestMethod 'http://127.0.0.1:5180/obsidia-local/universal-c54-readiness' | Format-List
Invoke-RestMethod 'http://127.0.0.1:5180/obsidia-local/universal-c53-observed' | Select-Object schema,status,recordCount,executionAllowed
```
Attention : V5 contient déjà des routes de lancement de service hors C5 ; ne pas les activer pendant cet audit. Ne pas utiliser `npm run preview` pour contrôler ces routes de développement Vite.

**Ne pas basculer le Monde canonique**, ni écraser `Desktop\monde-obsidia` ou `Desktop\OBSIDIA_WORLDS\monde-obsidia-git`. Le clone de validation reste isolé. Aucun WIP ou secret ne doit être copié pendant ce test.

## Bornes

`SOURCE_GIT_OBSERVED_NOT_RUNTIME_VERIFIED` prouve uniquement que Git a répondu. Le pont `C5.3` lit la projection locale déjà exposée sous les dossiers Obsidia de LOCALAPPDATA, si présente, mais ne garantit aucune provenance cryptographique. Aucun rattachement à un tenant sans preuve d'identité fiable. Aucun passage de `ALLOW` vers une action.
