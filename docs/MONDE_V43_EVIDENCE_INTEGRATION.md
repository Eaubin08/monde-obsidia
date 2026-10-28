# Monde V43 — Evidence Integration Audit (NON FREEZE)

## Scope
This pass connects the existing V40 batch audit → V41 receipt capture → V42 receipt boundary → Builder review output. Previously V42 was callable in isolation and did not participate in an end-to-end Builder handoff.

New orchestrator `src/worldEvidenceIntegration.ts` accepts an explicit organization policy, rejects unavailable or foreign World Snapshots before any GET, captures local evidence receipts via the existing single-batch reader, and attaches V42 receipt violations to the related Builder review requests. Missing or ambiguous receipt identity fails closed. No data writes or Builder calls.

## Explicit findings
- The current GET reader validates structure and the source's own AVAILABLE flag, not authenticated source tenant ownership.
- A V41 receipt contains the World Snapshot revision, not a verified upstream registry revision. There is no demonstrated signed source receipt, trusted upstream ETag, atomic multi-registry snapshot or canonical journal integration.
- A successfully recomputed receipt digest is internally consistent but cannot prove signed origin. V43 retains SOURCE_SIGNATURE_NOT_VERIFIED and TENANT_SOURCE_AUTHENTICITY_NOT_VERIFIED.
- The source model is CSSA-specific; no universal inference about other companies is made.
- Review requests remain HOLD, buildApproved=false, deploymentApproved=false and executionAllowed=false regardless of field match.

## Tests
`tests/world-evidence-integration.test.mjs` includes integration checks for local unsigned receipts in the handoff, foreign tenant rejection before IO, stale snapshot rejection, and offline-source HOLD.

## Validation
This is code published to main, not runtime certification. Run npm.cmd test / npm.cmd run build / npm.cmd run lint on the exact published commit. Generated local-inventory observedAt changes during prebuild are not evidence of agent execution.

## Next action
Audit full existing test suite and build first. Then consider source-specific, authenticated tenant/version receipts only if supported by a real upstream contract. Do not invent version claims or a second sovereign journal.
