# Monde V57 — Reviewed-source subprocess functional testing (NON FREEZE)

V57 adds a **separate Node subprocess** for functional tests of the three finite, byte-identical V54 reviewed source templates. It is an operational fault boundary, **NOT a proven OS sandbox** for untrusted JavaScript.

## Implementation
- `server/reviewed-source-process-worker.mjs`: reconstructs source locally from finite kind/component/organization parameters, compares SHA-256 to the parent's expected digest, and executes fixed functional cases. Never reads user-supplied source bytes.
- `server/reviewed-source-process-runner.mjs`: requires static validation and exact canonical source match *before* launching the child, limits process runtime (default 1500 ms, maximum 5000 ms), sets a 64 MiB V8 old-space limit, bounds stdout/stderr, and checks the returned test records and digest.
- `server/synthetic-source-build-pipeline.mjs`: runs process tests after V56 exact-template functional tests. Stores `processEvidence` in the source manifest; revalidates evidence on inspect. Preserves legacy `STORED_SOURCE_NOT_EXECUTED` public status, meaning **not deployed or executed within Monde**. The source **is** executed for explicitly limited laboratory tests in the Node child process.
- `tests/reviewed-source-process-v57.test.mjs` and `tests/synthetic-source-pipeline-v57.test.mjs`: test child-process behaviors, unreviewed source refusal, invalid timeout, persisted evidence and tamper detection.

## Exact limitations
A subprocess, short timeout and V8 old-space option do **not** guarantee network denial, filesystem isolation, process-tree termination, total memory bound, user privilege separation or OS containment. The worker has its normal Node account permissions. **Do not use V57 for arbitrary/LLM-generated/external code.** No sandbox readiness claim, no real agent activation, no KX108 authorization and no deployment.

## Local verification
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
node server/run-synthetic-source-build.mjs "$env:TEMP\obsidia-source-builder-v57" PURE_TOOL Demo1 LAB
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
git log -1 --oneline
```
The V43–V57 global suite is still **unverified on the exact GitHub HEAD** in this conversation. The last user-provided successful local run was V42, 419 tests PASS.

## Next step
Build a separately provisioned OS sandbox (container/VM or equivalent), demonstrate actual network-denial and filesystem isolation with adversarial tests, measure resource limits at OS level, and only then evaluate broader source generation. Keep all production actions HOLD without actual KX108 authority.
