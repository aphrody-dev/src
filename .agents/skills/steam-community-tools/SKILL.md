---
name: steam-community-tools
description: This skill should be used when the user asks to "download a depot", "find a depot manifest id", "open the SteamDB page for an app", "use SteamCMD to install a dedicated server", "compare DepotDownloader and steamroom", or "pick a Steam client library". For the manifest and chunk format itself, steam-content-cdn applies.
---

# Steam community tools

Map a Steam task to the right community tool. Per-tool notes: [`references/tools.md`](references/tools.md); selection table: [`references/decision-matrix.md`](references/decision-matrix.md).

Tools covered: SteamDB, SteamCMD, DepotDownloader, steamctl, steamroom, SteamKit2, node-steam-user, ValvePython steam, steam-vent, steamworks-rs, ArchiSteamFarm, Steam ROM Manager, Decky Loader, ProtonDB, protontricks, steam-tui and steam-lancache-prefill.

## Ground rules

1. Treat SteamDB as a read-only human reference: never fetch its pages programmatically, build links only (its FAQ restrictions are in [`references/tools.md`](references/tools.md)).
2. Get data from Steam itself: anonymous PICS and CDN access through steamroom, DepotDownloader, steamctl or a CM client library.
3. The Rust implementation in this repository is `src/steam` (package `steam-depot`); the upstream projects it follows and what it takes from each are listed in `src/steam/UPSTREAM.md`.
4. Run heavy downloads on `vps` (fr1), not on the local Windows host; installed tools are listed in [`references/tools.md`](references/tools.md).
5. Prefer anonymous login. Content of a paid app needs an account that owns a license (`-manifest-only` resolves AppInfo anonymously, content needs a license).

## SteamDB links: use `steamdb_link`

Use the plugin MCP tool `steamdb_link` to produce SteamDB URLs. It only builds links and never requests the site. Hand the link to the user; do not read the page on their behalf. URL patterns: [`references/tools.md`](references/tools.md) (SteamDB). For client and web resource tracking data use the upstream `SteamTracking/SteamTracking` repository.

## Workflow: inspect or download depot content

1. Resolve the app: `steamroom info --app <appid>` (add `--os linux`, `--format json`).
2. List current manifests per branch: `steamroom manifests --app <appid> [--branch <name>]`.
3. List files without downloading: `steamroom files --app <appid> --depot <depotid>`; offline manifest reads are in [`references/tools.md`](references/tools.md) (steamroom, steamctl).
4. Download: `steamroom download --app <appid> --depot <depotid> [--manifest <id>] -o <dir>`; filter with `--file-regex` or `--filelist`, resume and check with `--verify`.
5. Cross-check with DepotDownloader when steamroom misbehaves: `DepotDownloader -app <appid> -depot <depotid> -manifest <id> -dir <dir> -validate`. For branches use `-branch <name>`.
6. Record manifest ids in commits or notes, never in SteamDB scrapes.

Worked example with real ids: [../steam-local-inspect/references/layout.md](../steam-local-inspect/references/layout.md).

## Workflow: SteamCMD

Use SteamCMD for dedicated servers and official installs where a full app (not a single depot) is needed; syntax in [`references/tools.md`](references/tools.md) (SteamCMD).

## Workflow: choose a client library

- Rust: steam-vent, steam-rs (Web API), keyvalues-parser (text VDF), steamlocate-rs, steamroom crates; steamworks-rs for Steamworks SDK features with a running client.
- JavaScript under Bun: node-steam-user and node-steam-session.
- Python: ValvePython steam and its CLI steamctl.
- C#: SteamKit2.

Source repositories per library: [`references/tools.md`](references/tools.md) (Libraries).

## Workflow: Linux, Deck and Proton questions

ProtonDB (link only), protontricks, Decky Loader, Steam ROM Manager and steam-tui: [`references/tools.md`](references/tools.md) (Ecosystem applications). Proton prefix and runtime work: [`../steam-linux-proton/SKILL.md`](../steam-linux-proton/SKILL.md).

## Workflow: caching and bulk transfer

Use steam-lancache-prefill (C#) to warm a lancache. Cache rules and the local nginx port: [../steam-content-cdn/references/lancache.md](../steam-content-cdn/references/lancache.md).

## ArchiSteamFarm caveat

ArchiSteamFarm describes itself as an application "with primary purpose of farming Steam cards from multiple accounts simultaneously" (https://github.com/JustArchiNET/ArchiSteamFarm). The Steam Subscriber Agreement section 4.C bars "scripts, bots, macros, or other non-human-controlled systems" and earning rewards "without genuine user input"; section 4.D allows Valve to restrict or terminate accounts (https://store.steampowered.com/subscriber_agreement/, accessed 2026-11-12). Do not deploy it for this repository, and do not use it as a download tool. steamctl `apps idle-games` / `idle-cards` carry the same caveat.

## Sources

- `src/steam/UPSTREAM.md`
- https://github.com/SteamRE/DepotDownloader, https://github.com/landaire/steamroom, https://github.com/ValvePython/steamctl, https://github.com/SteamRE/SteamKit
- https://steamdb.info/faq/
- https://developer.valvesoftware.com/wiki/SteamCMD
- https://store.steampowered.com/subscriber_agreement/ (sections 4.C, 4.D)
- https://github.com/SteamGridDB/steam-rom-manager, https://github.com/SteamDeckHomebrew/decky-loader, https://github.com/Matoking/protontricks, https://github.com/dmadisetti/steam-tui
- https://www.protondb.com (URL pattern checked from vps, 2026-11-12)
