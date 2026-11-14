---
name: epic-games
description: Epic Games ecosystem entry point and engineering reference (.pak, IoStore, .uasset formats, repak, unreal_asset, Unreal Engine C++, Unreal MCP, Lore VCS, Zen, EOS SDK and Web API, BuildPatchTool, Pixel Streaming, community parsers and launchers). Use before answering or coding anything Epic, Unreal, UEFN, EOS, Lore or Epic Games Store related.
---

1. Read `docs/epic/RESOURCES.md` (sourced snapshot of 2026-11-13). Do not state a version, API or flag that is not in it without a fresh source (`gh api`, Context7 `/websites/dev_epicgames`, dev.epicgames.com); refresh the doc when you do.
2. Live editor work: use the official plugin `unreal-engine-skills-for-claude-code@aphrody` (skills `unreal-mcp`, `create-toolset`, `unreal-skill`); discover tools with `list_toolsets` / `describe_toolset`, run with `call_tool`, save before and after bulk edits.
3. Lore: code in `third_party/lore` and `src/lore*`; SDKs from `EpicGames/lore-{js,go,python,dotnet}` (forks in aphrody-labs).
4. EOS: one platform handle, `EOS_Platform_Tick` per frame on the game thread, Dev Auth Tool only in development, secrets through env (`-ClientSecretEnvVar` for BuildPatchTool).
5. Files: `.pak` with `trumank/repak` (Rust), assets with `unreal_asset` (AstroTechies/unrealmodding) or CUE4Parse; never hand-roll parsers.
6. Never commit Epic launcher client credentials or EOS secrets.
7. Binary formats (`.pak` footer, IoStore `.utoc`/`.ucas`, `.uasset` header): see [references/formats.md](references/formats.md). Launcher/manifest protocol facts live in `docs/epic/RESOURCES.md`.
