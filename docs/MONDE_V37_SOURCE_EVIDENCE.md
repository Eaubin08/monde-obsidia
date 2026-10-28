# Monde V37 — Source-backed evidence / replay (NON FREEZE)

## Real reader boundary
`worldCanonicalSourceReader.ts` calls existing validated read-only local GET endpoints:
- `/obsidia-local/cssa-business-state` (Business collections)
- `/obsidia-local/cssa-ops-state` (tasks)
- `/obsidia-local/cssa-crm-directory` (CRM collections)

Readers require valid collections and source metadata `_source.status === 'AVAILABLE'`. The connector returns exact ID matches only; zero matches, duplicates, unknown registries and errors cannot confirm an object. The connector does not POST/PUT/DELETE. Each requested registry is fetched once per batch.

## V37 replay
`worldSourceBackedReplay.ts` requires an **explicit mapping** from requirement `sourceRef/domain/capabilityId` to the specific registry/collection/record ID. It does not equate a requirement reference to an arbitrary record ID. A source-observed record must carry a usable source observation timestamp within the caller policy to count as fresh. Missing, ambiguous, stale and unavailable records remain blocked. All review requests remain HOLD and never grant build/deploy/execute authority.

## Evidence limitations
- A registry object match proves only that a **local GET reader returned a matching record under available source metadata**. It does not establish a signed document, cryptographic integrity, immutable timestamp, independently verified organization association, actual capability absence, requirement validity, or execution rights.
- The V37 source timestamp is registry-supplied; it is not independently authenticated.
- CSSA is the first concrete adapter; universal multi-company source adapters remain future work.
- Replay output is computed, not written to a durable canonical journal.
- The local browser UI remains a diagnostic testbed. No source mutation or Builder call is made.

## Validation
Run tests, build and lint locally on a recorded Git SHA before claiming PASS. Prebuild may update `public/data/local-inventory.json` observation time; inspect the diff rather than committing a generated timestamp accidentally.
