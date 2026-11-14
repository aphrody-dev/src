[Original en inglés](../../games/PLAN.md)

# Juegos y suite creativa en src: plan (reescrito el 2026-11-13)

Sustituye a la primera versión, retirada por proponer decisiones ya tomadas en el repositorio. Cada fila cita dónde se leyó el dato el 2026-11-13. Nada está construido salvo que se diga.

## 1. Qué existe ya

| Área                 | Estado                                                                                                                                                       |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decisión de UI       | Framework libre (Bevy UI, egui, iced, WinUI 3, Tauri, GPUI, WebUI y otros); cuentan render, rendimiento y función (`docs/ui/STACK.md`)                       |
| Sistema de diseño    | Tokens en `packages/design`; núcleo `crates/aphrody-ui` con adaptadores `to_bevy` y `to_egui` tras las features `bevy` y `egui`                              |
| Pines de motor y GPU | bevy 0.20, egui 0.37, wgpu 30.0.1, winit 0.31.0-beta.4, image 0.25.10 (`Cargo.toml`)                                                                         |
| Medios               | `crates/tv-core`, `tv-ffmpeg` (sobre `ffmpeg-next` 9.1.0), `tv-cli`, `tv-i18n`                                                                               |
| Licencias            | Lista de permitidas en `deny.toml`; se rechazan GPL, LGPL, AGPL y no OSI salvo revisión; libav* de FFmpeg se enlaza dinámicamente                            |
| ABI C                | `crates/core-capi` (`include/aphrody_core.h`) sobre `crates/core`; binding en `packages/core/src/ffi.ts`; reglas en `docs/native/llvm/C-ABI-2026.md`                |
| Grafo de código      | `ay graph build`, `just graph <path> <name>`, salida en `graphify-out/<name>` (no versionada)                                                                |
| Aplanado             | `ay flat list\|sync\|check` copia crates hoja del fork de bun en `crates/bun-flat`, con licencia por módulo en `flat.toml`                                   |
| Checkouts fijados    | `third_party/artcraft` (`83aad5eb`), `third_party/ffmpeg` (`46d13a83`), `third_party/storyteller-bevy` (`4ce8b72c`), `third_party/wgpu`, `third_party/winit` |
| Forks seguidos       | 18 de bevyengine, 33 de storytold y 10 de EpicGames en `third_party/forks.txt`                                                                               |
| Dirección            | Unreal Engine solo mediante el fork privado (`docs/STACK-ROADMAP.md`)                                                                                        |

## 2. Versiones que condicionan una fusión (`gh api`, 2026-11-13)

| Pila                          | wgpu     | winit         | UI                        | Licencia                                                         |
| :---------------------------- | :------- | :------------ | :------------------------ | :--------------------------------------------------------------- |
| Workspace de src              | 30.0.1   | 0.31.0-beta.4 | `docs/ui/STACK.md`        | MIT OR Apache-2.0                                                |
| Bevy v0.20.1                  | 30       | 0.30          | bevy_ui                   | MIT OR Apache-2.0                                                |
| Craft Apps                    | 30.0     | 0.30.13       | egui 0.37.0 (fork)        | Apache-2.0                                                       |
| ArtCraft Studio               | no leído | no leído      | Tauri 2.11.2 y TypeScript | Apache-2.0 y MIT                                                 |
| `storytold/artcraft-services` | n/a      | n/a           | n/a                       | "ArtCraft License (WIP)", fair source, solo uso personal privado |

Las tres pilas Rust usan wgpu 30, así que basta uno. winit difiere: añadir `bevy_winit` o `egui-winit` introduciría un segundo winit.

## 3. Conflictos y valor por defecto hasta que decida el propietario

1. Cualquier framework de UI es aceptable; las Craft Apps conservan egui y reciben los tokens por la feature `egui` de `aphrody-ui`.
2. `third_party/storyteller-bevy` no tiene licencia: solo lectura de referencia, nada copiado a `crates/`, candidato a salir del lock.
3. `docs/tv/plan-ecosysteme-c-rust.mdx` lista x264 y x265 (GPL) pero el test `ffmpeg_build_is_lgpl` lo impide: se aplica el test (build LGPL, codificadores por hardware).
4. Ningún directorio raíz nuevo `C`: una superficie C nueva va en `core-capi` o en un crate `<domain>-capi`.
5. `storytold/artcraft-services` es no OSI: ni fork ni copia; solo su API HTTP documentada (`docs/games/ARTCRAFT.md`).

## 4. Orden de trabajo

Las compilaciones de Rust se ejecutan en CI o en fr1.

| #   | Paso                                                                                                               | Verificación                                       | Estado                                             |
| :-- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :------------------------------------------------- |
| 1   | Graficar los checkouts con `just graph third_party/<path> <name>`                                                  | `GRAPH_REPORT.md` con nodos y aristas              | Hecho 2026-11-13 (p. ej. libavcodec 29819 / 97225) |
| 2   | IR de LLVM de esas bibliotecas con el clang compartido, en fr1                                                     | archivos `.bc` de un build LGPL                    | No iniciado                                        |
| 3   | Evaluar `storytold/craft-libs` (Apache-2.0, 114 crates) como dependencias git fijadas por `rev`, sin copiar        | `cargo deny check licenses` en CI                  | No iniciado                                        |
| 4   | Medios: ampliar `crates/tv-*` según `docs/tv`                                                                      | tests de `tv-ffmpeg`, incl. `ffmpeg_build_is_lgpl` | A cargo de la sesión de `crates/tv-*`              |
| 5   | Motor: añadir crates de Bevy de una en una tras la feature `bevy`; decidir winit 0.30 o 0.31 antes de `bevy_winit` | `cargo tree -d` muestra un winit y un wgpu         | No iniciado                                        |
| 6   | Aplanar solo crates hoja a modificar: `flat.toml` por fork                                                         | `ay flat check --fork third_party/<name>` limpio   | Hecho 2026-11-13 (bun, diffutils)                  |
| 7   | Capturas de las Craft Apps desde builds de release en fr1, fuera de git                                            | archivos en `docs/games/ARTCRAFT.md`               | No iniciado                                        |
| 8   | Unreal Engine: fork privado, solo interoperabilidad                                                                | `docs/epic/RESOURCES.md`                           | Sin trabajo previsto                               |

## 5. Lo que no está hecho

- No se añadió ningún crate, no se movió código ni se ejecutó ninguna compilación. La refactorización hacia motor de juegos y suite creativa no ha empezado.
- Puertas que fallaron el 2026-11-13: `ay arch check --strict` (72 errores o más, entre ellos binarios de más de 50 MB), `ay manifests verify` (pines que no son gitlinks), `ay doctor` (falta `cl.exe`).

## 6. Objetivo fijado por el propietario el 2026-11-13 (nada iniciado)

- Tres apps, una por dominio: `shenron`, `rosegriffon` y una app Aphrody que fusiona `apps/aphrody` y `apps/aphrody-app`. Todo lo demás se aplana en código compartido.
- La app fusionada aloja las Craft Apps, ArtCraft y el juego: WebAssembly y WebGPU a pantalla completa, multijugador de mundo abierto, 120 fps a 1080p, mando, teclado y ratón, audio y vídeo, sobre Bevy y con matriz de funciones frente a Unreal Engine.
- Upstreams a comprobar con `gh api` antes de usarlos: `vercel-labs/ui`, `niri-wm/niri`, DioxusLabs, `longbridge`, `cloudflare/vinext`, `vercel/next.js`, `vercel/ai`, `mui/base-ui`, shadcn, `tailwindlabs/tailwindcss`, Microsoft WebUI, iced y COSMIC.
- Limpieza: eliminar copias de terceros incrustadas; una versión por dependencia; binarios más pequeños.
- Por definir: un build de la app fusionada en CI, una ejecución en navegador que mida los fps y una lista de paridad por función. Hoy no existe ninguna.
- Los personajes y mascotas pertenecen a sus dueños; solo entran recursos cuya licencia permita redistribuirlos.
