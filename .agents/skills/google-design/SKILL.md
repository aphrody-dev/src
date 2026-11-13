---
name: google-design
description: Principes généraux de conception tirés de la bibliothèque design.google (accessibilité et inclusion mondiale, densité, couleur, thème sombre, mouvement, son et haptique, connectivité faible, IA, voix, lisibilité, bien-être, revue de design). Utiliser pour cadrer ou critiquer une expérience au-delà des tokens : choix d'interaction, inclusion, IA dans le produit, contenu, revue. Pour les valeurs et composants, voir material-3 et ui-system.
---

# google-design

Source normalisée : `docs/design/specs/principles/google-design.md` (lisible) et `.json` (machine, schéma `docs/design/specs/spec.schema.json`). Chaque règle a un id stable `gd.<thème>.<nom>` et l'URL de l'article qui la fonde. design.google est propriétaire (conditions Google) : règles reformulées, aucune citation ni image ; index des articles : `docs/design/index/design.google.json`.

## Quand l'utiliser

- Cadrer un écran ou un flux neuf : public mondial, appareils modestes, connexion lente ou absente.
- Concevoir une fonction d'IA, une interface vocale ou conversationnelle.
- Critiquer une maquette ou préparer une revue de design.
- Trancher entre simplicité et contrôle, densité et respiration, expressivité et sobriété.

## Principes directeurs

1. Inclusion d'abord : concevoir avec et pour des personnes aux capacités, langues, cultures et contextes variés ; tester avec elles, pas seulement pour elles.
2. Contexte réel : supposer appareils d'entrée de gamme, réseau intermittent, données coûteuses ; l'état hors ligne est un état normal du produit.
3. Clarté avant ornement, sans froideur : l'expressivité (forme, couleur, mouvement) sert la compréhension et l'émotion, jamais la décoration seule.
4. Mouvement et son signifiants : chaque animation, son ou vibration explique un changement d'état ou guide l'attention.
5. IA honnête : dire ce que le système sait faire et ne pas faire, montrer la confiance, laisser l'humain corriger et garder la main.
6. Respect de l'attention : pas de mécanique d'engagement forcé ; aider l'utilisateur à atteindre son but puis à repartir.
7. Système cohérent : mêmes règles et mêmes tokens partout ; la cohérence se vérifie au pixel et en revue.
8. Lisibilité mesurée : typographie et contraste choisis pour la lecture réelle, polices variables pour adapter graisse et largeur.

La liste complète, avec niveaux MUST/SHOULD/MAY et sources, est dans la spec ; citer l'id en revue.

## Liens

- Specs Material 3 et règles d'implémentation : skill `material-3`.
- Cibles, tokens générés (`packages/design`), Figma, Stitch : skill `ui-system`.
- Bibliothèque : https://design.google/library
