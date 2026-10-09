# C5 — Universalité Obsidia V0.1 : audit Monde V5 et préparation du read model

Date : 2026-10-09. Branche isolée : `feat/universal-c5-readonly-projection-v0`. Base : `main` de `Eaubin08/monde-obsidia`.

## Audit constaté

- Le point d'entrée effectif est `src/main.tsx` → `src/V5Root.tsx`, **pas** `src/App.tsx` (interface historique).
- `V5Root.tsx` expose Monde / Workspace / Pokémon / Recherche, territoires, domaine, gouvernance, traces, missions, état runtime.
- Le bridge `server/local-bridge.mjs` observe les fichiers de décision, les reçus, les processus et expose `/obsidia-local/state`; il contient **aussi** des routes de lancement/arrêt : il n'est donc pas sûr de lui confier une nouvelle autorité implicitement.
- `scripts/read-local-sources.mjs` produit un inventaire de sources documentaires, pas une preuve de consentement ni d'authentification.
- Le README précise `canonicalTruth=false` et `KX108_ONLY`, ainsi que les lanceurs existants.

## Raccord préparé et périmètre strict

- `src/universalC5Readonly.mjs` : transformation pure, sans fichiers, sans API, sans réseaux, sans dispatch, sans écriture. Elle exige organisation/domaine/source/capacité/génération et références décision/ticket/reçu, conserve la provenance déclarée, permet le filtrage par organisation, rejette les schémas mal formés et les autorités autres que `KX108_ONLY`.
- `tests/universal-c5-readonly.test.mjs` : filtre multi-tenant, documents faux ou incomplets, révocation, immutabilité, une attestation `ALLOW` ne devient **jamais** un ordre d'exécution.
- **Pas encore branché** à V5Root ni au bridge : aucune nouvelle route réseau, aucune session métier, aucune permission réelle créée.
- L'import d'une preuve ou d'un ticket JSON ne constitue pas une vérification cryptographique indépendante ; l'entrée `evidence_grade` est une assertion du producteur, pas une vérité garantie par l'UI.

## Source gelée

Universal `Eaubin08/obsidia-x108-proofs` : commit de clôture `b69cfcbc7424c842f62895a918b849ff7882ca2c` sur `feat/universal-cross-domain-conformance-v0`. Les 64 / 21 / 64 tests C2–C4.1 proviennent de sorties locales observées; C4.2 interrepo reste BLOCKED_FAIL_CLOSED; Trading reste hors de la nouvelle campagne.

## Critères avant intégration dans V5Root

1. Définir un contrat de lecture entre deux dépôts avec déclaration de provenance vérifiable et politique de fraîcheur.
2. Attacher les `organization_id` réels aux sources de vérité exposées par `/obsidia-local/state`, sans invention de liens identité/décision.
3. Vue Monde > Organisations / Domaines / Gouvernance avec filtre de tenant **appliqué côté serveur**, pas seulement côté interface; éviter qu'une route brute laisse fuiter l'autre entreprise.
4. Source manquante ou non vérifiée = `UNKNOWN` ou `BLOCK`, sans bouton exécutable.
5. Une revue sécurité doit séparer la nouvelle route GET read-only des routes POST de launchers existants.
6. Tests Node et build Vite verts sur clone local avant PR et avant toute fusion.

## Validation locale du lot isolé

```powershell
git clone --branch feat/universal-c5-readonly-projection-v0 https://github.com/Eaubin08/monde-obsidia.git "$env:TEMP\monde-c5-readonly"
Set-Location "$env:TEMP\monde-c5-readonly"
node --test tests/universal-c5-readonly.test.mjs
npm.cmd ci
npm.cmd test
npm.cmd run build
git status --short
```

Ne pas lancer `DEMARRER.cmd` ou `METTRE_A_JOUR.cmd` pour ces tests : ils manipulent des services/UI runtime. Ne pas toucher au répertoire Monde V5 actif de l'utilisateur.
