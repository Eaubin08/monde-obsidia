# Monde V36 — Canonical Evidence Links and replay (NON FREEZE)

## Scope
V36 binds explicit expectation sourceRef to evidenceRefs already present on unique AVAILABLE World Objects in the current snapshot, within the expected domain and organization. The source time observedAt must parse and fall within the caller-supplied maxAgeMs relative to now; missing, future and stale observations fail closed.

The deterministic replay combines: V34 declared expectations, V35 requirement assertion checks (no external authentication), V36 projected canonical links, conservative Builder readiness and review requests. Returned requests remain HOLD with buildApproved/deploymentApproved/executionAllowed=false.

## Important boundaries
This is a link to an *existing canonical projection*, not a direct file fetch, signed evidence attestation, cryptographic source authenticity check or transactional snapshot. An observed evidenceRef alone does not prove a verified business requirement or capability absence. Replay is deterministic for the same explicit inputs, but no durable audit event has been persisted and no KX108 authorization has run.

## Next integration steps
1. Implement per-registry proof adapters that retrieve current canonical records from their real origin and validate evidence identities.
2. Preserve original source timestamps, integrity hashes, unique source IDs and organization scope.
3. Add tamper-evident replay persistence once a canonical journal is available; don't invent a parallel authoritative log.
4. Run npm test, TypeScript/Vite build and lint locally before asserting V36 PASS.
