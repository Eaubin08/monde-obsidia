# Monde Obsidia — V2 automatique

Extraire le ZIP dans OBSIDIA_WORLDS, à côté de sources et de la version précédente. Double-cliquer sur DEMARRER.cmd. Les dépendances sont installées si nécessaire, puis le navigateur est ouvert. Garder la fenêtre du serveur ouverte.

## Sources et décisions reprises
- Échange original Texte collé(4).txt : Monde, Workspace, Pokémon View côte à côte ; CLI transversale ; organes accessibles par plusieurs vues.
- Gmail 02/10/2026, message 1a0f983b0338ef8d : première population R&D = sessions Claude/Codex/Gemini, mission, session, machine, livrables. Les agents de couche du noyau ne sont pas utilisés pour remplacer cette population.
- Gmail 21/09/2026, message 1a0c109b655c91c8 : agent personnel, continuité opérationnelle, mandat borné, état canonique, travail isolé, diff/tests/risques/receipt et décision humaine.
- Gmail 21/09/2026, message 1a0c10963d4fe8c3 : mapping cible OpenJarvis/Obsidur/OS Trad/Binder/mémoire/KX108. Source de vision datée, pas preuve de raccordement runtime actuel.
- Gmail 23/09/2026, message 1a0cf79cad0ba50e : contrat de sortie de la Factory du frère vers ExternalAdapter, gouvernance, décision et preuve. La définition intégrale de son système agentique n’a pas été retrouvée : aucune structure interne ne lui est inventée.
- Drive consulté : Obsidia_Frere_Programmeur.docx (17/09/2025) décrit la collaboration humaine et ne constitue pas la définition de sa Factory. Le document Scrum consulté est externe et n’est pas traité comme sa définition.

## Livré
- Population R&D issue automatiquement des métadonnées des fichiers de sessions locaux Claude/Codex. Aucune saisie de zone ou d’agent requise.
- Observateur local toutes les 5 secondes ; affichage des 40 fichiers de sessions les plus récemment modifiés.
- Présence de fichier et horodatage séparés de l’activité d’un agent. Aucune animation de travail ni mission simulée.
- Gemini reste visible comme outil prévu ; son chemin de sessions n’a pas été établi.
- Trois vues accessibles, Pokémon View ouvrable indépendamment.
- Monde : 32 lieux documentaires navigables. Workspace : couches/contextes documentaires, registre et fichiers agents de la copie Git voisine lorsqu’elle est accessible.
- Lecture automatique de ../sources/obsidia-x108-proofs au lancement : HEAD, branche, fichiers agents, registre s’il existe. Aucun checkout, aucune mutation Git, aucun runtime exécuté.
- Textes sources de l’agentique personnel et du contrat du frère consultables.

## Limites exactes
Les missions, droits effectifs, états actif/attente/bloqué, worktrees de session, diffs, tests, résultats et receipts runtime ne sont pas encore raccordés. Le Workspace est une première surface documentaire ; il ne pilote pas encore de processus. CLI/Brody/Obsidure/Jarjar/Jarvis ne sont pas lancés. Aucune action ni décision KX108 effectuée. Le monde permanent connecté reste à construire.

Les personnages CSS sont provisoires. Les références open source retrouvées dans le plan (Pixel Agents, Pixel Office, AgentRoom, Agent Town) ne sont pas intégrées dans ce build.

## Observation locale
Le serveur Vite est lié à 127.0.0.1. L’API n’accepte que GET, depuis une connexion loopback et une origine locale identique au serveur. Les prompts et contenus des sessions ne sont pas lus. Le parcours ignore les liens symboliques et est limité à 4000 entrées par fournisseur et 5 niveaux. L’observation porte sur les fichiers présents, pas sur les processus en cours. Les chemins affichés sont relatifs aux dossiers de sessions.

## Validation
Compilation TypeScript/Vite réussie. Tests DOM : sessions affichées sans saisie, deux profils sources avec limite du frère explicite, 32 lieux, Workspace et 32 documents. Test observateur : Claude/Codex, métadonnées, absence de contenu privé, chemins relatifs, liens symboliques ignorés. Rendu visuel réel non validé ici : Chromium indisponible.
