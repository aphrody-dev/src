# Revue Gemini : couche gaming (docs/gaming/OWNERSHIP.md, ay steam, ay gaming, piles miroir) (2026-11-13)

Moteur : relais ai-os `gemini_review` (antigravity), sur la carte d'ownership et le code de `crates/ay/src/low/steam.rs`, `packages/gaming/src/{native,steamcmd,proton}.ts`, `packages/upstream/src/mirror.ts`, `infra/gaming/downloads.toml`. Note : 12/20.

Retenu et corrigé dans le même commit :

- filtre des fichiers d'identifiants : nom testé tel quel puis sur le chemin résolu (`canonicalize`, liens et `..`), points et espaces finaux ignorés, flux ADS (`:`) refusés, en Rust et en TypeScript ;
- détection du format : VDF binaire reconnu à l'octet de type de tête (0x00 à 0x02), plus à la présence d'un NUL ;
- lecture bornée à 2 Gio ;
- steamcmd : `sha256` au manifeste et contrôlé avant écriture, extraction dans un dossier `.partial` puis déplacement, liste de l'archive vérifiée (aucune entrée absolue ou `..`), `tar.exe` de System32 sous Windows ;
- piles miroir : `--force-with-lease` sur le sommet du fork vu par `status`, bail vérifié avant une mise à jour de ref par l'API, aucune écriture si la source a disparu, `GIT_TERMINAL_PROMPT=0` pour le timer, motif invalide sans arrêt de la pile, tri des branches datées sur les chiffres.

Déjà couvert : identifiants Steam Linux Runtime 3.0 testés contre `STEAM_LINUX_RUNTIME_SNIPER_APP_ID` ; `CACHYOS_PROTON_OPTIONS` ne s'applique qu'aux variables que `launch_plan` laisse vides (delta, pas seconde source).

Écarté : liste blanche de fichiers pour `ay steam vdf` (`localconfig.vdf`, `shortcuts.vdf`, `compatibilitytool.vdf` sont lus légitimement ; seuls les fichiers à jetons sont refusés, liste de `steam-local-inspect`).

Reste ouvert : version de schéma de `ay steam` comparée par `packages/gaming` (un `ay` antérieur échoue aujourd'hui avec un message explicite) ; lecture en flux d'`appinfo.vdf`.
