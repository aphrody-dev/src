---
name: stitch-react-vite-dashboard
description: Convert Stitch designs into production React + Vite dashboards with TanStack Query, accessible tokens from DESIGN.md, and Web3-ready patterns (ethers/viem).
allowed-tools:
  - "stitch*:*"
  - "Read"
  - "Write"
  - "Bash"
  - "web_fetch"
---

> Mirror generated from google-labs-code/stitch-skills (stitch-skills/plugins/stitch-build/skills/react-vite-dashboard) by `bun packages/ai-os/src/google/absorb.ts skills --write`; do not edit here.
> In src: relay Stitch tools `stitch__<tool>` (MCP `mcp__relay__stitch__*`, gcloud auth), CLI `ay design stitch <cmd>`
> (upload, design-md, generate, html, download), DESIGN.md `ay design lint|export` (system: packages/design/DESIGN.md),
> Jules `ay jules run|sessions` and tools `jules_run`, `jules_status`. JS/TS: bun only.

# Stitch to React + Vite Dashboard

You are a frontend engineer building **data-dense dashboards** from Stitch screens. Target stack: **React 18**, **Vite**, **TypeScript**, **TanStack Query**, **React Router**, and optional **ethers v6** or **viem** for on-chain reads.

## Prerequisites

- Stitch MCP configured ([setup guide](https://stitch.withgoogle.com/docs/mcp/setup/))
- A project `DESIGN.md` (see the `design-md` skill) for token fidelity
- Vite + React + TypeScript scaffold (`bun create vite@latest`)

## Workflow

1. **Discover MCP prefix** — run `list_tools`, note the Stitch prefix (e.g. `stitch:`).
2. **Fetch screen** — `[prefix]:get_screen` with project and screen IDs.
3. **Download assets** — persist HTML/screenshot under `.stitch/designs/{screen}.html` and `.png`.
4. **Read DESIGN.md** — map `colors.*`, `typography.*`, `spacing.*` to CSS variables in `src/index.css`.
5. **Generate components** — split into `src/components/`, `src/pages/`, `src/hooks/`.
6. **Wire data** — use TanStack Query for async fetches; keep presentational components pure.

## HTML → React mapping

| Pattern            | Implementation                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Layout grid / flex | Tailwind utilities or CSS modules aligned to DESIGN.md spacing tokens                                             |
| Cards / panels     | `<section>` with tokenized border-radius and elevation fallbacks for forced-colors                                |
| Tables             | Semantic `<table>` or TanStack Table; never div-only grids for tabular data                                       |
| Buttons            | `<button type="button">` with visible focus ring (preserve browser default unless DESIGN.md defines focus tokens) |
| Forms              | `<label htmlFor>` + `<input id>`; associate errors with `aria-describedby`                                        |
| Loading            | Skeleton components; `aria-busy` on containers during fetch                                                       |
| Wallet connect     | Isolate in `WalletProvider`; never embed private keys in generated code                                           |

## DESIGN.md integration

```css
/* src/index.css — example token bridge */
:root {
  --color-primary: /* from DESIGN.md colors.primary */;
  --font-body: /* typography.body-md.fontFamily */;
}
```

Run the design.md linter locally before shipping UI:

```bash
bunx @google/design.md lint DESIGN.md
```

## Web3 dashboard conventions

- Read-only contract calls via `useReadContract` (viem/wagmi) or ethers `Contract` + TanStack Query `queryFn`.
- Format token amounts with `formatUnits`; show network name and chain ID in settings footer.
- Surface transaction errors in plain language; link to block explorer when `txHash` exists.
- Gas-sensitive flows: batch reads, avoid redundant `eth_call` in render loops.

## File structure

```
src/
├── components/     # Presentational UI from Stitch
├── pages/          # Route-level screens
├── hooks/          # useQuery wrappers, wallet hooks
├── lib/            # ABI helpers, formatters
└── styles/         # Token CSS variables
```

## Quality checklist

- [ ] WCAG 2.2 AA: contrast from DESIGN.md component pairs passes linter
- [ ] Keyboard navigable: focus order matches visual order
- [ ] Responsive: test at 375px and 1280px widths
- [ ] No secrets in repo: RPC URLs from env (`VITE_*` prefix only for public endpoints)
- [ ] TypeScript strict: no `any` on contract ABIs

## Stitch docs note

When following links on [stitch.withgoogle.com/docs](https://stitch.withgoogle.com/docs/), use the full `https://stitch.withgoogle.com/docs/...` URL if relative navigation redirects incorrectly.
