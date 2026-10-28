# Monde V46 — Executable synthetic Builder laboratory (NON FREEZE)

## Real functionality implemented
- `server/synthetic-builder-lab.mjs`: executable Node backend factory with `planSyntheticBuild`, `renderSyntheticComponent`, `executeSyntheticBuild`.
- Supports three **fixed and synthetic** component kinds: `AGENT_CONFIG`, `TOOL_CONFIG`, `WORKFLOW_CONFIG`. Input must explicitly specify `SYNTHETIC_ONLY`, validated organization and component IDs. Arbitrary shell commands, generative code and production modes are rejected.
- Writes a real `component.json` to an OS-managed temporary directory, reads it back, runs six invariant checks, hashes the built artifact with SHA-256, and removes the temporary directory in a finally block. It returns the artifact contents in memory for inspection; does not persist it to any project or deploy it.
- `server/run-synthetic-builder.mjs`: opt-in demonstrator. Run `node server/run-synthetic-builder.mjs AGENT_CONFIG DemoAgent LAB`.
- `tests/synthetic-builder-lab.test.mjs`: tests synthetic agent/tool/workflow construction, invariant testing, deterministic payload, and rejection of production/unsupported/path-like input.

## Critical boundaries
This lab is a **real automatic artifact-generation and test cycle**, but the produced artifact is a static, safe configuration; it is **not a functioning agent, executable tool, LLM-based generator, authorized Builder, or self-modifying deployment pipeline**. The Node server has normal process permissions; use in CI/test environment, not as a security sandbox for untrusted code. There is no code execution of generated artifacts.

The code is deliberately not called from `worldBuilderReviewHandoff` or V35–V45, whose review requests retain `HOLD` and buildApproved/deploymentApproved/executionAllowed=false. KX108 remains the sole specified decision authority. No approval bypass is introduced.

## Next practical development
1. Validate V46 global tests/build/lint at the published HEAD.
2. Introduce a bounded **synthetic build-job queue** with explicit, testable transitions and durable manifest only in a dedicated lab directory.
3. Add reusable component manifest + template registry, detect existing matching templates, and record test evidence.
4. Integrate a **proposal-only** bridge from company needs to a synthetic build plan; any execution remains explicitly separated and synthetic opt-in.
5. Add a controlled artifact preview in Monde, then connect genuinely authorized generators only when governance is proven.

## Local commands
`git pull --ff-only origin main`
`npm.cmd test`
`node server/run-synthetic-builder.mjs AGENT_CONFIG DemoAgent LAB`
`npm.cmd run build`
`npm.cmd run lint`
`git status`

Prebuild may regenerate only `public/data/local-inventory.json` observation timestamps; review diff before cleaning.
