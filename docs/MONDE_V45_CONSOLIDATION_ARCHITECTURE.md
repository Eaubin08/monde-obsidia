# Monde V45 — consolidation architecturale et audit des accès aux preuves (NON FREEZE)

## Base probante
- Journal local transmis à HEAD `be91ee7` : 419/419 tests PASS, build TypeScript/Vite PASS, lint 0 errors / 25 warnings.
- V43/V44/V45 non validés par ce journal. V45 ajoute six scénarios; total théorique ~434 depuis V42 (419 + V43 4 + V44 5 + V45 6), sous réserve de compilation/régression.
- Aucune écriture dans les registres métier, aucun appel de construction, aucune autorisation KX108.

## Carte de contrats principale
`readCssaBusiness` / `readCssaTasks` / `readCssaCrmDirectory`
→ `readCanonicalSourceEvidence` (V37)
→ `collectWorldEvidenceBatch` (V40 : un GET par registre demandé)
→ `auditWorldEvidenceBatchV40` (identité, champs, horodatage, digest local)
→ `captureWorldEvidenceReceipts` (V41 : reçu SHA-256 local)
→ `auditEvidenceReceiptBoundary` (V42 : limites tenant/temps/doublons et signature absente)
→ `auditWorldEvidenceIntegration` (V43/44 : propagation des violations)
→ `prepareBuilderReview` / requests HOLD, no build/deploy/execute.

Chemins historiques V38/V39 (`worldEvidenceCrossCheck`, `worldFieldIntegrity`, `worldSemanticReplay`) restent disponibles pour compatibilité mais réalisent plusieurs passages GET. **Ne pas les confondre** avec le chemin principal groupé V40→V45. Leur remplacement exige tests de parité avant suppression.

## Corrections V45
1. `worldEvidenceBatchAudit.ts` ne collecte plus les bindings sans attente déclarée correspondante, supprimant les GETs sur des registres non utilisés.
2. Un champ présent à valeur `undefined` est MISSING (et non une exception de canonicalisation ni une égalité supposée).
3. Quand l'enregistrement source porte explicitement `organizationId`, une valeur étrangère cause `SOURCE_TENANT_CLAIM_MISMATCH` avant toute qualification structurale.
4. Tests : GET non sollicités, absence de binding, champ undefined, chaîne Builder, revendication d'organisation étrangère dans le batch et dans l'intégration.

## Limitations explicites
Une correspondance `organizationId` déclarée par le fournisseur ne constitue PAS une authentification du tenant. Si la source n'a pas ce champ, V45 ne l'invente pas. Le timestamp de la source, les reçus auto-hachés et la révision de snapshot ne démontrent pas d'origine signée ni de transaction atomique. La chaîne Builder reste HOLD. Aucun journal canonique persistant n'est créé.

## Validation à réaliser sur le HEAD V45
`git pull --ff-only origin main`; `npm.cmd test`; `npm.cmd run build`; `npm.cmd run lint`; `git status`; `git log -1 --oneline`. L'horodatage généré dans `public/data/local-inventory.json` peut changer lors du prebuild : contrôler le diff.

## Suite technique recommandée
Validation contradictoire V45; ensuite tests de parité comportementale V38/V39 vs V40, sans retirer les anciennes API avant couverture. Revue de l'origine effective des claims tenant/version dans les endpoints backend, puis routage du diagnostic de Monde sur le chemin de preuves consolidé en lecture seule.
