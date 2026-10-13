# Obsidure MathMemory — audit et patch proposé — 2026-10-08

Base d'audit : lecture seule de `Eaubin08/obsidia-x108-proofs`.  
Aucune modification du repo proofs n'a été effectuée.

## Verdict

`OBSIDURE_MONDE_BINDING = COHERENT`  
`OBSIDURE_MATHMEMORY_PROVIDER = READONLY_COERENT`  
`OBSIDURE_MATHMEMORY_CALLSITE = BROKEN_BINDING`

Le défaut est précis :

```python
provider = _get_math_provider()
all_ids = provider.list_ids()
...
research = provider.research_context(objective)
```

mais `ObsidureMathMemoryProvider` n'expose aucune méthode `research_context`.

Méthodes réellement exposées :

- `get_pepite`
- `get_metric`
- `get_missing_dependencies`
- `can_use_for_proof`
- `get_status`
- `list_ids`
- `explain_boundary`

Conséquence actuelle : `_build_math_memory_context_pack()` tombe dans le `except` global et retourne `ERROR:AttributeError`, donc la sélection indexée existante n'est jamais atteinte.

## Ce qu'il ne faut pas faire

Ne pas inventer une nouvelle API de recherche MathMemory pour corriger ce bug.

Aucune implémentation de `research_context` ni contrat `OBSIDURE_RESEARCH_ROOT` cohérent n'a été retrouvé ailleurs dans le repo actuel. La seule occurrence est le callsite cassé dans `agent_obsidure.py`.

Créer arbitrairement `research_context` introduirait un nouveau mécanisme non spécifié.

## Patch minimal recommandé

Rendre le chemin research optionnel et conserver le provider actuel comme source canonique.

Patch cible dans `periphery/agents/agent_obsidure.py` :

```python
        selected: List[Dict[str, Any]] = []

        # Research excerpts are optional. The current canonical provider does
        # not expose research_context; in that case continue with indexed
        # MathMemory selection instead of failing the whole context pack.
        research_fn = getattr(provider, "research_context", None)
        if callable(research_fn):
            research = research_fn(objective)
            if research is not None:
                return {
                    "readonly": True,
                    "source": "OBSIDURE_RESEARCH_ROOT",
                    "provider": "ObsidureMathMemoryProvider",
                    "status": research["availability"],
                    "total_ids_seen": len(all_ids),
                    "selected_count": 1 if research["source_evidence"] else 0,
                    "selected_items": [research] if research["source_evidence"] else [],
                    "source_errors": research["source_errors"],
                    "boundary": boundary_info,
                }
```

Puis laisser intact le chemin déjà présent :

```text
ids exacts mentionnés dans l'objectif
→ get_pepite()
→ get_status()
→ can_use_for_proof()
→ get_missing_dependencies()
→ fallback par trigger terms
```

## Pourquoi ce patch est préféré

- ne modifie pas le provider readonly ;
- n'invente aucune nouvelle capacité ;
- ne change aucune frontière d'autorité ;
- ne touche pas au Kernel ;
- ne touche pas aux preuves ;
- restaure simplement le chemin indexé déjà implémenté ;
- reste compatible si un vrai `research_context` est ajouté plus tard.

## Invariants à verrouiller

Le test d'intégration dédié doit prouver :

1. provider sans `research_context` → pas d'`AttributeError` ;
2. `_build_math_memory_context_pack()` retourne `status=AVAILABLE` quand l'index est disponible ;
3. la sélection d'id exact continue de fonctionner ;
4. le fallback trigger terms continue de fonctionner ;
5. `readonly=true` ;
6. `kernel_mutation=false` ;
7. `emits_act=false` ;
8. `memory_write=false` ;
9. aucune écriture dans le repo ;
10. aucune modification de `proofs/`.

## État

`PATCH_PREPARED_NOT_APPLIED`

Ce document est volontairement stocké hors du repo proofs. L'application éventuelle doit se faire uniquement dans un chantier Obsidure explicitement autorisé.
