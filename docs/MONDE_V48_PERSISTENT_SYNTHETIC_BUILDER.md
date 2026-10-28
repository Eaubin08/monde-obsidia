# Monde V48 — Persistent synthetic Builder artifacts (NON FREEZE)

## Real backend delivery
- `server/synthetic-artifact-store.mjs`: explicit opt-in laboratory directory, SHA-256 content-addressed artifact files, job manifest and verified readback. Only jobs with `TESTED_SYNTHETIC` phase and passing tests may be stored. Artifact JSON must remain synthetic, non-deployable, authority NONE, and have matching organization and component identities.
- `server/run-synthetic-build-store.mjs`: opt-in build → test → store → verify pipeline. An explicit fourth CLI argument supplies the local laboratory root.
- `tests/synthetic-artifact-store.test.mjs`: five tests for persistence across store instances, invalid jobs, corrupted artifact, tampered manifest, and absent root.
- Existing V46/V47 jobs remain in-memory. V48 persists **completed artifacts and manifests**, not a recoverable live queue. Restarted jobs are not resumed.

## Local run
```powershell
git pull --ff-only origin main
npm.cmd test
node server/run-synthetic-build-store.mjs AGENT_CONFIG DemoAgent LAB "$env:TEMP\obsidia-builder-lab-v48"
npm.cmd run build
npm.cmd run lint
git status
```
The generated manifest and artifact are under the explicit laboratory path. Do not use a repository checkout, business data root, or production directory as lab root. Reusing the same LAB_JOB ID after process restart is refused by exclusive manifest creation: new executions should use a fresh isolated lab root or future globally unique job identity mechanism.

## Security and authority
SHA-256 verifies stored bytes against a local manifest; it does not prove authentic source origin or provide an external signed receipt. A writer who controls both the manifest and file can replace both. This Node process has ordinary filesystem permissions and does **not** constitute an OS-level sandbox for untrusted code. Generated components are static JSON configurations, not executable autonomous agents. The CLI and store do not run generated code, deploy, update business registries, or invoke KX108. Builder approvals remain false.

## Remaining issues
- No durable asynchronous job queue, crash recovery, global unique job ID across restarts, manifest signature, journal, source-authenticated tenant ID, authorized component activation or read-only web API.
- Before making this a service, add storage isolation, quota controls, symlink/race defenses, atomic journal persistence and separate verified identity authorization.
- V48 is CODE/TEST WRITTEN. Confirm full npm test/build/lint on the published HEAD before marking PASS.

## Next builder milestone
V49: durable, uniquely identified job lifecycle with read-only artifact listing/preview, bounded retention and explicit synthetic-only activation simulation (not production deployment).
