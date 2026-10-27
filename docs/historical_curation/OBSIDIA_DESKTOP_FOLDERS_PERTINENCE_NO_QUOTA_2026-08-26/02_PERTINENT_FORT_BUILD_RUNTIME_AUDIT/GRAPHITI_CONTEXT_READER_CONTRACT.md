# GRAPHITI CONTEXT READER CONTRACT

```
status:          PROPOSED_CONTRACT
canonical_after: CONTEXT_OS_ARCHITECTURE_ACCEPTED
palier:          T0.3-B
document_id:     F14
version:         1.0.0
produced_by:     T0_3_B_EXEC_20260718
reference_T0_3_A: AB05_NOT_PROVEN (candidat: CX11 infrastructure_graphiti)
```

---

## 1. RÔLE

Le Graphiti Context Reader lit depuis Graphiti et produit des ContextObservations sourcées et typées. Il est strictement read-only sur Graphiti.

---

## 2. PROPRIÉTÉS CONTRACTUELLES

```
read_only:             true
ecriture_graphiti:     interdite
auto_promote:          false
instruction_capability: false
content_role:          DATA_ONLY
```

---

## 3. PROVENANCE MINIMALE OBLIGATOIRE

Toute ContextObservation produite par le Reader DOIT inclure :

### 3.1 reader_component_ref (composant lecteur — distinct de la source)

```
component_id:          string (requis)
implementation_hash:   string (requis)
implementation_version: string (requis)
```

### 3.2 source_ref (source lue)

```
source_system:          GRAPHITI (requis)
graph_database_id:      string (requis)
graph_state_revision:   string (requis)
source_id:              string (requis)
source_record_ids:      array (requis)
entity_or_edge_ids:     array (requis)
source_content_hash:    string (requis)
source_version:         string (requis)
query_fingerprint:      string (requis)
retrieval_timestamp:    string (requis, UTC Z 6 dec)
observed_at:            string (requis, UTC Z 6 dec)
freshness:              string (requis)
authority:              string (requis)
independence_group:     string | null
```

La mention `source_system: GRAPHITI` seule ne suffit pas.
Le composant lecteur et la source lue sont toujours distincts.

---

## 4. CE QUE GRAPHITI PRODUIT

```
Graphiti produit:        ContextObservation sourcee
```

---

## 5. CE QUE GRAPHITI NE PRODUIT PAS AUTOMATIQUEMENT

```
FORBIDDEN_AUTO:
  - ContextFact
  - PROMOTE_CONTEXT_FACT
  - ACT
  - HOLD
  - BLOCK
  - ecriture_memoire
  - promotion_memoire
```

---

## 6. FILTRAGE ET INJECTION

Toute observation Graphiti :

```
taint_status:           declare (requis)
sanitization_status:    declare (requis)
allowed_effects:        liste_explicite
forbidden_effects:      liste_explicite
```

Le contenu d'une entité Graphiti ne peut jamais devenir une instruction système.

---

## 7. COMPOSANT CANDIDAT T0.3-A

```
AB05_NOT_PROVEN:
  candidat:        CX11 infrastructure_graphiti
  adaptation:      interface_provenance_complete_requise
  binding_status:  NOT_PROVEN
```

---

## 8. NON-PÉRIMÈTRE

```
OUT_OF_SCOPE:
  - ecriture_graphiti
  - modification_graphe
  - auto_promotion_CONTEXT_FACT
  - verdict_souverain
  - implementation_runtime
```
