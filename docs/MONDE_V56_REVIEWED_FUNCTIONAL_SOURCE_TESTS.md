# Monde V56 — Functional tests of strictly reviewed sources (NON FREEZE)

## What is actually implemented
V56 adds `server/reviewed-software-functional-tests.mjs`. After V54 static validation and **byte-for-byte template equality**, it executes only the three finite V54 templates using Node's `vm.Script` with 100 ms per functional case and disabled string/wasm code generation in the context. Assertions cover PURE_TOOL string transformation, PURE_WORKFLOW array processing, and PURE_AGENT_DESCRIPTOR metadata. No arbitrary input code is evaluated.

`server/synthetic-source-build-pipeline.mjs` now requires those functional tests before writing a source-job record; it persists the functional evidence in the V55 manifest and independently reruns the deterministic cases during inspection to identify altered evidence. The V55 public status `STORED_SOURCE_NOT_EXECUTED` is preserved for compatibility; V56 adds `functionalStatus: FUNCTIONAL_TESTED_LAB`. This legacy status now means source was not deployed or executed in the World, **not** that local functional testing did not occur.

`tests/synthetic-source-functional-v56.test.mjs` adds five test cases: all three reviewed behaviors, rejected forged code even with a recalculated SHA, persistence/restart evidence, tampering and unsupported input.

## Critical trust boundary
Node `vm` is **NOT an OS-level security sandbox**. The timeout is not an enforceable per-process CPU/memory/network boundary. The reviewed source is hardcoded and exact-match checked; this code must never execute LLM-generated code, externally sourced JavaScript, or unreviewed templates. No worker isolation, container, WASM capability boundary or network isolation has been demonstrated. Generated software is not authorized for deployment or integration, and the KX108 decision authority is not invoked.

## Run
```powershell
cd "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS\monde-obsidia-git"
git pull --ff-only origin main
node server/run-synthetic-source-build.mjs "$env:TEMP\obsidia-source-builder-v56" PURE_TOOL Demo1 LAB
npm.cmd test
npm.cmd run build
npm.cmd run lint
git status
git log -1 --oneline
```

## Status
CODE + TEST WRITTEN; global V43–V56 execution on exact published HEAD remains unconfirmed. Last user-provided successful local suite was V42 419 tests PASS. Next milestone: actual process/container security isolation to support broader source generators, enforcing resource/network/FS controls, plus authenticated read-only preview integration. Do not advertise V56 as untrusted-code sandbox.
