# Revue Gemini : crates/aphrody-ui (cœur Rust du design system), 2026-11-13

Moteur : relais `gemini_review` (antigravity), 51 s, sur Cargo.toml, lib.rs et tests/visual_regression.rs (pas tout le crate). Note : **11/20**.

| # | Remarque | Suite |
|---|---|---|
| 1 | dépendances lourdes obligatoires (oxc, resvg, lightningcss, walkdir, toml, sha2) | corrigé : features `layout`, `react`, `next`, `brand` optionnelles (défaut activé, `default-features = false` pour un moteur) ; `--no-default-features --features std,serde` vérifié sur fr1 |
| 2 | features vides (`std`, `serde`, `embedded-fonts`), pas de `no_std` | partiel : `std` et `serde` gardent les `cfg` du module color ; `no_std` à rétablir (libm) |
| 3 | `#![allow]` clippy globaux | différé |
| 4 | clippy sans `-D warnings` en CI | différé (dette existante des modules importés) |
| 5 | `unwrap` dans next/react | différé |
| 6 | code Rust généré dans des littéraux (next emit_*) | différé |
| 7 | golden par hash fragile (versions resvg/tiny-skia, SIMD) | assumé : Cargo.lock commité, rendu sans texte, exécuté sur fr1 seulement ; PNG + tolérance à venir avec les scénarios de composants |
| 8 | `APHRODY_UPDATE_GOLDENS` vrai même vide | corrigé : `== "1"` |
| 9 | `Svg::new("X", "")` factice | assumé : rendu sans police pour des sources sans texte |
| 10 | contraste limité à 3 paires | corrigé : toutes les paires `on-X`/`X` des 6 modes (4,5:1, 7:1 en contraste élevé) et `outline`/`surface` 3:1 depuis tokens.rs |
| 11 | parité MCU 2021 seulement, pas de test différentiel | différé : fixtures à régénérer depuis le fork aphrody-labs/material-color-utilities (spec 2025) |
| 12 | `forbid(unsafe_code)` en double | corrigé |
| — | sortir react/next/brand du DS | réfuté par décision du propriétaire (un seul crate) ; atténué par les features optionnelles |
| — | IR de rendu neutre, specs par composant, harnais multi-moteurs, tests ARIA/clavier/cibles | plan : prochaine étape (GPUI, WebUI, Zig, wasm+WebGPU), specs attendues dans docs/design/specs |
