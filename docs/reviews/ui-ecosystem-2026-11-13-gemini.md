# Revue Gemini : audit écosystème UI, adaptateurs de packages/design, applier toolchain.ts (2026-11-13)

Moteur : relais `gemini_review` (antigravity), 42 s. Note : **12/20** (correspondances M3 14, formats amont 13, robustesse de l'applier 9).

## Corrigé

- toolchain.ts : extraction dans un sous-dossier dédié, archive vide signalée, chemin `path` confiné à l'archive (`chemin hors archive`), nom de skill validé, copie dans `<skill>.new` puis bascule (témoin `.source` écrit avant), `claude plugin list --json` en échec = ERR au lieu d'une liste vide, `stdin: ignore` et délais sur tous les processus. Vérifié : installation réelle dans un HOME temporaire, refus de `../../..`.

## Rejeté (avec raison)

- « code de sortie du téléchargement jamais lu » : faux, `dl.exitCode` est testé.
- « mélange RVB linéaire des couches d'état » : le mélange porte sur les octets sRGB encodés, comme les state layers M3 (opacité sur sRGB).
- « surfaceVariant devrait être le rôle surface-variant » : MCU 0.4.0 n'expose plus ce rôle (49 rôles de tokens.json) ; surface-container-highest est sa correspondance.
- Flutter `background`/`surfaceVariant` : dépréciés depuis 3.18 (source `color_scheme.dart`), cible stable 3.50.0.
- WinUI : `SystemAccentColor` est bien émis (ton 50).

## Noté, non traité dans ce lot

- Convergence MCP (commande modifiée dans le manifeste non réappliquée) et épinglage du commit des marketplaces : le manifeste ne fait que noter le commit.
- chart-4/5 (rôles fixed-dim) : contraste des graphiques à mesurer quand un tableau de bord les utilise.
- WebUI `aphrody-bolt` garde le nom de `tokens.css` (même variable partout).
