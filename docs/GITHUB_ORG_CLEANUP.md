# GitHub org cleanup (2026-11-12)

Deleted forks of aphrody-dev: not referenced by .gitmodules or src.lock.json, and every branch head already exists in the upstream repository (GitHub compare status identical), so no unique commit was lost. Re-create any of them with `gh repo fork <parent> --org aphrody-dev`.

| Fork                  | Upstream                          | Size (MB) | Archived |
| --------------------- | --------------------------------- | --------- | -------- |
| zed                   | zed-industries/zed                | 540       | false    |
| tree-sitter           | tree-sitter/tree-sitter           | 23        | false    |
| transcribe.cpp        | handy-computer/transcribe.cpp     | 55        | true     |
| strobe                | anomalyco/strobe                  | 7         | true     |
| sst                   | anomalyco/sst                     | 165       | true     |
| rune                  | anomalyco/rune                    | 157       | true     |
| rio                   | raphamorim/rio                    | 346       | true     |
| niri                  | niri-wm/niri                      | 10        | true     |
| models.dev            | anomalyco/models.dev              | 39        | true     |
| mistral.rs            | EricLBuehler/mistral.rs           | 240       | true     |
| maki                  | tontinton/maki                    | 25        | true     |
| lore                  | EpicGames/lore                    | 25        | true     |
| litebox               | microsoft/litebox                 | 56        | true     |
| lapce                 | lapce/lapce                       | 28        | true     |
| jan                   | janhq/jan                         | 1544      | true     |
| hex                   | anomalyco/hex                     | 329       | true     |
| helix                 | helix-editor/helix                | 88        | true     |
| gpui-shell            | andre-brandao/gpui-shell          | 35        | true     |
| fish-shell            | fish-shell/fish-shell             | 197       | true     |
| desktop               | zen-browser/desktop               | 5791      | true     |
| cubecl                | tracel-ai/cubecl                  | 21        | true     |
| cosmic-epoch          | pop-os/cosmic-epoch               | 0         | true     |
| coreutils             | uutils/coreutils                  | 49        | false    |
| chwd                  | CachyOS/chwd                      | 1         | false    |
| burn                  | tracel-ai/burn                    | 85        | true     |
| brush                 | reubeno/brush                     | 7         | true     |
| asterinas             | asterinas/asterinas               | 19        | true     |
| alacritty             | alacritty/alacritty               | 14        | true     |
| agents-cli            | google/agents-cli                 | 13        | true     |
| NixOS-WSL             | nix-community/NixOS-WSL           | 1         | true     |
| Exo                   | debuggyo/Exo                      | 26        | true     |
| EAC-Extractor-Utility | lguilhermee/EAC-Extractor-Utility | 0         | true     |
| Boxedwine64           | andrewnakas/Boxedwine64           | 243       | true     |

## Archived unit repositories

Their code now lives in `aphrody-dev/src` (flattened in root commit `5d7e803` and later). Each was
archived read-only with a description pointing to its new path; `gh repo unarchive` reverts it.

ai-os, ai-triad, aphrody, aphrody-app, brain, bun-parity, bun-plugins, chromium-bun, depot, env-kit,
forge, gamescope-rs, google-design, infra, knowledge-engine, pi-opencode, unix, wayland, wck, xtask.

Kept active: `src` (monorepo), submodules `bench`, `ring3-agent`, `rust-stack`, `mesh-vn` (its code is
not tracked in the root yet), `cours-ia`, `fairy-tail-archive`, `mochi-desktop` (1 own commit),
`opentunnel` (comparison failed), and the forks referenced by `src.lock.json` (bun, codex, OmniRoute,
opencodex, opentui, gemini-cli, claude-code, cc-switch, cc-switch-cli, CLIProxyAPI, agent-browser,
agent-desktop, antigravity-sdk-python).

Result: 75 repositories (16.9 GB of forks) became 42 (21 active, 21 archived), 10.2 GB of forks removed.
