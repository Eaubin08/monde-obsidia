# Obsidia — Pokémon View live / Agent Town

## Lancer

Extraire monde-obsidia-pokemon-live-v5 dans Desktop/OBSIDIA_WORLDS, à côté de sources. Double-cliquer DEMARRER.cmd. Le navigateur ouvre Pokémon View. Si 5180 est occupé, Vite choisit automatiquement un autre port.

Le dépôt doit être dans ../sources/obsidia-x108-proofs ; OBSIDIA_SOURCE_REPO peut définir un autre emplacement. Python doit être dans le PATH Windows.

Pour le premier essai, cliquer « Premier audit live (dry-run) ». Obsidure reçoit un objectif fixe et exécute seulement phase_a_audit. Le comportement dry-run a été vérifié dans les sources du commit 553df13d7bc8 : aucune phase V/D/R ni génération de patch. Son constructeur peut créer le dossier _PATCH_PROPOSALS s’il manque. Le personnage affiche les phases observées puis reste marqué terminé pendant 30 secondes. L’historique conserve le résultat. Dans Workspace, ouvrir les rapports locaux : l’inventaire des points d’entrée (existence, taille, SHA-256) est produit par l’observateur déterministe et séparé du résultat de l’agent. La phase A traduit l’objectif et lit le contexte ; elle ne constitue pas un audit complet des lanceurs.

Pour une session interactive, cliquer Obsidure dans la barre d’accès. Un terminal standalone s’ouvre ; le personnage apparaît lorsque le processus Python démarre. Saisir l’objectif dans le terminal de l’agent : la vue suit le cycle réel. Ce n’est pas une saisie manuelle de l’état dans l’interface. Brody et CLI sont aussi lancés sous observation ; le CLI reste un outil et ne devient pas un personnage.

## Réemploi

Moteur Agent Town, MIT, commit 78e8e91b9c2620ff8048377f12048412ed603028. Licence et attribution conservées dans src/vendor/agent-town. Les fichiers upstream ont ts-nocheck pour leur compatibilité avec la configuration de compilation hôte. Animations de conversations, pauses café, mouvements spontanés et messages aléatoires désactivées. Les déplacements restants représentent les phases observées, pas une localisation physique.

## Live réalisé

L’observateur externe utilise runpy et un profileur Python pour les appels des phases d’Obsidure. L’observateur ne réécrit pas les sources Obsidia ; le programme exécuté conserve son comportement propre. L’agent conserve son programme standalone, sa saisie et ses frontières. Les événements sont écrits uniquement dans .obsidia-live du dossier de cette interface. Un heartbeat signale la présence chaque seconde ; le frontend consulte les événements chaque seconde.

- Processus lancé : personnage apparaît.
- input() : attente de saisie observée.
- run_cycle(objective) : objectif et début de cycle observés.
- phase_a_audit : lecture/audit.
- phase_v_validation : validation.
- phase_d_disruption : construction.
- phase_r_reintegration : émission/review du proposal.
- run_lake_build : tests, si observé.
- Arrêt : personnage marqué terminé pendant 30 secondes puis retiré, code de sortie conservé. Un code 0 n’est pas une preuve d’acceptation X-108.
- Heartbeat absent depuis 5 secondes : présence inconnue et activité suspendue visuellement.

Aucun agent ne peuple le village simplement parce que son nom figure dans le registre. Les 52 noms restent dans un volet documentaire séparé.

## Limites

Les processus lancés en dehors de cette interface ne sont pas adoptés automatiquement. Les agents fondateurs non implémentés ne sont pas démarrés. L’observation des phases dépend des noms de méthodes retrouvés dans agent_obsidure.py au commit 553df13d7bc8 ; si la copie locale diffère, la présence et la saisie restent observables mais les phases peuvent manquer. Brody a présence, saisie et arrêt observés ; ses phases internes ne sont pas raccordées. Les échanges entre agents ne sont pas raccordés et ne sont pas simulés.

Le Monde permanent et les raccordements Jarjar/Jarvis restent à réaliser. Workspace conserve les lecteurs de fichiers/proposals/receipts.

## Vérifications

Compilation TypeScript/Vite PASS. Test dry-run sur fixture PASS : arguments transmis, phase A seule, résultat structuré, inventaire séparé et arrêt. Tests avec un agent fixture : démarrage, saisie, objectif, A/V/D/R et arrêt PASS. Tests du lecteur live : heartbeat, télémétrie expirée, ligne JSON partielle, session terminée PASS. Ces tests vérifient l’observateur ; ils ne prétendent pas faire exécuter le runtime Obsidia réel. Lancement Windows non vérifié ici. Vérification visuelle non exécutée : le moteur navigateur requis n’est pas installé dans cet environnement.
