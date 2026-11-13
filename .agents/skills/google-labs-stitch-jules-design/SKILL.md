---
name: google-labs-stitch-jules-design
description: Google Labs in src (google-labs-code forks absorbed): Stitch UI generation and design systems, DESIGN.md lint/export, Jules cloud coding agent, Stax evaluation. Use for any Stitch, DESIGN.md, Jules or Stax task; routes to the mirrored stitch-* / jules-* skills.
---

# Google Labs (Stitch, DESIGN.md, Jules, Stax) in src

The nine `google-labs-code` repositories are forked in `aphrody-labs` (`third_party/forks.txt`), checked out in
`third_party/<name>` and followed by `ay upstream sync google-labs` (`infra/upstream/stacks.d/google-labs.toml`).
Their code runs from src, bun-native, with no copy elsewhere.

## Surfaces

| Need | Use |
|---|---|
| Stitch from an agent | relay MCP tools `stitch__<tool>` (`mcp__relay__stitch__generate_screen_from_text`, `get_screen`, `upload_design_md`, ...), gcloud OAuth, no API key |
| Stitch from a script | `ay design stitch projects\|create\|generate\|screens\|html\|upload\|download\|design-md\|tools\|call`, or `import { Stitch, StitchToolClient } from "@aphrody/ai-os/stitch"` |
| DESIGN.md | `ay design lint [file]`, `ay design export --format css-vars\|dtcg\|css-tailwind\|json-tailwind`, `ay design spec`; library `@aphrody/google-design/design-md`. The design system of the monorepo is `packages/design/DESIGN.md` |
| DESIGN.md to Stitch | `ay design push <projectId> [file]` |
| Jules (cloud agent on GitHub, ends with a PR) | `ay jules run "<task>" [--repo o/r] [--wait]`, `ay jules sessions`, relay tools `jules_run` / `jules_status` / `jules_sessions`, orchestrator step `models: ["jules:aphrody-labs/src"]`, CI `.github/workflows/jules.yml` |
| Stax (AI evaluation platform: Spring Boot, Next.js, Terraform on GCP) | reference only, `third_party/stax` |

## Mirrored skills (generated, do not edit)

`bun packages/ai-os/src/google/absorb.ts skills --write` regenerates them from the forks (npx/npm/node rewritten to bun):

- Stitch design: `stitch-generate-design`, `stitch-manage-design-system`, `stitch-extract-design-md`, `stitch-code-to-design`, `stitch-extract-static-html`, `stitch-upload-to-stitch`
- Stitch build: `stitch-react-components`, `stitch-react-native`, `stitch-react-vite-dashboard`, `stitch-remotion`, `stitch-shadcn-ui`
- Stitch utilities: `stitch-design-md`, `stitch-enhance-prompt`, `stitch-site-md`, `stitch-loop`, `stitch-taste-design`
- Jules: `jules-automate-github-issues`, `jules-local-action-verification`

Community index of Jules prompts: `third_party/jules-awesome-list/README.md` (no license upstream: read, do not copy).
