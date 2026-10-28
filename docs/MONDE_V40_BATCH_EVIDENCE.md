# Monde V40 — Single-batch evidence observation (NON FREEZE)

## New path
`worldEvidenceBatch.ts` makes exactly one validated GET per requested registry within a single audit call (Business, Ops, CRM), using the existing V37 source reader. `worldEvidenceBatchAudit.ts` performs explicit identity, evidenceRef, timestamp, and field comparison over those SAME fetched records. Unlike the V39 semantic replay, it does not perform separate GET passes for its individual checks.

## Reproducible evidence digest
SHA-256 digest over deterministically ordered JSON encoding of a returned record. This proves repeatability of the encoded bytes under the same inputs, **not** authenticity: the origin is an unsigned local HTTP response. No signature or trusted source receipt is verified. Digest is not a provenance attestation and does not prove data completeness or a company capability is absent.

## Freshness / non-atomicity
Source and projected World Object timestamps must each fall within the caller-supplied time policy and must agree for the matching verdict. Source timestamps are still untrusted local metadata. A one-GET-per-registry batch is **not** an atomic transaction across registries, nor an atomic comparison with an earlier World Snapshot. Output therefore always declares `NON_ATOMIC`.

## Builder authority
All derived Builder review requests remain HOLD. `buildApproved`, `deploymentApproved` and `executionAllowed` are hard-coded false. This module never calls the Builder or KX108 and never writes source records.

## Follow-up
Add authenticated tenant-scoped origin receipts, revision/ETag pinning when genuinely supported upstream, durable canonical replay, and tests against real connected source versions. V40 is not a freeze until full test/build/lint logs from the checkout confirm it.
