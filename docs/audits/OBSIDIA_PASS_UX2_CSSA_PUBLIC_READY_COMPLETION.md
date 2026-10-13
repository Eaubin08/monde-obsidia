# OBSIDIA — PASSE UX2 CSSA PUBLIC READY COMPLETION

**Date :** 13 octobre 2026  
**Dépôt :** Eaubin08/monde-obsidia  
**Branche cible :** main  
**HEAD de départ :** d7b7faaa45eca176b953cb3c91c127ffa71e7dfb  
**PR :** #16  
**Merge :** 2bd464393dc65ca4468b14f456ec71f481f6b17a

## Objectif

Terminer les points non réalisés par la première passe UX sans ajouter de nouvelle fonctionnalité métier : supprimer les doublons de navigation, rendre l'accueil orienté action, reconstruire la lecture de l'organisation, restaurer Mail, ajouter un breadcrumb profond et améliorer l'usage à 1366/1024/mobile.

## Travail réalisé

- Nouveau `CSSAHomePage` : accueil centré sur tâches ouvertes, priorités, blocages, dossiers actifs et contradictions.
- Nouveau `CSSAOrganisationPage` : pôles humains, équipes, rôles, détail d'objet et frontière UNKNOWN explicite.
- Sidebar CSSA simplifiée : Accueil, Sportif/Terrain, Opérations/Relations, Le Club, Sources.
- `Mail` réintégré dans la navigation.
- Modules avancés (`tests`, `field`, `governance`, `projects`, `reporting`) masqués par défaut et exposés avec les détails techniques.
- Doublon de navigation globale dans `CSSAOpsWorkspace` supprimé.
- Breadcrumb CSSA enrichi à partir des routes profondes.
- Reset de la recherche lors du changement de module.
- Hauteurs rigides Ops réduites et responsive renforcé.
- Responsive Sportif renforcé sans modifier ses données ou sa logique métier.
- Tests UX2 ajoutés pour verrouiller ces invariants.

## Fichiers principaux

Créés :
- `src/CSSAHomePage.tsx`
- `src/CSSAHome.css`
- `src/CSSAOrganisationPage.tsx`
- `src/CSSAOrganisation.css`
- `tests/cssa-ux2.test.mjs`

Modifiés :
- `src/CSSAPage.tsx`
- `src/CSSAPage.css`
- `src/CSSAOpsWorkspace.tsx`
- `src/CSSAOps.css`
- `src/CSSASport.css`

## Validation automatique

GitHub Actions, workflow Windows and Linux launchers, run 38399824910 :

- Ubuntu : SUCCESS
  - npm ci : PASS
  - npm run build : PASS
  - npm test : PASS
- Windows : SUCCESS
  - npm ci : PASS
  - npm run build : PASS
  - npm test : PASS
  - updater Windows : PASS

Résultat npm test sur Ubuntu :
- tests : 92
- pass : 91
- fail : 0
- un test non compté comme pass est conservé par la suite existante (skip/todo selon harness).
- Vite : 34 modules transformés, build réussi.

## Verdict

**CODE GATE : PASS**

**PUBLIC READY VISUEL : À VALIDER LOCALEMENT**

Le code et les invariants automatiques sont verts sur Ubuntu et Windows. En revanche, une validation humaine dans le navigateur réel reste nécessaire pour confirmer le rendu à 1920×1080, 1366×768 et 1024×768 et juger la lisibilité finale. Aucun faux verdict visuel n'est déclaré sans cette inspection.

## Reprise

- main merge : `2bd464393dc65ca4468b14f456ec71f481f6b17a`
- prochaine action : `git pull`, lancer `DEMARRER.cmd`, inspecter visuellement CSSA Accueil / Sportif / Organisation / Ops aux résolutions cibles.
