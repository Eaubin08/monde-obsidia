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
Dernière suite globale achevée (Accueil) : 159 tests, 158 PASS, 1 SKIP, 0 échec. Passe Organisation suivante : 41 tests ciblés PASS ; suite globale interrompue par revue automatique lors d’un accès SportCorico.
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

## Passe suivante exécutée : personnes et provenance

Tâches et Dossiers lisent le store Organisation pour résoudre respectivement `responsiblePersonId` et `ownerPersonId`. Seul l’identifiant explicite relie un objet métier à une personne ; aucun rapprochement par nom, poste ou rôle public. La lecture est actualisée toutes les 15 secondes et après une modification d’Organisation. Une réponse antérieure ne peut pas remplacer une lecture plus récente dans ce raccord.

Référence absente, ambiguë, source indisponible ou nom absent : UNKNOWN. Un nom historique sans lien canonique reste signalé comme déclaré. Une personne inactive garde son statut visible ; le raccord ne lui confère aucune habilitation.

Les cartes des dossiers montrent leur pilote et source. Le dossier sélectionné expose les références de validation, dépôt, pièce justificative, résultat externe et documents liés. La tâche sélectionnée expose sa source, classe de vérité et références CRM / match. Aucune mutation métier ni autorisation n’est ajoutée.

Validation réutilisée : TypeScript, build Vite et lint PASS ; 140 PASS / 1 SKIP / 0 échec. Cas couverts : nom canonique actualisé, personne inactive, référence supprimée, doublon ambigu, source indisponible et absence d’inférence depuis un rôle ou un nom déclaré.

## Position dans le plan directeur

Cette séquence est un raccord de projections CSSA / Monde, pas le plan directeur complet ni un nouveau chantier Builder.

Référence de direction : `OBSIDIA_PLAN_MAITRE_MONDE_V01_BUILDER_UNIVERSALITE_2026-10-14.md`, ajouté le 14 octobre à 13 h 19 (Europe/Paris), après le mail de direction UX DVCR de 8 h 55. Forge privée, Builder entreprise, Monde, Workspace et Pokémon restent distincts. La Company Baseline précède la reconstruction ; les agents sont générés selon les besoins réels, et les templates accélèrent la forme sans imposer la vérité.

Correction de reprise issue de `Texte collé(20261014-192844).txt` (audit sémantique, passe 2) : composer `NonSovereignAgentSpec`, `AgentResult`, `ContextPacket`, contrats providers et leases existants. FunctionContract ne se reconstruit pas de zéro. OrganizationBaseline ne remplace pas DomainState. UNKNOWN conduit à HOLD DESIGN, pas à la création automatique d’un agent. Les patterns de promotion mémoire ne constituent pas un lifecycle d’organe.

Instruction de reprise de l’utilisateur : audits terminés, continuer leur exécution sans rouvrir une campagne d’audit. Les futurs raccords s’appuient sur ces conclusions et préservent les responsabilités des dépôts.

## Passe exécutée : dossier → exigence → document / tâche

Le dossier sélectionné expose maintenant chaque exigence : criticité, état déclaré, échéance, responsable canonique et source. Les liens vers document et tâche ne sont navigables que si la source locale est AVAILABLE et si l’identifiant désigne exactement un objet. Lien absent, référence supprimée, doublon ambigu et source indisponible sont distingués. Aucun nom ou titre ne sert à deviner une relation.

Les tâches sont lues depuis le store Ops existant et actualisées après ses événements de modification et toutes les 15 secondes. Aucun registre de tâches secondaire n’est créé. La tâche garde son état et responsable propres ; son achèvement ne modifie ni exigence ni validation.

Documents possède une fiche sélectionnée avec version, statut, source, référence de fichier, validité, origine mail et boutons vers les dossiers utilisateurs. Ces liens proviennent exclusivement de `dossierId`, `usedIn` ou des exigences référant le document. Une référence cassée reste UNKNOWN. Le document sélectionné est visible même si les filtres de la bibliothèque le masquent ; la gestion détaillée est ouverte à la sélection.

Cette passe est une projection/navigation : zéro nouvelle écriture métier, zéro création automatique d’objet, zéro changement d’autorité. Aucun fichier référencé n’est ouvert ou téléchargé automatiquement.

Validation : TypeScript, build Vite, lint des fichiers modifiés et diff whitespace PASS. Suite : 143 PASS, 1 SKIP, zéro échec. Tests : résolution unique par id, absence de lien, source indisponible, id dupliqué et distinction template / source disponible.

## Passe exécutée : création de tâche confirmée et retour au dossier

Le bouton de création relit l’exigence, son dossier et les tâches du registre. Une référence absente/ambiguë, une source INVALID/UNREADABLE ou un dossier supprimé bloque le raccord. Une tâche existante liée à la même exigence et au même dossier est réutilisée sans réinitialiser son statut ni ses données.

Pour une nouvelle tâche, l’identifiant est stable par exigence (`task-dossier-<requirement-id>`). Les réponses des deux écritures sont vérifiées. Le lien n’est envoyé au store Business qu’après confirmation de la tâche. La dernière version de l’exigence est relue ; seul `taskRefId` est écrit, sans réécrire son état, sa source ou sa validation. La fiche affiche les erreurs et bloque les clics concurrents dans cette instance de la page.

Les stores restent séparés : si la tâche existe mais que le lien échoue, la tâche est conservée et l’échec signalé. Une reprise relit les relations et réutilise cette tâche. Aucun rollback automatique ni transaction interstores n’est introduit. Les sources MISSING permettent l’initialisation Ops par l’action explicite existante ; leurs templates ne sont pas traités comme tâches live avant cette écriture.

La tâche expose un retour à son dossier depuis sa relation DOSSIER, résolue dans le store Business réel. Une référence cassée ou ambiguë reste UNKNOWN.

Validation : TypeScript, build Vite, lint et diff whitespace PASS ; 151 PASS, 1 SKIP, zéro échec. Scénarios : échec écriture tâche sans lien, succès conservant l’état courant d’exigence, échec lien puis reprise sans doublon et sans remise à zéro, tâche déjà liée sans écritures, ambiguïté, source invalide, référence cassée, dossier supprimé et id occupé non écrasé. Scénario HTTP isolé : création → lien → répétition sans doublon, exigence A_VERIFIER conservée.

## Passe exécutée : attention des dossiers sur Accueil

Accueil dérive une file de liens dossiers à revoir à partir de Business, Ops et Organisation déjà servis : exigences obligatoires non satisfaites, pilote ou responsable sans lien canonique, personne inactive, document lié introuvable/ambigu, pièce expirée, date de validité invalide et tâche référencée introuvable/ambiguë. Une source indisponible produit UNKNOWN source, et non une affirmation que l’objet manque. Les alertes conservent le libellé de l’exigence et sa source ; chaque ligne ouvre le dossier existant.

Une exigence SATISFAIT associée à une pièce expirée demeure SATISFAIT dans le store et produit une alerte. Une tâche TERMINE ne satisfait pas l’exigence. L’indicateur positif de préparation sur Accueil n’est plus présenté quand ces écarts sont détectés ; aucun statut, validation, dépôt ou autorisation n’est modifié.

Le compteur des dossiers à traiter compte les ids uniques sur les alertes existantes et celles de liens. Le compteur d’attention club utilise désormais toute la file, et non sa tranche visible de 12 lignes. Le nombre affiché et le total sont distingués. Les KPIs Tasks, Business et Mail affichent UNKNOWN quand la lecture concernée échoue ; les autres observations restent visibles, avec indication de vue partielle.

Validation : TypeScript, build Vite, lint et diff whitespace PASS ; 158 PASS, 1 SKIP, zéro échec. Sept scénarios ajoutés : liens disponibles sans mutation ; pièce périmée malgré exigence SATISFAIT ; référence supprimée vs source absente vs ambiguïté ; nom déclaré/personne inactive/source Organisation absente ; travail obligatoire incomplet malgré tâche terminée ; date invalide ; source Business absente/dossiers clos/résultats non plafonnés à douze.

## Passe exécutée : personne → travail assigné

Organisation expose une fiche personne navigable (`#cssa/organisation/person%3A<id>`), séparée des ids de rôles publics. Les cartes personnes ouvrent cette fiche ; le filtre Toutes permet aussi de consulter les personnes inactives. Les liens depuis une tâche ou un dossier ouvrent directement le responsable canonique concerné.

La fiche rassemble les tâches ouvertes, dossiers actifs pilotés et exigences non satisfaites assignées explicitement via `responsiblePersonId` / `ownerPersonId`. Les états viennent des stores Ops / Business existants, sans duplication de registre, sans rapprochement par nom et sans affectation déduite d’un rôle. Les éléments terminés, dossiers clos et fixtures sont exclus du travail ouvert. Une exigence assignée avec dossier introuvable reste visible avec UNKNOWN et sans navigation vers un objet supposé.

La fiche conserve statut, contact, source, notes, rôles, disponibilités et habilitations déclarées. Une personne inactive peut garder du travail assigné ; aucune activation ou réaffectation n’en est déduite. Les métadonnées d’habilitation ne sont pas une décision d’exécution. Source absente ou identité ambiguë : UNKNOWN ; source Ops/Business absente : compteur du travail UNKNOWN. Les KPIs Organisation affichent aussi UNKNOWN si son fichier n’est pas disponible.

Validation de cette passe : 41 tests ciblés PASS (person-work, Organisation store, people projection, linked references, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. La suite globale a été interrompue par la revue automatique sur un accès réseau à www.sportcorico.com ; aucune réussite globale nouvelle n’est revendiquée. Les tests ciblés de remplacement n’effectuent pas cet accès web. Les six scénarios person-work couvrent ids explicites vs noms égaux, exclusion terminé/fixture/clos/satisfait, personne inactive sans mutation, personne absente/ambiguë/source absente, sources de travail absentes et exigence avec dossier manquant.

## Passe exécutée : compteurs de navigation issus des registres

Les badges Organisation, Tâches, Dossiers et Documents utilisent les observations locales déjà lues par le shell, au lieu des entités natives ou du catalogue historique. Ils comptent respectivement les personnes ACTIF, tâches non TERMINE, dossiers sans résultat enregistré et hors ATTRIBUE/NON_RETENU/ANNULE, et toutes les références documentaires. Ces périmètres correspondent aux vues initiales des pages ; les filtres locaux peuvent ensuite afficher un autre sous-ensemble. Le libellé accessible et l’infobulle précisent le périmètre ; l’infobulle garde la route source.

Une source absente, INVALID, UNREADABLE, non qualifiée AVAILABLE ou une collection illisible affiche UNKNOWN. Les templates MISSING ne deviennent pas des compteurs live. Une source disponible vide affiche explicitement 0. Les autres modules conservent leurs références de navigation. Les lectures du shell portent un numéro de génération afin qu’une réponse ancienne ne remplace pas une actualisation plus récente.

Projection seule : aucune écriture dans les registres, modification de validation ou inférence d’autorisation. Les inconnues, contradictions, sources et preuves existantes sont conservées.

Validation : 44 tests ciblés PASS (navigation-counts, live-profile, person-work, linked-reference, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Les cinq nouveaux scénarios couvrent périmètres réels, zéro vs UNKNOWN, templates/sources invalides, collections malformées/résultats manquants et indépendance des sources. Suite globale non relancée ; la limite réseau déjà documentée reste applicable.

## Passe exécutée : Tâches distingue registre réel et modèle de secours

La vue métier Tâches ne présente plus les tâches du template Ops comme du travail réel quand le fichier local est MISSING ou que la source n’est pas AVAILABLE. Les trois indicateurs deviennent UNKNOWN, les listes de triage sont remplacées par un message explicite et la gestion détaillée reste accessible pour préparer le registre. Un registre AVAILABLE vide conserve ses compteurs à zéro.

La lecture utilise le même endpoint local, sans cache et avec délai maximal de quatre secondes. Une structure illisible ou une tâche dont les champs nécessaires au rendu manquent produit une indisponibilité explicite, sans conserver d’anciennes lignes affichées. Un numéro de génération empêche les réponses précédentes de remplacer une lecture plus récente ; le démontage empêche leur application à une page quittée.

Une sélection de tâche ouvre la gestion détaillée, notamment depuis Dossiers ou Organisation. Les statuts, relations, sources et métadonnées sont conservés tels que lus. Aucun changement du protocole d’écriture ni de l’autorité de validation n’est introduit.

Validation : 44 tests ciblés PASS (tasks-read, navigation-counts, requirement-task, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Les cinq nouveaux scénarios vérifient conservation des relations/provenance/contradictions, maintien de MISSING pour un template, refus des réponses HTTP et structures invalides, registre vide AVAILABLE et paramètres de lecture locale bornée. Suite globale non relancée.

## Passe exécutée : disponibilité réelle Dossiers / Documents

Les deux pages relisent Business via un raccord de lecture commun : endpoint existant, absence de cache, timeout quatre secondes, contrôle des six collections utilisées et identifiants des lignes. Les événements cssa-business-updated déclenchent une lecture au lieu d’injecter leur payload dans l’état affiché. Le numéro de génération rejette les réponses dépassées ; le démontage interdit leur application après navigation. Une erreur de lecture retire l’ancien état de la projection.

Les indicateurs Dossiers et Documents affichent UNKNOWN quand la source n’est pas AVAILABLE. Les listes ne projettent plus les éventuels objets de secours comme des objets réels. Les messages distinguent registre disponible vide et source indisponible ; la gestion détaillée reste accessible quand une réponse de secours valide est servie. Documents conserve les UNKNOWN pour une sélection sans source et ne fabrique aucun lien de dossier. Aucun état métier, preuve, validation ou autorisation n’est modifié.

Validation : 52 tests ciblés PASS (business-read, tasks-read, navigation-counts, requirement-task, linked-reference et UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Cinq scénarios Business ajoutés : source disponible vide vs métadonnées indisponibles, collections illisibles, conservation exigences/preuves/contradictions, erreurs de transport/HTTP/JSON et lecture du véritable endpoint avec timeout. Suite globale non relancée.

## Carte de suivi à reprendre en fin de passe

Cette carte suit l’implémentation ; elle ne remplace pas le plan maître et n’atteste pas l’achèvement de ses phases.

| Niveau | État constaté / suite |
| --- | --- |
| Raccord Organisation → Dossiers → Accueil → Tâches | Projections locales, liens explicites personnes/exigences/documents/tâches, attention Accueil et compteurs raccordés. Continuer la cohérence des lectures et sources sur Organisation puis les parcours liés. Ne pas déclarer le raccord entièrement clos. |
| Dossiers / Documents / Tâches | Distinction AVAILABLE / UNKNOWN et registre vide renforcée sur les trois vues ; vérifier ensuite les parcours de modification existants et leurs confirmations, au-delà de la création de tâche déjà contrôlée. |
| Administration / Intendance / CRM | Stores et pages existants ; poursuivre leur raccord transversal au travail persistant selon les objets présents, sans recréer de registres. |
| Sportif | Direction maintenue : profondeur R1/R2/U20, Formation regroupée, École de foot globale, Féminines regroupées et calendrier transversal. Achèvement non attesté par ces passes. |
| Pages métier puis copilote | Pages alimentées par les données présentes d’abord ; copilote fondé sur les capacités réellement disponibles ensuite. Non livré par les compteurs et raccords seuls. |
| V0.1 / Forge / Builder / agents / universalité | Cadre global maintenu, non démontré par ces passes CSSA. Forge privée distincte du Builder entreprise ; agents générés selon les besoins ; CSSA première incarnation, pas origine de V0.1. Monde / Workspace / Pokémon restent des vues à synchroniser. |

Boucle directrice inchangée : BRANCHER → OBSERVER → RECONSTRUIRE → PROJETER → COPILOTER → CONSTRUIRE → GÉNÉRER LES AGENTS → GOUVERNER → UTILISER → PROUVER → APPRENDRE → FAIRE ÉVOLUER. Le travail courant porte sur les projections Monde. UNKNOWN, contradictions, sources et preuves restent conservés ; KX108_ONLY, séparation comprendre/proposer/autoriser/exécuter/prouver et absence d’autorité déduite d’une tâche demeurent les frontières.

Consigne de restitution de l’utilisateur : en fin de chaque passe, donner le livré, la prochaine étape locale, le reste CSSA et la position dans le plan global.

## Passe exécutée : lecture Organisation et responsables cohérente

La page visuelle Organisation et les raccords de responsables (`useCssaPeople`, utilisés notamment par Tâches / Dossiers) utilisent désormais une même fonction de lecture du registre Organisation existant. Elle contrôle les cinq collections et les champs nécessaires aux projections humaines, sans normaliser ni réécrire les lignes. Timeout quatre secondes, absence de cache, événements de modification et lecture périodique restent en place. Les réponses dépassées et les lectures terminées après démontage ne remplacent pas l’état courant ; un échec retire l’ancien état affiché.

La page ne projette plus des personnes ou engagements de secours comme des éléments réels. Le compteur d’avatars et celui des engagements actifs rejoignent les autres indicateurs en UNKNOWN quand la source n’est pas AVAILABLE. Le message de liste distingue une source indisponible d’un filtre sans personne. La structure publique reste consultable séparément ; aucune personne n’en est déduite.

Le raccord des responsables continue de refuser une identité issue d’une source indisponible. Les ids dupliqués restent présents pour être signalés comme ambigus par la résolution existante ; les personnes inactives, contradictions et habilitations déclarées ne sont ni supprimées ni promues. Le formulaire détaillé et son protocole d’écriture ne sont pas modifiés dans cette passe.

Validation : 51 tests ciblés PASS (organisation-read, Organisation store, people-projection, person-work, linked-reference, navigation-counts et UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Cinq scénarios de lecture ajoutés : disponibilité et métadonnées, collections/champs illisibles, conservation personnes inactives/doublons/habilitations/contradictions, erreurs transport/HTTP/JSON, endpoint local et timeout. Suite globale non relancée.

### État du plan après cette passe

- Livré : cohérence de disponibilité et protection des lectures de la vue Organisation et des responsables liés. Dossiers, Documents et Tâches disposent déjà de leurs protections de lecture ; Accueil expose les alertes et inconnues des sources.
- Prochaine passe locale : confirmations des écritures du formulaire Organisation (erreur explicite, ne pas effacer une saisie non enregistrée), en conservant les stores et opérations existants. Le raccord n’est pas déclaré entièrement clos.
- Reste CSSA : poursuivre les modifications et confirmations des parcours liés, puis les raccords Administration / Intendance / CRM ; direction Sportif et calendrier transversal maintenue ; pages métier alimentées avant copilote.
- Cadre global inchangé : V0.1 entreprise, Forge privée distincte du Builder entreprise, agents générés selon les besoins, universalité au-delà de CSSA et vues Monde / Workspace / Pokémon synchronisées. Les raccords courants restent dans OBSERVER → RECONSTRUIRE → PROJETER, sans démontrer la boucle entière.

## Passe exécutée : écritures Organisation confirmées

Les cinq formulaires existants (personne, affectation de rôle, disponibilité, engagement, habilitation déclarée) n’effacent plus leurs champs après un HTTP en échec ou une réponse non confirmée. Ils affichent l’enregistrement en cours, le succès confirmé ou l’erreur explicite. Tous leurs champs sont désactivés pendant une écriture et un verrou empêche les envois concurrents dans cette instance de la page.

Le raccord relit le registre avant écriture. AVAILABLE autorise la modification locale ; MISSING permet l’initialisation explicite d’une personne. INVALID/UNREADABLE ou une source non qualifiée bloquent l’écriture plutôt que de remplacer un fichier illisible par un état vide. Les quatre opérations liées à une personne exigent exactement une personne canonique portant l’id sélectionné dans la source actuelle. Cela ne constitue pas un contrôle d’autorité d’exécution et n’ajoute pas d’habilitation déduite.

La réponse POST est contrôlée avec le validateur de lecture Organisation : source AVAILABLE, objet unique dans sa collection et champs saisis tous identiques. Une réponse absente/ambiguë/différente ne confirme pas l’opération. La saisie reste présente. L’id de l’opération reste stable pour une nouvelle tentative tant que cette instance du formulaire reste montée ; il est libéré seulement après confirmation. Le mécanisme réutilise l’upsert existant, sans nouvelle table ou contrat. Il n’est pas une transaction multiutilisateur ni une garantie de reprise après fermeture/rechargement de la page.

Les événements demandent une relecture des projections après succès ou échec, pour exposer aussi une éventuelle écriture dont la réponse a été perdue. Une lecture de montage antérieure ne peut plus écraser la réponse confirmée du formulaire. Les rôles, disponibilités, engagements, habilitations et leurs sources conservent leurs états déclarés indépendants. Le serveur et son protocole de persistance restent ceux déjà présents.

Validation : 49 tests ciblés PASS (organisation-write, organisation-read, Organisation store, people-projection, person-work et UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Six scénarios d’écriture ajoutés, dont les quatre formulaires liés à une personne et une reprise sur le vrai store avec réponse perdue après sauvegarde : deux requêtes, une seule nouvelle personne, autre personne conservée. Autres cas : initialisation MISSING, source invalide/illisible, personne supprimée/ambiguë, refus HTTP, objet absent/dupliqué/différent ou source non confirmée. Suite globale non relancée.

### État du plan après cette passe

- Livré : confirmations et conservation de saisie des cinq formulaires Organisation, ids de reprise stables dans la page et blocage des envois concurrents.
- Prochaine passe locale : appliquer la vérification des écritures aux parcours détaillés Dossiers / Documents déjà existants, sans confondre enregistrement, validation, dépôt et preuve.
- Raccord Organisation → Dossiers → Accueil → Tâches : projections et liens explicites présents, lectures renforcées, confirmations Organisation et création de tâche contrôlées ; ensemble encore ouvert.
- Reste CSSA : confirmations des autres modifications métier, raccords Administration / Intendance / CRM, profondeur Sportif et calendrier transversal ; pages métier alimentées avant copilote.
- Cadre global : V0.1 entreprise, Forge privée distincte du Builder entreprise, génération d’agents selon les besoins, universalité et synchronisation Monde / Workspace / Pokémon restent dans le plan maître. Position actuelle OBSERVER → RECONSTRUIRE → PROJETER ; KX108_ONLY et séparation comprendre/proposer/autoriser/exécuter/prouver conservées.

## Passe exécutée : confirmations Dossiers / Documents

Les opérations des deux modes détaillés passent désormais par le raccord de confirmation du protocole Business existant : dossier, exigence, document, validation, preuve de dépôt et résultat. La source est relue avant POST ; INVALID/UNREADABLE ou une source non qualifiée bloquent l’écriture. Une modification partielle dont la cible a disparu, un id ambigu ou un dossier parent introuvable/ambigu sont refusés avant envoi. MISSING conserve la possibilité d’initialiser explicitement un dossier ou un document de bibliothèque.

La réponse doit porter une source AVAILABLE et confirmer tous les objets du patch, chacun unique et avec les champs envoyés identiques (y compris tableaux, valeurs nulles et champs structurés). Ainsi une réponse confirmant seulement le dossier et pas sa preuve ne suffit pas. Le succès confirme l’enregistrement local ; il ne vérifie pas le contenu de la preuve, ne soumet rien à un tiers et n’ajoute aucune décision d’exécution.

Les formulaires conservent leur saisie et leur sélection sur erreur. Pendant une écriture ou une création de tâche liée, les commandes Dossiers/Documents sont désactivées ; un verrou empêche la concurrence entre ces deux opérations dans cette page. Les créations dossier/exigence/document/validation/dépôt/résultat gardent leur id pour une reprise tant que l’instance reste montée. Les ids des exigences/validations/dépôts/résultats sont associés au dossier pour ne pas réutiliser une opération incertaine sur un autre dossier. Ce mécanisme n’est ni une transaction multiutilisateur ni une reprise durable après rechargement.

Les changements de statut, responsable, état d’exigence ou validation n’envoient plus une copie complète ancienne de l’objet : ils transmettent uniquement id et champs modifiés à l’upsert. Les autres champs, notamment sources et taskRefId, restent ceux du registre. Les enregistrements groupés dépôt/résultat ne renvoient que le statut du dossier associé. Les conditions métier préexistantes de préparation et de validation demeurent dans l’interface ; cette passe ne les transforme pas en autorisation serveur.

Un document ajouté depuis la bibliothèque générale n’est plus rattaché implicitement au premier dossier ni à un id de document sélectionné. Un ajout depuis un dossier garde son lien explicite au dossier courant. La lecture de montage ne peut pas remplacer une réponse d’écriture plus récente.

Le composant étant partagé avec Commerce/Finance, son chemin HTTP commun expose aussi les échecs et ne vide plus leurs formulaires sur échec HTTP ; les confirmations détaillées et ids de reprise de cette passe concernent Dossiers/Documents. Les autres registres financiers ne sont pas déclarés raccordés par ce travail.

Validation : 49 tests ciblés PASS (business-write, business-read, requirement-task, linked-reference, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Sept scénarios d’écriture ajoutés, dont quatre scénarios avec le vrai store isolé : six types d’objets conservant leurs états indépendants, confirmation groupée dépôt/résultat, réponse perdue puis reprise sans doublon de document, modification partielle conservant source et lien tâche. Refus testés : source invalide, cible supprimée/ambiguë, parent absent, HTTP échoué, réponse partielle/différente/ambiguë/non qualifiée et patch invalide. Suite globale non relancée.

### État du plan après cette passe

- Livré : confirmations des opérations détaillées Dossiers/Documents, conservation de saisie, ids de reprise dans la page, modifications partielles et bibliothèque sans rattachement implicite.
- Prochaine passe locale : modifications des tâches dans le workspace Ops existant (statut, checklist, notes et responsable), avec confirmation et conservation de la dernière version des autres champs. La création tâche depuis une exigence est déjà contrôlée.
- Raccord Organisation → Dossiers → Accueil → Tâches : projections et liens présents ; lectures renforcées et confirmations Organisation / Dossiers / Documents livrées. Ensemble encore ouvert, sans clôture globale revendiquée.
- Reste CSSA : raccords Administration / Intendance / CRM, confirmations des autres modifications métier, profondeur Sportif et calendrier transversal ; pages métier avant copilote.
- Cadre global inchangé : V0.1 entreprise, Forge privée distincte du Builder entreprise, génération d’agents selon les besoins, universalité et synchronisation Monde / Workspace / Pokémon. Position actuelle OBSERVER → RECONSTRUIRE → PROJETER ; KX108_ONLY et états tâche/exigence/validation/dépôt/preuve distincts.

## Passe exécutée : modifications des tâches confirmées

Statut, priorité, checklist, notes et responsable utilisent désormais un raccord de modification des tâches existantes. Les affichages optimistes de ces cinq actions sont retirés : la fiche ne présente leur résultat qu’après confirmation de l’objet unique dans le registre Ops AVAILABLE. Une source MISSING/INVALID/UNREADABLE, une tâche absente/ambiguë ou un point de checklist disparu bloque l’écriture. La modification d’un template de secours ne l’initialise pas implicitement comme une tâche réelle.

Le raccord relit la tâche puis transmet uniquement id et champs demandés. Il ne renvoie pas son ancien historique, ses relations, sa source, sa classe de vérité ou ses autres champs. L’historique reste produit par le store existant. La checklist est fusionnée avec sa version relue et reçoit une valeur explicite, pas une nouvelle inversion lors de la reprise. Le responsable est résolu par id unique dans Organisation AVAILABLE ; son nom actuel est repris sans activation ni habilitation déduite. La désaffectation reste explicite.

Une réponse POST est contrôlée avec le lecteur de tâches existant, les collections Ops nécessaires au workspace, la disponibilité et les champs demandés. Si une reprise retrouve déjà ces champs dans la source actuelle, elle retourne cette confirmation sans POST supplémentaire : pas de double inversion ni d’entrée UPDATE supplémentaire. Ce n’est pas une transaction avec comparaison atomique entre utilisateurs ; une modification survenue après la relecture reste hors de cette garantie.

Le workspace bloque ses commandes pendant une de ces modifications et expose en cours, confirmation ou erreur. Le succès des notes ne s’affiche plus après une réponse en échec. Un brouillon de note non sauvegardé est conservé lors des mises à jour confirmées d’autres champs de la même fiche ; le changement de sélection recharge la note de la fiche choisie. Les réponses de lecture du montage ne remplacent plus une modification plus récente et ne sont pas appliquées après démontage.

Cette passe concerne les cinq modifications de tâches, aussi réutilisées par la vue Administration. La création manuelle, la suppression de tâche et les écritures Intendance / CRM utilisent encore leurs parcours antérieurs ; leur confirmation n’est pas revendiquée ici. Une tâche TERMINE ou un point coché ne modifie aucune exigence, validation, preuve ou autorisation.

Validation : 52 tests ciblés PASS (task-update, tasks-read, requirement-task, person-work, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Sept scénarios ajoutés, dont trois avec le vrai store isolé : modifications partielles conservant sources/contradictions/relations et historique, fusion de checklist conservant les autres points actualisés et réponse perdue suivie d’une reprise sans deuxième écriture. Autres scénarios : identité canonique actuelle sans activation, sources/tâches/checklist indisponibles, réponses HTTP/objets non confirmés et identités supprimées/ambiguës. Suite globale non relancée.

### État du plan après cette passe

- Livré : statut, priorité, checklist, notes et responsable des tâches confirmés ; champs indépendants préservés, brouillon de note conservé sur mise à jour d’autres champs.
- Prochaine passe locale : création manuelle et suppression des tâches, pour ne plus fermer le formulaire ni retirer une tâche avant confirmation. La création depuis une exigence est déjà contrôlée.
- Raccord prioritaire Organisation → Dossiers → Accueil → Tâches : projections et liens présents, lectures renforcées, confirmations Organisation/Dossiers/Documents et modifications des tâches livrées ; ensemble encore ouvert.
- Reste CSSA : raccords Administration / Intendance / CRM et confirmations des autres modifications ; profondeur Sportif et calendrier transversal ; pages métier avant copilote.
- Cadre global maintenu : V0.1 entreprise, Forge privée distincte du Builder entreprise, agents générés selon les besoins, universalité et synchronisation Monde / Workspace / Pokémon. Position actuelle OBSERVER → RECONSTRUIRE → PROJETER ; KX108_ONLY conservé.

## Passe exécutée : création manuelle et suppression des tâches confirmées

La création manuelle ne préajoute plus la tâche à l’écran et ne ferme ni ne vide son formulaire avant confirmation. L’id de création est conservé dans l’instance ouverte pour une reprise. Le raccord relit Ops, refuse INVALID/UNREADABLE et les ids ambigus, puis vérifie l’objet renvoyé par le POST. MISSING permet l’initialisation explicite via le store existant, qui conserve son mécanisme de valeurs initiales ; aucun second registre n’est créé.

Si une réponse a été perdue après création et que la même tâche est déjà présente, la reprise la retourne sans nouvelle écriture. Elle compare les champs d’identité de la création (titre, description, source, origine, structure et références métier) et ne remet pas à zéro statut, priorité, notes ou affectation intervenus depuis. Une collision avec une tâche différente est refusée au lieu de l’écraser. La garantie d’id stable reste limitée à la page montée, sans reprise durable après rechargement.

La nouvelle tâche manuelle conserve truthClass UNKNOWN : une saisie ne prouve pas une confirmation publique. Une référence de match ne sert plus à déduire une équipe ; team reste null. L’affectation explicite relit une personne unique dans Organisation AVAILABLE et utilise son nom courant. La date vide utilise la date de création, en cohérence avec le comportement du store. L’historique de création est confirmé tel que produit par le store et n’est pas imposé depuis l’UI.

La suppression ne retire plus la tâche avant confirmation. Elle exige Ops AVAILABLE et refuse un id ambigu. Une réponse avec la tâche encore présente est un échec ; une reprise qui constate déjà son absence réussit sans deuxième POST. Cases, intendance et objets Business ne sont pas nettoyés en cascade : leurs références restent conservées et peuvent apparaître comme liens cassés dans les projections existantes.

Ces deux parcours partagent le verrou des modifications de tâches et leurs messages visibles. Une lecture ancienne ne remplace pas leur résultat ; le formulaire reste présent sur erreur. Le parcours de création d’une relance depuis CRM reste distinct et n’est pas déclaré confirmé par cette passe.

Validation : 53 tests ciblés PASS (task-lifecycle, task-update, tasks-read, requirement-task, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Sept scénarios ajoutés : initialisation MISSING avec UNKNOWN, réponse de création perdue puis progression préservée sans duplication, collision refusée, suppression avec réponse perdue et reprise sans deuxième POST préservant les autres objets Ops, sources invalides/templates, réponses HTTP ou objets non confirmés, responsable canonique actualisé. Les scénarios de persistance utilisent le vrai store dans un répertoire temporaire isolé. Suite globale non relancée.

### État du plan après cette passe

- Livré : création manuelle et suppression confirmées, en complément du statut/priorité/checklist/notes/responsable déjà contrôlés. La création depuis une exigence est également contrôlée. Le parcours CRM reste séparé.
- Prochaine passe locale : Intendance / Matchday, confirmations du statut, des notes et du responsable, sans réécrire les autres champs ni confondre état logistique déclaré et autorisation.
- Raccord prioritaire Organisation → Dossiers → Accueil → Tâches : projections, liens, lectures renforcées et principales confirmations livrés ; clôture globale non revendiquée.
- Reste CSSA : Intendance / Administration / CRM, parcours de relance CRM et autres confirmations métier, profondeur Sportif et calendrier transversal ; pages métier avant copilote.
- Cadre global maintenu : V0.1 entreprise, Forge privée distincte du Builder entreprise, agents selon les besoins, universalité et synchronisation Monde / Workspace / Pokémon. Position actuelle OBSERVER → RECONSTRUIRE → PROJETER ; KX108_ONLY, UNKNOWN, contradictions, sources et preuves conservés.

## Passe exécutée : Intendance / Matchday confirmé et actualisé

Les modifications du statut logistique, des notes et du responsable ne sont plus affichées avant leur confirmation par Ops. Elles relisent l’élément unique dans une source AVAILABLE puis transmettent seulement id et champ modifié. Une source MISSING/INVALID/UNREADABLE, un élément absent/ambigu ou une personne canonique introuvable/ambiguë bloque l’écriture. Les références de match, lieu, tâche liée et classe de vérité sont conservées ; aucun objet métier n’est créé implicitement par une modification partielle.

La réponse doit confirmer exactement la modification dans un élément unique d’une source AVAILABLE. Si une reprise retrouve déjà la valeur désirée, elle ne renvoie pas de POST. Le responsable reste un id explicite : aucune activation ni habilitation n’est déduite, y compris pour une personne inactive. Un statut CONFIRMÉ décrit une inscription logistique, pas une autorisation d’exécution.

Le workspace réutilise le mécanisme de confirmation des modifications de tâches pour ces trois actions : verrou, messages en cours/succès/échec, application après confirmation, protection contre une ancienne lecture et retrait du faux succès des notes. Le brouillon de note reste conservé pendant une modification d’un autre champ de la même fiche. Les parcours CRM encore anciens ne sont pas déclarés confirmés par cette réutilisation.

La vue Matchday lit maintenant le même registre contrôlé toutes les quinze secondes et après cssa-ops-updated, avec timeout, génération de lecture et nettoyage au démontage. Les objets de secours ne sont plus projetés comme travail réel, les indicateurs deviennent UNKNOWN quand la source n’est pas AVAILABLE et le pourcentage de préparation reste UNKNOWN si aucun élément n’est enregistré. Le calendrier chargé reste explicitement une référence séparée des états logistiques locaux. Les responsables de tâches se résolvent via Organisation canonique et la sélection ouvre la gestion détaillée.

Validation : 55 tests ciblés PASS (intendance-update, task-update, task-lifecycle, tasks-read, people-projection, UX CSSA), TypeScript, build Vite, lint et diff whitespace PASS. Sept scénarios ajoutés : vrai store conservant match/tâche/classe de vérité et autres objets Ops ; réponse perdue puis reprise sans nouvelle écriture ; personne inactive sans promotion ; sources/éléments absents ou ambigus ; réponses HTTP/objets non confirmés ; références Organisation invalides ; contrôle de lecture des éléments malformés et conservation des métadonnées MISSING. Suite globale non relancée.

### État du plan après cette passe

- Livré : statut/notes/responsable Intendance confirmés, préparation Matchday actualisée et distinction calendrier de référence / état local / UNKNOWN.
- Prochaine passe locale : CRM, confirmations du répertoire et du journal relationnel, puis contrôle du parcours de relance vers Tâches afin de conserver saisie et liens en cas d’échec partiel.
- Raccord prioritaire Organisation → Dossiers → Accueil → Tâches : projections et principaux raccords de confirmation présents ; ensemble encore ouvert, sans clôture globale revendiquée.
- Reste CSSA : CRM et relances, autres confirmations Administration/métier, profondeur Sportif et calendrier transversal ; pages métier avant copilote.
- Cadre global maintenu : V0.1 entreprise, Forge privée distincte du Builder entreprise, génération d’agents selon besoins, universalité et vues Monde / Workspace / Pokémon synchronisées. Position actuelle OBSERVER → RECONSTRUIRE → PROJETER ; KX108_ONLY, UNKNOWN, contradictions, sources et preuves conservés.
