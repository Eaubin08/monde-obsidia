# AUDIT RACCORD BRODY — MONDE — 2026-10-07

Scope : audit readonly du raccord Brody utilise par Monde.
Aucune modification de `obsidia-x108-proofs`.

## Verdict

`BRODY_MONDE_BINDING = COHERENT`

Pas de correctif Monde requis a ce stade.

## Raccord actif observe

- Monde cible l'API Obsidia partagee sur `127.0.0.1:8000`.
- Route Brody : `POST /api/brody/chat`.
- Route classee backend reel dans la source actuelle.
- Monde reutilise / ouvre le launcher API valide au lieu de lancer une API cachee.
- Session interface Brody reste separee du terminal natif.

## Memoire

Le pipeline actuel importe et utilise :
- `brody_native_memory_response_adapter`
- `brody_obsidia_native_memory`
- source_mode `OBSIDIA_NATIVE_MEMORY`
- activation memoire decidee en amont par MEMZUM.

Frontiere :
- readonly=true
- memory_write=false
- canonical_write=false
- emits_act=false
- kernel_mutation=false
- decision_authority=KX108_ONLY

## Reponse

La priorite de sortie observee est :
1. true_voice final_answer ;
2. V1.4.12A final_answer ;
3. response_md structure ;
4. fallback structurel explicite.

## Element legacy detecte

`apps/obsidia_api/routes/brody.py` conserve encore :
- P52 `graphiti_memory_readonly_activation`
- construction d'un snapshot `_graphiti_memory_state`

Ce chemin est auxiliaire / readonly et ne remplace pas la Native Memory comme source active.

Classification :
`LEGACY_A_CLEANER_DANS_CHANTIER_BRODY`

Ne pas le modifier depuis Monde.

## Decision

- Ne pas refaire Brody depuis Monde.
- Ne pas modifier sa qualite cognitive dans ce chantier.
- Ne pas modifier le repo canonique depuis Monde.
- Conserver l'API 8000 validee.
- Conserver la projection de session Monde.
- Revenir sur P52/legacy uniquement pendant le chantier Brody dedie.

## Suite

Audit de raccord Obsidure :
- OS_TRAD_REVERSE
- Brody reasoning
- Lean
- MathMemory
- SRL / memoire
- erreurs actuelles de raccord
- composants presents mais mal relies
