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

Double-cliquer `METTRE_A_JOUR.cmd` dans le même dossier. Le lanceur arrête le Vite de ce projet et ses processus enfants, fait `git pull --ff-only`, puis relance. Il installe les dépendances si le lockfile change ou si leur chargement est incomplet. Il vérifie leur chargement après installation et s’arrête sur un échec. `DEMARRER.cmd` détecte aussi une installation incomplète, même lorsque le dossier `node_modules` existe. Aucun nouveau ZIP ou dossier de version.

## Usage actuel de la V5

La navigation active est :

- **Monde** : où se trouvent les objets, domaines, missions, preuves et couches.
- **Workspace** : travail, outils, fichiers, preuves et **lancements runtime**.
- **Pokémon** : qui travaille, état des agents, cycle de vie, équipes et missions.
- **Recherche** : retrouver un objet puis l'ouvrir dans la bonne vue.

Les launchers ne vivent plus dans Pokémon. Ils sont dans **Workspace > Lancements**.

### Services et outils

Depuis Workspace :

- **Kernel X108** : service d'autorité sur `:3001`.
- **API Obsidia / Brody / Native Memory** : service sur `:8000`.
- **GPS / Defense / Aviation** et **Trading → X108** : services/domaines natifs.
- **Brody**, **Obsidure** et **CLI** : sessions terminal ou interface distinctes.
- **Jarjar** : orchestration Kernel + API + Qwen texte `:8080` + Qwen-VL `:8081` + HUD.

Monde n'utilise pas un simple port ouvert comme preuve suffisante pour Kernel/API/Qwen : les processus attendus sont vérifiés avant de déclarer les composants READY.

Brody ne remplace pas l'autorité de décision. La projection Monde reste `canonicalTruth=false` et l'autorité affichée reste `KX108_ONLY`.

### Qwen local

Le launcher Jarjar préfère un modèle Qwen texte local complet :

```text
%USERPROFILE%\Desktop\MODELS\QWEN\qwen2.5-3b-instruct-q4_k_m.gguf
```

ou le chemin défini par `OBSIDIA_QWEN_TEXT_MODEL`.

Le freeze exige un fichier GGUF local complet. Si aucun modèle local prêt n'est trouvé, Jarjar s'arrête explicitement : aucun téléchargement automatique ni fallback Hugging Face n'est lancé par ce script.

### Démarrage

`DEMARRER.cmd` lance Vite en mode développement avec le bridge local `/obsidia-local/*`.

Le script `npm run preview` sert uniquement à prévisualiser le build statique Vite ; il ne doit pas être utilisé comme launcher runtime Obsidia tant que le bridge n'implémente pas `configurePreviewServer`.

Les chemins source sont résolus depuis ce dépôt. `OBSIDIA_SOURCE_REPO`, `OBSIDIA_PYTHON`, `OBSIDIA_JARJAR_ROOT`, `OBSIDIA_JARJAR_PYTHON` et `OBSIDIA_QWEN_TEXT_MODEL` permettent de remplacer les chemins locaux par défaut.

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
