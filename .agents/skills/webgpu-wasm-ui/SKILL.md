---
name: webgpu-wasm-ui
description: Règles de src pour le rendu UI au GPU et le calcul natif dans le navigateur. Utiliser AVANT tout code WebGPU (adaptateur, device, limites, WGSL, canvas, compute), WebAssembly (chargement streaming, SIMD, threads, mémoire, débogage DWARF, WasmGC), Worker ou OffscreenCanvas, ou toute UI web rendue sur canvas, et pour savoir où WebGPU est disponible dans Chrome.
---

# webgpu-wasm-ui

Spec qui fait autorité : `docs/design/specs/gpu-wasm/webgpu-wasm.md` + `.json` (ids `web.webgpu.*`, `web.wasm.*`, `web.workers.*`, sources developer.chrome.com et web.dev lues le 2026-11-13, miroir `third_party/design-mirror`).

## Place dans la direction UI de src

- `docs/ui/STACK.md` fixe les cibles : desktop natif en GPUI (D3D11) ou WebUI, nt en GPU pur D3D12 4K 120 fps via son agent, 3D par three.js WebGPURenderer ou wgpu (skill `threejs-webgpu`).
- Cette skill couvre la cible navigateur : WebGPU et wasm dans Chrome et les autres moteurs, quand une surface web doit rendre ou calculer au GPU.
- Code partagé natif et web : Rust + wgpu ou C++ + Dawn compilés en wasm ; une seule base de shaders WGSL.
- Une UI dessinée sur canvas reste accessible et mesurable : arbre DOM synchronisé (`web.webgpu.ui-a11y`), specs `a11y/web` et `perf/core-web-vitals` applicables (skill `web-a11y-seo-cwv`).

## À retenir

- Chrome : WebGPU par défaut depuis 113 (Windows D3D12, macOS, ChromeOS), Android 12+ depuis 121, Linux depuis 144 (Intel Gen12+) puis 147-148 (NVIDIA, Wayland) en déploiement progressif. Firefox 141 (Windows), Safari 26. Toujours détecter `navigator.gpu` et un adaptateur `null`, avec repli.
- Limites : `requestDevice()` donne le plus petit dénominateur commun ; demander `requiredLimits`/`requiredFeatures` explicitement. Matériel ancien : `featureLevel: "compatibility"` (Chrome 146).
- Windows : `powerPreference` sans effet dans Chrome, un seul adaptateur.
- Erreurs asynchrones, perte de device à gérer, `label` sur chaque objet ; vérifier « Hardware accelerated » dans `chrome://gpu` avant de mesurer.
- WGSL : extension récente seulement après `navigator.gpu.wgslLanguageFeatures` et directive `requires`.
- wasm : `instantiateStreaming`/`compileStreaming`, `Content-Type: application/wasm` ; un binaire par cohorte (SIMD, threads, exceptions) choisi par wasm-feature-detect ; threads = COOP `same-origin` + COEP `require-corp` ; aucune vue mémoire conservée après `memory.grow` ; DWARF 5 séparé pour déboguer.
- Workers : rendu dans un worker via OffscreenCanvas transféré, module workers, thread principal sans tâche > 50 ms.

## Procédure

1. Lire la spec, appliquer les MUST, citer les ids en revue et en commit.
2. Tester sur le poste (RTX 4070, Chrome 157 ; skill `chrome` pour flags, `chrome://gpu`, headless) et en mode logiciel pour le repli.
3. Toute version ou disponibilité nouvelle : lire `developer.chrome.com/docs/web-platform/webgpu/news` en direct, mettre à jour JSON puis `.md`, consigner le conflit.

## Skills voisines

`threejs-webgpu` (scènes 3D, wgpu natif), `ui-system` (cibles et tokens), `gpui-kit` (desktop GPUI), `modern-web-guidance:modern-web-guidance` (API web, section WebAssembly), `chrome` (configuration GPU du navigateur).
