# Monde V58 — OS isolation prerequisite probe (NON FREEZE)

## Delivered code
- `server/v58-docker-isolation-probe.mjs`: an explicit Docker probe, not a general-purpose software executor.
- `server/run-v58-isolation-probe.mjs`: opt-in diagnostics command.
- `tests/v58-docker-isolation-probe.test.mjs`: five tests covering arguments, no fallback, contradictory probe output, mocked success semantics and invalid bounds.

The probe runs a **fixed, internally authored Node probe** in `node:22-alpine` with Docker arguments `--pull never --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 --memory 128m --memory-swap 128m --cpus 0.5 --user 65534:65534 --tmpfs /tmp:rw,nosuid,nodev,size=8m,mode=1777`. The container has no host bind mounts and no published ports.

The fixed probe attempts and verifies:
- a write to `/etc` is refused;
- a write to `/tmp` works;
- a direct socket connection fails;
- the worker is non-root.

Results are `PROBED_ISOLATION` only if every runtime check reports success; otherwise `HOLD`. Reported CPU/memory/PID limits are **configured by Docker flags but not independently measured**. A positive result describes a local probe, not authorization to run arbitrary third-party code, and not a proof that all future workers are isolated.

## Prerequisites and Windows command
Requires Docker Engine / Docker Desktop with a working Linux-container backend and the **already local** image `node:22-alpine`. The `--pull never` setting prevents silent image downloads. Users can provision that image explicitly, after reviewing source/provenance, with:
```powershell
docker image inspect node:22-alpine
# If absent, an explicit and reviewed provisioning action is required.
git pull --ff-only origin main
node server/run-v58-isolation-probe.mjs
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
```

## Hard boundaries
- This pass does **NOT** execute V54-generated source inside a Docker container. The existing V57 subprocess remains **not** OS-sandboxed; it is still limited to byte-identical reviewed templates.
- No automatic fallback from Docker to bare host execution. The V58 diagnostic is not connected as an authorization gate to V57 execution; broader code remains HOLD.
- Docker Engine configuration, daemon privileges, image provenance, cgroup enforcement, host runtime, filesystem mounts and container breakout risks require independent review and adversarial tests.
- Network denial is probed by a single direct TCP connection; this does not exhaustively certify networking isolation.
- This is not authenticated production execution; no KX108 decision, deployment or integration into Monde.
- Tests using a fake executor demonstrate control-flow behavior, **not** host isolation. An actual local Docker probe must run before asserting this environment is isolated.
- The last user-confirmed global test result remains V42 419 PASS; V43–V58 global validation still pending.

## Next
V59 should execute only canonical reviewed V54 sources inside the same locked-down container, with container-scoped behavioral tests and persisted evidence, after a real host probe and immutable image pinning. Then consider a stronger security review before ever accepting generative/untrusted source.
