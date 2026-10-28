# Monde V53 — bounded synthetic Builder artifact storage (NON FREEZE)

## Implementation
- `server/synthetic-storage-policy.mjs`: storage policy over explicit lab root, default limits 64 KiB per generated artifact, 10 MiB total artifact/manifest bytes, 1000 manifests. Scans current artifact and manifest directories using lstat and fails closed on non-file entries, unreadable paths, exceeded limits or invalid arguments.
- `server/synthetic-artifact-store.mjs`: enforces policy before persist, rejects oversize content, insufficient remaining capacity and manifest count limits. Existing content-addressed SHA-256 and manifest/readback checks remain.
- `tests/synthetic-builder-v53-storage.test.mjs`: five tests including compatible stored build, per-artifact bound, manifest capacity, unsafe file entry and invalid limits.

## Honest constraints
This is an **admission-time cooperative quota**, not a filesystem quota enforced by the OS. It is not atomic across independent writers; the V52 service lock governs only cooperating Builder service instances. Disk space outside artifacts/manifests, e.g. job-events and lock data, is not counted. A concurrent uncooperative process can violate limits between scan and write. No malicious code execution is allowed. Existing static synthetic configs still require explicit lab build request and remain non-deployable. V53 does not implement transaction-safe storage, fully secure symlink defense, OS sandboxing, automatic crash recovery, authorized Builder execution, or a World HTTP API.

## Validation
V53 commits are published, tests written, but global V43–V53 test/build/lint is not independently verified. The last provided local global run showed 419/419 tests passing on V42. To validate on this exact HEAD:
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
git log -1 --oneline
```

## Next work
Complete operational hardening with explicit unit tests for rollback/crash states, include journal bytes in bounded accounting, and introduce authenticated read-only Mundo API before pursuing actual generated source in an OS-isolated build worker.
