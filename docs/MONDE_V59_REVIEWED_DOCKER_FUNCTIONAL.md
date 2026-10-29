# Monde V59 — Reviewed-source Docker functional tests (NON FREEZE)

## Scope
V59 implements real execution of the three exact finite V54 JavaScript templates **inside a Docker Linux container**, conditional on a fresh positive V58 isolation probe. This path is explicitly invoked and does not replace V55–V57's source build pipeline or provide production deployment authority.

## Files
- `server/v59-reviewed-docker-runner.mjs`: canonical source check, V58 probe gate, restricted Docker launch, bounded output parsing and functional evidence.
- `server/run-v59-reviewed-docker.mjs`: user-invoked runner.
- `tests/v59-reviewed-docker-runner.test.mjs`: five mocked control-flow tests; they do NOT establish actual Docker success on the user's machine.

## Example on Windows
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
node server/run-v58-isolation-probe.mjs
node server/run-v59-reviewed-docker.mjs PURE_TOOL Demo1 LAB
node server/run-v59-reviewed-docker.mjs PURE_WORKFLOW DemoFlow LAB
node server/run-v59-reviewed-docker.mjs PURE_AGENT_DESCRIPTOR DemoAgent LAB
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
git log -1 --oneline
```

## Boundaries and limitations
- The Docker worker executes only a **byte-identical reviewed V54 template**; it does not execute arbitrary source inputs, third-party code, or freely LLM-generated JavaScript.
- Explicit flags: `--pull never --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 --memory 128m --memory-swap 128m --cpus 0.5 --user 65534:65534 --tmpfs /tmp:rw,nosuid,nodev,size=8m,mode=1777`; no host mounts, no published ports.
- V58's network test samples one TCP connection; it is not a comprehensive security proof. Docker daemon security and image provenance remain external trust dependencies.
- The image `node:22-alpine` is a **mutable tag**. Pin to a verified digest and verify policy plus engine resource enforcement before broadening execution.
- Resource limits are **configured**, not independently measured. Docker worker stdout is compared to the expected test case names/count, but no cryptographic attestation of the Docker host is established.
- V59 remains a **separate explicit test CLI**; no automatic V55 store promotion, no KX108 authority call, no deploy, no agent activation. `executionAllowed:false` denotes no world/production execution; local lab tests intentionally execute finite reviewed code.
- Published tests use mocks; run CLI on the real machine for operational evidence. Global V43–V59 suite remains pending on current HEAD.

## Next
V60: pin immutable container digest, persist Docker test evidence alongside source manifests with replay-safe verification, audit actual container memory/CPU controls and keep broad untrusted-code execution HOLD pending independent safety review.
