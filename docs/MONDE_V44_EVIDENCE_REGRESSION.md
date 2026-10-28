# Monde V44 — Evidence regression and Builder boundary consolidation (NON FREEZE)

## Evidence from user local checkout (V42 only)
The supplied PowerShell log on HEAD `be91ee7` reports 419/419 passing tests, `tsc -b && vite build` completed (117 transformed modules, bundle-size warning), and oxlint finished with 0 errors and 25 warnings. `public/data/local-inventory.json` was regenerated only for observedAt and the local git working tree was dirty at that point. This **does not validate the later V43/V44 commits**.

## Reviewed paths
Existing readers: `src/cssaBusinessRead.ts`, `src/cssaTasksRead.ts`, `src/cssaCrmReadOnly.ts`; source status: `src/cssaLinkedReference.ts`; snapshot: `src/cssaWorldSnapshot.ts`; cross-contract pipeline: `src/worldEvidenceBatchAudit.ts` → `src/worldEvidenceReceipts.ts` → `src/worldEvidenceReceiptBoundary.ts` → `src/worldEvidenceIntegration.ts` → review-only Builder handoff.

## Concrete V44 hardening
- In `worldEvidenceIntegration.ts`, an exact review tuple (domain, requestedCapability, sourceRef) must correspond to **exactly one captured local receipt**; absent/duplicate receipt identities add `MISSING_OR_AMBIGUOUS_CAPTURE_RECEIPT`.
- Repeated declared expectation tuples are explicitly marked `DUPLICATE_EXPECTATION`. No arbitrary duplicate selection is treated as authoritative.
- The receipt boundary V42 violations continue to propagate to every review; Builder always HOLD with buildApproved/deploymentApproved/executionAllowed=false.
- Five adversarial tests cover duplicate expectations, duplicate bindings, missing bindings, apparent field equality with unsigned receipt, and foreign organization rejection before network IO.

## Open problems / honest boundaries
Source status is a local declaration; upstream tenant ownership, source revision/ETag, authenticated timestamp, signed origin, atomic cross-registry snapshot, and KX108 decision are not established. No source writes, Builder execution, or source schema fabrication.

## Validation gate
V44 is **CODE + TEST WRITTEN**, not runtime PASS until local `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint`, and `git status` are observed on the same HEAD. The expected test count is approximately 428 (V42 419 + V43 4 + V44 5), assuming no other changes. Prebuild can update `public/data/local-inventory.json` timestamp; inspect before restoring/committing.

## Next step
Consolidate overlapping audits after regression evidence, reduce redundant source reads in legacy V38/V39 paths only with measured parity, and implement real authenticated registry/version receipts only if supported by upstream code.
