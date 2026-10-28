# Monde V42 — Evidence receipt boundary / contradictory audit (NON FREEZE)

## Concrete source contract findings
The existing readers obtain CSSA Business, Ops, CRM state through three independently requested GET endpoints. The only source availability check inspected is `_source.status === 'AVAILABLE'`. Business, Ops and CRM readers validate required collection/record structure. Their current contracts do not validate a cryptographic signature, authenticated tenant ownership, trusted source revision, ETag, canonical journal receipt or atomic multi-registry snapshot.

V41 receipts contain the **snapshot controller revision** and caller-supplied observation time. Neither field represents independently attested upstream source history. Adding a `sourceRevision` value without reading it from the actual source would fabricate a guarantee; V42 deliberately does not.

## V42 implementation
`worldEvidenceReceiptBoundary.ts`: fail-closed examination of locally constructed receipts. Checks requested organization, duplicated receipt identity, required identity fields, safe snapshot revision, observation freshness, SHA-256 digest format, recomputed receipt digest. It always retains blockers for unverified source signature and tenant ownership. Does not assert trusted approval even if every local check succeeds.

`tests/world-evidence-receipt-boundary.test.mjs`: five contradictory scenarios, including foreign tenant, duplicates, altered receipt, malformed or stale timestamps, and missing source digest.

## Trust limits and next stage
- A self-hashed receipt is **not** a signed receipt. Recomputing a SHA-256 digest detects accidental/inconsistent mutation but cannot establish authentic origin.
- A local URL/GET response is not per-record tenant authentication.
- No Builder call, data modification, persistent audit journal or KX108 decision.
- Next priority: obtain authentic source revision and tenant claims from the upstream contracts, then verify them with a trusted identity and replay boundary. If absent, remain HOLD.
- On the published SHA, run test/build/lint locally; V42 publication is not equivalent to validated runtime.
