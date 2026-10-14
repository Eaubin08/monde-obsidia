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

Les réponses Organisation, Business et Ops exposent désormais `_source` : AVAILABLE, MISSING, INVALID ou UNREADABLE. Le fichier source est identifié par son nom uniquement. Le timestamp de lecture est distinct du timestamp conservé du fichier ; une source absente ne reçoit pas de date de modification artificiellement prouvée. Le fallback Ops est explicitement TEMPLATE. Une réponse HTTP réussie avec source manquante, invalide ou illisible ne produit aucune capacité OBSERVED ni preuve live dans le profil. OBSERVED reste une lecture locale, pas une validation métier. Les contenus invalides sont projetés avec des collections vides et une alerte UNKNOWN ; aucun fichier n’est réparé par la lecture. Les mutations existantes des stores restent inchangées.

## Validation

TypeScript : PASS. Build Vite : PASS (avertissement existant de taille du bundle).
Suite complète après distinction des sources : 138 tests, 137 PASS, 1 SKIP, 0 échec.
Projection et stores ciblés : 19 PASS.
Diff whitespace et lint des fichiers modifiés : PASS.
HTTP réel Vite : 6 GET PASS ; 3 cycles POST → GET PASS (Organisation, Business, Ops), répertoire live temporaire isolé.

Aucune copie de Builder/KX108, aucune mutation ajoutée aux projections. Pas de validation sur les fichiers live du PC utilisateur ; publication sur main du raccord ; aucun déploiement automatique sur le PC utilisateur.

## Plan de reprise CSSA / Monde

1. Cartographie endpoints et statique : faite.
2. Raccord Organisation, Dossiers, Accueil et Tâches : première passe publiée dans 55935e9.
3. Distinction disponible / vide / absent / invalide / illisible : cette passe. HTTP isolé vérifié pour les trois stores : MISSING → POST AVAILABLE → GET AVAILABLE → INVALID. Métadonnées jamais persistées dans les fichiers live.
4. Compléter progressivement les projections métier : ouvert. Conserver les inconnues, contradictions, preuves et provenance. Catalogue public et agenda sportif de référence encore statiques.
5. Validation des parcours et publication sur main : contrôles automatisés faits pour cette passe ; observation du PC Windows encore non réalisée.

La frontière demeure : les registres décrivent le domaine. Builder/KX108 ne sont pas recopiés dans l’UI et aucune autorisation n’est déduite des observations.
