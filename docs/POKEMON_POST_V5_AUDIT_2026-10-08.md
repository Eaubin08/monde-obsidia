# Pokémon post-V5 — audit de cohérence — 2026-10-08

## Périmètre
Audit de la vue `V5Pokemon` après les enrichissements 10.1 à 10.5.

## Contrat de vue
- Monde = Où ?
- Workspace = Quoi ?
- Pokémon = Qui ?
- CLI = transversal

Pokémon doit rester une projection centrée sur l'identité, l'état, la mission, les relations et les preuves observées des agents. La vue ne doit créer ni nouvelle vérité canonique, ni nouvelle autorité décisionnelle, ni workflow d'exécution parallèle.

## Constat

### 1. Centre de gravité
Le hero reste explicitement `QUI ?`.
La vue organise les agents par cycle de vie, famille, mission, équipe, historique et preuves.

### 2. Source d'état
Pokémon lit `/obsidia-local/state`.
Les enrichissements 10.1–10.5 dérivent leurs informations de `entities`, `relations`, `sessions` et `missions` déjà partagés.

### 3. Contexte inter-vues
La sélection continue d'utiliser :
- `obsidia-focus-entity`
- `obsidia-context`
- `obsidia-selected-session`
- `obsidia-world-zone`
- `obsidia-workspace-area`

Il n'existe pas de contexte parallèle propre à Pokémon.

### 4. Autorité
La télémétrie peut afficher l'autorité observée et conserve le fallback `KX108_ONLY`.
Aucune autorité `POKEMON` n'est introduite.
Aucune route d'exécution, de décision, de lancement ou d'arrêt n'est déclenchée depuis `V5Pokemon`.

### 5. Contexte agent
Le contexte agent projette le domaine, la mission, les résultats, les preuves et les relations déjà observés.
Le fallback `BELONGS_TO_DOMAIN` est bien une relation existante produite par `server/obsidia-state.mjs`; il ne s'agit pas d'une relation inventée par la vue.

### 6. Preuves et historique
Les preuves proviennent des références de mission.
L'historique provient uniquement des événements de session observés.
Aucune chronologie synthétique n'est fabriquée.

### 7. Équipe et relations
Les coéquipiers sont limités aux `sessionRefs` de la mission.
Les relations affichées proviennent directement de `state.relations`.
Aucune collaboration supplémentaire n'est déduite.

### 8. Synthèse opérationnelle
La synthèse utilise uniquement :
- état / objectif / message de session ;
- `primaryBlocker` ;
- présence des refs session / résultat / décision / receipt / impact ;
- `traceabilityStatus` ;
- `recommendedNextStep` ;
- preuves reliées.

Elle reste une synthèse readonly et ne devient pas un moteur de décision.

## Verdict

```text
POKEMON_QUI_BOUNDARY = COHERENT
POKEMON_SHARED_STATE_PROJECTION = COHERENT
POKEMON_CROSS_VIEW_CONTEXT = COHERENT
POKEMON_AGENT_EVIDENCE = COHERENT
POKEMON_AGENT_RELATIONS = COHERENT
POKEMON_OPERATIONAL_SUMMARY = COHERENT
KX108_AUTHORITY_BOUNDARY = PRESERVED
NEW_POKEMON_CANONICAL_TRUTH = NOT_INTRODUCED
PARALLEL_POKEMON_WORKFLOW = NOT_INTRODUCED
```

## Décision BFRV
Aucune preuve ne justifie de rouvrir les couches V5 déjà saines. Le bloc Pokémon post-V5 peut être considéré cohérent sous réserve de la régression locale complète et du build.
