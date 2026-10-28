# Monde V41 — Local evidence receipts and changesets (NON FREEZE)

## Delivered
- `worldEvidenceReceipts.ts` creates deterministic SHA-256 local receipts from V40 batch-audit results, scoped to organization/revision/domain/capability/sourceRef, observed time, observed-record digest and projected object key.
- `verifyLocalEvidenceReceipt` recomputes the receipt hash to detect changes against the supplied receipt digest. It does **not** attest who created the receipt; a party who rewrites both data and digest can forge a locally valid receipt.
- `compareLocalEvidenceReceipts` compares two explicit sets: unchanged, added, removed, source digest changed, evidence status changed, snapshot revision changed, ambiguous and invalid receipts. Duplicate identities fail closed.
- The underlying V40 batch reader issues one GET per requested registry per capture. No POST, source mutation, Builder invocation or KX108 decision.
- All Builder review requests remain HOLD, with build/deploy/execute false.

## Boundaries
- Revision here is the World Snapshot controller revision, **not an independently verified source-registry revision/ETag**. No upstream ETag or verified version marker is available in the current source-reader contract.
- The receipt's observedAt is supplied by the caller. This is not a trusted timestamp.
- No external signature, authenticated origin, authenticated tenant identity, append-only journal, transaction boundary, trusted clock, revocation, or independent source integrity proof exists yet.
- A changed receipt sourceDigest is a change between **observations**, not necessarily an upstream change event. Different read times might sample different states.
- Captures and comparison are pure application-level operations. Durable storage and KX108 authorization are out of scope.

## Validation required
Run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, `git status` on the published HEAD before claiming V41 PASS. `prebuild` may refresh only the generated local inventory timestamp.

## Suggested next phase
Audit and harden the source contracts; only add true source-revision/ETag checks if upstream registries supply them. Design signed/persisted receipts around existing canonical authority and journal rather than creating a second sovereign store.
