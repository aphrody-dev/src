---
name: material-3
description: Règles Material Design 3 (dont M3 Expressive) normalisées pour le monorepo C:\src. Utiliser pour toute décision de couleur, typo, forme, élévation, état, mouvement, mise en page adaptative, accessibilité ou de composant M3 (boutons, FAB, barres, navigation, champs, feuilles, dialogues, menus, chips, listes, sliders, onglets, etc.), ou pour vérifier qu'une UI respecte M3. Complète ui-system (cibles et outils) ; les valeurs se consomment depuis packages/design, jamais recopiées.
---

# material-3

Specs réécrites (m3.material.io est propriétaire : aucune phrase ni image reprise ; valeurs factuelles vérifiées le 2026-11-13, tokens issus de material-web et androidx sous Apache-2.0) :

| Domaine | Lisible | Machine |
|---|---|---|
| Tokens (couleur, typo, forme, élévation, états, espacement, classes de largeur) | `docs/design/specs/tokens/material-3.md` | `.json` |
| Mouvement (ressorts Expressive, easing, durées) | `docs/design/specs/motion/material-3.md` | `.json` |
| Composants (variantes, anatomie, états, mesures dp, a11y) | `docs/design/specs/components/material-3.md` | `.json` |
| Accessibilité | `docs/design/specs/a11y/material-3.md` | `.json` |

Schéma : `docs/design/specs/spec.schema.json`. Index des pages sources : `docs/design/index/m3.material.io.json`. Chaque règle a un id stable (`m3.<domaine>.<nom>`) à citer en revue.

## Consommer, jamais recopier

- Valeurs : `packages/design/tokens/` (`tokens.css` `--md-sys-*`, `tokens.json`, `tokens.rs`, `tokens.zig`, `ansi.json`), générées par Material Color Utilities depuis `assets/brand/brand.toml`. Une valeur des specs ne se colle pas dans le code : elle sert à vérifier ou à corriger le générateur (`packages/design/src/build.ts`).
- Cibles, bibliothèques, Figma, Stitch : skill `ui-system`. Rust : crate `aphrody-ui` (contrats M3).

## Règles clés

1. Couleur : rôles sémantiques seulement ; texte et icônes en `on-*` du conteneur (`m3.color.on-pairs`) ; `*-container` jamais pour du texte ; hiérarchie de surfaces par `surface-container-*` (surface-tint obsolète) ; `outline` pour les bordures interactives, `outline-variant` pour les séparateurs.
2. Thèmes : clair et sombre, chacun en contraste standard, moyen et élevé (`m3.color.three-contrast-levels`).
3. Typo : 15 styles de l'échelle (display/headline/title/body/label × L/M/S), unités rem, texte agrandissable à 200 %.
4. Forme : échelle de rayons none → full ; élévation : niveaux 0 à 5 uniquement, ombre seulement si nécessaire.
5. États : couche d'état de la couleur du contenu, opacités hover 0.08, focus 0.10, pressed 0.10, dragged 0.16 ; désactivé 0.38 ; anneau de focus 3dp, décalage 2dp, `secondary`.
6. Mouvement : ressorts (schéma expressive par défaut, standard pour l'utilitaire) ; spatial pour géométrie, effects pour couleur/opacité ; easing + durée en repli ; réduction des animations respectée.
7. Mise en page : classes compact < 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large ≥ 1600dp ; marges 16dp (compact) puis 24dp ; grille 8dp avec sous-unités 4dp.
8. Accessibilité : cible ≥ 48 × 48dp, contraste 4.5:1 texte / 3:1 grand texte et non-texte, nom accessible pour tout contrôle icône, ordre de focus logique, focus rendu à l'ouvreur, RTL miroir.
9. Composants : prendre la variante et les mesures de `components/material-3.json` ; sur le web, l'implémentation est `@material/web` via `@aphrody/design/components` (ui-system), pas un composant maison.

## Vérifier avant d'affirmer

- Valeurs de tokens : `gh api repos/material-components/material-web/contents/tokens/versions/latest/sass` (Apache-2.0) ; ressorts : `androidx/androidx` `compose/material3/.../tokens/*MotionTokens.kt` ; contraste : `packages/google-design/upstream/material-color-utilities`.
- Règles d'usage : relire la page m3 citée en `source` (SPA : `agent-browser open <url>` puis `agent-browser read`, ~1 requête/s).
- Écart entre spec et `packages/design` : corriger le générateur, régénérer, `bun test --cwd packages/design`.

Principes généraux de Google Design : skill `google-design`.
