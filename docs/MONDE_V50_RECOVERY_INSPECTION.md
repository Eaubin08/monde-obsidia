# Monde V50 — Read-only recovery inspection (NON FREEZE)

## Delivered
`server/synthetic-build-recovery.mjs` inspects a persisted synthetic job journal and its stored artifact, without running, resuming, approving or deploying a job. It classifies interrupted jobs as `INTERRUPTED_UNRESUMABLE`, missing journals as `MISSING_JOURNAL`, and valid stored jobs as `CONSISTENT_STORED`. Inconsistencies stay HOLD.

The bounded `inventory({limit})` enumerates up to the declared maximum and explicitly reports `truncated:true` if more jobs exist. It does not claim completeness when truncated.

`tests/synthetic-builder-v50-recovery.test.mjs` adds four scenarios: interrupted HOLD, journal/store reconciliation, bounded inventory and missing/invalid identity.

## Boundaries
V50 provides inspection and classification, **not automatic crash recovery or durable queue resumption**. No production deployment, no user-generated code execution, no KX108 decision, no HTTP API. The V49 journal is locally hash-linked and unsigned. The V48 artifact store is not an adversarially secure sandbox. A crash between saving an artifact and recording its final event leaves `STORE_EVENT_MISSING`; never infer approval. No new durable job processor is present.

## Validate
Pull published HEAD; run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, `git status`. V43–V50 have not been locally confirmed in this session. Last user-provided log showed V42 419/419 PASS.

## Next implementation priority
Make a transaction-aware lab job service with a single writer, bounded disk quota, real OS sandbox controls for any future code generator, and an authenticated read-only API for World integration. Do not silently promote `CONSISTENT_STORED` into deployment authorization.
