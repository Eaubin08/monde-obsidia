# Monde V5 — Repair ledger — 2026-10-08

Branch: `repair/monde-v5-runtime-freeze-20261008`

Purpose: close the already-audited repair backlog before V5 regression/freeze. This is not a new feature phase.

## Validated on FIXE

### Build / tests

```text
npm.cmd test
28 tests
28 pass
0 fail
0 skipped

npm.cmd run build
tsc -b && vite build
PASS
```

Observed build:

```text
vite v8.3.2
24 modules transformed
built successfully
```

### Repair status

| Repair item | Status | Evidence |
|---|---|---|
| Cross-view Monde ↔ Workspace ↔ Pokémon | STATIC PASS | `V5 cross-view navigation stays wired` |
| V5 guard / active frontend | STATIC PASS | `V5 is the active frontend and has one primary navigation` |
| Workspace launcher routes | STATIC PASS | `Workspace launchers map to real bridge routes` |
| Qwen diagnostic log | STATIC PASS | bridge reads `jarjar_qwen_text_llama.log` |
| Qwen text launcher aligned to frozen runtime | PASS | local GGUF, frozen b11193 preferred, no automatic network fallback |
| Sigma READY projection | STATIC PASS | `API_READY_UNVERIFIED`, no verified READY inferred from API alone |
| Pokémon Disponible / Inactif | STATIC PASS | catalog available/inactive lifecycle test |
| Jarjar telemetry in Pokémon | STATIC PASS | shared runtime projection + telemetry fields |
| Kernel/API canonical process identity | STATIC PASS | READY requires canonical process identity |
| Production build | PASS | TypeScript + Vite build successful |

## Qwen freeze alignment

Monde Jarjar launcher now follows the validated Jarjar/Qwen freeze:

- preferred llama.cpp: `%USERPROFILE%\Desktop\llama-b11193\llama-server.exe`
- preferred Qwen text model: `%USERPROFILE%\Desktop\MODELS\QWEN\qwen2.5-3b-instruct-q4_k_m.gguf`
- no `-hf` / `-hfr` / `-hff` automatic fallback
- no automatic cleanup/re-download of Hugging Face partials
- local retry only
- Qwen text port: `:8080`
- Qwen-VL port: `:8081`

## Remaining validation before repair phase closes

The static/source repair backlog is green. Remaining work is physical/UI validation on the fixed machine:

1. launch Monde V5 from this branch;
2. verify Pokémon → Workspace opens the expected area;
3. verify Monde/Recherche → Pokémon selects the expected agent;
4. verify Sigma is not displayed as verified READY merely because API `:8000` is up;
5. verify Disponible / Inactif agents render as intended;
6. verify Jarjar telemetry is visible in Pokémon while Jarjar is live;
7. verify launcher status reflects canonical Kernel/API/Qwen/Qwen-VL processes.

Only after these physical checks should the repair phase be marked closed and the final V5 regression/audit/freeze begin.
