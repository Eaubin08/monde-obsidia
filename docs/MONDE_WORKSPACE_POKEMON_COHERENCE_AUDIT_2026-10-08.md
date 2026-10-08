# Monde ↔ Workspace ↔ Pokémon — audit de cohérence — 2026-10-08

## Contrat
- Monde = Où ?
- Workspace = Quoi ?
- Pokémon = Qui ?
- CLI = transversal

Les trois vues doivent projeter le même état partagé sans créer de vérité, d'autorité ou de contexte parallèle.

## Vérifications

### Contexte partagé
Les vues utilisent les mêmes marqueurs de contexte :
- `obsidia-focus-entity`
- `obsidia-context`
- `obsidia-selected-session`
- `obsidia-workspace-area`
- `obsidia-world-zone`

### Identité des objets
Workspace conserve désormais le `kind` réel de l'entité sélectionnée.
Un bug de précédence dans l'expression de `workspaceContext.kind` pouvait reclasser une entité non-session en `mission`.
Correction ciblée :
```ts
kind: session ? 'session' : (entity?.kind || (mission ? 'mission' : 'aucun'))
```

Aucune autre logique Workspace n'a été modifiée.

### Monde
Le Monde reste la projection spatiale / territoriale des objets et mécanismes observés.

### Workspace
Workspace reste l'espace de travail et de continuité de tâche. Il consomme le contexte partagé et ne crée pas de vérité canonique distincte.

### Pokémon
Pokémon reste centré sur l'agent : identité, état, mission, équipe, preuves, historique et synthèse opérationnelle observée.

### Autorité
Les vues ne créent aucune autorité propre.
La frontière `KX108_ONLY` reste préservée.

## Verdict

```text
MONDE_WHERE_BOUNDARY = COHERENT
WORKSPACE_WHAT_BOUNDARY = COHERENT
POKEMON_WHO_BOUNDARY = COHERENT
SHARED_CONTEXT_IDENTITY = COHERENT
CROSS_VIEW_OBJECT_KIND = COHERENT_AFTER_TARGETED_FIX
CROSS_VIEW_NAVIGATION = COHERENT
KX108_AUTHORITY_BOUNDARY = PRESERVED
NEW_CROSS_VIEW_CANONICAL_TRUTH = NOT_INTRODUCED
PARALLEL_CONTEXT_MODEL = NOT_INTRODUCED
```

## Décision BFRV
Le seul défaut concret observé pendant l'audit était la précédence de `workspaceContext.kind`. Il a été réparé isolément. Les autres couches restent protégées.
