# GRAPHITI / MÉMOIRE READONLY — ÉTAT DOCUMENTAIRE
**Date** : 2026-06-20  
**Source** : MEMOIRE_GRAPHITI_SUPPORT_COMPLET.md + SUPPORT_COMPLET binding audit

---

## Verdict global : SEMI_CONNECTED / DO_NOT_CONNECT_TO_KERNEL

Sur 500 items famille MEMOIRE_GRAPHITI :
- 1 item BOUND_BRODY_AND_DOMAIN : `graphiti` (le terme)
- 11 items BOUND_BRODY_ONLY
- 488 items REFERENCE_ONLY_NOT_BOUND

---

## Statut Readonly — CONFIRMED_BY_DOCUMENTS

Graphiti opère en **mode readonly uniquement** dans la stack actuelle. Tous les documents convergent :

| Marqueur | Statut source | Présence |
|---|---|---|
| `GRAPHITI_READONLY` | CONFIRMED_BY_DOCUMENTS | Core, V1, Enriched, Probe — Bank/Trading/GPS, Tests/Preflight |
| `GRAPHITI_READONLY_CONTEXT` | CONFIRMED_BY_DOCUMENTS | Core, Enriched — Tests/Preflight |
| `graphiti_v20_readonly_client` | CONFIRMED_BY_DOCUMENTS | Core, V1, Enriched — Tests/Preflight |
| `FROZEN_READONLY` | CONFIRMED_BY_DOCUMENTS | Core, V1, Enriched, Probe — Bank/Trading/GPS, Graphiti, Tests/Preflight |
| `NO_GRAPHITI_WRITE` | CONFIRMED_BY_DOCUMENTS | Core, Enriched, Probe — Tests/Preflight |
| `graphiti readonly` (phrase) | CONFIRMED_BY_DOCUMENTS | Core, Enriched — Bank/Trading/GPS, UI, Tests/Preflight |
| `readonly=True` | CONFIRMED_BY_DOCUMENTS | Core, V1, Enriched, Probe — Bank/Trading/GPS, UI, Graphiti, Tests/Preflight |
| `memory_write_canon_freeze` | CONFIRMED_BY_DOCUMENTS | Core, V1, Enriched — Bank/Trading/GPS, Tests |
| `GRAPHITI_READONLY_CONTEXT` (module) | CONFIRMED_BY_DOCUMENTS | Core, Enriched — Tests/Preflight |

---

## Statut Sidecar — CONFIRMED_BY_DOCUMENTS

Graphiti est un **sidecar mémoire** de Brody, pas un composant kernel :

> *"État runtime readonly : modules actifs, mémoire candidate, Graphiti V20 gelé"*

Le terme "V20 gelé" indique que Graphiti V20 est dans un état frozen/gelé en prod.

> *"Si Graphiti V20 est disponible, le contexte peut être récupéré en readonly ; sinon statut OFFLINE_OR_UNAVAILABLE."*

Graphiti peut être offline — le système ne dépend pas de sa disponibilité pour fonctionner.

---

## Index Graphiti V20 — SEMI_CONNECTED

| Composant | Statut |
|---|---|
| `GRAPHITI_READONLY_INDEX_V2_FUSION_READY` | CONFIRMED_BY_DOCUMENTS (Enriched) |
| `_graphiti_readonly_indexes/GRAPHITI_READONLY_INDEX_V2_FUSION_20260512_224854/` | CONFIRMED_BY_DOCUMENTS |
| `graphiti_readonly_records_v2.jsonl` | SEMI_CONNECTED (Enriched + Probe — Bank/Trading/GPS, Tests) |
| `graphiti_readonly_records_v2` (référence) | SEMI_CONNECTED (Enriched + Probe — Bank/Trading/GPS, Tests) |
| GRAPHITI_V2_000008 (records individuels) | BOUND_BRODY_ONLY (Enriched) |
| GRAPHITI_V2_000011 | BOUND_BRODY_ONLY |
| GRAPHITI_V2_000060 | BOUND_BRODY_ONLY |
| GRAPHITI_V2_000068 | BOUND_BRODY_ONLY |
| GRAPHITI_V2_000000 à 000007, 000009-000010, etc. | REFERENCE_ONLY_NOT_BOUND (488 records) |

---

## Non-souveraineté — CONFIRMED_BY_DOCUMENTS

Graphiti ne prend aucune décision et n'a pas d'autorité :

> *"Readonly descriptions mentioning memory/Graphiti must not become writes."*
> *"Explicit creation/mutation of Graphiti/Neo4j/memory/canon is a write boundary."*

Graphiti est une **source de lecture contextuelle** pour Brody, jamais un décideur.

---

## Lien (ou non-lien) avec le kernel — DO_NOT_CONNECT_TO_KERNEL

Graphiti est **explicitement séparé du kernel** :
- Le kernel (`proofs/`, `formal/tla/`) ne dépend pas de Graphiti.
- Graphiti alimente Brody (lecture contextuelle), pas X-108.
- Toute écriture directe dans Graphiti depuis le kernel serait une violation architecturale.

---

## Modules Brody liés à Graphiti

| Fichier | Surface | Rôle |
|---|---|---|
| `apps/obsidia_api/graphiti_v20_readonly_client.py` | V1, Enriched | Client readonly V20 |
| `brody_graphiti_ready_export_readonly_v1_6_4.py` | Enriched | Export readonly V1.6.4 |
| `brody_session_trace_ledger_readonly_v1_6_3.py` | Enriched | Ledger session trace readonly |
| `brody_world_source_intake_readonly_v1_6.py` | Enriched | Intake source monde readonly |
| `readonly_context_guard.py` | Enriched | Guard contexte readonly |
| `READONLY_CONTEXT_PROVIDER` | Enriched — Graphiti/Preflight | Provider contexte |
| `P51_BRODY_READONLY_CONTROLLED_ACTIVATION_READY` | Confirmed | Brody readonly activé |
| `P52_GRAPHITI_MEMORY_READONLY_CONTROLLED_ACTIVATION_READY` | Confirmed | Graphiti readonly activé |

---

## Ambiguïtés

| Point | Nature |
|---|---|
| "Graphiti V20 gelé" dans les docs : gelé = frozen permanent ou gelé temporairement ? | AMBIGUOUS — NEEDS_USER_DECISION |
| 488/500 items MEMOIRE_GRAPHITI non liés : sont-ils des records passés ou du corpus à intégrer ? | AMBIGUOUS — NEEDS_USER_DECISION |
| Neo4j backend actif ou mode local seulement ? | AMBIGUOUS — pas de preuve d'exécution dans les docs lus |
| "BRODY_V3_ORGANIC_RUNTIME_MEMORY_FREEZE_PACK_V0" (freeze 2026-06-16) : quelle évolution ? | AMBIGUOUS — NEEDS_USER_DECISION |
| Graphiti live feedback loop (dans NOT_YET_IMPLEMENTED) : priorité ? | NEEDS_USER_DECISION |
