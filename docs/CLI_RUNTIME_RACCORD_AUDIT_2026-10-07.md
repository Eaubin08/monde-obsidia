# AUDIT DIFFERENTIEL CLI OBSIDIA — 2026-10-07

Branche Monde : `refactor/monde-ui-v5-zero`
Freeze de départ : `freeze/monde-runtime-raccord-20261007`
CLI audité : `obsidia-x108-proofs/scripts/obsidia_cli.py`

## Verdict global

Le CLI n'est pas structurellement cassé.

Son architecture de base reste cohérente :
- terminal NON SOUVERAIN ;
- aucune autorité de décision ;
- `decision_authority = KX108_ONLY` ;
- doctor/status readonly ;
- pas de subprocess arbitraire ;
- pas d'auto-apply/commit/push ;
- receipts locaux non souverains.

Le retard principal est la SOURCE DE VERITE RUNTIME utilisée pour son panneau Status.

Le registre `scripts/obsidia_registry.yaml` est encore aligné sur une observation de juillet et conserve plusieurs dépendances/runtime surfaces historiques qui ne décrivent plus le runtime actif actuel.

## Matrice différentielle

| Élément | Verdict | Constat |
|---|---|---|
| Autorité KX108_ONLY | A_CONSERVER | Cohérent avec l'architecture actuelle. |
| Terminal readonly / non souverain | A_CONSERVER | Bonne frontière. |
| Kernel port 3001 | ACTUEL mais MAL_BRANCHE | Le port est bon, mais le registre sonde encore `/health` comme non confirmé alors que l'endpoint canonique runtime est `POST /kernel/ragnarok`. |
| API Obsidia 8000 | ACTUEL | API partagée Brody/OS_TRAD/runtime. |
| Sigma domaines | ACTUEL mais MAL_BRANCHE | Les domaines existent, mais les probes CLI peuvent retourner DOWN alors que le runtime est actif. |
| Sigma canonical domains | ACTUEL | bank, trading, ecom, gps_defense_aviation. |
| Native Memory | ABSENT du panneau runtime / MAL_BRANCHE | La mémoire active actuelle n'est pas représentée comme telle. |
| Graphiti 8011 | OBSOLETE comme mémoire active | Historique readonly seulement ; ne doit plus être raconté comme dépendance mémoire active sans callsite runtime démontré. |
| Neo4j 7688 / 7475 | OBSOLETE comme dépendance runtime | Ancienne stack mémoire. |
| UI 5173 | OBSOLETE pour Monde actuel | Le CLI sonde encore l'ancienne UI Vite 5173, pas Monde actuel. |
| Graphiti frozen status dans doctor | OBSOLETE / A_RETIRER_DU_HEALTH_ACTIF | Peut rester comme historique/documentaire, pas comme critère de santé du runtime courant. |
| Router pré-inférence `OBSIDIA_ROUTER_ROOT` historique | A_AUDITER | Chemin codé vers ancien workspace `C:\Users\User\Desktop\obsidia-router`; peut être absent ou dépassé. |
| OIE / thermo / gates / Lean surfaces | A_CONSERVER sous réserve | Pas de preuve actuelle de régression structurelle dans cet audit. |
| CLI TUI | A_CONSERVER | Le problème observé est le contenu de statut, pas la surface TUI elle-même. |

## Preuves de retard

### 1. Registry runtime ancien

`scripts/obsidia_registry.yaml` déclare encore :

- UI : 5173
- Graphiti : 8011
- Neo4j browser : 7475
- Neo4j bolt : 7688
- mémoire : commande Graphiti frozen status
- Kernel : `http://127.0.0.1:3001/health` marqué non confirmé

Ce registre explique directement les lignes observées dans le CLI :
- GRAPHITI_8011 DOWN
- NEO4J_BOLT_7688 DOWN
- NEO4J_BROWSER DOWN
- UI_5173 DOWN
- KERNEL_3001 NOT_CONFIRMED

### 2. Native Memory est maintenant la mémoire active

Documentation actuelle du repo :
- le chemin mémoire actif n'est plus Graphiti/Neo4j ;
- cutover Native Memory Obsidia ;
- index natif ;
- lecture locale readonly ;
- Graphiti/Neo4j ne doivent plus être racontés comme mémoire active sans callsite runtime démontré.

### 3. Kernel réel

Le Kernel canonique est :
- port 3001 ;
- `server.kernel.sealed.cjs` ;
- endpoint décisionnel `POST /kernel/ragnarok` ;
- autorité finale KX108_ONLY.

Le probe actuel `GET /health` n'est donc pas une preuve suffisante de disponibilité réelle.

### 4. Sigma

Les domaines canoniques présents restent :
- bank
- trading
- ecom
- gps_defense_aviation

Les routes Sigma existent côté API ; le problème est le raccord de statut, pas l'existence du sous-système.

## Ce qu'il ne faut PAS faire

- Ne pas réécrire tout le CLI.
- Ne pas supprimer son modèle readonly/non souverain.
- Ne pas brancher le CLI comme autorité.
- Ne pas remettre Graphiti/Neo4j actifs.
- Ne pas faire dépendre le CLI de Monde pour fonctionner localement.
- Ne pas transformer doctor/status en auto-launcher.

## Patch recommandé — périmètre minimal

1. Mettre à jour `scripts/obsidia_registry.yaml` :
   - retirer Graphiti/Neo4j/UI5173 du health actif ;
   - déclarer Native Memory comme état local readonly ;
   - conserver Graphiti/Neo4j dans une section legacy/history si utile ;
   - mettre à jour les notes memory/live/kernel.

2. Mettre à jour `RUNTIME_SERVICE_MAP_V1` dans `obsidia_cli.py` :
   - API 8000 ;
   - Kernel 3001 via socket + identité runtime, pas `GET /health` seul ;
   - Sigma via routes réellement exposées ;
   - Native Memory via présence/index/cutover local ;
   - supprimer les faux négatifs UI5173/Graphiti/Neo4j du statut principal.

3. Mettre à jour les tests :
   - remplacer l'ensemble attendu historique par la carte runtime actuelle ;
   - conserver des tests d'invariants readonly/KX108_ONLY ;
   - ajouter un test garantissant que Graphiti/Neo4j ne sont pas reportés comme mémoire active.

4. Auditer séparément `OBSIDIA_ROUTER_ROOT` :
   - chemin utilisateur historique `C:\Users\User\Desktop\obsidia-router` ;
   - décider si le router actuel existe ailleurs ou si ce fallback doit rester optionnel.

## Priorité

P0 : corriger le panneau Status pour qu'il raconte la vérité actuelle.

P1 : réviser le registre mémoire/runtime.

P2 : auditer le pre-inference router historique.

P3 : seulement ensuite améliorer la qualité de réponse CLI.

## Résumé

Le CLI a principalement un RETARD DE CARTOGRAPHIE RUNTIME, pas un défaut de doctrine.

Conclusion :
`CORE_CLI = A_CONSERVER`
`RUNTIME_STATUS_MAP = MAL_BRANCHE`
`GRAPHITI_NEO4J_ACTIVE_STATUS = OBSOLETE`
`NATIVE_MEMORY_STATUS = ABSENT`
`KERNEL_3001_PROBE = MAL_BRANCHE`
`UI_5173_PROBE = OBSOLETE`
