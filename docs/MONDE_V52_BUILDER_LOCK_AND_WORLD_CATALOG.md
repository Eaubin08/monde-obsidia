# Monde V52 — Builder lab contention and World read-only boundary (NON FREEZE)

## Code delivered
- `server/synthetic-lab-lock.mjs`: exclusive cooperative lock using atomic directory creation in the explicitly selected laboratory root. If occupied, caller receives LOCKED. No destructive stale-lock takeover is attempted. The lease is released by its owning token only, with best-effort cleanup.
- `server/synthetic-builder-service.mjs`: `run()` now acquires laboratory lock before journal mutation or execution and returns HOLD/LAB_LOCKED on contention. The in-process busy guard remains. Queued jobs are not automatically promoted to execution.
- `server/world-builder-catalog-read.mjs`: a bounded read-only projection for the Monde backend, filtered by explicit organization ID. Only locally verified, reconciled artifact records are returned as PREVIEW_ONLY; unresolved artifacts are HOLD, and no activation or deployment operation is exposed.
- `tests/synthetic-builder-v52-hardening.test.mjs`: four tests for lock contention, integrated service behavior, organization isolation and input bounds.

## Scope boundaries
- The lock is cooperative and does not protect against actors ignoring it. A process crash can leave a stale lock requiring manual investigation; no PID-based auto-unlock and no force removal.
- Existing V48 storage has no durable disk quota or transaction-level atomicity; these are NOT implemented by V52. Multiple processes using storage directly instead of the unified service are outside the cooperative lock.
- The read-only catalog is a server-side module, not an HTTP API or frontend wiring. Organization selection is a filter, **not authenticated tenant access control**. Do not expose this endpoint to untrusted clients without authentication and server-side tenant resolution.
- All components are static synthetic JSON models. No arbitrary code execution, generative coding, real autonomous agent activation, real deployment or KX108 approval. No production source mutations.
- V52 publication proves CODE/TEST WRITTEN, not validated local runtime. The last submitted full test log was 419/419 on V42. Validate test/build/lint on exact V52 HEAD.

## Run validation
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
git log -1 --oneline
```

## Next major Builder milestone
Before general-purpose generation: validate V43–V52 together, then implement bounded artifact sizes, disk quotas, transaction/recovery hardening and an authenticated, local-only World read-only interface. From there pursue controlled generators in OS-isolated workers with explicit KX108 decisions, not by running generated code inside the current Node process.
