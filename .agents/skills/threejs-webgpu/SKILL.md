---
name: threejs-webgpu
description: Scènes 3D et rendu GPU de src. Utiliser avant toute scène three.js (WebGPURenderer, TSL, glTF, éclairage, post-traitement, performance) ou tout rendu wgpu natif en Rust. Absorbe CloudAI-X/threejs-skills (MIT), réécrit pour bun, sans React.
license: MIT
metadata:
  upstream: "CloudAI-X/threejs-skills@0e181866f095 (fork aphrody-labs/threejs-skills)"
  verified: "2026-11-13, gh api repos/<o>/<r>/releases/latest : mrdoob/three.js r187 publié 2026-10-30, gfx-rs/wgpu v30.0.2 publié 2026-11-12"
---

# threejs-webgpu

Deux voies, une seule par surface :

| Surface | Voie | Interdit |
|---|---|---|
| Web (aphrody.com, aphrody.app, démos) | `three` (fork `aphrody-labs/three.js`), `WebGPURenderer` + TSL (`three/tsl`), repli WebGL2 automatique du même renderer | `@react-three/fiber`, drei, gltfjsx, vite, npm |
| Desktop / natif | `wgpu` (fork `aphrody-labs/wgpu`) depuis Rust, WGSL ; GPUI pour le chrome autour du canvas | moteur maison au-dessus d'OpenGL |

## Règles

1. bun seul : `bun add three` dans le paquet, page servie par `Bun.serve` (HTML importé, bundler de bun). Outils glTF : `bun x @gltf-transform/cli@4.5.1 inspect|validate|optimize` (version épinglée, registre npm du 2026-11-13, y compris dans les références).
2. Version : vérifier `gh api repos/mrdoob/three.js/releases/latest` avant de citer une API ; les références ci-dessous visent r186, relire les notes de version r187 avant d'écrire du code dépendant d'une API récente.
3. Renderer : `new WebGPURenderer({ antialias: true })`, `await renderer.init()` avant le premier rendu, `renderer.setAnimationLoop`. Matériaux nodaux (`MeshStandardNodeMaterial`, TSL) plutôt que `ShaderMaterial` GLSL.
4. Couleurs de scène, fonds et HUD : rôles M3 de `packages/design/tokens/tokens.json` (jamais de hex recopié) ; HUD en Material Web par-dessus le canvas.
5. Accessibilité et mouvement : `prefers-reduced-motion: reduce` = image fixe, pas de boucle ; canvas avec `aria-label` et alternative textuelle ; libérer géométries, matériaux et textures au démontage.
6. Budget : LCP < 1,2 s (canvas chargé après le contenu), 120 fps visés sur RTX 4070 en 4K, `renderer.info` surveillé ; modèles en glTF/GLB compressés meshopt ou Draco, textures KTX2.
7. wgpu : aucune compilation sur le PC ; `cargo` sur fr1 (`nice -n 19`) ou en CI. Toolchain LLVM partagée (skill `llvm-toolchain`).

## Références (lire à la demande)

`references/` contient le texte upstream (licence MIT, `references/LICENSE`), sans la partie React Three Fiber :
`fundamentals`, `geometry`, `materials`, `lighting`, `textures`, `loaders`, `asset-pipeline`, `animation`, `interaction`, `shaders`, `postprocessing`, `performance`. Les mentions de React ou gltfjsx y sont hors pile : les ignorer.

## Revue

Livrable 3D : capture via le MCP chrome-devtools (`performance_start_trace` pour les fps), puis revue Gemini (`mcp__relay__gemini_review`), verdict dans `docs/reviews/`.
