# Cahier des Charges (PRD) & Architecture Maquette — `aphrody.com` & Studio d'Actifs Ouverts

**Date de révision** : 2026-11-11  
**Périmètre** : [`C:\src\apps\aphrody`](file:///C:/src/apps/aphrody) (`aphrody.com`) + [`C:\src\packages\google-design`](file:///C:/src/packages/google-design) (`@aphrody/google-design`)  
**Statut** : Validé en mode Plan avant implémentation  
**Conformité** : Modern Web Guidelines, Lighthouse / `wck` 100/100, Google Material Design 3, Microsoft Fluent UI 2, `ui-ux-pro-max`, `3d-pro-max`, `impeccable`, `humanizer`, `DESIGN.md`.

---

## 1. Positionnement Produit & Propriété IA Stricte

1. **Séparation stricte de propriété** :
   - [`C:\src\packages\ai-os`](file:///C:/src/packages/ai-os) (`@aphrody/ai-os`) est notre **unique produit IA public et propriétaire IA interne**.
   - `aphrody.com` (`C:\src\apps\aphrody`) et `aphrody.app` (`C:\src\apps\aphrody-app`) sont des **plateformes généralistes de recherche web, d'ingénierie système, de distribution Linux/WSL2 et de création graphique**, alignées sur les principes d'ingénierie de **Linus Torvalds** (structures de données sobres, intégrité système, zéro surcouche inutile), **Jarred Sumner** (Bun v1.4.4 Full-Rust, zéro dépendance npm externe, AOT/LTO, copie zéro) et **Larry Page** (clarté immédiate sous 100 ms, simplicité d'accueil masquant une infrastructure profonde).
2. **Exécution 100 % autonome en interne, zéro AI-slop en façade** :
   - Toute la chaîne de conception, génération d'actifs, compilation, test et déploiement s'exécute sans intervention humaine (NHITL).
   - En façade, aucun slogan creux ("AI-powered next-gen", dégradés violets génériques, émojis, hyperboles marketing) n'est toléré. Chaque texte passe le filtre `humanizer` et la grille critique `impeccable`.

---

## 2. Architecture de l'Information & Nouvelles Surfaces (`aphrody.com`)

### 2.1 Page d'accueil (`/` et `/en`)
- **Titre FR** : `Aphrody - Recherche web, paquets, Linux WSL2 et design` (54 car., <= 60).
- **Titre EN** : `Aphrody - Web search, packages, WSL2 Linux and design` (53 car., <= 60).
- **Structure visuelle (LCP < 1.2 s, CLS = 0.000)** :
  - En-tête sobre : bascule de mode visuel (`Classic`, `Fluent 2`, `Material 3`), accès directs aux fenêtres `Store`, `Storytold`, `Benchmark`, `Studio & Assets`, `Omarchy WSL2`.
  - Zone centrale : marque vectorielle Aphrody, barre de recherche instantanée (`/api/q`, raccourci `/`, recherche vocale et visuelle), double action primaire, barre bilingue FR/EN.
  - Pied de page enrichi : liens directs vers **Mentions légales & Confidentialité** (`/search/brand-legal`), **Banque d'actifs & Thèmes** (`/search/creative-assets`), **Distribution Omarchy x CachyOS WSL2** (`/search/omarchy-cachyos-wsl`), et paramètres de thème clair/sombre.

### 2.2 Nouvelles Rubriques Indexables (SSG FR + EN + Schema.org `@graph` + Sitemaps)
1. **`/search/omarchy-cachyos-wsl` (`/en/search/omarchy-cachyos-wsl`) — Distribution Native Omarchy x CachyOS x Arch Linux WSL2 & Rust WSLg** :
   - Fusion du design clavier et des **23 thèmes Aether + 16 plugins** d'Omarchy (`omacom/omarchy`), des optimisations noyau **Linux 7.4 BORE / `sched-ext` (`scx_lavd`) + paquets `x86-64-v3` ThinLTO** de CachyOS (`CachyOS/cachyos-wsl`), et de l'outillage officiel **Arch Linux GitLab** (`pkgctl`, `mkinitcpio`, `archlinux-wsl`), propulsés sous Windows 11 par notre compositeur Wayland **WSLg en Rust** (`wslg-rs` avec support Hyprland, COSMIC, mise à l'échelle fractionnaire et DMA-BUF D3D12).
   - Points d'accès JSON temps réel : `/api/distro/themes`, `/api/distro/plugins`, `/api/distro/wsl-manifest`.
2. **`/search/creative-assets` (`/en/search/creative-assets`) — Galerie & Banque d'Actifs Open-Source Téléchargeables** :
   - Accès libre et téléchargement direct d'actifs compressés sous licence ouverte (`CC0-1.0` / `SIL-OFL-1.1` / `MIT`) générés par `@aphrody/google-design` :
     * **27 thèmes & feuilles de style CSS** (Material 3, Fluent 2 Mica, CachyOS Emerald, 23 palettes Omarchy) + jetons W3C `design-tokens.json`.
     * **Pack de 32 icônes SVG** géométriques sur grille 24x24 (`stroke-width: 1.75`) + planche de sprites `<symbol>` (`aphrody-icons.sprite.svg`).
     * **4 compagnons animés Open Pets** (`aphrody-fox`, `cachy-lynx`, `omarchy-owl`, `bun-hare`) disponibles en **vrais fichiers `.gif` animés LZW (GIF89a)**, planches de sprites `.svg`, animations `.css` et atlas `.json`.
     * **Galerie de 8 fonds d'écran haute définition** (`wallpapers/*.svg` 4K + `.png` compressés sans perte).
     * **4 modèles 3D open-source** prêts pour WebGPU / Three.js en formats standards **`.glb` (glTF 2.0 binaire PBR)**, `.gltf` et Wavefront `.obj`.
     * **Banque audio & vidéo** : 5 sons d'interface synthétisés en PCM 16 bits `.wav` (`ui-tap`, `workspace-glide`, `confirm-harmonic`, `focus-pulse`, `ambient-drone`) + bannières cinétiques `.gif`/`.svg` et scène interactive Canvas/WebGPU exportable en `.webm`.
   - Catalogue JSON interrogeable : `/api/assets/catalog`.
3. **`/search/brand-legal` (`/en/search/brand-legal`) — Charte de Marque, Typographie & Mentions Légales** :
   - Identité de marque complète Aphrody (logotypes SVG, monogramme BIMI `aphrody-monogram-bimi.svg`, règles typographiques OFL sans décalage de mise en page).
   - Mentions légales complètes, éditeur, contact organisationnel (`contact@aphrody.com`), politique de confidentialité RGPD (Consent Mode v2 refusé par défaut, relai `/g/collect` sans traceur tiers forcé), conditions d'utilisation et registre des licences open-source.

*(Note de continuité SEO : le point d'accès technique `/api/gemini/search` et sa documentation `/search/ai-gemini` restent maintenus comme documentation d'API serveur sobre pour préserver 100 % des contrats WebMCP et des tests SEO existants, sans jamais présenter `aphrody.com` comme un produit IA).*

---

## 3. Maquette Structurelle End-to-End (Grille & Composants)

```
+-----------------------------------------------------------------------------------+
| [Mode: Classic|Fluent 2|M3] [Store] [Storytold] [Bench] [Assets] [WSL2]  [Apps]   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                                   A P H R O D Y                                   |
|                                                                                   |
|              +-----------------------------------------------------+              |
|              | [Loupe]  Rechercher sur le web ou /api/pm... [Mic][L]|              |
|              +-----------------------------------------------------+              |
|                        [ Recherche Google ]  [ J'ai de la chance ]                |
|                                                                                   |
|                         Disponible en : Français · English                        |
+-----------------------------------------------------------------------------------+
| Galerie & Studio Interactif (Fenêtre macOS / Fluent Mica / Page SSG dédiée) :     |
| +-------------------------------------------------------------------------------+ |
| | [x][-][+] Studio d'Actifs, Open Pets, Fonds d'écran 4K, Modèles 3D & Audio    | |
| |-------------------------------------------------------------------------------| |
| | Onglets : [Thèmes (27)] [Icônes & Sprites] [Open Pets GIF] [Wallpapers] [3D]  | |
| |                                                                               | |
| |  +-----------------+  +-----------------+  +-----------------+                | |
| |  | [Aperçu GIF/3D] |  | [Aperçu Wallpaper] | [Aperçu Audio]  |                | |
| |  | aphrody-fox.gif |  | bore-grid.png   |  | ui-tap.wav      |                | |
| |  | [Télécharger]   |  | [Télécharger]   |  | [Écouter/DL]    |                | |
| |  +-----------------+  +-----------------+  +-----------------+                | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
| France | Rubriques SEO · Paquets · WSL2 Omarchy/CachyOS · Actifs · Mentions légales|
+-----------------------------------------------------------------------------------+
```

---

## 4. Critères d'Acceptation & Budgets de Qualité (`wck` + `gds`)

1. **Zéro dépendance npm externe** dans `apps/aphrody/package.json` (`dependencies: {}`, `devDependencies: {}`).
2. **Score `wck` 100/100** sur les 7 spécifications (HTML5 sémantique, méta robots, JSON-LD `@graph`, budget CSS/JS compressé, accessibilité ARIA + cibles >= 48 px, sécurité CSP/HSTS, zéro CLS).
3. **Audit anti-AI-slop `gds`** : `0` émoji, `0` cliché IA détecté par `humanizer`, contraste WCAG AA/AAA vérifié sur les thèmes clair et sombre.
4. **Actifs réels & téléchargeables** servis depuis `dist/assets/` avec pré-compression `.gz`/`.br` pour les formats textuels et `ETag` fort BLAKE3/SHA-256 pour tous les formats binaires (`.gif`, `.png`, `.glb`, `.wav`).
