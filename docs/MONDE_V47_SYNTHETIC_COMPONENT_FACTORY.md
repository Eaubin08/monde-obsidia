# Monde V47 — Automatic Synthetic Component Factory (NON FREEZE)

## Actual backend functionality
V47 advances the V46 executable lab with a finite reusable template registry, a bounded in-memory job queue and a proposal-only company-needs bridge. It is not a new proof-only pass.

- `server/synthetic-template-registry.mjs`: three reusable templates, exact kind and required-capability match. No unknown or loose matching.
- `server/synthetic-build-queue.mjs`: submit, run, inspect and list. Each job has an ID, explicit QUEUED → RUNNING → TESTED_SYNTHETIC / FAILED transitions, test results and validated JSON artifact content with SHA-256 digest. Queue capacity is bounded; job inspection returns a defensive clone.
- `server/run-synthetic-build-queue.mjs`: opt-in CLI invokes full job lifecycle.
- `server/synthetic-need-bridge.mjs`: maps explicit HOLD need candidates to a review-only template suggestion. It never submits jobs, infers organization, approves an action or invokes Builder.
- `tests/synthetic-build-queue.test.mjs` and `tests/synthetic-need-bridge.test.mjs`: seven tests for actual job execution, three kinds, non-sovereignty, capacity, ambiguity and rejection.

## Run the real synthetic builder
```powershell
git pull --ff-only origin main
npm.cmd test
node server/run-synthetic-build-queue.mjs AGENT_CONFIG DemoAgent LAB
node server/run-synthetic-build-queue.mjs TOOL_CONFIG DemoTool LAB
node server/run-synthetic-build-queue.mjs WORKFLOW_CONFIG DemoFlow LAB
npm.cmd run build
npm.cmd run lint
git status
```

## Boundaries
- Queue and artifacts are **in memory**, not durable after process exit; V46 writes to a temporary folder only during each build and deletes it after tests.
- No arbitrary generated code execution, no model/LLM generator, no integration of generated agent/tool into an application or deployment.
- Jobs are executed sequentially when explicitly requested via run(id). There is no background queue processor.
- Node temp files are not an untrusted-code sandbox. Never execute code supplied by external agents in this process.
- Company needs and V35–V45 evidence HOLD remain non-authoritative. The bridge can propose a template but cannot submit a job.
- No KX108 decision; all production approval fields remain false.

## Next construction steps
V48: content-addressed artifact storage in a dedicated local lab directory, job manifest lifecycle and fail-closed verification of stored bytes. Then introduce a separately authorized sandbox executor with strict resource limits. Preview integration into Monde should consume read-only artifacts without granting deployment.
