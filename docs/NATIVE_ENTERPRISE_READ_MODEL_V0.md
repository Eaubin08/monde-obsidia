# MONDE_OBSIDIA_NATIVE_READ_MODEL_V0

Read-only enterprise territory that consumes the **persisted** canonical
Obsidia store. It does not generate business rules, cases, tasks or actions.

## Architecture

```text
obsidia-x108-proofs (native canonical stores)
        ↓
periphery.native_ops.monde_native_read_model_v0 (verified projection)
        ↓
server/native-enterprise-read.mjs (GET-only local bridge)
        ↓
GET /obsidia-local/native-enterprise
        ↓
Monde Obsidia / #enterprise
```

## Local requirements

Use a local checkout of `obsidia-x108-proofs` that contains branch
`feat/monde-obsidia-native-read-model-v0`, with the existing
`OBSIDIA_SOURCE_REPO` path configured if necessary.

Configure **existing, permitted** local runtime roots using environment
variables before `npm run dev`:

- `OBSIDIA_ENTERPRISE_SOURCE_RUNTIME_ROOT`
- `OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT`
- `OBSIDIA_ENTERPRISE_GOVERNANCE_ROOT`
- `OBSIDIA_ENTERPRISE_EXECUTION_ROOT`

Only configure paths that already exist and you are authorized to read.
None are required to start the UI, but without existing roots it shows
`UNAVAILABLE`; it never materializes fixture data automatically.
The four roots can be configured independently.

## Truth boundary

- existing agent-world projection remains unchanged;
- native CASE/TASK/FOLLOWUP state is replay verified;
- source packets and execution receipts have their hashes verified;
- KX108 decision record files, when available, are displayed as observed
  **without** asserting full replay verification;
- absent persisted `Interpretation`, `ActionCandidate`, or
  `ProviderBinding` objects stay `UNAVAILABLE`;
- no Gmail, Google Calendar, database, or other provider is contacted;
- no network/dispatch route was added (only GET).

## Verify

`npm test`

`npm run build`

Core read-model tests and full-loop E2E run in the separate
`obsidia-x108-proofs` GitHub CI workflow.

No main merge.
