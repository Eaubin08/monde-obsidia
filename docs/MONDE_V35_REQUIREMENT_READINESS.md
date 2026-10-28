# Monde V35 — Requirement evidence & Builder readiness (NON FREEZE)

## Scope and contracts
- `worldRequirementVerification.ts`: accepts supplied source reference evidence with exact organization, domain and capability. Missing and foreign matches do not verify a requirement. Duplicate verified evidence or conflicting reject/verify evidence is marked CONFLICTING_EVIDENCE.
- `worldBuilderReadiness.ts`: classifies missing observation as UNKNOWN_SOURCE or NOT_OBSERVED_IN_CURRENT_MODEL; output remains HOLD even when a supplied reference is VERIFIED_REFERENCE.
- `worldBuilderReviewHandoff.ts`: passes blockers to review-only requests, while buildApproved=false, deploymentApproved=false and executionAllowed=false remain immutable.

## Epistemic limits
The module checks **the internal consistency of supplied evidence assertions**. It does NOT query a canonical requirement store, cryptographically validate evidence IDs or prove the requirement's source document exists. VERIFIED_REFERENCE means a unique matching supplied assertion, NOT an independent forensic verification of source authenticity. A missing capability in this model does not prove absence in the company.

Source selection and authority remain separate. No Builder execution, mutation, approval or KX108 decision occurs in V35. An authorization system with genuine proof will require a separate gate before any action.

## Validation and next steps
Execute `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint` on the same commit before marking integration PASS. Next: provenance-backed canonical evidence adapters, explicit validity and freshness checks, policy-controlled handoff and replayable audit trail.
