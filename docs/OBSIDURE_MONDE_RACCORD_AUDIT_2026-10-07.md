# AUDIT RACCORD OBSIDURE — MONDE — 2026-10-07

Scope : audit readonly depuis Monde.
Aucune modification de `obsidia-x108-proofs`.

## Verdict global

`OBSIDURE_MONDE_BINDING = COHERENT`
`OBSIDURE_INTERNAL_MATHMEMORY = BROKEN_BINDING`

Le raccord Monde -> Obsidure fonctionne. Le défaut observé est interne au runtime Obsidure.

## OS_TRAD_REVERSE

- Obsidure cible par défaut `http://127.0.0.1:8000`.
- `scripts/obsidure_cli.py` expose `--api` avec ce défaut.
- `AgentObsidure` journalise cette cible.
- L'exécution utilisateur observée a remonté `source=REAL_BACKEND`.

Classification : `ACTUEL / BIEN_BRANCHE`.

## Gouvernance

Frontières cohérentes :
- decision_authority = KX108_ONLY
- cockpit_role = READONLY_TEST_PATCH_PROPOSAL
- allowed_to_decide = false
- emits_act = false
- kernel_mutation = false
- x108_merge = false
- sandbox_mode = HUMAN_APPROVED_WRITE

La sortie reste `PATCH_PROPOSAL -> AWAITING_HUMAN_APPROVED_WRITE`.

Classification : `A_CONSERVER`.

## Brody reasoning

Le chemin RepairRequest -> Brody reasoning interne existe.
L'état observé `NEEDS_DIAGNOSTIC_CONTEXT` n'est pas une panne de raccord :
il indique que le reasoning n'avait pas de cible inspectable suffisante.

Classification : `ACTUEL / QUALITE_A_AMELIORER_PLUS_TARD`.

## SRL

La SRL est lue et résumée en readonly.
Les cartes produites restent candidates et ne sont pas écrites automatiquement.

Classification : `A_CONSERVER`.

## BUG REEL — MathMemory

Dans `agent_obsidure.py`, `_build_math_memory_context_pack(objective)` fait :

```python
provider = _get_math_provider()
all_ids = provider.list_ids()
...
research = provider.research_context(objective)
```

Mais `ObsidureMathMemoryProvider` expose :
- get_pepite
- get_metric
- get_missing_dependencies
- can_use_for_proof
- get_status
- list_ids
- explain_boundary

Il n'expose PAS `research_context`.

Conséquence :
`AttributeError` systématique avant la sélection normale des items MathMemory.

Cela correspond exactement au runtime observé :
`MathMemory ctx : status=ERROR:AttributeError selected=0`.

Classification :
`MAL_BRANCHE_INTERNE / BUG_CONFIRME`.

## Impact

- Obsidure continue en fail-soft.
- Le cycle AVDR ne s'arrête pas.
- MathMemory devient inutilisable dans ce passage.
- La classification Lean tombe avec moins de contexte, ce qui peut contribuer à :
  - confidence LOW
  - can_generate=False
  - davantage de LEAN_SEMANTIC_TARGET_MISMATCH

Cela ne prouve pas que ce bug explique toute la qualité Lean, mais il retire bien une source de contexte prévue.

## Action recommandée

A corriger dans le chantier Obsidure dédié, pas dans Monde :
- soit implémenter `research_context` dans le provider ;
- soit rendre son appel conditionnel via `hasattr` et poursuivre la sélection indexée existante ;
- ajouter un test d'intégration garantissant que `_build_math_memory_context_pack` ne renvoie plus `ERROR:AttributeError`.

## Monde

Aucune mutation du runtime canonique requise.
Monde doit seulement présenter/observer le statut et conserver les sessions.

## Suite

P4 — Jarjar :
- finir Qwen texte 8080 ;
- vérifier routes Kernel/API/Qwen/Qwen-VL ;
- éliminer les dépendances fantômes restantes.
