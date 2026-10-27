# 03_MEMORY_GRAPHITI_READONLY — Mémoire / Graphiti — Readonly permanent

**Règle** : memory_write=false invariant kernel. ATTESTATION_ONLY.  
**Source** : Plan action R-02, R-10, Checklist P5-03→P5-08, P4-23, Audit V4 p.4

---

## Principe readonly

Graphiti et toute la couche mémoire fournissent un **contexte** — jamais une décision.  
`memory_write=false` est un invariant kernel, pas une convention de code.  
NPL peut annoter mais jamais écrire. SGS peut lire mais jamais écrire dans la mémoire principale.  
Les preuves Lean existantes (57 fichiers) sont frozen / crypto-ancrées — DO_NOT_TOUCH.

---

## Table — Composants mémoire et Graphiti

| Composant | Statut | Readonly pourquoi | Écriture interdite | Branchement autorisé | Risque si violé |
|---|---|---|---|---|---|
| **Graphiti 8011** (instance active) | ACTIF VERT | ATTESTATION_ONLY — memory_write=false invariant kernel | Toute écriture directe | Brody lit en readonly / Kernel consulte | Corruption mémoire contextuelle |
| **memory/readonly_context.py** (P5-04) | A_CREER | Projection lecture seule du contexte | Toute écriture | Brody + Kernel consultation | Fuite contexte non filtré |
| **memory/readonly_context_projection.py** via P5-08 | A_CREER | Projection mémoire — jamais écriture | Écriture directe | Brody, UI display | Contexte modifié sans trace |
| **memory/memory_context_guard.py** (P5-03) | A_CREER | Garde mémoire — bloque toute écriture non autorisée | Bypass du guard | API 8000 → guard → Graphiti | Écriture silencieuse non tracée |
| **memory/x108_readonly_context_candidate.py** (P5-05) | A_CREER | Candidat contexte X108 — lecture seulement | Promotion sans décision kernel | Kernel consultation | Candidat promu sans validation |
| **obsidia_core/memory/brody_triadic_memory_governor.py** (P4-23) | A_CREER | V3.2.2 — memory_write=false strict | Toute écriture | Brody Enriched → gouverneur | Mémoire triadique corrompue |
| **obsidia_core/memory/memory_attestation_layer.py** (P5-07) | A_CREER | ATTESTATION_ONLY — pas de write | Write direct | Attestation audit → Cockpit | Attestation falsifiable |
| **obsidia_core/memory/readonly_context_projection.py** (P5-08) | A_CREER | Projection contexte — readonly | Écriture | Brody, Kernel, UI | Contexte projeté altéré |
| **memory/srl_session_registry.py** (P5-01) | A_CREER (BRANCH) | SRL = registre session — états, pas décisions | Décision basée sur SRL seul | SRL → Kernel (signal contexte) | État session falsifié |
| **memory/fidelity_registry.py** (P5-02) | A_CREER (BRANCH) | Registre fidélité — lecture et signal | Écriture sans kernel gate | Kernel + Brody consultation | Fidélité corrompue |
| **memory/context_compression_proxy_v1.py** (P5-06) | A_CREER | Compression contexte — proxy seul | Compression avec perte non déclarée | Brody → proxy → Graphiti | Contexte compressé sans trace |

---

## Table — Preuves et signatures — Frozen / DO_NOT_TOUCH

| Composant | Statut | Readonly pourquoi | Écriture interdite | Branchement autorisé | Risque si violé |
|---|---|---|---|---|---|
| **57 preuves Lean existantes** (proofs/*.lean) | FROZEN — DO_NOT_TOUCH | Crypto-ancrées — modification invalide la chaîne | Toute édition / reformatage / renommage | Lecture par proof_checker seulement | Invalidation chaîne Merkle |
| **MANIFEST_SHA256** | SEALED — DO_NOT_TOUCH | Scellé — référence SHA immutable | Toute modification | Vérification Merkle uniquement | Merkle cassé |
| **merkle_seal.json** | SEALED — DO_NOT_TOUCH | Racine Merkle — scellée | Régénération sans procédure | Vérification intégrité | Chaîne invalide |
| **RFC3161 timestamps** | SEALED — DO_NOT_TOUCH | Horodatage légal — non modifiable | Toute modification | Vérification légale | Preuve temporelle invalide |
| **7 nouveaux théorèmes Lean** (L-01→L-07) | A_CREER (D13+D14 requis) | Nouveaux — DO_NOT_TOUCH une fois créés | Édition post-création sans procédure | Proof checker après création | Même risque que les 57 existants |

---

## Table — NPL (F70–F73) — Non souverain / Readonly

| Composant | Statut | Readonly pourquoi | Écriture interdite | Branchement autorisé | Risque si violé |
|---|---|---|---|---|---|
| npl/npl_f70_init.py (P7-09) | A_CREER — D29 requis | NO_ACT / NO_DECISION | Toute action autonome | NPL → lecture archives uniquement | Violation RULE_NPL_001 |
| npl/npl_f71_references.py (P7-10) | A_CREER — D29 | NPL références — lecture | Écriture dans archive | Lecture mémoire historique | Données corrompues par NPL |
| npl/npl_f72_pipeline.py (P7-11) | A_CREER — D29 | NPL pipeline — annotation | Action pipeline autonome | Annotation lecture seule | NPL agit sans autorisation |
| npl/npl_f73_integration.py (P7-12) | A_CREER — D29 | NPL intégration — readonly | Intégration avec écriture | Consultation par Brody | NPL prend décision |
| npl/npl_rules.yaml (P7-16) | A_CREER — D29 | Règles NPL — RULE_NPL_001-006 | Override règles sans D29 | Application des règles uniquement | NPL souverain |
| **Connexion NPL → domaines** | BLOQUÉ — D29 requis | NPL ne se branche aux domaines qu'après D29 | Tout branchement domaine avant D29 | Après D29 confirmé par Etienne | NPL agit sur domaine |

---

## Règle SGS vis-à-vis de la mémoire

`obsidia_core/selfplay/sgs_x108_loop.py` (P4-22) est sandbox uniquement.  
SGS peut lire la mémoire en consultation — **jamais écrire** dans Graphiti ni la mémoire principale.  
SGS produit des candidats pour validation Etienne — jamais des décisions autonomes.
