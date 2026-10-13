# RECONCILE V1 REGISTER — monde-obsidia

Branch: `reconcile/monde-obsidia-v1`
Date: 2026-10-13
Status: **ORGANIZATION_RECONCILED — UI_VALIDATION_PENDING**

Organizational closure tag: `org-reconciled/monde-obsidia-v1-20261013`, placed on the commit that contains this register. It certifies the Git organization only. **It is not a runtime freeze and not a certified UI freeze.**

**What this closure means:** the V5 reference is organized and every historical development is traced below. **It does not mean that older features were ported to V5.** Nothing listed as kept separate is abandoned.

No source branch was modified. Nothing was deleted. Nothing was merged into `main`. No PR was opened, closed, modified or merged. No other repository was touched.

## 1. Base (controlled moving base)

| Item | Value |
|---|---|
| Base | `main` @ `80bd4faad3faf48c57dc62799fd8b4bfcf02a5c6`, head of `main` when the branch was created |
| Minimal reference authorized | `6ad14b657e70600e77557018e3d02e49b9b6e734` |
| Check | the base descends from the minimal reference (ahead 2, behind 0, no history rewrite) |
| Commits since the minimal reference | `0e96924c3fccf9f6a7b1221f7c2e1c2ae33c1982`, `80bd4faad3faf48c57dc62799fd8b4bfcf02a5c6` — only `src/CSSAPage.tsx` and `src/CSSAPage.css` |
| Live interface | `src/main.tsx` mounts `V5Root.tsx`. `Ecosystem.tsx`, `App.tsx`, `LivePokemon.tsx`, `ToolWorkspace.tsx` are earlier-generation UI files still in the tree but not mounted; `Ecosystem.css` is still imported by V5 |

`main` is under active development (it moved four times on 2026-10-13 during this work). This branch is fixed on the SHA above and does not follow later commits.

## 2. Integrated

| # | Source | Source SHA | Method | Resulting commit | Content |
|---|---|---|---|---|---|
| 1 | `audit/monde-v5-final-flows-20261008` | `642834889d754d72ff98f0dd17630b7711eaa8e4` | merge commit | `3b27091bf00ecc8b7b030a081e8c3e29811f8df0` | 2 commits; adds `docs/MONDE_V5_FINAL_FLOW_AUDIT_2026-10-08.md` (blob `c335dc8e8a822dd7db9dab27a95884721b63037b`, identical to the source) |
| 2 | `post-v5/obsidure-mathmemory-audit-20261008` | `29fbffa69e1ce3f947a6cec56a443ea0413fbb7f` | merge commit | `07b83acb1ae1684b3c60b35ded94ecd75639420f` | 1 commit; adds `docs/OBSIDURE_MATHMEMORY_PATCH_PROPOSAL_2026-10-08.md` (blob `e41c9bc9808b04bfdba232a8c2907a978a85bcce`, identical to the source) |

Relative to the base, the branch adds exactly these two files. No UI or server file differs from the base.

## 3. Reconciliation-only commits

| SHA | Purpose |
|---|---|
| `f277529fd4567fc6c8715b47d86bb95f52624fca` | `.github/workflows/launchers.yml`: push trigger extended to `reconcile/**`. Jobs and tests unchanged |
| (this commit) | adds this register |

## 4. Developments kept separate — exhaustive list

Method: for each branch that is not an ancestor of `main`, files changed since its fork point were compared to `main`. "Present in main" is the share of the branch's added lines (longer than 14 characters) found in the current `main` version of the same file. Measured against `main` @ `56aabc7a8a1995cae018895a1269074498b3fee6`; the 4 later commits of `main` only touch `src/CSSAPage.*`, which none of these branches modifies.

### Pokémon / cockpit

#### `feat/shared-obsidia-state-v0`

- Head: `2416e306328dc7bf710c8d5df4662ca41a9f6b5b` — fork point `6b38e100e833d2aef65447d3a37ab963bf7e1279` — 28 commit(s) ahead of `main`
- PR: PR #1 squash-merged
- Unique functionality: Shared read-only Obsidia state projection across World, Workspace and Pokémon views; canonical Sigma domains and agents
- Dependencies: none
- Status and porting conditions: ALREADY_IN_BASE (squash). Branch is the only holder of the 28 original commits
- Files:
  - `server/local-bridge.mjs` (modified, +21/-1) — 88% present in main; main also changed it since the fork
  - `server/obsidia-state.mjs` (added, +86/-0) — 94% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +9/-6) — 0% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +12/-3) — 42% present in main; main also changed it since the fork
  - `src/SessionControls.tsx` (modified, +1/-1) — 100% present in main; main also changed it since the fork
  - `tests/domain-agent-binding.test.mjs` (added, +35/-0) — 100% present in main; main also changed it since the fork
  - `tests/launchers.test.mjs` (modified, +14/-0) — 100% present in main; main also changed it since the fork
  - `tests/obsidia-state.test.mjs` (added, +31/-0) — 100% present in main; main also changed it since the fork

#### `feat/proof-decision-impact-v0`

- Head: `2975763d2a9dafe1001e19e721d76c9dd41d0855` — fork point `295e40e75d411c4593c59571a51b92898182612d` — 7 commit(s) ahead of `main`
- PR: PR #2 squash-merged
- Unique functionality: Canonical decisions, receipts, evidence and impacts projection; runtime evidence sanitizer
- Dependencies: PR #1
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `server/local-bridge.mjs` (modified, +32/-1) — 93% present in main; main also changed it since the fork
  - `server/obsidia-state.mjs` (modified, +30/-2) — 92% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +3/-3) — 33% present in main; main also changed it since the fork
  - `tests/proof-decision-impact.test.mjs` (added, +38/-0) — 100% present in main; main also changed it since the fork
  - `tests/runtime-evidence-sanitizer.test.mjs` (added, +33/-0) — 100% present in main; main also changed it since the fork

#### `feat/mission-timeline-v0`

- Head: `5be67992a8b77beb280491324be858e4607b284a` — fork point `c4a57550751ce07f32a6416693dcc65516ea106f` — 5 commit(s) ahead of `main`
- PR: PR #3 squash-merged
- Unique functionality: Mission timelines from exact canonical action identities
- Dependencies: PR #2
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `server/obsidia-state.mjs` (modified, +33/-3) — 88% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +4/-3) — 0% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +4/-2) — 25% present in main; main also changed it since the fork
  - `tests/mission-timeline.test.mjs` (added, +35/-0) — 100% present in main; main also changed it since the fork

#### `feat/mission-traceability-blockers-v0`

- Head: `55fe6b492401e6a824c18935cc43ee68e837161c` — fork point `9351530dd7e1a00ac44cc9d1da67466a66058739` — 13 commit(s) ahead of `main`
- PR: PR #4 squash-merged
- Unique functionality: Mission traceability gaps and advisory priorities; single fixed local Vite server
- Dependencies: PR #3
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `scripts/start-windows.ps1` (modified, +1/-1) — 100% present in main; main also changed it since the fork
  - `server/local-bridge.mjs` (modified, +1/-1) — 0% present in main; main also changed it since the fork
  - `server/obsidia-state.mjs` (modified, +21/-0) — 94% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +2/-2) — 0% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +2/-2) — 0% present in main; main also changed it since the fork
  - `tests/launchers.test.mjs` (modified, +11/-0) — 100% present in main; main also changed it since the fork
  - `tests/mission-timeline.test.mjs` (modified, +14/-0) — 100% present in main; main also changed it since the fork
  - `vite.config.ts` (modified, +1/-1) — 100% present in main; main also changed it since the fork

#### `feat/mission-result-stage-v0`

- Head: `6885722a4dd1c564ca1e8febd8f253595aa00368` — fork point `214a67dc10b405b70578c537f95adfa90b0b3cf4` — 4 commit(s) ahead of `main`
- PR: PR #5 squash-merged
- Unique functionality: Result stage linked into mission timelines
- Dependencies: PR #4
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `server/obsidia-state.mjs` (modified, +8/-3) — 100% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +2/-2) — 0% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +2/-2) — 0% present in main; main also changed it since the fork
  - `tests/mission-timeline.test.mjs` (modified, +5/-0) — 100% present in main; main also changed it since the fork

#### `refactor/shared-mission-timeline-v0`

- Head: `5907d5eaa56c6dd55d6e5f54153ed73e92f30962` — fork point `63a6a3611b8f4828ebf361e4102727f84b028551` — 3 commit(s) ahead of `main`
- PR: PR #6 squash-merged
- Unique functionality: Shared MissionTimeline component
- Dependencies: PR #5
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `src/Ecosystem.tsx` (modified, +3/-2) — 67% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +3/-2) — 67% present in main; main also changed it since the fork
  - `src/MissionTimeline.tsx` (added, +23/-0) — 50% present in main; main also changed it since the fork

#### `feat/pokemon-workspaces-v0`

- Head: `f7d5f3360441797fb7b48a70c2847e98f864052f` — fork point `c3b4a4ea726a99051463f5edc14ad34537f00844` — 7 commit(s) ahead of `main`
- PR: PR #7 squash-merged
- Unique functionality: Dedicated Brody / Obsidure / CLI workspaces (ToolWorkspace)
- Dependencies: PR #6
- Status and porting conditions: ALREADY_IN_BASE (squash)
- Files:
  - `src/Ecosystem.css` (modified, +2/-0) — 100% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +4/-3) — 50% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +1/-2) — 0% present in main; main also changed it since the fork
  - `src/ToolWorkspace.tsx` (added, +49/-0) — 100% present in main; main also changed it since the fork

#### `feat/chantiers-cockpit-v0`

- Head: `a385df0e64c661aacd7e01a84e2d6db0fea0dc3a` — fork point `62710b2980a297a4a25a84100bc7e676e5ba4b06` — 3 commit(s) ahead of `main`
- PR: PR #8 closed, not merged
- Unique functionality: Real git worktrees exposed as chantier sources and shown as cards
- Dependencies: PR #7 line
- Status and porting conditions: KEPT_SEPARATE. Server and CSS parts were re-done later in main (90-100% of added lines present); the LivePokemon part (legacy UI) is not. Porting: nothing to port for the server; the card UI would have to be rewritten for V5Pokemon
- Files:
  - `server/local-bridge.mjs` (modified, +13/-2) — 90% present in main; main also changed it since the fork
  - `src/Ecosystem.css` (modified, +8/-0) — 100% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +6/-4) — 0% present in main; main also changed it since the fork

#### `feat/visible-runtime-status-v0`

- Head: `4b5784ffe83fd8b6627dc242c82a8c8c8117956e` — fork point `c3b4a4ea726a99051463f5edc14ad34537f00844` — 2 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Local HEAD sync status exposed by the bridge and shown in the header
- Dependencies: PR #6 line
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Targets the legacy Ecosystem.tsx header. Porting: re-expose the sync endpoint in the current local-bridge and add the indicator to V5Root
- Files:
  - `server/local-bridge.mjs` (modified, +2/-2) — 0% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +4/-3) — 0% present in main; main also changed it since the fork

#### `feat/pokemon-cockpit-v0`

- Head: `4c55cdca3f1a50223b2a6419f8869a3785587bb1` — fork point `62710b2980a297a4a25a84100bc7e676e5ba4b06` — 2 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Pokémon view simplified into an active-work cockpit
- Dependencies: PR #7
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Legacy LivePokemon.tsx only. Porting: redesign on V5Pokemon
- Files:
  - `src/Ecosystem.css` (modified, +1/-0) — 0% present in main; main also changed it since the fork
  - `src/LivePokemon.tsx` (modified, +6/-1) — 0% present in main; main also changed it since the fork

#### `feat/workspace-visual-shell-v0`

- Head: `f731e3e450a3392e38fc0d49d9ed98c63e439306` — fork point `62710b2980a297a4a25a84100bc7e676e5ba4b06` — 2 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Distinct visual shell and navigation for Workspace V2
- Dependencies: PR #7
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Legacy Ecosystem.tsx / Ecosystem.css. Porting: styling decision on V5, not a merge
- Files:
  - `src/Ecosystem.css` (modified, +2/-0) — 0% present in main; main also changed it since the fork
  - `src/Ecosystem.tsx` (modified, +1/-1) — 0% present in main; main also changed it since the fork

### V4

#### `refactor/monde-ui-v4`

- Head: `3c518a94f995f78b453f4668fa258542e6f1d4af` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 7 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Isolated UI V4 shell and visual system, V4 conservation guard (doc + test)
- Dependencies: fork 22edf1ac
- Status and porting conditions: KEPT_SEPARATE, UNIQUE, superseded generation. V5 replaced V4; its guard test would enter the V5 test run. Porting: not applicable as such; the guard idea exists for V5 as tests/ui-v5-zero-guard.test.mjs
- Files:
  - `docs/UI_V4_GUARD.md` (added, +84/-0) — absent from main; main left it untouched since the fork
  - `src/Ecosystem.tsx` (modified, +18/-12) — 0% present in main; main left it untouched since the fork
  - `src/ui-v4.css` (added, +152/-0) — absent from main; main left it untouched since the fork
  - `tests/ui-v4-guard.test.mjs` (added, +44/-0) — absent from main; main left it untouched since the fork

### Pre-V5

#### `feat/premiere-mise-au-monde-final-ui-v0`

- Head: `53aea2a5abbd4c41880da360e3cab325f298e583` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 5 commit(s) ahead of `main`
- PR: PR #9 open draft -> main
- Unique functionality: F23 read-only world projection contract and truth-boundary panel
- Dependencies: fork 22edf1ac; mirrors the X-108 'premiere mise au monde' chain
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Porting: re-apply the 12-line contract in the current server/obsidia-state.mjs, move the panel from legacy Ecosystem.tsx to V5Root
- Files:
  - `F23_MONDE_UI_FINAL_V0.md` (added, +87/-0) — absent from main; main left it untouched since the fork
  - `server/obsidia-state.mjs` (modified, +12/-0) — 9% present in main; main also changed it since the fork
  - `src/Ecosystem.css` (modified, +10/-0) — 0% present in main; main left it untouched since the fork
  - `src/Ecosystem.tsx` (modified, +2/-1) — 0% present in main; main left it untouched since the fork
  - `tests/obsidia-state.test.mjs` (modified, +10/-0) — 0% present in main; main left it untouched since the fork

#### `feat/native-operations-world-projection-v0`

- Head: `8aaec21138772803a22cf69f08d7a5d8dc4fcf37` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 15 commit(s) ahead of `main`
- PR: PR #10 open draft -> PR #9 branch
- Unique functionality: Native sources, CRM, tasks and receipts projected read-only into the world (server/native-operations-projection.mjs + tests)
- Dependencies: PR #9 (stacked)
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Porting: the new module and its test are self-contained; the wiring into server/obsidia-state.mjs (+115 lines) and local-bridge.mjs must be redone on the current files; UI zone to rebuild in V5Root
- Files:
  - `F23_MONDE_UI_FINAL_V0.md` (added, +87/-0) — absent from main; main left it untouched since the fork
  - `server/local-bridge.mjs` (modified, +2/-1) — 0% present in main; main also changed it since the fork
  - `server/native-operations-projection.mjs` (added, +168/-0) — absent from main; main left it untouched since the fork
  - `server/obsidia-state.mjs` (modified, +115/-3) — 4% present in main; main also changed it since the fork
  - `src/Ecosystem.css` (modified, +12/-1) — 0% present in main; main left it untouched since the fork
  - `src/Ecosystem.tsx` (modified, +14/-7) — 0% present in main; main left it untouched since the fork
  - `tests/native-operations-projection.test.mjs` (added, +103/-0) — absent from main; main left it untouched since the fork
  - `tests/obsidia-state.test.mjs` (modified, +10/-0) — 0% present in main; main left it untouched since the fork

#### `feat/native-enterprise-read-model-v0`

- Head: `e962467dc338684c34b8906b9d10dd88243519f5` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 1 commit(s) ahead of `main`
- PR: PR #11 open draft -> main
- Unique functionality: Read-only native enterprise read model, NativeEnterpriseView UI, dedicated workflow
- Dependencies: fork 22edf1ac; mirrors X-108 PR #82
- Status and porting conditions: KEPT_SEPARATE. Two implementations: main now has its own server/native-enterprise-read.mjs (rewritten 2026-10-13), 35% common lines. Porting: compare validation rules with main's version; NativeEnterpriseView is superseded by the CSSA / universal cockpit unless decided otherwise
- Files:
  - `.github/workflows/native-enterprise-read-model-v0.yml` (added, +25/-0) — absent from main; main left it untouched since the fork
  - `docs/NATIVE_ENTERPRISE_READ_MODEL_V0.md` (added, +60/-0) — absent from main; main left it untouched since the fork
  - `server/local-bridge.mjs` (modified, +2/-0) — 100% present in main; main also changed it since the fork
  - `server/native-enterprise-read.mjs` (added, +40/-0) — 35% present in main; main also changed it since the fork
  - `src/App.tsx` (modified, +5/-4) — 0% present in main; main left it untouched since the fork
  - `src/NativeEnterpriseView.css` (added, +19/-0) — absent from main; main left it untouched since the fork
  - `src/NativeEnterpriseView.tsx` (added, +94/-0) — absent from main; main left it untouched since the fork
  - `tests/native-enterprise-read.test.mjs` (added, +68/-0) — 73% present in main; main also changed it since the fork

#### `feat/native-enterprise-interrepo-freeze-v0`

- Head: `d1b78d4de11ca2da4d31f88799ebb75fd3aa1698` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 2 commit(s) ahead of `main`
- PR: PR #12 open draft -> PR #11 branch
- Unique functionality: Tightened read-model validation for the inter-repo freeze
- Dependencies: PR #11 (stacked); mirrors X-108 PR #83
- Status and porting conditions: KEPT_SEPARATE. Porting: check whether the stricter validation is covered by main's implementation and tests
- Files:
  - `.github/workflows/native-enterprise-read-model-v0.yml` (added, +25/-0) — absent from main; main left it untouched since the fork
  - `docs/NATIVE_ENTERPRISE_READ_MODEL_V0.md` (added, +60/-0) — absent from main; main left it untouched since the fork
  - `server/local-bridge.mjs` (modified, +2/-0) — 100% present in main; main also changed it since the fork
  - `server/native-enterprise-read.mjs` (added, +64/-0) — 10% present in main; main also changed it since the fork
  - `src/App.tsx` (modified, +5/-4) — 0% present in main; main left it untouched since the fork
  - `src/NativeEnterpriseView.css` (added, +19/-0) — absent from main; main left it untouched since the fork
  - `src/NativeEnterpriseView.tsx` (added, +94/-0) — absent from main; main left it untouched since the fork
  - `tests/native-enterprise-read.test.mjs` (added, +76/-0) — 23% present in main; main also changed it since the fork

#### `codex/r12-f6-b2-readonly-ui`

- Head: `0a3092ff31db8a1a538d722deb44d38cb96a8cbe` — fork point `22edf1ac70e4d4ddcaf277b4eea1a71fb80ea85e` — 1 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Supervised mission read-only projection: SupervisedMissionPanel + proxy test
- Dependencies: fork 22edf1ac; R12/F6 chantier
- Status and porting conditions: KEPT_SEPARATE, UNIQUE. Porting: the panel component and test are self-contained; the 49-line proxy in local-bridge.mjs must be redone on the current file; mount point to choose in V5Root (ToolWorkspace is legacy)
- Files:
  - `server/local-bridge.mjs` (modified, +49/-0) — 3% present in main; main also changed it since the fork
  - `src/Ecosystem.css` (modified, +2/-0) — 0% present in main; main left it untouched since the fork
  - `src/SupervisedMissionPanel.tsx` (added, +56/-0) — absent from main; main left it untouched since the fork
  - `src/ToolWorkspace.tsx` (modified, +2/-1) — 0% present in main; main left it untouched since the fork
  - `tests/supervised-mission-proxy.test.mjs` (added, +95/-0) — absent from main; main left it untouched since the fork
  - `tests/ui-paths.test.mjs` (modified, +30/-0) — 18% present in main; main also changed it since the fork

### Post-V5 / Qwen

#### `feat/qwen-services-ui-20261009`

- Head: `4e80fd0be90559dda6a45d7a20b4f1f133ca1319` — fork point `8b4a1800553281d474af6799503964fd3e819168` — 7 commit(s) ahead of `main`
- PR: PR #15 open -> main
- Unique functionality: Qwen runtimes as native system services, standalone launchers; last commit is a revert of the launcher UI
- Dependencies: fork 8b4a1800
- Status and porting conditions: KEPT_SEPARATE. 79-82% of added lines are present in main through later commits. Porting: only the 30-line ui-paths test block differs; decide between this variant and qwen-system-only
- Files:
  - `scripts/start-service-colored.ps1` (modified, +85/-0) — 79% present in main; main also changed it since the fork
  - `server/local-bridge.mjs` (modified, +15/-1) — 82% present in main; main also changed it since the fork
  - `tests/ui-paths.test.mjs` (modified, +30/-0) — 33% present in main; main left it untouched since the fork

#### `feat/qwen-system-only-20261009`

- Head: `d0411aa5c9ffd6a775aaf12c207a3b7839682c81` — fork point `8b4a1800553281d474af6799503964fd3e819168` — 6 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Qwen services in the system launcher list only; live Qwen state detection without false READY
- Dependencies: fork 8b4a1800; variant of PR #15
- Status and porting conditions: KEPT_SEPARATE. 69-100% present in main. Porting: residual differences in local-bridge.mjs and V5Launchers.tsx to compare line by line
- Files:
  - `scripts/start-service-colored.ps1` (modified, +68/-0) — 100% present in main; main also changed it since the fork
  - `server/local-bridge.mjs` (modified, +17/-3) — 69% present in main; main also changed it since the fork
  - `src/V5Launchers.tsx` (modified, +3/-2) — 33% present in main; main also changed it since the fork

### Post-V5 / Universal C5

#### `feat/universal-c5-readonly-projection-v0`

- Head: `de656a5bc4d1ecfc884f9f643122e9ab599b6105` — fork point `8b4a1800553281d474af6799503964fd3e819168` — 19 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Fail-closed multi-organization read-only evidence projection, scoped feed, quarantine, source readiness probe, C5.5 diagnostics
- Dependencies: fork 8b4a1800; X-108 chain A (universal)
- Status and porting conditions: KEPT_SEPARATE. Server modules and 2 tests are in main (95-100%). Not in main: docs/C5_4_PC_FIXE_SOURCE_READINESS_20261009.md and 3 test files (c53, c54, c55). Its V5Root governance panel (+28 lines) was removed from main since. Porting: the 4 absent files can be added as they are; the UI panel is a product decision
- Files:
  - `docs/C5_2_UNIVERSAL_MONDE_BRIDGE_READONLY_20261009.md` (added, +36/-0) — 100% present in main; main also changed it since the fork
  - `docs/C5_4_PC_FIXE_SOURCE_READINESS_20261009.md` (added, +44/-0) — absent from main; main left it untouched since the fork
  - `docs/C5_UNIVERSAL_AUDIT_READONLY_20261009.md` (added, +45/-0) — 100% present in main; main also changed it since the fork
  - `server/local-bridge.mjs` (modified, +8/-0) — 100% present in main; main also changed it since the fork
  - `server/universal-c5-local.mjs` (added, +27/-0) — 95% present in main; main also changed it since the fork
  - `server/universal-c53-observed.mjs` (added, +34/-0) — 100% present in main; main also changed it since the fork
  - `server/universal-c54-readiness.mjs` (added, +20/-0) — 100% present in main; main also changed it since the fork
  - `server/universal-c55-diagnostic.mjs` (added, +14/-0) — 100% present in main; main also changed it since the fork
  - `src/V5Root.tsx` (modified, +28/-0) — 0% present in main; main also changed it since the fork
  - `src/universalC5Readonly.mjs` (added, +50/-0) — 98% present in main; main also changed it since the fork
  - `tests/universal-c5-bridge.test.mjs` (added, +49/-0) — 100% present in main; main also changed it since the fork
  - `tests/universal-c5-readonly.test.mjs` (added, +48/-0) — 100% present in main; main also changed it since the fork
  - `tests/universal-c53-observed.test.mjs` (added, +31/-0) — absent from main; main left it untouched since the fork
  - `tests/universal-c54-readiness.test.mjs` (added, +26/-0) — absent from main; main left it untouched since the fork
  - `tests/universal-c55-diagnostic.test.mjs` (added, +22/-0) — absent from main; main left it untouched since the fork

### Post-V5 / CSSA

#### `fix/interface-remove-cssa-v0`

- Head: `22373a5de8d03efec9c8e8b7129b440e6f980a49` — fork point `faca78695bd793869b63557a1fda65528c07282a` — 1 commit(s) ahead of `main`
- PR: no PR
- Unique functionality: Removal of the CSSA organizations surface from V5Root
- Dependencies: fork faca7869
- Status and porting conditions: KEPT_SEPARATE. 100% of its change is present in main (main made the same removal, then rebuilt CSSA as a dedicated page). Nothing to port
- Files:
  - `src/V5Root.tsx` (modified, +2/-35) — 100% present in main; main also changed it since the fork

## 5. Branches already contained in the base (ancestors of `main`)

Nothing to integrate: each head is reachable from the base. Kept as milestones.

| Branch | SHA |
|---|---|
| `audit/monde-v5-final-flows-20261008` | `642834889d754d72ff98f0dd17630b7711eaa8e4` |
| `feat/cssa-universal-main-integration-v0` | `eaabdfb00072b3566534afe37d828568b1f9a7fa` |
| `feat/monde-territories-v0-20261008` | `00ed9f2c661c8bb5e1623fd3bb1951a6c9ca524b` |
| `fix/cssa-organization-page-20261010` | `855ed6fb15a680664545b4e7a88e4700b874d7d6` |
| `fix/openjarvis-ui-launcher-20261009` | `4c86a4a308b51b0f265c2eb89fa0a3bf90d71e4b` |
| `fix/qwen-only-no-regression-20261009` | `0bb9e809975e8ad24b8fc18f23a6fde93b1d69f0` |
| `fix/search-focus-hijack-world-20261010` | `2352237738209233114311d624accd3bed8d3bdf` |
| `fix/universal-direct-entry-20261010` | `c97eb0fcd2cce248fc79d8f1fd838e2b572d36cc` |
| `fix/universal-organizations-hierarchy-20261010` | `9b1d46e6a8fafc6df9b2c5124eadb4f085a4f5f7` |
| `fix/universal-page-visible-20261010` | `acc2a1a30a06ef7b05482b5f6669fd019ee8ea0b` |
| `freeze/monde-post-v5-20261008` | `00ed9f2c661c8bb5e1623fd3bb1951a6c9ca524b` |
| `freeze/monde-runtime-raccord-20261007` | `65128f4291e19f935975935a34ba9ef1e6b89111` |
| `freeze/monde-ui-v5-dashboard-20261007` | `bc4f39f22c383a27d06f1c3efd237016b43ef44d` |
| `freeze/monde-v5-20261008` | `05151608d0317c5d7d421cf7f3ede71fc4e9c887` |
| `freeze/terminal-stack-colored-20261006` | `81f4275a7d0f833831d321806a3d6ad5346732c8` |
| `integration/c5-current-main-20261009` | `263b3978457c7ee76b3c7bc178af0d42dc42303b` |
| `integration/monde-post-v5-pr13-audit-20261008` | `80122e571bc6c6888b5d0bf626f6967466e6bd6b` |
| `post-v5/obsidure-mathmemory-audit-20261008` | `29fbffa69e1ce3f947a6cec56a443ea0413fbb7f` |
| `post-v5/runtime-truth-20261008` | `16162f58fa367cbe5074fcb7dfc9b49d50a9b556` |
| `refactor/monde-ui-v5-zero` | `30dddf94fc6fe792667da1a9007ae715f686b5e2` |
| `repair/monde-v5-runtime-freeze-20261008` | `05151608d0317c5d7d421cf7f3ede71fc4e9c887` |

Total: 21 ancestor branches + 21 branches listed in §4 + `main` = 43 pre-existing branches.

Tag `monde-openjarvis-cli-freeze-20261009` (tag object `af905c310d6132506f33b2422f4a70792ac33b92`) is unchanged.

## 6. Pull requests (unchanged)

| PR | State | Head -> base | Note |
|---|---|---|---|
| #1-#7 | merged (squash) | feature branches -> `main` | Pokémon / cockpit generation |
| #8 | closed, not merged | `feat/chantiers-cockpit-v0` -> `main` | see §4 |
| #9 | open, draft | `feat/premiere-mise-au-monde-final-ui-v0` -> `main` | F23 |
| #10 | open, draft | `feat/native-operations-world-projection-v0` -> PR #9 branch | stacked on #9 |
| #11 | open, draft | `feat/native-enterprise-read-model-v0` -> `main` | mirrors X-108 #82 |
| #12 | open, draft | `feat/native-enterprise-interrepo-freeze-v0` -> PR #11 branch | stacked on #11, mirrors X-108 #83 |
| #13 | closed, not merged | `freeze/monde-post-v5-20261008` -> `main` | superseded by #14 |
| #14 | merged | `integration/monde-post-v5-pr13-audit-20261008` -> `main` | V5 integration |
| #15 | open | `feat/qwen-services-ui-20261009` -> `main` | see §4 |

## 7. Tests

CI run `38359819441` on `f277529fd4567fc6c8715b47d86bb95f52624fca` (workflow "Windows and Linux launchers"): **failure**, reported as observed.

| Job | Build | `npm test` |
|---|---|---|
| `verify (windows-latest)` | OK | 70 tests: 69 pass, **1 fail**, 0 skipped |
| `verify (ubuntu-latest)` | OK | 70 tests: 68 pass, **1 fail**, 1 skipped |

The single failing test, on both systems:

```
tests/universal-c5-bridge.test.mjs :: C5 route is GET only, and UI is read-only
AssertionError: The input did not match the regular expression /Universal C5 — Organisations/
```

Cause, known: the test looks for the text "Universal C5 — Organisations" in `src/V5Root.tsx`; `main` removed that panel from the interface. **The failure is inherited from the base**: `main` @ `80bd4faad3faf48c57dc62799fd8b4bfcf02a5c6` fails the same single test (69 pass, 1 fail). The integration adds two documents and changes no test result. No test was edited, skipped or fixed.

The Windows updater step did not run because `npm test` failed before it.

## 8. Open items

| Item | Status |
|---|---|
| C5 UI text test | **OPEN_TECHNICAL_ITEM**, inherited from `main`. Either the test or the interface has to change; not decided here |
| Visual / UI validation of V5 | **PENDING** — CI builds and runs tests, it does not look at the screen |
| Live runtime (Jarjar, Qwen, Brody, kernel) behind the launchers | **PENDING** |
| Windows updater test step | not executed in CI (blocked by the failing test step) |
| Porting of the developments of §4 to V5 | **NOT DONE**, by decision. Conditions are listed per branch |
| `main` keeps moving | this branch is behind any commit pushed to `main` after the base |

## 9. Guarantees

- `main` was not moved by this work. It was at the base SHA when the branch was created; later movements are the repository owner's.
- The 42 other pre-existing branches are at the same SHA as before.
- The historical tag is unchanged. The 15 PRs are unchanged, field by field.
- No force-push, rebase or squash.
