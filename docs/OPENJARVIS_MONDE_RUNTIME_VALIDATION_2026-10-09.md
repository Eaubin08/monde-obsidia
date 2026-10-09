# Open Jarvis ↔ Monde — validation runtime — 2026-10-09

## Contexte
Branche Monde : `fix/qwen-only-no-regression-20261009`

## Validation observée
- Le bon serveur Monde doit être lancé depuis :
  `C:\Users\Aubin\Desktop\OBSIDIA_WORLDS\monde-obsidia-git`
- Un ancien Vite pouvait occuper le port 5180 depuis :
  `C:\Users\Aubin\Desktop\monde-obsidia`
- Après arrêt de cet ancien processus et relance du bon repo, Monde s'ouvre correctement.
- Depuis Monde, le bouton **Open Jarvis** lance bien Open Jarvis sur la machine.

## État
`OPEN_JARVIS_LAUNCH_FROM_MONDE = RUNTIME_VALIDATED`

## Portée
Cette validation couvre le lancement réel depuis Monde.
Elle ne constitue pas une validation complète de toutes les fonctions internes Open Jarvis, ni de toutes les routes de gouvernance.

## Invariants
- Open Jarvis reste distinct de Jarvis/Jarjar.
- Open Jarvis n'est pas autorité.
- La décision reste `KX108_ONLY`.
- Le full backend historique `:7880` n'est pas réintroduit.
