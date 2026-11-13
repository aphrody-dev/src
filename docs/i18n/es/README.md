[Original en inglés](../../../README.md)

# src

Monorepo de Aphrody. El contrato para colaboradores y agentes está en [AGENTS.md](../../../AGENTS.md) y [CLAUDE.md](../../../CLAUDE.md); la arquitectura en [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) y la hoja de ruta en [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md).

## Estructura

| Directorio | Contenido |
| :--- | :--- |
| `apps/` | `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2-site`, `r2b`, `unixwin`, `yolo`, y los sitios comunitarios `rosegriffon` y `shenron`. `auto`, `r2b`, `rosegriffon` y `shenron` son submódulos git. |
| `packages/` | Paquetes Bun `@aphrody/*`: `ai-os` (el único producto de IA), `core`, `design`, `forge`, `gaming`, `wck` y otros. |
| `crates/` | Crates Rust 2024 en un workspace plano: `ay` (la CLI del repositorio), `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `tv-*`, `gamescope-*` y otros. |
| `infra/` | Configuración de flota y despliegue ensamblada con herramientas upstream. |
| `third_party/` | Copias upstream y forks de aphrody-labs, fijados en `src.lock.json`; sin modificaciones locales. |

## Pines y licencias

- `src.lock.json` es el único pin; `DEPS` y `.gitmodules` se derivan con `ay manifests`. `MAINTAINERS` es manual.
- El código propio es MIT OR Apache-2.0. La política de dependencias está en `deny.toml`.

## Comandos

Rust se compila en CI o en el host de compilación, no en la estación de trabajo.

```sh
just doctor          # diagnóstico de la toolchain
just arch-check      # puerta de arquitectura
just lock            # fija el checkout en src.lock.json y deriva DEPS y .gitmodules
just manifests-check # manifiestos derivados coherentes con src.lock.json
just graph <path> <name>   # grafo de código en graphify-out/<name>
just deploy          # docker compose pull + up --wait
just verify-all      # arquitectura, doctor, suites de Bun y ci.yml para Rust
```

## Dónde leer

| Tema | Documento |
| :--- | :--- |
| Diseño e interfaz | [docs/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) |
| Medios (`crates/tv-*`) | [docs/tv](../../tv) |
| Juegos y Steam | [docs/gaming/OWNERSHIP.md](../../gaming/OWNERSHIP.md) |
| Juegos y suite creativa (plan, sin empezar) | [docs/games/PLAN.md](../../games/PLAN.md) |
| Despliegue | [docs/infra/DEPLOY.md](../../infra/DEPLOY.md) |

## Labs (fusionado el 2026-11-12)

Aphrody Labs: plataforma autoalojada; su antiguo binario es ahora `ay conformance`. Incluye `crates/conformance`, `crates/lore*` (Lore VCS, MIT), `crates/apm`, `infra/chromium-factory` y el plugin `plugins/labs`. Recetas: `just lab-build`, `just lab-dev`, `just lab-conformance`.
