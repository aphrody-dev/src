# Steam community tools: reference

Upstream repositories are cited by GitHub name; only steamlocate-rs is cloned under `third_party/` on this host. Versions of the tools on `vps` (fr1): run `<tool> --version` there.

## SteamDB

- Site: https://steamdb.info. No public API; contact partnerships@steamdb.info. No scraping or
  crawling, no auto-refreshing plugins, no full-data publication, no AI training on its data
  (https://steamdb.info/faq/).
- URL patterns: `/app/<id>/`, `/app/<id>/depots/`, `/depot/<id>/manifests/`, `/sub/<id>/`
  (each has an HTTP 200 Wayback capture, archive.org availability API, checked 2026-11-12).
  The live site returned HTTP 403 to `curl -I` from vps and a Cloudflare challenge in the
  browser (2026-11-12), which was not bypassed.
- In this plugin: build links with the MCP tool `steamdb_link`; it does not fetch pages.
- Related: `SteamTracking/SteamTracking` (client and web resources) and `SteamTracking/Protobufs` (canonical `.proto` files), see `src/steam/UPSTREAM.md`.

## SteamCMD

- Valve's command-line Steam client. Docs: https://developer.valvesoftware.com/wiki/SteamCMD
  (read in Chrome, accessed 2026-11-12).
- `+force_install_dir <dir>` (before login), `+login anonymous`,
  `+app_update <id> [-beta <name>] [-betapassword <pass>] [validate]`, `+app_set_config`,
  `+@sSteamCmdForcePlatformType windows|macos|linux`, `+runscript <file>`, `+quit`.
- vps: `/usr/games/steamcmd` (checked 2026-11-12).
- Never pass a real password or branch password on a command line; prefer
  `+login anonymous` where the content allows it.

## DepotDownloader (SteamRE/DepotDownloader)

- C# CLI built on SteamKit2.
- Never pass a real password on a command line: use `-qr` or `-remember-password` instead of `-password`.
- Args (upstream README): `-app <#>`, `-depot <#>`, `-manifest <id>` (needs `-depot`), `-branch <name>`, `-branchpassword <pass>`, `-ugc <#>`, `-pubfile <#>`, `-username <user>`, `-password <pass>`, `-remember-password`, `-qr`, `-os windows|macos|linux`, `-osarch 32|64`, `-all-platforms`, `-language`, `-dir <dir>`, `-filelist <file>` (`regex:` prefix supported), `-validate`, `-manifest-only`. `-beta` / `-betapassword` were accepted as aliases of `-branch` / `-branchpassword` in the 3.x source; prefer `-branch`.
- vps: `~/.local/bin/DepotDownloader` (checked 2026-11-14).

## steamroom (landaire/steamroom)

- Rust reimplementation of DepotDownloader (CM client, PICS, depot keys, manifest decode, CDN chunks).
- Commands (upstream README): `login`, `download`, `info`, `manifests`, `save-manifest`, `files`, `diff`, `packages`, `workshop`, `local-info`.
- Examples: `steamroom info --app 730 --os linux --format json`; `steamroom manifests --app 480 --branch previous`; `steamroom download --app 480 --depot 481 --manifest <id> --file-regex '\.dll$' --verify -o out/`; `--branch-password`, `--max-downloads 16`, `--local-keys`.
- Offline manifest read: `steamroom files --manifest-file <file.manifest>`.
- vps: `~/.local/bin/steamroom` (checked 2026-11-14). `src/steam` depends on the `steamroom` crates (`src/steam/UPSTREAM.md`).

## steamctl (ValvePython/steamctl)

- Python CLI on ValvePython steam.
- Command groups (upstream README): `apps` (activate_key, licenses list/add, list, product_info, idle-games, idle-cards), `authenticator` (add, remove, list, status, code), `clear`, `cloud` (list, list_apps), `depot` (info, list, download, diff), `hlmaster query`, `ugc info`, `webapi` (set-key, clear-key, list), `workshop` (search, info, download, subscribe, unsubscribe, favorite).
- Offline manifest read: `steamctl depot info -f <file.manifest>`.
- vps: `~/.local/bin/steamctl` (uv tool, checked 2026-11-14).

## Libraries

| Library                | Lang | Repository                                   | Notes                                                |
| ---------------------- | ---- | -------------------------------------------- | ---------------------------------------------------- |
| SteamKit2              | C#   | `SteamRE/SteamKit`                           | EMsg, manifest format reference                      |
| node-steam-user        | JS   | `DoctorMcKay/node-steam-user`                | CM client; runs under Bun                            |
| node-steam-session     | JS   | `DoctorMcKay/node-steam-session`             | IAuthenticationService login                         |
| ValvePython steam      | Py   | `ValvePython/steam`                          | CM client and CDN                                    |
| steam-vent             | Rust | crates.io `steam-vent` (repository on Codeberg) | CM client                                            |
| steamworks-rs          | Rust | `Noxime/steamworks-rs`                       | needs running Steam client                           |
| steam-rs               | Rust | `garhow/steam-rs`                            | Web API                                              |
| keyvalues-parser       | Rust | crates.io `keyvalues-parser` (vdf-rs)          | text VDF parser                                      |
| steamlocate-rs         | Rust | `WilliamVenner/steamlocate-rs`               | library discovery, StateFlags (`third_party/steamlocate-rs`) |
| steam-lancache-prefill | C#   | `tpill90/steam-lancache-prefill`             | lancache prefill                                     |

## Ecosystem applications

| Tool              | Purpose                                                                                                                                                                                                                                   | Source                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| ArchiSteamFarm    | card farming on multiple accounts; conflicts with SSA 4.C                                                                                                                                                                                 | https://github.com/JustArchiNET/ArchiSteamFarm    |
| Steam ROM Manager | bulk game importer and artwork manager                                                                                                                                                                                                    | https://github.com/SteamGridDB/steam-rom-manager  |
| Decky Loader      | plugin loader for the Steam Deck (game mode)                                                                                                                                                                                              | https://github.com/SteamDeckHomebrew/decky-loader |
| protontricks      | winetricks for Proton prefixes: `protontricks <APPID> <ACTIONS>` passes the actions to winetricks, `protontricks -c <COMMAND> <APPID>` runs a command in the prefix (https://github.com/Matoking/protontricks README, fetched 2026-11-12) | https://github.com/Matoking/protontricks          |
| steam-tui         | Rust TUI wrapper, requires steamcmd                                                                                                                                                                                                       | https://github.com/dmadisetti/steam-tui           |
| ProtonDB          | Proton compatibility reports; link `/app/<appid>` only, no scraping                                                                                                                                                                       | https://www.protondb.com                          |
