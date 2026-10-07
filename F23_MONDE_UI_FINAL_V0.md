# F23 — Monde UI Final V0

Status: IMPLEMENTED / VALIDATION REQUIRED

## Purpose

Finalize the Monde UI as a readonly projection of observed Obsidia state.

The UI must never become a competing truth model, memory authority, cognitive authority or execution surface.

## Existing UI reused

F23 reuses the existing Monde / Workspace / Pokémon ecosystem:
- spatial Monde zones;
- live sessions and missions;
- domains;
- governance / decision / receipt / rollback / impact objects;
- R&D branches/worktrees;
- documentary layers;
- shared context bridge;
- Workspace and Pokémon linked views.

No second UI shell is created.

## Projection contract

The shared state now exposes an explicit `projectionContract`:

- `observationIsTruth = false`
- `worldStateIsMemory = false`
- `worldStateIsCognition = false`
- `domainIsAuthority = false`
- `provenanceIsEvidence = false`
- `generatedIsPhysicalTruth = false`
- `candidateRealityOnly = true`
- `decisionAuthority = KX108_ONLY`
- `allowedToDecide = false`
- `allowedToAct = false`

These are projection invariants, not user-selectable controls.

## UI visibility

The Monde header now displays the truth boundary directly:
- READ_ONLY state;
- projection schema;
- candidate-reality status;
- canonical-truth status;
- observation/truth separation;
- decision/ACT prohibition;
- KX108 authority.

This makes the architectural boundary visible instead of leaving it implicit.

## Separation rules

`Monde projection != canonical truth`

`WorldState != memory`

`WorldState != cognition`

`Domain != authority`

`Provenance != evidence`

`Generated != physical truth`

`UI != decision surface`

## Authority

F23 does not add:
- decision buttons;
- ACT authorization;
- memory writes;
- kernel mutation;
- domain authority;
- truth promotion.

The existing operational launchers remain tool/session launchers. They do not change the readonly status of the Monde projection.

## Next phase

F24 — Global Regression / Negative Tests.

No F24 freeze verdict before the Monde UI build/tests are validated.
