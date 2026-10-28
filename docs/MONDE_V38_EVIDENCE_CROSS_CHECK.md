# Monde V38 — Source / projection cross-check (NON FREEZE)

## Implemented
- `worldEvidenceCrossCheck.ts`: explicit evidence expectation → source record binding → unique same-organization current World Object, matching domain and identity, matching evidenceRef, observation-time comparison.
- `worldCrossCheckedReplay.ts`: provenance nodes for declared expectation, local GET source record and projected object, with per-request conservative Builder blockers.
- Read-only GET through V37 readers; no store mutations, Builder invocation, authorization or durable audit journal.

## Verifiable verdicts
- STRUCTURALLY_CONSISTENT is a **structural correspondence only**: it is never cryptographic integrity, source authenticity, runtime capability or permission.
- SOURCE_UNRESOLVED, PROJECTED_OBJECT_UNRESOLVED, IDENTITY_OR_REFERENCE_DIVERGENCE, FRESHNESS_NOT_ESTABLISHED, OBSERVATION_TIME_DIVERGENCE, BINDING_AMBIGUOUS_OR_MISSING preserve uncertainty.
- Missing, stale or future source timestamps fail closed; timestamps are registry metadata, not certified timestamps.
- Matching timestamps does **not** establish atomicity of the source and snapshot reads.
- The explicit objectKey binding is required; no match by label or inferred relation.
- Every Builder request remains readiness HOLD; buildApproved/deploymentApproved/executionAllowed=false.

## Limitations
- The CSSA local GET adapters are concrete but not universal multi-tenant connectors. Read-model tenant filtering does not authenticate the raw external source's tenant.
- Source record fields are not deeply compared to the projection; verified integrity hashes and signed source receipts are not implemented.
- Replay is in-memory and deterministic with fixed supplied inputs and fixture GET data, not persisted or signed.
- This is non-freeze. Validate with `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint` on the exact HEAD before marking PASS.
