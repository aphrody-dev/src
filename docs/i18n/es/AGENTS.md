[Original en inglés](../../../AGENTS.md)

# src: contrato de los agentes (`AGENTS.md`)

Resumen. Plan y estado: [docs/games/PLAN.md](../../games/PLAN.md).

## Qué es src

Monorepo público de Aphrody: motor de juegos y suite creativa en abierto (Bevy, Craft Apps, ArtCraft, `crates/tv-*`, FFmpeg; Unreal solo por interoperabilidad, fork privado). Nada de esa refactorización está construido todavía.

## Cómo trabajan los agentes

- Sin aprobación ni humano en el bucle: decidir, ejecutar, verificar e informar.
- Todo directo a `main`; sin ramas ni worktrees; nunca push a un upstream.
- Interfaz única: `just` y `ay` (`docs/NAMING.md`). Rust compila en CI o en fr1, nunca en la estación de trabajo; prd es solo producción y fr2 el edge.
- La IA vive solo en `packages/ai-os`.
- Se publica una vez que el escaneo de secretos está limpio.

## Límites

- Nunca imprimir ni confirmar valores de `.env`; el repositorio es público.
- Sin código de Unreal, Oodle, MSVC SDK ni con licencia no OSI.
- Sin cambios en `C:\Windows\System32`.
- Sin emojis ni atribución de IA.
- Pureza de dominio: `crates/*` solo Rust, `packages/*` solo Bun.
