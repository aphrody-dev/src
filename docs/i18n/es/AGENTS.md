[Original en inglés](../../../AGENTS.md)

# src: contrato operativo de los agentes (`AGENTS.md`)

Lo leen todas las CLI de agentes (Claude Code, Codex, Antigravity, OpenCode, Pi, Zed). Reescrito el 2026-11-13 en torno a [docs/games/PLAN.md](../../games/PLAN.md).

## 1. Qué es src

Monorepo público de Aphrody. Su dirección: motor de juegos y suite creativa en abierto, con Bevy como motor, las Craft Apps y ArtCraft como herramientas creativas, `crates/tv-*` y FFmpeg para medios, y Unreal Engine solo por interoperabilidad (fork privado, nunca publicado). Estado: `docs/games/PLAN.md`. Nada de esa refactorización está construido todavía; hay que decirlo cuando se pregunte.

## 2. Estructura

- `apps/`: `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2b`, `r2-site`, `rosegriffon`, `shenron`, `unixwin`, `yolo`; solo `auto`, `r2b`, `rosegriffon` y `shenron` son submódulos. `rosegriffon` y `shenron` son sitios comunitarios, no productos de Aphrody.
- `packages/`: paquetes Bun `@aphrody/*`.
- `crates/`: crates Rust 2024 en un workspace plano.
- `infra/`: flota y despliegue con herramientas upstream.
- `third_party/`: copias upstream y forks, fijados en `src.lock.json`.

## 3. Cómo trabajan los agentes

- Sin aprobación ni confirmación ni humano en el bucle: decidir, ejecutar, verificar e informar de lo hecho y lo no hecho.
- Todo directo a `main`; sin ramas ni worktrees; nunca push a un upstream.
- Interfaz única: `just` y `ay` (`docs/NAMING.md`). Rust compila en CI o en fr1, nunca en la estación de trabajo; prd es solo producción y fr2 el edge.
- Framework de UI libre (Bevy UI, egui, iced, WinUI 3, Tauri, GPUI, WebUI); tokens de `packages/design` y `crates/aphrody-ui`.
- La IA vive solo en `packages/ai-os`; proveedores y modelos se descubren en ejecución.
- Se publica en abierto una vez que el escaneo de secretos está limpio (`docs/publish/STATUS.md`).

## 4. Límites que se mantienen

- Secretos: nunca imprimir ni confirmar valores de `.env`; solo `.env.example`. El repositorio es público.
- No se copian ni publican fuentes de Unreal Engine, los SDK de Oodle y MSVC, ni código sin licencia o con licencia no OSI.
- No se modifican directorios del sistema (`C:\Windows\System32`); los binarios de usuario van a `~/.local/bin`.
- Sin emojis ni atribución de IA en código, documentos, UI o commits.
- Pureza de dominio (`ay arch check --strict`): `crates/*` solo Rust, `packages/*` solo Bun, upstream en `third_party/`.

## 5. Juegos y Steam

Propiedad: [docs/gaming/OWNERSHIP.md](../../gaming/OWNERSHIP.md). Rust: `crates/steam-depot` (`ay steam`). Bun: `packages/gaming` (`ay gaming`). Plugin y MCP: `apps/rosegriffon/plugins/steam`.
