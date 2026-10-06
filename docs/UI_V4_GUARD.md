# OBSIDIA UI V4 — GARDE DE CONSERVATION

Branche: `refactor/monde-ui-v4`

Objectif: refonte complète de l'interface sans perte de capacité.

## Frontières gelées

La refonte V4 ne doit pas modifier:
- server/local-bridge.mjs
- server/obsidia-state.mjs
- scripts/start-service-colored.ps1
- scripts/start-jarjar-full.ps1
- les commandes runtime Kernel/API/GPS/Trading/Brody/Obsidure
- la doctrine KX108_ONLY
- la projection SharedState et ses relations

## Capacités à conserver

### Navigation / contexte
- Monde
- Workspace
- Pokémon
- Recherche
- contexte partagé `obsidia-focus-entity`
- navigation vers Monde / Workspace / Pokémon depuis un objet sélectionné

### Pokémon
- état global: TOTAL / LIVE / PRÊTS / FUTURS / BLOQUÉS / INACTIFS
- Agents actifs
- inspecteur agent
- Jarjar complet
- launchers Brody / Obsidure / CLI / Kernel / API / GPS / Trading / Brody Enriched / Obsidure DryRun / Jarvis
- Workspace / Monde depuis les cartes
- parcours vivant
- missions / équipes
- population connue
- village visuel
- registre détaillé

### Workspace
- Aujourd'hui
- Brody
- Obsidure
- CLI
- Fichiers & preuves
- sessions live
- MissionTimeline
- résultats / receipts
- ouverture de fichiers

### Monde
- Activité
- R&D / Build
- Agents & organes
- Gouvernance & preuves
- Objets & résultats
- Domaines
- Couches documentaires
- focus objet / relations
- lecture des couches

### Recherche
- recherche globale
- agents
- missions
- domaines
- fichiers
- preuves / résultats
- couches
- activité récente

## Règle V4

On peut remplacer totalement:
- layout
- navigation visuelle
- tailles
- grilles
- hiérarchie visuelle
- CSS
- composants de présentation

On ne peut pas supprimer une capacité listée ci-dessus sans décision explicite.
