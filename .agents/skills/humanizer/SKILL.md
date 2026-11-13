---
name: humanizer
description: Retirer les tics d'écriture IA d'un texte (français ou anglais) sans changer ce qu'il dit - texte d'interface, pages, docs, README, messages de commit, notes de version. Utiliser avant de livrer tout texte public de src et pendant la revue anti-slop d'une interface. Absorbe blader/humanizer (MIT) ; contrôle automatique par `gds audit-slop`.
license: MIT
metadata:
  upstream: "blader/humanizer@b48c832f0f80 (fork aphrody-labs/humanizer)"
---

# humanizer

Réécrire pour un lecteur précis, garder le sens, les faits et la longueur utile. Catalogue complet des 26 tics, avec exemples avant/après : `references/patterns.md` (upstream, anglais). Le lire en entier avant une réécriture longue.

## Outils

```bash
bun C:/src/packages/google-design/cli.ts audit-slop <chemin> [--json]   # code de sortie 1 si constat
bun C:/src/packages/google-design/cli.ts humanize <fichier> [--write]    # réécritures mécaniques seules
```

`gds humanize` ne remplace que les tournures sûres ; le reste se réécrit à la main d'après le catalogue.

## Tics à retirer (résumé)

- Mise en scène : « pas X mais Y », chute dramatique d'une ligne, maximes creuses, préambule (« voici ce qu'il faut savoir »), réfutation d'un adversaire absent.
- Rythme mécanique : triades forcées, débuts de phrase répétés, tirets cadratins partout, qualificatifs empilés, voix passive sans sujet.
- Enflure : mots IA (en : delve, seamless, tapestry, unlock, elevate, robust, pivotal ; fr : « véritable », « incontournable », « au cœur de », « fluide », « révolutionner », « booster », « sublimer »), importance gonflée, langage commercial, autorité empruntée, « se positionne comme » au lieu de « est ».
- Mise en forme par réflexe : gras décoratif, listes « **Libellé** : texte », titres décoratifs, guillemets typographiques mélangés.
- Restes de chat : « Excellente question », « J'espère que cela aide », avertissements de date de connaissance, titre répété en première phrase, texte qui parle du document au lieu du sujet.
- Mauvais lecteur : réexpliquer ce que le lecteur sait déjà.

## Règles src

1. Zéro emoji, zéro attribution IA, aucune promesse non mesurée (chiffres seulement s'ils sont sourcés).
2. Français : espaces insécables avant `; : ! ?` dans les pages publiques, guillemets « », pas d'anglicisme quand un mot français existe.
3. Interface : verbes d'action courts sur les boutons, messages d'erreur qui disent quoi faire, pas de point final sur les libellés.
4. Ne pas réécrire : citations, texte légal, sorties de commande, code, noms propres, texte que l'auteur a voulu ainsi.
5. Rendu : texte réécrit seul, puis une ligne par changement de sens éventuel ; jamais de commentaire sur la méthode.
