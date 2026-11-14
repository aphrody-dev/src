# wck and Modern Web Guidance gate

Folded from the former modern-web-ui-ux-pro skill (its aesthetic and anti-slop rules live in `ui-system` and `ui-ux-pro-max`; its stricter CWV numbers were dropped in favour of the thresholds in SKILL.md). Source: `packages/wck` (`src/cli.ts`).

- `wck <path> [--spec=seo|aiseo|mwg|cwv|lh|wasm|webgpu] [--json] [--quiet]`: compile-time web and Lighthouse gate.
- `wck search "<query>"` / `wck retrieve <guide-id>`: Modern Web Guidance search and retrieval, gated by `.mwgrc` (`baseline`, `allowOriginTrials`, `allowVolatileFeatures`).
- `wck baselinestatus <query> [--json]`: Baseline support lookup.
- `wck legacy-scan [<path>] [--json] [--guide=<id>]`: scan HTML/CSS/JS for legacy patterns mapped to guides.
- MCP tools (relay): `mwg_audit` (`mode: validate | legacy-scan`, `path`, `spec`) and `web_guidance` (`action: search | retrieve | baseline`, `query`).
- Native core: `src/core/capi/c/mwg_core.c` -> `packages/wck/native/mwg_capi.dll`, with a Bun fallback in `packages/wck/src/mwg-ffi.ts`.

## Visual verification pipeline

1. Start the app with Bun; 2. run Playwright over routes, states and viewports; 3. run Lighthouse (targets: performance >= 95, accessibility, best practices and SEO = 100); 4. inspect the rendering and accessibility tree with `agent-browser` before closing the task.
