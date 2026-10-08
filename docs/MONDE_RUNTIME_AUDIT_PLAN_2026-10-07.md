# MONDE / RUNTIME — CHECKPOINT ET PLAN D'AUDIT

Date: 2026-10-07
Branche de travail: `refactor/monde-ui-v5-zero`

## Etat a figer

Etat actuellement suffisamment stable pour poursuivre par audit, sans refonte immediate :

- Kernel terminal : launcher freeze valide.
- API Obsidia/Brody : launcher freeze valide.
- GPS / Trading : launchers valides.
- Separation Workspace : `surface = interface | terminal`.
- Brody interface : session integree separee du terminal natif.
- Obsidure interface : session integree separee du terminal natif.
- CLI interface : session integree separee du terminal natif.
- Entrée = envoyer dans les interfaces.
- Historique des sessions preserve hors heartbeats.
- Brody/Obsidure interface peuvent faire ouvrir l'API validee si 8000 est absente.
- Jarjar : Kernel/API prerequisites prepares par Monde.
- Jarjar Kernel URL : cible canonique `http://127.0.0.1:3001/kernel/ragnarok`.
- Qwen-VL : READY observe.
- Qwen texte : encore en anomalie / diagnostic actif.

## Regles de non-regression

1. Ne pas modifier les launchers terminaux freezes sauf preuve explicite.
2. Ne jamais modifier `obsidia-x108-proofs` pour un besoin UI Monde.
3. Kernel/API/GPS/Trading restent des services Workspace, pas des Pokemon.
4. `KX108_ONLY` reste l'autorite de decision.
5. `memory_write=False`, `emits_act=False`, `kernel_mutation=False`.
6. Terminal natif et interface sont deux surfaces independantes.
7. Une session terminal ne bloque pas la session interface du meme outil.
8. Une session interface ne bloque pas le terminal du meme outil.

## Plan suivant

### P1 — CLI Obsidia : audit de retard / raccord

Comparer la vision runtime du CLI avec l'etat reel actuel.

A verifier :
- references Graphiti / Neo4j devenues obsoletes ;
- Native Memory comme memoire active ;
- Kernel reel sur 3001 ;
- API Obsidia sur 8000 ;
- Sigma/domaines actuels ;
- etat Monde/UI actuel ;
- probes de statut obsoletes ou faux-negatifs ;
- anciennes routes / ports / services encore exposes ;
- differences entre branche CLI et builds recents.

Sortie attendue :
`ACTUEL | OBSOLETE | MAL_BRANCHE | ABSENT | A_CONSERVER`

### P2 — Brody : audit de raccord uniquement

Ne pas lancer un chantier de qualite cognitive maintenant.

Verifier seulement :
- sources reellement hydratees ;
- Native Memory readonly ;
- session/conversation ;
- API partagee ;
- routage/provider effectif ;
- absence de fallback ou stub involontaire.

### P3 — Obsidure : audit de raccord uniquement

Verifier :
- OS_TRAD_REVERSE ;
- Brody reasoning ;
- Lean ;
- MathMemory ;
- Native Memory / SRL ;
- sources de contexte ;
- erreurs deja visibles comme `MathMemory AttributeError` ;
- composants existants mais mal relies.

Ne pas refondre le Solve Engine dans ce chantier.

### P4 — Jarjar

Finir d'abord Qwen texte.

Puis verifier :
- Kernel = 3001/ragnarok ;
- Brody/API = 8000/api/brody/chat ;
- Qwen texte = 8080 ;
- Qwen-VL = 8081 ;
- pre-inference/router ;
- cognition locale vs Brody ;
- aucune ancienne route ou dependance fantome.

## Strategie

Priorite = raccorder correctement ce qui existe deja avant d'ajouter de nouvelles fonctions ou de repartir chercher d'autres branches.

Le prochain chantier principal apres Qwen est l'audit differentiel du CLI.
