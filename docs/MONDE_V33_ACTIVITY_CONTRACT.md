# Monde V33 — Activity Context / render plan (non-freeze)

## Runtime path
Canonical GET registries → CSSA World Snapshot → World Read Model → World Object Graph → Company Model / Capability Registry → UI Composition Contract → semantic UI Composer → Activity Plan.

## Contract boundaries
- Activity selection requires an exact unique key belonging to the current organization's available read model. Unknown / foreign / missing-source keys are unresolved.
- `roleLabel` is user-declared presentation metadata, **not** a verified role, authentication, access control, or permission.
- `preferredDomains` changes only display order, never object visibility or data access.
- `focusedObjectKey` emphasizes an observed object; it cannot select a foreign entity or authorize a tool call.
- Phase `IDLE`, `LOADING` or `UNAVAILABLE` produces zero projected territories or context regardless of a previously held snapshot.
- `READY` / `DEGRADED` reflect reported independent registry availability, not an atomic organization transaction.
- Any invocation, tool capability, mutation or approval must pass through its own real authorization boundary; this projection always says authority `NONE`, decision authority `KX108_ONLY`.

## Evidence limits
The current CSSA diagnostic is an opt-in renderer and not proof of the full future UI, authenticated role management, a working Builder or a real Kopilot connection. V33 fixtures cover a hypothetical factory organization to test generality of the projection. The model is not yet a discovered real company bootstrap.

## Validation
Run `npm.cmd test`, `npm.cmd run build`, `npm.cmd run lint` against the same checkout and record the passing command output and commit SHA before claiming validation.
