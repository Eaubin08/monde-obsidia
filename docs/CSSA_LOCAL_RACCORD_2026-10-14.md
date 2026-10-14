# CSSA : raccord des registres locaux — 2026-10-14

Base : main, a4ea03f. Travail dans le checkout existant ; aucune nouvelle branche ni worktree.

## Routes réellement déclarées

Routes publiques sous `/obsidia-local`, servies par `server/local-bridge.mjs` dans Vite.

| Route | Méthodes | Source |
| --- | --- | --- |
| cssa-organisation-state | GET, POST | cssa_organisation_state.json |
| cssa-business-state | GET, POST | cssa_business_state.json |
| cssa-ops-state | GET, POST | cssa_ops_state.json |
| cssa-sport-state | GET, POST | cssa_sport_state.json |
| cssa-crm-directory | GET, POST | store annuaire CRM |
| cssa-mail-state | GET, POST | store Mail |
| cssa-mail-ingest | POST | ingestion Mail |
| cssa-sport-watch | GET | surveillance des sources sportives |

## Lectures et delta

Organisation lit déjà le store réel. Sa vue visuelle est maintenant rafraîchie après une écriture du registre et toutes les 15 secondes.
Dossiers lit déjà Business et reçoit ses événements de mise à jour. Ajout d'une relecture périodique.
Accueil lit déjà Ops, Business, Mail et Organisation. Les lectures sont maintenant indépendantes, bornées à 4 secondes ; une source indisponible est signalée UNKNOWN sans bloquer les autres. Les événements de modification déclenchent une relecture.
Tâches lit déjà Ops. Ajout de relecture après écriture dans la gestion détaillée et toutes les 15 secondes.

Le profil de CSSAPage lit maintenant Organisation, Business et Ops toutes les 5 secondes et après modification locale. Il projette les valeurs UNKNOWN explicites, les conflits portant une truthClass de conflit, les champs sémantiques explicites présents dans le store, ainsi que les preuves de dépôt enregistrées avec leur référence et provenance. Les fixtures sont exclues des projections de lignes.

Une lecture de registre donne OBSERVED, jamais PROVEN. Les capacités historiques sans observation restent UNKNOWN, avec leurs détails historiques. Les références historiques de contradictions et de preuves sont explicitement étiquetées. Elles ne sont pas supprimées par un store vide. Aucun droit, aucune validation ou résolution de contradiction n'est déduit des compteurs.

## Statique restant

Catalogue public des rôles et équipes, sources publiques, fixtures sportives utilisées dans l'agenda Accueil, chiffres historiques de la section Tests, références de profils Trading/GPS. Ces éléments ne sont pas convertis en observations live par cette passe.

Les stores peuvent renvoyer un état vide quand le fichier manque ou est illisible ; le frontend ne peut pas distinguer ces situations à partir des réponses actuelles. OBSERVED signifie uniquement réponse du registre lue, pas fichier live présent ni contenu validé.

## Validation

TypeScript : PASS. Build Vite : PASS (avertissement existant de taille du bundle).
Suite complète : 134 tests, 133 PASS, 1 SKIP, 0 échec.
Projection et stores ciblés : 19 PASS.
Diff whitespace et lint des fichiers modifiés : PASS.
HTTP réel Vite : 6 GET PASS ; 3 cycles POST → GET PASS (Organisation, Business, Ops), répertoire live temporaire isolé.

Aucune copie de Builder/KX108, aucune mutation ajoutée aux projections. Pas de validation sur les fichiers live du PC utilisateur ; publication sur main du raccord ; aucun déploiement automatique sur le PC utilisateur.
