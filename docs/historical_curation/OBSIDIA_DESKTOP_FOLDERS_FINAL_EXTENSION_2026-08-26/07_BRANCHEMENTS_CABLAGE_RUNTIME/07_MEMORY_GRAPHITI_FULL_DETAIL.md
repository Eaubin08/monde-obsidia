# 07_MEMORY_GRAPHITI_FULL_DETAIL — Mémoire / Graphiti : inventaire complet

**Règle** : MEMORY_READONLY — memory_write=false invariant permanent — jamais levé
**Source** : V1 Readonly 03_MEMORY_GRAPHITI_READONLY.md + Checklist P5 + Audit V4

---

## Table 1 — Composants mémoire P5 (nommés)

| ID | Composant | Chemin | Statut | Lecture par qui | Écriture | Rôle Brody | Rôle Kernel | Rôle Domaines | Risque si violé |
|---|---|---|---|---|---|---|---|---|---|
| P5-01 | srl_session_registry.py | memory/srl_session_registry.py | A_CREER | Kernel | INTERDITE | Signal contexte session | SRL états → Kernel signal | Contexte session lecture | État session falsifié |
| P5-02 | fidelity_registry.py | memory/fidelity_registry.py | A_CREER | Kernel + Brody | INTERDITE | Registre fidélité contexte | Kernel signal fidélité | Lecture fidélité | Fidélité corrompue |
| P5-03 | memory_context_guard.py | memory/memory_context_guard.py | A_CREER | — | INTERDITE (bloque) | — | Bloque écriture mémoire | — | Écriture silencieuse non tracée |
| P5-04 | readonly_context.py | memory/readonly_context.py | A_CREER | Brody + Kernel | INTERDITE | Contexte readonly Brody | Kernel consulte | — | Fuite contexte non filtré |
| P5-05 | x108_readonly_context_candidate.py | memory/x108_readonly_context_candidate.py | A_CREER | Kernel | INTERDITE | — | Candidat contexte X108 — lecture seule | — | Candidat promu sans validation |
| P5-06 | context_compression_proxy_v1.py | memory/context_compression_proxy_v1.py | A_CREER | Brody | INTERDITE | Brody → proxy → Graphiti | — | — | Contexte compressé sans trace |
| P5-07 | memory_attestation_layer.py | obsidia_core/memory/memory_attestation_layer.py | A_CREER | Audit / Kernel | INTERDITE | — | ATTESTATION_ONLY | — | Attestation falsifiable |
| P5-08 | readonly_context_projection.py | obsidia_core/memory/readonly_context_projection.py | A_CREER | Brody / Kernel / UI | INTERDITE | Projection contexte | Kernel consulte | UI display | Contexte projeté altéré |
| P5-09 | (non nommé dans source) | — | ITEM_LEVEL_NOT_AVAILABLE_IN_SOURCE_PDF | — | INTERDITE | — | — | — | — |
| P5-10 | decisional_form_cic.py | — | A_CREER | Kernel + Bank | INTERDITE | — | Gate CIC bank | CIC gate bank | Formulaire CIC falsifié |
| P5-11 | cic_bank_gate.py | — | A_CREER | Bank | INTERDITE | — | Gate CIC bank | Séparé trading/GPS | CIC bank bypass |
| P5-12 | cic_trading_gate.py | — | A_CREER | Trading | INTERDITE | — | Gate CIC trading | Séparé bank/GPS | CIC trading bypass |
| P5-13 | cic_gps_gate.py | — | A_CREER | GPS | INTERDITE | — | Gate CIC GPS | Séparé bank/trading | CIC GPS bypass |
| P5-14 | cic_registry.yaml | — | A_CREER | Kernel | INTERDITE | — | Registry global CIC | — | Registry CIC corrompu |
| P5-15 | srl_states.schema.json | schemas/srl_states.schema.json | A_CREER | Kernel | INTERDITE | — | Schema SRL états | — | Schema non validé |

---

## Table 2 — Graphiti 8011 (instance active)

| Dimension | Valeur | Règle | Risque si violé |
|---|---|---|---|
| Statut | ACTIF VERT | — | — |
| Port | 8011 | — | — |
| Mode | ATTESTATION_ONLY | memory_write=false invariant kernel | Corruption mémoire contextuelle |
| Lecture | Autorisée | Brody lit readonly / Kernel consulte | — |
| Écriture | INTERDITE PERMANENTE | Jamais levée — invariant kernel | Corruption mémoire contextuelle |
| NPL | Peut annoter — jamais écrire | NPL = NO_ACT / NO_DECISION | NPL agit = violation |
| SGS | Peut lire — jamais écrire | SGS = sandbox | SGS écrit = violation |
| Domaines | Lecture seule du contexte | Bank/Trading/GPS lisent contexte | Domaine écrit = violation |
| UI | Lecture projection readonly | Affichage contexte — jamais write | UI écrit = violation |

---

## Table 3 — Preuves et signatures — Frozen / DO_NOT_TOUCH

| Composant | Statut | Readonly pourquoi | Écriture | Accès autorisé | Risque si violé |
|---|---|---|---|---|---|
| 57 preuves Lean existantes (proofs/*.lean) | FROZEN — DO_NOT_TOUCH | Crypto-ancrées — modification invalide la chaîne | INTERDITE | proof_checker lecture seule | Invalidation chaîne Merkle |
| MANIFEST_SHA256 | SEALED — DO_NOT_TOUCH | SHA immutable | INTERDITE | Vérification Merkle uniquement | Merkle cassé |
| merkle_seal.json | SEALED — DO_NOT_TOUCH | Racine Merkle scellée | INTERDITE | Vérification intégrité | Chaîne invalide |
| RFC3161 timestamps | SEALED — DO_NOT_TOUCH | Horodatage légal | INTERDITE | Vérification légale | Preuve temporelle invalide |
| 7 nouveaux théorèmes Lean (L-01→L-07) | A_CREER (D13+D14 requis) | DO_NOT_TOUCH une fois créés | INTERDITE post-création | proof_checker après création | Même risque que 57 existants |
| server.kernel.sealed.cjs | WRITE-PROTECTED | Gray kernel V5 — deny rule auto | INTERDITE | Runtime lecture | Kernel corrompu |

---

## Table 4 — NPL (F70–F73) — Non souverain / Readonly — D29 requis

| Composant | Chemin | Statut | Lecture | Écriture | Règle | Risque si violé |
|---|---|---|---|---|---|---|
| npl_f70_init.py (P7-09) | npl/npl_f70_init.py | A_CREER — D29 requis | OUI — archives | INTERDITE | NO_ACT / NO_DECISION | Violation RULE_NPL_001 |
| npl_f71_references.py (P7-10) | npl/npl_f71_references.py | A_CREER — D29 | OUI — mémoire historique | INTERDITE | Lecture références seule | Données corrompues |
| npl_f72_pipeline.py (P7-11) | npl/npl_f72_pipeline.py | A_CREER — D29 | OUI | INTERDITE | Annotation lecture seule | NPL agit sans autorisation |
| npl_f73_integration.py (P7-12) | npl/npl_f73_integration.py | A_CREER — D29 | OUI | INTERDITE | Consultation Brody | NPL décide |
| npl_rules.yaml (P7-16) | npl/npl_rules.yaml | A_CREER — D29 | OUI | INTERDITE | Règles NPL RULE_NPL_001-006 | NPL souverain |
| Connexion NPL → domaines | — | **BLOQUÉ D29** | NON avant D29 | — | D29 confirmé Etienne | NPL agit sur domaine |

---

## Invariant memory_write=false

**Ce fichier entier est gouverné par cette règle.**

| Composant | memory_write=false appliqué ? |
|---|---|
| Graphiti 8011 | OUI — permanent |
| P5-01 à P5-15 | OUI — permanent |
| 57 preuves Lean | OUI — frozen crypto |
| NPL | OUI — NO_ACT |
| SGS | OUI — sandbox |
| Domaines (Bank/Trading/GPS) | OUI — readonly contexte |
| UI/Cockpit | OUI — display only |
| Adapters | OUI — output only |
| **Exceptions connues** | **AUCUNE** |
