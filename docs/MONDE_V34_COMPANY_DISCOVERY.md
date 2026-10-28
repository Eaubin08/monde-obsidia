# Monde V34 — Company discovery / needs / Builder review (NON FREEZE)

## Observed sources, bounded claims
The V34 pipeline uses the current World Snapshot only in READY/DEGRADED phases; stale IDLE/LOADING/UNAVAILABLE snapshots generate zero discovery or Builder requests.

**Company Discovery V0** inventories observed domains and capabilities. An absent feature is not automatically a business need.

**Capability gap candidates** require an explicit expectation with domain, capability ID, reason and source reference. The reference is carried verbatim as provenance *claim*; it is NOT verified as an existing file or authenticated requirement by this layer.

**Need Candidates V0** classifies unresolved expectations as INSUFFICIENT evidence / HOLD.

**Builder Review Handoff V0** prepares review-only records with buildApproved=false, deploymentApproved=false, executionAllowed=false. No network call, build, proposal approval, or deployment occurs.

## Scope and limitations
The CSSA diagnostic calls discovery with **no** invented expectations; it therefore cannot report synthesized needs or a fabricated Builder queue. Future verified requirements can feed expectations only after their upstream source and organizational scope are assessed.

Missing/ambiguous/foreign organization data remains outside current verified scope. READY/DEGRADED does not imply global transactional consistency. The observer/renderer cannot authenticate roles, discover unknown enterprise sources autonomously, authorize actions, or execute Builder work. KX108 remains the final authority in the wider architecture, not an action performed by this code.

## Validation
After pulling main, run `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run lint`. Capture exact outputs and the SHA. No freeze from publishing the files.
