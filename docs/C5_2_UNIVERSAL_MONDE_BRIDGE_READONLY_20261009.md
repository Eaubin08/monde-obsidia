# C5.2 — Universal read-only raccord Monde V5

Date : 2026-10-09. Branche : `feat/universal-c5-readonly-projection-v0`. Ne pas fusionner sur main.

## Intégration

- `server/universal-c5-local.mjs` : charge un **fichier JSON local explicitement configuré**, valide les enregistrements et projette uniquement une organisation configurée côté serveur ; absence/configuration invalide/fichier invalide = réponse vide, aucun droit.
- `server/local-bridge.mjs` : expose uniquement `GET /obsidia-local/universal-c5`; lit `OBSIDIA_C5_ORGANIZATION_ID` et `OBSIDIA_C5_RECORDS_PATH` du processus Vite, **pas des paramètres de requête**.
- `src/V5Root.tsx` : ajoute un panneau Monde > Gouvernance, sans nouvelle action d'écriture. Affichage des décisions/receipts sous réserve d'origine et d'états déclarés.
- `tests/universal-c5-bridge.test.mjs` : isolation avec deux tenants en entrée, configuration absente, faux certificat d'autorité, assertions de raccord UI/route.

## Frontières essentielles

La projection ne valide pas une signature KX108 et **n'est pas** une preuve de consentement réel. `INDEPENDENTLY_VERIFIED` dans un JSON n'est pas une vérification cryptographique faite par le bridge. Les clés de la source de test sont déclaratives. L'interface n'offre aucune action, même en présence de `ALLOW`.

Cette première route expose un **seul tenant configuré au démarrage du serveur**. Elle n'est pas une API authentifiée pour plusieurs utilisateurs simultanés. Une isolation entre utilisateurs humains exigerait authentification, autorisation vérifiée et serveur dédié; ne pas présenter `OBSIDIA_C5_ORGANIZATION_ID` comme un contrôle d'accès de production.

Les autres routes locales V5, y compris les launchers préexistants, ne sont pas modifiées.

## Validation

```powershell
Set-Location (Join-Path $env:TEMP 'monde-c5-readonly')
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'Pull C5.2 échoué' }
node --test tests/universal-c5-readonly.test.mjs tests/universal-c5-bridge.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'Tests C5 échoués' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Régression Monde échouée' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build Monde échoué' }
git restore --source=HEAD --worktree -- public/data/local-inventory.json
git status --short
```

**Statut : livré sur la branche, validation locale de C5.2 en attente.** Universal central fixé à `b69cfcbc`; Trading hors du lot; pas de lancement runtime réel.
