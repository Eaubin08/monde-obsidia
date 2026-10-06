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

## État de cette base

- Village Agent Town V5 conservé ; styles et fichiers applicatifs repris de l’archive V5 d’origine.
- CLI Obsidia et Brody : lancement manuel confirmé sur le PC utilisateur. API Brody sur 8000 confirmée.
- Ouverture des terminaux et tests depuis l’interface : dysfonctionnements signalés, à corriger. Cette base n’est pas présentée comme une validation de ces boutons.
- Le registre historique ne prouve pas que ses agents sont actifs. Le live provient des sessions instrumentées.
- Suite : stabiliser les lanceurs, simplifier les demandes, raccorder le suivi des agents, poursuivre Monde et Workspace selon l’organisation validée.

## Attribution

Le moteur du village vient d’Agent Town, sous MIT. Licence et référence amont conservées dans `src/vendor/agent-town`. Aucun fichier de clé, journal runtime ou dépendance installée n’est nécessaire dans Git.
