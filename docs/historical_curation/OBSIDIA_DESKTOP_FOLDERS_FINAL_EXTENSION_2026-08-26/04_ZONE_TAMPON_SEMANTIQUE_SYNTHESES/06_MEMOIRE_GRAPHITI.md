# 06_MEMOIRE_GRAPHITI — Axe 6 : Mémoire / Graphiti / SRL

```
Mode:  READ_ONLY
Layer: KERNEL
Scope: Extraction exhaustive axe 6 — mémoire, Graphiti, SRL, V3 vs V2.1
Risk:  NONE
Files touched: 06_MEMOIRE_GRAPHITI.md
Date: 2026-06-20
Mission: OBSIDIA_LONG_MEMORY_RECONCILIATION_V3
```

---

## 1. GRAPHITI V20 — STATUT BASELINE (CONFIRMED)

| Propriété | Valeur | Delta |
|---|---|---|
| Version | Graphiti V20 | CONFIRMED |
| Statut | VALIDATED_LOCAL_FREEZE | CONFIRMED |
| Port | 8011 | CONFIRMED |
| Route frozen | /graph/v20/frozen/workbench | CONFIRMED |
| Suite | GRAPHITI_PHASE0_V20_WORKBENCH_SUITE | CONFIRMED |
| Rôle | Memory sidecar — readonly — non souverain | CONFIRMED |
| write autorisé | NON — jamais | CONFIRMED |

---

## 2. CORPUS GRAPHITI

| Propriété | Valeur | Delta |
|---|---|---|
| Fichier records | graphiti_readonly_records_v2.jsonl | CONFIRMED |
| Total records | 3 267 | CONFIRMED |
| Records avec text_excerpt | 2 363 | CONFIRMED |
| Records sans text_excerpt | 904 | CONFIRMED |

---

## 3. BRODY TRIADIC MEMORY GOVERNOR (CONFIRMED)

```
BRODY_TRIADIC_MEMORY_GOVERNOR_READONLY_V1
memory_role = ATTESTATION_ONLY
```
- Graphiti est une mémoire attestataire — elle atteste, elle ne décide pas.
- Graphiti ne peut pas initier une action.
- Graphiti ne peut pas modifier un état kernel.

---

## 4. X108_READONLY_CONTEXT_CANDIDATE (NEW)

```python
X108_READONLY_CONTEXT_CANDIDATE = {
    source: "graphiti_readonly_records_v2.jsonl",
    read_only: True,
    decision_authority: "KX108_ONLY",
    inject_to_kernel: False,
    inject_to_brody: True (readonly context only),
    sovereign: False
}
```
**Delta** : NEW — format d'injection readonly formalisé.

---

## 5. SRL — SESSION REGISTRY LAYER (NEW)

| État SRL | Description | Delta |
|---|---|---|
| ACTIVE | Enregistrement actif, utilisé en session courante | NEW |
| SEMI_ACTIVE | Enregistrement partiellement actif, en marge | NEW |
| COLD | Enregistrement inactif, archivé | NEW |
| GHOST | Enregistrement fantôme — présent mais non référencé | NEW |
| REFLEX_ALERT | Alerte réflexe — signal anormal détecté | NEW |

**Delta** : NEW — absent de V2.1.

---

## 6. OBSIDIA_CONTEXT_COMPRESSION_PROXY_V1 (NEW)

```
OBSIDIA_CONTEXT_COMPRESSION_PROXY_V1
Statut : PERIPHERAL / READONLY / REVERSIBLE / ADVISORY_ONLY
Autorité : KX108_ONLY
Rôle : Compression contextuelle sans perte d'autorité
Source conceptuelle : "Headroom" — limite de contexte LLM → proxy de compression
```
**Delta** : NEW.

---

## 7. MEMORY_CONTEXT_GUARD (NEW)

```python
MEMORY_CONTEXT_GUARD = {
    role: "GUARD",
    action: "block_sovereign_memory_claim",
    trigger: "any agent claiming memory write authority",
    verdict: "BLOCK"
}
```
**Delta** : NEW.

---

## 8. MEMORY_ATTESTATION_LAYER (NEW)

```
memory_attestation_layer:
  input: kernel decision record
  output: attestation_record (readonly)
  no_write: True
  no_execute: True
  source: SGS-X108 discussion
```
**Delta** : NEW — inspiré de la boucle SGS-X108.

---

## 9. FIDELITY_REGISTRY (NEW)

```
fidelity_registry:
  contenu: registre de fidélité des enregistrements mémoire
  champs: record_id, fidelity_score, last_verified, status
  autorité: KX108_ONLY
  write: NON
```
**Delta** : NEW.

---

## 10. BRODY_DOMAIN_MEMORY_LOCAL_FALLBACK (CONFIRMED)

```
BRODY_DOMAIN_MEMORY_LOCAL_FALLBACK_READONLY_V1
Rôle : fallback local si Graphiti indisponible
readonly : True
```

---

## 11. GRAPH POISONING RISK (NEW)

| Métrique | Description | Delta |
|---|---|---|
| graph_poisoning_risk | Risque injection / corruption / faux lien dans Graphiti | NEW |
| Remédiation | Validation hash de chaque nœud avant injection | NEW |
| Statut | À intégrer dans V4.1 (manquant dans scan) | NEW |

---

## 12. GRAPHITI CANDIDATES ATLAS V0.7 (CONFIRMED)

| Propriété | Valeur | Delta |
|---|---|---|
| Graphiti candidates | 311 (World Protocol Atlas V0.7) | CONFIRMED |
| Doublons | 92 (Branchable Atlas) | CONFIRMED |

---

## 13. RÈGLES MÉMOIRE INVARIANTES

| Règle | Valeur | Source |
|---|---|---|
| Graphiti non souverain | "mémoire sidecar readonly" | MANIFEST V2.1 |
| memory_role | ATTESTATION_ONLY | V3 NEW |
| inject_to_kernel | False | V3 NEW |
| no write | True (absolu) | V2.1 + V3 CONFIRMED |
| no execute | True (absolu) | V2.1 + V3 CONFIRMED |
| BLOCK sur claim souveraineté | automatique | V3 NEW |

---

## 14. DELTA RÉSUMÉ MÉMOIRE/GRAPHITI

| Catégorie | V2.1 | V3 | Delta |
|---|---|---|---|
| Version Graphiti | V20 frozen | V20 + SRL | EXPANDED |
| SRL états | ABSENT | 5 états | NEW |
| X108_READONLY_CONTEXT_CANDIDATE | ABSENT | Formalisé | NEW |
| Context Compression Proxy | ABSENT | V1 | NEW |
| MEMORY_CONTEXT_GUARD | ABSENT | Présent | NEW |
| memory_attestation_layer | ABSENT | Présent | NEW |
| fidelity_registry | ABSENT | Présent | NEW |
| graph_poisoning_risk | ABSENT | Métrique V4.1 | NEW |
