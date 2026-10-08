# AUDIT FONCTIONNEL TRANSVERSAL MONDE V5 — 2026-10-07

Branche auditée : `refactor/monde-ui-v5-zero`

Scope : audit source de la surface active V5 et de son bridge local.
Aucune modification du runtime canonique `obsidia-x108-proofs`.
Aucune modification de `main`.

## Verdict global

`MONDE_V5_CORE = COHERENT`
`CROSS_VIEW_SELECTION = BROKEN_PARTIAL`
`TEST_SUITE_V5 = STALE_MIXED_V3_V5`
`QWEN_DIAGNOSTIC_PROJECTION = MAL_BRANCHE`
`POKEMON_LIFECYCLE_SEMANTICS = PARTIAL`
`JARJAR_P4_RUNTIME = PENDING_QWEN_8080`

La V5 active est structurellement cohérente : Monde, Workspace, Pokémon et Recherche utilisent la même projection `/obsidia-local/state`, les launchers sont dans Workspace, les services système restent séparés des agents, et l'autorité reste `KX108_ONLY`.

Le freeze global ne doit cependant pas être posé avant correction des défauts ci-dessous et exécution d'une régression V5 réellement alignée sur la surface active.

## 1. Navigation et surface active

### Verdict : A_CONSERVER

`src/V5Root.tsx` est bien la surface active et expose :
- Monde
- Workspace
- Pokémon
- Recherche

Les catégories sont distinctes et cohérentes avec la doctrine :
- Monde = projection globale ;
- Workspace = outils / travail / lancement ;
- Pokémon = vie des agents ;
- Recherche = retrouver objets et preuves.

## 2. Workspace / launchers

### Verdict : COHERENT

`src/V5Launchers.tsx` sépare :
- agents / outils : Brody, Obsidure, CLI ;
- services système : Kernel, API/Brody/Native Memory, GPS, Trading, Brody Enriched, Obsidure DryRun ;
- Jarjar comme assistant terrain observé séparément.

Les services natifs sont ouverts par `/obsidia-local/open/<id>`.
Les sessions intégrées Brody / Obsidure / CLI utilisent `/run`, `/input`, `/stop` dans Workspace.

La séparation `surface = terminal | interface` reste cohérente.

## 3. Observation runtime

### Verdict : COHERENT avec une limite

`server/local-bridge.mjs` observe :
- Kernel : port 3001 ;
- API : port 8000 ;
- GPS : processus `aviation_robo.py` ;
- Trading : processus `trading_live.py` ;
- Brody Enriched ;
- Obsidure DryRun ;
- Jarjar : Kernel/API/Qwen/Qwen-VL/HUD.

Les états `READY | STARTING | OFFLINE | DEGRADED` proviennent de ports/process observés et non d'un simple état UI.

### Limite détectée — Sigma

Dans `/cli-runtime` :
```js
const sigmaReady=!!api?.ready
```

Donc Sigma est déclaré READY dès que l'API 8000 est READY, sans probe d'une route Sigma réelle.

Classification :
`SIGMA_STATUS = MAL_BRANCHE / OBSERVATION_TROP_FAIBLE`

Ce n'est pas une panne Sigma démontrée ; c'est une preuve insuffisante dans la projection Monde.

## 4. Synchronisation Monde ↔ Workspace ↔ Pokémon

### Verdict : BROKEN_PARTIAL

Le contexte global existe via :
- `obsidia-focus-entity`
- event `obsidia-context`

Mais la sélection opérationnelle n'est pas complètement propagée.

### Bug A — Pokémon → Workspace

`V5Pokemon.tsx` écrit :
```ts
sessionStorage.setItem('obsidia-workspace-area', ...)
location.hash='workspace'
```

Mais `V5Root.tsx` :
- initialise toujours `workspaceArea` à `home` ;
- ne lit jamais `obsidia-workspace-area`.

Conséquence :
le bouton Workspace depuis un agent peut ouvrir Workspace sans ouvrir l'outil attendu.

Classification :
`CROSS_VIEW_WORKSPACE_AREA = MAL_BRANCHE`

### Bug B — Monde / Recherche → Pokémon

`V5Root.tsx` met à jour `obsidia-focus-entity` et déclenche `obsidia-context`.

Mais `V5Pokemon.tsx` :
- initialise `selected` uniquement depuis `obsidia-selected-session` au montage ;
- ne s'abonne pas à `obsidia-context`.

Conséquence :
ouvrir Pokémon depuis un objet/agent sélectionné peut afficher le premier agent live au lieu de l'agent ciblé.

Classification :
`CROSS_VIEW_POKEMON_SELECTION = MAL_BRANCHE`

## 5. Pokémon / cycle de vie

### Verdict : PARTIAL

La V5 contient réellement :
- Village vivant ;
- Cycle vivant ;
- Missions / équipes ;
- Familles / population ;
- Registre détaillé ;
- regroupement dynamique par mission.

Les services système sont correctement exclus du live Pokémon.

### Décalage sémantique

Le statut `Disponible` est actuellement calculé uniquement pour une session LIVE dont la phase vaut `WAITING_INPUT`.

Or la définition fonctionnelle du projet prévoit aussi :
`Disponible = agent existant, prêt à être lancé`.

Les agents du catalogue non lancés sont actuellement comptés comme `Inactifs`, pas comme `Disponibles`.

Classification :
`POKEMON_AVAILABLE_SEMANTICS = PARTIAL / A_ALIGNER`

### Filtre Inactifs

Le compteur d'inactifs vient du catalogue, mais la liste `visible` filtre uniquement les sessions live.
Le filtre `inactive` ne peut donc pas afficher les agents inactifs dans le village.

Classification :
`POKEMON_INACTIVE_FILTER = ABSENT`

## 6. Jarjar comme objet partagé

### Verdict : BACKEND COHERENT / V5 PRESENTATION PARTIAL

`server/obsidia-state.mjs` projette Jarjar comme un agent/session partagé et transporte :
- `inputMode`
- `cognitionSource`
- `decisionAuthority`
- `governanceSource`
- `governancePhase`
- `humanConfirmationRequired`
- `confirmationPrompt`
- composants Kernel/API/Qwen/Qwen-VL/HUD.

Donc le modèle partagé existe.

Mais `V5Pokemon.tsx` ne typpe ni n'affiche actuellement ces champs spécifiques.
Jarjar apparaît comme agent runtime générique, sans toute sa télémétrie détaillée.

Classification :
`JARJAR_SHARED_OBJECT = ACTUEL`
`JARJAR_POKEMON_TELEMETRY = ABSENT/PARTIAL`

## 7. Qwen diagnostic

### Verdict : MAL_BRANCHE

Le launcher actuel écrit le diagnostic natif dans :
```text
%LOCALAPPDATA%\Obsidia\jarjar_qwen_text_llama.log
```

Mais `jarjarObservedStatus()` lit encore :
```text
%LOCALAPPDATA%\Obsidia\jarjar_qwen_text.log
```

Conséquence :
la carte Jarjar peut ne pas afficher le vrai diagnostic Qwen alors que le log llama.cpp existe.

Classification :
`QWEN_DIAGNOSTIC_LOG = MAL_BRANCHE`

## 8. Qwen readiness / P4 Jarjar

### Verdict : PENDING_RUNTIME

Le launcher actuel exige maintenant `:8080 READY` avant de lancer Jarjar.

C'est cohérent avec le contrat voulu :
- pas de faux provider Qwen actif ;
- pas de Jarjar déclaré complet avec Qwen indisponible.

Le modèle Qwen texte est actuellement en téléchargement sur le PC fixe.
La validation runtime finale reste donc en attente.

Critère :
```text
[QWEN TEXT] READY :8080
puis
[6/6] SERVEURS READY -> INTERFACE JARJAR
```

Puis une requête générale doit produire une source cognition Qwen, et une requête projet doit rester routée selon les règles Brody/Obsidia.

## 9. Tests / non-régression

### Verdict : STALE_MIXED_V3_V5

`package.json` exécute :
```text
node --test tests/*.test.mjs
```

Mais la suite mélange encore des tests legacy et V5.

### `ui-paths.test.mjs`

Ce fichier audite encore :
- `LivePokemon.tsx`
- `Ecosystem.tsx`
- `ToolWorkspace.tsx`

alors que la surface active est :
- `V5Root.tsx`
- `V5Pokemon.tsx`
- `V5Launchers.tsx`.

Il exige aussi encore `start_qwen_text.ps1` dans `start-jarjar-full.ps1`, alors que Qwen texte est maintenant lancé directement par Monde avec `llama-server`.

Classification :
`UI_PATHS_TEST = OBSOLETE_PARTIAL`

### `ui-v5-zero-guard.test.mjs`

Il cible bien la V5, mais certaines attentes textuelles ne correspondent plus au composant actuel :
- attend `PARCOURS VIVANT`, source actuelle = `CYCLE VIVANT` ;
- attend `Registre détaillé du catalogue`, source actuelle = `Registre détaillé`.

Donc la suite ne peut pas être considérée comme une preuve propre de non-régression tant qu'elle n'est pas réalignée.

Classification :
`V5_GUARD_TEST = MAL_BRANCHE_TEXT_EXPECTATIONS`

## 10. Gouvernance / frontières

### Verdict : A_CONSERVER

L'audit source ne trouve pas de régression de doctrine dans Monde :
- `KX108_ONLY` reste affiché/projeté ;
- Monde est `canonicalTruth=false` ;
- la projection est readonly ;
- les services ne deviennent pas des Pokémon ;
- aucune autorité décisionnelle n'est ajoutée par la V5 ;
- les actions Workspace restent derrière les routes bridge explicites.

## Priorités de correction après audit

### P0 — avant freeze V5
1. Corriger synchronisation de sélection V5 :
   - Pokémon → bon onglet Workspace ;
   - Monde/Recherche → bon agent Pokémon.
2. Réaligner les tests sur V5 active et supprimer les assertions legacy trompeuses.
3. Corriger le chemin du diagnostic Qwen.
4. Ajouter un vrai probe Sigma ou renommer l'état comme inféré depuis API.

### P1 — Pokémon
5. Aligner `Disponible` avec le catalogue d'agents lançables.
6. Rendre le filtre `Inactifs` réellement visible.
7. Exposer dans la fiche Jarjar : mode d'entrée, cognition, gouvernance, dernier résultat.

### P2 — runtime
8. Dès Qwen téléchargé :
   - valider :8080 ;
   - test route général → Qwen ;
   - test projet → Brody/Obsidia ;
   - test vision → Qwen-VL ;
   - vérifier `KX108_ONLY`.
9. Lancer build + lint + tests V5 réalignés.
10. Freeze V5 seulement après régression verte.

## Conclusion

La V5 n'est pas à reconstruire.

Le coeur fonctionnel est cohérent, mais le freeze global est prématuré tant que :
- la sélection inter-vues n'est pas déterministe ;
- les tests audités ne correspondent pas tous à la surface active ;
- le diagnostic Qwen n'est pas raccordé au vrai log ;
- le cycle Pokémon ne reflète pas encore exactement le catalogue disponible/inactif ;
- P4 Jarjar n'a pas été validé avec Qwen :8080 READY.


## Correctifs appliqués après audit

État au 2026-10-07 — corrections source posées, validation live globale reportée après disponibilité Qwen :8080.

- `CROSS_VIEW_WORKSPACE_AREA` : CORRIGE_SOURCE
  - V5Root lit et persiste `obsidia-workspace-area`.
  - Pokémon peut ouvrir le bon onglet Workspace.

- `CROSS_VIEW_POKEMON_SELECTION` : CORRIGE_SOURCE
  - V5Pokemon écoute `obsidia-context`.
  - une entité agent ciblée est résolue vers sa session live quand elle existe.

- `QWEN_DIAGNOSTIC_LOG` : CORRIGE_SOURCE
  - Monde lit désormais `jarjar_qwen_text_llama.log`.

- `SIGMA_STATUS` : CORRIGE_SEMANTIQUE
  - l'API 8000 seule ne produit plus un faux `READY` Sigma ;
  - état projeté : `API_READY_UNVERIFIED` tant qu'une route Sigma réelle n'est pas probée.

- `POKEMON_AVAILABLE_SEMANTICS` : CORRIGE_SOURCE
  - les agents du catalogue non live sont maintenant comptés comme disponibles.

- `POKEMON_INACTIVE_FILTER` : CORRIGE_SOURCE
  - le filtre peut rendre les agents inactifs/non observés localement.

- `JARJAR_POKEMON_TELEMETRY` : CORRIGE_SOURCE
  - entrée, cognition, autorité, gouvernance, confirmation et fraîcheur télémétrie sont exposées dans la fiche Jarjar.

- `UI_PATHS_TEST` : REALIGNE_V5
  - les assertions legacy V3 ont été remplacées par les chemins V5 actifs.

- `V5_GUARD_TEST` : REALIGNE
  - attentes textuelles mises en phase avec `CYCLE VIVANT`, `VILLAGE VIVANT`, `Registre détaillé`.

### Quick checks source

13 invariants critiques vérifiés sur les sources de branche : 13/13 présents/cohérents.

Cela ne remplace pas :
- `npm test`
- `npm run build`
- le test Windows live des launchers
- le test de routage Jarjar avec Qwen :8080 READY

Ces validations restent à exécuter en fin de téléchargement Qwen.


### Corrections de navigation et vérité runtime — passage 2

- Mission accueil Monde : ouvre maintenant la zone Activité avec la mission sélectionnée.
- Activité récente : ouvre maintenant la zone Activité avec la session sélectionnée.
- Bouton Workspace depuis un objet Monde : ouvre l'onglet Brody / Obsidure / CLI lorsque le contexte le permet.
- Recherche → Pokémon : transporte désormais la sélection d'agent ; les entrées R&D essaient de résoudre l'agent canonique par libellé.
- Recherche → Monde : conserve également le contexte ciblé.
- Statut global V5 : `Core LIVE` n'est plus dérivé de `snapshot.available`.
  - Kernel X108 READY observé requis.
  - API Obsidia READY observée requise.
  - Un repo lisible sans runtime affiche désormais `Sources disponibles / Runtime core non prêt`.

Quick checks source après ce passage : `20/20` invariants critiques présents.


### Réaudit source — passage 3

Nouveaux défauts trouvés et corrigés :

- `POKEMON_AVAILABLE_INACTIVE_OVERLAP` : CORRIGE
  - les agents déclarés non locaux/inactifs ne sont plus comptés simultanément comme disponibles.

- `QWEN_LOCAL_MODEL_HANDOFF` : CORRIGE_SOURCE
  - le launcher Jarjar préfère désormais :
    1. `OBSIDIA_QWEN_TEXT_MODEL` si fourni ;
    2. `%USERPROFILE%\Desktop\MODELS\QWEN\qwen2.5-3b-instruct-q4_k_m.gguf` si le fichier complet est présent ;
    3. Hugging Face seulement sinon.
  - cela évite de retélécharger Qwen après le téléchargement manuel actuel.

- `BRODY_API_FOREIGN_PORT` : CORRIGE
  - un simple port 8000 ouvert n'est plus `ready=true`.
  - l'identité `service=obsidia-api` doit être confirmée.
  - un service étranger sur 8000 est refusé.

- `KERNEL_API_PORT_ONLY_READY` : CORRIGE
  - Kernel 3001 et API 8000 ne sont plus déclarés READY sur simple port ouvert.
  - le propriétaire du port doit correspondre au process canonique attendu.
  - Jarjar refuse un prérequis sur port occupé par un process non canonique.

- `OBSIDURE_DRY_FALSE_POSITIVE` : CORRIGE
  - `Obsidure DryRun` exige maintenant `run_agent_obsidure.ps1` avec `-DryRun`.

- `JARJAR_SELF_PROCESS_FALSE_POSITIVE` : CORRIGE
  - la sonde PowerShell exclut son propre PID avant de rechercher `scripts.run_jarjar_live`.

- `QWEN_PORT_ONLY_READY` : CORRIGE
  - Qwen texte READY exige maintenant un `llama-server --port 8080`.
  - Qwen-VL READY exige maintenant un `llama-server --port 8081`.

Vérification heartbeat :
- observer : heartbeat toutes les 1 seconde ;
- Monde : LIVE si événement < 5 secondes ;
- marge cohérente, aucun défaut source identifié ici.

### Reste live-only

Le réaudit source ne peut pas prouver sans exécution Windows :
- que les processus réels ont exactement les lignes de commande attendues après pull ;
- que les ports 3001/8000/8080/8081 sont tous détectés correctement sur le fixe ;
- que le GGUF téléchargé se charge complètement ;
- que `/v1/chat/completions` répond réellement ;
- que le routage réel choisit Qwen/Brody/Vision comme prévu ;
- que build + tests TypeScript passent dans l'environnement local.

Ces points restent réservés au test live final.


### Réaudit source — passage 4 (angles alternatifs)

Angles audités :
- dérive par rapport au freeze runtime ;
- code legacy encore compilé par TypeScript ;
- readonly réel du bridge ;
- vérité des chemins externes ;
- coût du polling source ;
- états périmés silencieux ;
- cohérence du runbook opérateur.

Constats / corrections :

- `FREEZE_TERMINAL_DRIFT` : AUCUNE
  - `server/native-terminal.mjs` et `scripts/start-service-colored.ps1` ne font pas partie du diff depuis `freeze/monde-runtime-raccord-20261007`.

- `BRIDGE_READONLY_WRITES` : COHERENT
  - les écritures du bridge/observer vont vers `.obsidia-live` et les rapports d'observation, pas vers la source canonique X108.

- `VITE_PREVIEW_RUNTIME` : DOCUMENTE
  - `DEMARRER.cmd` utilise bien `npm run dev` et charge le bridge.
  - `vite preview` n'implémente pas `configurePreviewServer` et ne doit donc pas être utilisé comme launcher runtime.
  - README corrigé.

- `README_ARCHITECTURE_DRIFT` : CORRIGE
  - l'ancien modèle « launchers dans Pokémon / Brody démarre son API » a été remplacé par la V5 réelle.

- `QWEN_MANUAL_DOWNLOAD_RACE` : CORRIGE
  - si `curl.exe` écrit encore le GGUF local, Jarjar refuse de démarrer Qwen au lieu de lancer un second téléchargement Hugging Face.

- `EXTERNAL_REPO_FALSE_ABSENT` : CORRIGE
  - GPS et Trading utilisent désormais plusieurs candidats locaux + `OBSIDIA_GPS_ROOT` / `OBSIDIA_TRADING_ROOT`.

- `SNAPSHOT_DUPLICATE_WORK` : CORRIGE
  - `/snapshot` et `/state` appelaient tous deux les scans Git/source dans le même cycle UI.
  - cache court 3 s ajouté pour éviter les doubles `git ls-files`, `git worktree list`, `git status` et scans evidence.

- `STALE_UI_ON_POLL_FAILURE` : CORRIGE
  - Pokémon et Lancements affichent maintenant explicitement une perte d'observation runtime au lieu de conserver silencieusement le dernier état.

Checks source de ce passage : `16/16`.

### Point restant notable

`tsconfig.app.json` inclut tout `src`.
Les anciennes vues non actives restent donc compilées par TypeScript même si `main.tsx` charge uniquement `V5Root.tsx`.
Aucune erreur source évidente n'a été identifiée dans les fichiers legacy inspectés, mais seule l'exécution de `npm run build` sur le fixe ferme définitivement ce risque.


## Validation live P4 — 2026-10-07

Etat observe sur le PC fixe apres chargement du GGUF local :

- Kernel X108 : READY sur :3001.
- API Obsidia/Brody : READY sur :8000.
- Qwen texte local : READY sur :8080.
- Qwen-VL : READY sur :8081.
- Jarjar HUD : demarre.
- mode clavier : observe via `JARJAR_INPUT_MODE: KEYBOARD`.
- modele Qwen texte : decouvert depuis le GGUF local.
- requete generale : routee vers Qwen avec reponse correcte.
- requete projet Obsidia : routee vers Brody / Native Memory readonly.
- decision authority : `KX108_ONLY`.
- aucun fallback Qwen sur le test general final.

Preuve live observee :
```text
JARJAR_QWEN_MODEL: discovered=C:\\Users\\Aubin\\Desktop\\MODELS\\QWEN\\qwen2.5-3b-instruct-q4_k_m.gguf
JARJAR · QWEN> La capitale de l'Australie est Canberra.
```

Classification :
`P4_QWEN_TEXT = FERME_LIVE`
`P4_BRODY_ROUTE = FERME_LIVE`
`P4_KERNEL_API = FERME_LIVE`
`P4_VISION = RESTE_A_VALIDER_LIVE`

Le seul test P4 restant est une requete visuelle reelle avec evidence image/screen/camera afin de confirmer la route Qwen-VL de bout en bout.


## P4 vision / voix — réaudit live après premier test réel

Premier test réel :
`Regarde mon écran et dis-moi ce que tu vois.`

Résultat observé :
`BRODY/OBSIDIA/FALLBACK[VISION_AND_QWEN_UNAVAILABLE]`

Constats :
- Qwen-VL : port 8081 READY, mais la route vision n'a pas produit de réponse.
- OpenCV : erreurs MSMF sur indices caméra configurés.
- la timeline live pouvait échouer entièrement lorsqu'une caméra levait une exception, même si une capture écran valide existait déjà.
- le provider vision masquait ses exceptions dans le router.
- Qwen-VL utilisait encore un identifiant de modèle codé en dur au lieu de découvrir le modèle exposé par llama-server.
- la capture voix a atteint le plafond historique de 120 s, preuve que le seuil silence par défaut était trop permissif pour le micro-casque / bruit ambiant.
- le HUD pouvait rester visuellement vert car LISTENING pouvait écraser THINKING/SPEAKING lors de concurrence clavier/voix.

Correctifs Jarjar posés sur `fix/qwen-live-main-20261007` :
- caméra fail-soft par slot ;
- erreurs vision visibles dans le terminal ;
- Qwen-VL découvre son modèle via `/v1/models` ;
- indices caméra par défaut élargis 0,1,2,3 ;
- durée max utterance : 20 s par défaut ;
- seuil RMS par défaut : 650 ;
- protection des états HUD THINKING/SPEAKING contre un reset LISTENING prématuré.

Classification actuelle :
`P4_QWEN_TEXT = FERME_LIVE`
`P4_BRODY_ROUTE = FERME_LIVE`
`P4_KERNEL_API = FERME_LIVE`
`P4_VISION = CORRIGE_SOURCE / A_REVALIDER_LIVE`
`P4_VOICE_BOUNDARY = CORRIGE_SOURCE / A_REVALIDER_LIVE`
`P4_HUD_STATE_COLORS = CORRIGE_SOURCE / A_REVALIDER_LIVE`
