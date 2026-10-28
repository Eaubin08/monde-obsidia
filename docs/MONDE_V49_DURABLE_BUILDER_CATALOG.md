# Monde V49 — Durable synthetic job identity, journal and read-only catalog (NON FREEZE)

## Delivered backend
- `synthetic-build-queue.mjs`: new jobs receive collision-resistant `LAB_JOB_00001_<uuid32>` IDs. Sequence remains process-local; UUID suffix prevents ordinary collisions across CLI restarts.
- `synthetic-artifact-store.mjs`: supports legacy IDs and new V49 IDs in listing, validates stored artifact type and manifest success tests when reading back. V48 content-addressed SHA-256 artifact storage preserved.
- `synthetic-job-journal.mjs`: explicit lab-root journal with sequential, exclusive-create event files; strictly permitted phase transitions QUEUED → RUNNING → TESTED_SYNTHETIC/FAILED → STORED_SYNTHETIC, previous-digest link and digest verification on read. A modified event yields INVALID. This is an unsigned local chain, not a trusted append-only log.
- `synthetic-component-catalog.mjs`: re-opens stored artifacts through the validating store and exposes read-only summaries/previews with build/deploy/execute=false.
- `run-synthetic-build-store.mjs`: records journal transitions around the existing explicit synthetic build/store/verify CLI.
- `tests/synthetic-builder-v49.test.mjs`: five tests covering unique IDs across queue instances, catalog reload, journal transition validation, tampering, artifact corruption and absence of deployment methods.

## Invocation
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
npm.cmd test
node server/run-synthetic-build-store.mjs AGENT_CONFIG DemoAgent LAB "$env:TEMP\obsidia-builder-lab-v49"
npm.cmd run build
npm.cmd run lint
git status
```
The same lab root may now receive multiple ordinary runs: new UUID job IDs avoid collisions. Do not use a real corporate-data directory or production service path as a lab root.

## Critical limitations
- Job events are persisted but **live queued jobs are not resumed after crashes**, and the queue is not a background worker. The CLI does not perform a crash-recovery protocol.
- This is a laboratory artifact and event store using ordinary Node file permissions; write access to the directory can rewrite files or journal. SHA-256 detects inconsistent corruption, not adversarial origin forgery; no signed root.
- No atomic transaction across build result, event files and artifact manifest. A crash may leave partial state; investigate as UNKNOWN/HOLD, never infer success.
- Catalog is a backend function, **not yet a browser UI or HTTP API**.
- Only static synthetic JSON components; no generated code execution, runtime agent creation, autonomous tool integration, business mutations or Builder production approval.
- KX108 authority not invoked and no authority inferred. All approvals and execution flags remain false.

## Validation requirement
V49 is CODE + TEST WRITTEN until test/build/lint on exact published HEAD. Last confirmed user local test was V42 with 419 PASS. Do not label V43–V49 as validated until current logs are seen.

## Next milestone
V50: hardened storage transaction protocol / crash recovery, quotas, restrictive filesystem root validation, deterministic integrity inventory and explicit read-only world-facing catalog boundary, then introduce actual controlled generation drivers separately from synthetic templates.
