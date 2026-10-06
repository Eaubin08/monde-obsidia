# Monde Obsidia

Monde, Workspace et vue agents : base V5 d’origine. Ce dépôt devient la source unique des mises à jour.

## Premier lancement Windows

Le dépôt source Obsidia reste à côté, dans `../sources/obsidia-x108-proofs`.

```powershell
Set-Location "$env:USERPROFILE\Desktop\OBSIDIA_WORLDS"
git clone https://github.com/Eaubin08/monde-obsidia.git monde-obsidia-git
Set-Location .\monde-obsidia-git
.\DEMARRER.cmd
```

Prérequis : Node.js/npm, Git, Python et les dépendances du dépôt Obsidia. Le lanceur installe les dépendances de l’interface si nécessaire et ouvre Vite. Utiliser l’adresse affichée par le serveur.

## Mise à jour

Fermer le serveur de l’interface avec Ctrl+C, puis double-cliquer `METTRE_A_JOUR.cmd` dans le même dossier. Il fait `git pull --ff-only`, installe les dépendances et relance l’interface. Aucun nouveau ZIP ou dossier de version.

## Sessions et tests depuis la page

Dans **Pokémon View** :

- **CLI Obsidia**, **Brody**, **Obsidure** en haut ouvrent une fenêtre PowerShell Windows, conservée après la fin du programme. Une session native déjà active est remise au premier plan.
- **Audit Obsidure (dry-run)** lance un audit dans la page.
- **Test long · 20 audits · ≥ 1 min** exécute 20 audits réels, avec 4 secondes entre les audits. Les pauses sont affichées comme telles. C'est un contrôle de lancement et d'observation, pas la régression globale Obsidia.
- **Session Brody / CLI Obsidia / Obsidure** lance le programme dans la page. Sélectionner sa session, saisir une demande lorsqu'il attend une entrée, lire la sortie ou arrêter.
- Un programme actif émet ses phases et sa présence ; un programme terminé est distingué d'une fenêtre Windows encore ouverte.

Brody réutilise son API locale sur 8000 ou la démarre depuis `apps.obsidia_api.main:app`. Le client reçoit `/compact off` au démarrage. Les erreurs Python/API remontent dans la page. L'interface ne remplace pas le moteur Brody.

Les chemins sont résolus depuis ce dépôt, même si le dossier courant change. Python provient de `OBSIDIA_PYTHON`, puis du venv Obsidia existant, puis du PATH. `OBSIDIA_SOURCE_REPO` permet de choisir une autre copie source.

## Vérification

```powershell
npm.cmd test
npm.cmd run build
```

GitHub Actions exécute les contrôles sur Windows et Linux avec Python 3.14. Les fixtures identifiées `TEST_FIXTURE_ONLY` vérifient les lancements, entrées/sorties, événements, arrêts et le démarrage de l'API. Sur Windows, le test lance réellement PowerShell pour les trois outils et vérifie leurs PID et événements. Le premier plan de la fenêtre et le runtime personnel doivent encore être confirmés sur le PC utilisateur.

## État de cette base

- Village Agent Town V5 conservé ; styles et fichiers applicatifs repris de l’archive V5 d’origine.
- CLI Obsidia et Brody : lancement manuel confirmé sur le PC utilisateur. API Brody sur 8000 confirmée.
- Lanceurs natifs et sessions intégrées corrigés ; tests automatisés présents. Le rendu du village et ses styles V5 sont conservés.
- Le registre historique ne prouve pas que ses agents sont actifs. Le live provient des sessions instrumentées.
- Suite : confirmer sur le PC, simplifier les demandes, étendre le suivi aux autres agents réellement exécutables, poursuivre Monde et Workspace selon l’organisation validée.

## Attribution

Le moteur du village vient d’Agent Town, sous MIT. Licence et référence amont conservées dans `src/vendor/agent-town`. Aucun fichier de clé, journal runtime ou dépendance installée n’est nécessaire dans Git.
