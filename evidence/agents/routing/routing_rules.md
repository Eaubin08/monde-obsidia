# Obsidia Agent Routing Rules — Top 5 Bootstrap

> Extracted from `OBSIDIA_TOUS_LES_AGENTS.docx` where explicit.
> Fields marked TO_VERIFY have no verbatim source in the Top 5 section.

## Top 5 trigger → agent mapping

| Trigger type | Primary agent | Notes |
|---|---|---|
| Raw document / knowledge ingestion | `OBSIDIA_ATLAS_INGESTOR` | First pass; transforms raw matter into structured memory cards |
| Canon status check / freeze guard | `CANON_GUARDIAN` | Verdict only; never decides alone |
| Link / relationship between cards | `GRAPH_BUILDER` | Builds justified nodes/links; prevents vague graph inflation |
| Terminal / shell command needed | `TERMINAL_BUILDER` | Local-first; PowerShell/Bash commands with expected proof |
| Proof / CI / seal / Lean / TLA error | `PROOF_SENTINEL` | Distinguishes CI false-red from real invariant rupture |

## Claude Code skill → Obsidia agent mapping

| Claude Code skill | Obsidia agent | Mapping type |
|---|---|---|
| `read-only-inspector` | `OBSIDIA_ATLAS_INGESTOR` | reduced |
| `freeze-guardian` | `CANON_GUARDIAN` | reduced |
| `graph-calibrator-obsidia` | `GRAPH_BUILDER` + `CALIBRATION_PROCEDURALE` | composite |
| `terminal-builder` | `TERMINAL_BUILDER` | direct |
| `proof-sentinel` | `PROOF_SENTINEL` | direct |

## TO_VERIFY

- Inter-agent handoff protocol: TO_VERIFY.
- Escalation chain when `CANON_GUARDIAN` flags `CONFLIT`: TO_VERIFY.
- Conditions under which `PROOF_SENTINEL` escalates to `ALERTE_CANON`: TO_VERIFY.
- Dynamic Vertex AI vs local routing logic: TO_VERIFY.
- Exact integration point between registry agents and future local runtime: TO_VERIFY.

## Boundary rule

`agents/` is the Obsidia agent registry.

`.claude/agents/` is reserved for Claude Code subagents.

Do not mix the two.

