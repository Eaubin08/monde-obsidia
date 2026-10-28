# Monde V39 — Field Integrity and Semantic Replay (NON FREEZE)

## Implemented
- `worldFieldIntegrity.ts`: compares explicitly mapped source record fields to a limited set of projected World Object fields (`label`, `identity.id`, `source.id`). Missing source fields are not interpreted as empty values. It preserves V38 identity and temporal cross-check outcomes.
- Deterministic canonicalization of JSON-like objects and FNV-1a 32-bit fingerprints allows local change comparison. These hashes are **NOT cryptographic hashes or integrity attestations**.
- `worldSemanticReplay.ts`: reports field-level equality/divergence alongside V38 provenance and maintains Builder HOLD / no build, deploy, or execution approval.

## Important limitations / blocking facts
- Source and projection are read independently. V39 makes multiple independent GET passes; it cannot establish transactional equality across passes, even if individual field comparisons match.
- The source reader validates permitted collection and exact record ID, but does not verify an original file signature, authenticated tenant owner, canonical event receipt or provenance chain.
- Fingerprints are of differently shaped objects, so their different values are not themselves a field divergence. Explicit per-field comparisons are the actual equality test.
- No generic nested field mappings; no claim of semantic understanding, capability implementation, source authenticity, audit persistence or authorization.
- Verification continues fail-closed and KX108-only at authority level; this UI analysis never invokes KX108.

## Validation
Run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint` at the exact Git HEAD; only report PASS from observed output. Prebuild may regenerate an inventory observation timestamp. Do not commit it inadvertently.

## Next
Single-batch evidence read to eliminate multiple independently fetched source passes; authenticated source receipt and cryptographic digest over canonical bytes (not FNV1A32); real tenant-bound verification and replay storage.
