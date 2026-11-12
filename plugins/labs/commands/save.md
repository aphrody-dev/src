---
description: Versionner C:\labs dans Lore (just save)
argument-hint: "message"
allowed-tools: Bash(just:*), Bash(lore:*)
---
Dans C:\labs : `just save "$ARGUMENTS"` (lore stage --scan . ; commit ; push). Message vide : en proposer un court d'après `lore status`. Rapporter l'id de révision ou l'erreur. Pas de git.
