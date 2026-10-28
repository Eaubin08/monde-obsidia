# Monde V51 — Unified Synthetic Builder Service (NON FREEZE)

The V51 service integrates existing V46–V50 lab components in a single explicit workflow: validated synthetic request → queued journal event → running event → temporary component generation → six automatic tests → tested event → content-addressed persistent artifact → verified readback → stored event → recovery consistency check → read-only preview.

Files: `server/synthetic-builder-service.mjs`, `server/run-synthetic-builder-service.mjs`, `tests/synthetic-builder-v51-service.test.mjs` (four end-to-end scenarios).

## Explicit launch
```powershell
git pull --ff-only origin main
node server/run-synthetic-builder-service.mjs "$env:TEMP\obsidia-builder-v51" AGENT_CONFIG DemoAgent LAB
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
```

## Security/operational limits
The service is not an HTTP server nor autonomous worker. Calls to `submit` and `run` are explicit. It uses a process-local busy flag (not an interprocess file lock). Multiple OS processes sharing the same lab root are not supported as a hardened concurrent deployment. Queued jobs are in-memory; restart permits read-only inspection but not automatic re-execution. Ordinary filesystem permissions apply. SHA-256 journal and artifacts are unsigned and unauthenticated. A failure in a multi-file transaction may leave incomplete states, which remain HOLD under recovery inspection.

Components are deterministic synthetic JSON configurations; no arbitrary executable code, real agents, plugins, deployed interfaces or actual production builds are generated. No source registry mutation or KX108 authorization. All approvals are false.

## Validation status
Published CODE and tests, NOT yet independently executed on V51 HEAD. Last user-confirmed suite 419/419 on V42. Run all commands before accepting V51 as validated.

## Next milestone
V52: multi-process locking and bounded disk quotas, service-level recovery tests, then a restricted read-only endpoint for Monde preview. Only after source-backed authorization and resource isolation should realistic generator drivers be introduced.
