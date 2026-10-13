# MONDE OBSIDIA — JOURNAL DE RECONSTRUCTION FONCTIONNELLE

## TRANCHE 1 — CSSA Sportif · Seniors R1

- **Date d'exécution** : 13 octobre 2026
- **Responsable** : Antigravity Agent
- **Cible locale** : `C:\Users\Aubin\Desktop\OBSIDIA_WORLDS\monde-obsidia-git`
- **Branche** : `main`

---

### 1. Objectifs de la tranche

1. Éliminer les deux régressions bloquantes :
   - Échec de compilation TypeScript (`TS6133` sur composant orphelin `CssaSportPage` et variables inutilisées).
   - Échec du test unitaire `universal-c5-bridge.test.mjs` (gardien C5 invariant).
2. Mettre en place un routage d'ancrage profond :
   - `#cssa/sportif/SENIORS_R1` (sélection de l'équipe R1).
   - `#cssa/sportif/SENIORS_R1/<MATCH_ID>` (ouverture directe du dossier opérationnel).
3. Remplacer `localStorage` par une persistance locale serveur sur disque :
   - Fichier cible : `.obsidia-live/cssa_sport_state.json`.
   - Endpoints Vite / local-bridge : `GET /obsidia-local/cssa-sport-state`, `POST /obsidia-local/cssa-sport-state`.
4. Construire un dossier opérationnel de match complet :
   - Checklist de préparation à 6 items (convocation, transport, feuille de match, médical, kit équipement, briefing).
   - Notes du staff opérationnel avec sauvegarde auto sur blur ou bouton.
   - Suivi dynamique des tâches opérationnelles associées au match (création, toggle d'état, suppression).
   - Alerte explicite de conflit d'observation sur J7 Bogny vs Sedan (`PUBLIC_CONFLICT_REVIEW` avec horodatages discordants SportCorico vs LeBallonRond).
5. Intégrer la veille multi-sources et les flux DVCR :
   - Sources officielles et corroborées (SportCorico, LeBallonRond, CSSA officiel, District des Ardennes).
   - Intégration du média indépendant DVCR (*Drapeau Vert / Carton Rouge*, SIREN 923996078) : lien direct chaîne, statut de diffusion matchday YouTube, articles & avant-matchs.
6. Garantir la vérité des données :
   - Seniors R1 (26 matchs de championnat R1 + 3 tours de Coupe de France dont victoire 0-2 à Hagondange au 5e tour) : catégorisés `SECONDARY_CORROBORATED` ou `PUBLIC_CONFLICT_REVIEW`.
   - 18 autres équipes de jeunes / réserves : explicitement isolées avec badge `SIMULATED_NOT_OBSERVED` (F3E).

---

### 2. Fichiers créés et modifiés

#### Fichiers créés
- `server/cssa-sport-store.mjs` : Gestionnaire de persistance sur disque pour `.obsidia-live/cssa_sport_state.json`.
- `tests/cssa-sport.test.mjs` : Suite de tests automatisés (5 tests) couvrant store, watch, fixtures et bridge.
- `docs/audits/MONDE_OBSIDIA_REBUILD_LOG.md` : Présent journal de reconstruction.

#### Fichiers modifiés
- `src/CSSAPage.tsx` : Nettoyage du composant orphelin et routage vers `CSSASportPage`.
- `src/V5Root.tsx` : Préservation du panneau C5 en lecture seule pour honorer le contrat de gouvernance.
- `src/CSSASportPage.tsx` : Refonte complète en cockpit opérationnel avec routage profond, persistance serveur, tabs dossier / médias / sources, gestion des tâches et de la checklist.
- `src/CSSASport.css` : Styles CSS complets pour la grille 3 colonnes, les badges de vérité, la checklist, les tâches et les onglets.
- `server/local-bridge.mjs` : Ajout des routes GET/POST `/obsidia-local/cssa-sport-state` avec fallback mémoire/disque.
- `server/cssa-sport-watch.mjs` : Extension avec les URLs DVCR (direct YouTube, blog, podcast) et cache persistant.

---

### 3. Résultats des tests et vérifications

| Commande | Résultat | Détail |
|---|---|---|
| `npm.cmd run build` | **PASS** | `tsc -b` (0 erreur TS) + Vite build (28 modules compilés en 210ms) |
| `npm.cmd test` | **PASS** | 75 passés / 0 échoué |
| `node --test tests/cssa-sport.test.mjs` | **PASS** | 5 passés / 0 échoué |

---

### 4. Limites restantes pour la tranche suivante

1. Les 18 équipes hors Seniors R1 restent en mode synthétique (`SIMULATED_NOT_OBSERVED`).
2. La synchronisation automatique des compositions de match et feuilles de match officielles FFF n'est pas encore connectée à l'API FFF (fédérale) fermée.
3. Les tâches créées sur un match sont stockées au niveau du dossier sportif CSSA, pas encore reliées à l'orchestrateur général de tâches multi-organisations.

---

## TRANCHE 2 — CSSA Autres Équipes (R2, U20, Jeunes) & Calendrier Global Club

- **Date d'exécution** : 13 octobre 2026
- **Responsable** : Antigravity Agent
- **Cible locale** : `C:\Users\Aubin\Desktop\OBSIDIA_WORLDS\monde-obsidia-git`
- **Branche** : `main`

---

### 1. Objectifs de la tranche

1. Raccordement réaliste et corroboré de **Seniors R2 (Réserve)** :
   - 22 journées réelles de championnat Régional 2 Poule A.
   - Les 11 clubs réels du groupe R2_A issus du modèle public : Rethel SF, Reims Murigny FP, AS Val de l’Aisne, ES Fagnières, Reims FC Christo, Val de l’Orne FC, AS Saint-Brice-Courcelles, UL Plantières, US Étain-Buzy, Reims Sainte-Anne 2, CS Veymerange.
   - Résultats réels J1 à J5 et J6 (Rethel 1–1 Sedan 2 avec alerte de discordance horaire DNA vs Miroir CSSA).
   - Domicile : `Complexe Montvillers (Bazeilles)` pour éviter les conflits avec le Stade Louis-Dugauguez.
2. Raccordement réaliste et corroboré de **U20 R1 (Développement)** :
   - 22 journées en U20 Régional 1 (LGEF).
   - Confirmation de création via le site officiel (`https://cs-sedan.fr/groupe-de-developpement`).
   - Match réel corroboré du 03/10/2026 (OBS_U20_R1_WEEKEND) : Sedan U20 2–0 Reims Sainte-Anne U20 au Complexe Montvillers.
3. Intégration des résultats réels observés pour les équipes de jeunes :
   - U16 R1 vs OCPAM (1–1, source Est Républicain).
   - U15 R1 vs MIFA (2–1, source Le Progrès).
   - U15 D1 vs Bazeilles, U17 R1 chez Academy FC, U13 Fanion chez Bourg-Rocroi.
   - Transparence totale pour les catégories non raccordées : bandeau d'alerte explicite `DONNÉES RÉELLES NON RACCORDÉES` et bouton pour basculer la simulation F3E sans mélanger les vérités.
4. Construction du **Calendrier Global Consolidé du Club** (`#cssa/sportif/CALENDRIER_GLOBAL`) :
   - Regroupement multi-équipes transversal.
   - Filtres : Tout, Ce week-end (17–18 oct.), Week-end passé (03–04 oct.), Domicile, Extérieur, Conflits.
   - Barre logistique : total matchs, domicile (FMI obligatoire LGEF Art. 24), extérieur (minibus à réserver).
   - Détecteur de conflits d'occupation de terrain (`detectPitchConflicts`) avec alertes réglementaires (LGEF Art. 20-7) et création en 1 clic de tâches de conciliation de créneau sur le disque.
5. Préservation absolue des acquis de la Passe 01 :
   - Build TypeScript vert (`tsc -b`).
   - Tests automatisés portés de 75 à 80 tests (100% PASS).
   - Persistance universelle des notes, checklists et tâches sur `.obsidia-live/cssa_sport_state.json`.

### 4. Architecture à 4 Niveaux déployée (Version Corrigée)

Conformément à la directive du club (ne pas créer 19 copies plates de tableaux de bord, mais structurer selon la réalité opérationnelle) :

1. **Niveau 1 — Équipes Majeures (Profondeur)** :
   - *Seniors R1*, *Seniors R2*, *U20 R1*.
   - Dossier opérationnel complet : checklist de préparation à 6 items, notes du staff, tâches dynamiques, historique, sources officielles, diffuseur DVCR et analyse d'impact.
2. **Niveau 2 — Formation / Académie (Supervision globale)** :
   - Regroupement des catégories *U17 R1*, *U16 R1*, *U15 R1*, *U15 D1*, *U13 Fanion*, *U13/U12 Espoir*, *U12 Avenir*.
   - Vue de supervision synthétique : indicateurs clés, filtrage par catégorie, résultats réels observés (*U16 vs OCPAM 1–1*, *U15 vs MIFA 2–1*, *U15 D1 vs Bazeilles*), fiche inspecteur allégée (notes éducateur & source, sans surcharge de checklist senior).
3. **Niveau 3 — École de Foot (Programme Week-end / Plateaux)** :
   - Regroupement des catégories *U11 Fanion*, *U11/U10 Espoir*, *U10 Avenir*, *U9*, *U8*, *U7*, *U6*.
   - Tableau unifié des rassemblements départementaux et plateaux : catégorie, équipe, horaire, format (Foot à 8 / Foot à 5), site/terrain (Montvillers synthétique ou déplacements), adversaires, source officielle (District des Ardennes FFF), statut de confirmation.
4. **Niveau 4 — Pôle Féminin (Groupe dédié)** :
   - Regroupement de *Seniors Féminines* et *U18F R2* dans un espace dédié commun avec sélecteur d'équipe.
5. **Calendrier Global du Club (Vue transversale)** :
   - Regroupement de l'ensemble des rencontres et créneaux du club avec filtres transversaux (*Tout*, *Seniors*, *Formation*, *Féminines*, *Domicile*, *Extérieur*, *Ce week-end*, *Week-end passé*, *Conflits*).
   - Détecteur de collisions de terrain (`detectPitchConflicts`) appliquant les règles LGEF (Art. 20-7) avec bouton de création immédiate de tâche de conciliation.
   - Séparation stricte de la simulation F3E : bandeau explicite `DONNÉES RÉELLES NON RACCORDÉES` et bouton de bascule indépendant.

---

### 5. Limites restantes pour la tranche suivante

1. Raccordement direct aux flux automatisés du District des Ardennes et de la LGEF via un robot de veille périodique.
2. Gestion des convocations nominatives des joueurs par catégorie une fois la base d'effectif raccordée.
3. Extension du module aux aspects financiers, licences et billetterie pour les matchs à Dugauguez.


