# Epic Games ecosystem: official and community resources

Checked 2026-11-13 with `gh api`, Context7 (`/websites/dev_epicgames`) and the web pages cited. Anything without a source here is unverified; do not add it from memory. Versions and dates are a snapshot; community rows come from the GitHub GraphQL API (see Community).

## Epic philosophy (as stated by Epic)

Source: unrealengine.com/news/state-of-unreal-2026-top-news-from-the-show (2026-06-17).
- Build once, deploy to traditional platforms, Fortnite or your own ecosystems (UE 6 aim).
- Portable, interoperable content, code and economies through open standards.
- Open model choice: the UE MCP interface is open, use Claude, Gemini or any model.
- Lore: open source and free to use. Observed licensing practice: new public tools are MIT (snapshot.json `license`), UE source stays under the EULA in a private repo.

## Engine and languages

| Item | Fact | Source |
| :--- | :--- | :--- |
| Unreal Engine (C++) | Latest stable: 5.8 (2026-06-17), latest tag 5.8.4-release per docs/epic/snapshot.json, last planned UE5 major (UE 6: see below) | dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes |
| UE source access | Private `EpicGames/UnrealEngine`; link GitHub account at unrealengine.com/ue4-on-github | `gh api repos/EpicGames/Signup/readme`; `gh api repos/EpicGames/UnrealEngine` returns private |
| UE royalty | 5% above first US$1M gross per product; 3.5% under Launch Everywhere with Epic; EGS and Fab revenue excluded | unrealengine.com/release UNVERIFIED: secondary quotes only, EULA text not read |
| Lore (Rust VCS) | MIT, pre-1.0, v0.13.0 2026-11-06, centralized content-addressed, built into UEFN; docs epicgames.github.io/lore | `gh api repos/EpicGames/lore` |
| Lore SDKs | lore-js, lore-go, lore-python, lore-dotnet (MIT, no releases yet) | `gh api repos/EpicGames/lore-js` (and lore-go, lore-python, lore-dotnet) |
| Zen | UE5 local/shared DDC and cook storage server, C++20, xmake; v5.8.27 2026-10-20; no SPDX license | `gh api repos/EpicGames/zen` |

## Unreal Engine 6 and Verse direction

- UE 6 (official, unrealengine.com/news/state-of-unreal-2026-top-news-from-the-show, 2026-06-17, read via Chrome): in development, Early Access targeted end of 2027. Three initiatives: gameplay programming model moves to Verse ("transactionalizes C++"); portable, interoperable content, code and economies through open standards; pipeline features such as MCP with integrations for Claude, Gemini and others. UE 5.8 is the last planned UE5 major release (5.9 kept as an option).
- Same page: Lore is open source and free; EGS has 6,000+ games from 3,000+ partners and a full rebuild of the Launcher and storefront backend is under way; UE 5.8 MCP plugin is Experimental and model-agnostic.
- Scene Graph: animation, itemization and gameplay abilities arrive as Verse-scriptable components (same page).
- UEFN: v43.00 (2026-11-01) adds Verse material inheritance; Verse does not run on the client yet. v42.40 (2026-10-15): UEFN source assets licensable on Fab, `text_channel` API in `/Verse.org/Chat` (dev.epicgames.com/documentation/fortnite release notes).
- MetaHuman: Creator web app access closed 2026-11-05, then 90 more days to retrieve gallery MetaHumans (forums.unrealengine.com/t/metahuman-creator-web-application-is-being-discontinued/2695297); creation is in-engine. UE 5.8 ships a MetaHuman Devkit and Animator markerless mocap (State of Unreal 2026 news page).
- Licensing (unrealengine.com/ue-devs-can-now-choose-to-train-ai-models-on-their-projects): UE and MetaHuman projects can opt in to AI training; UEFN, Verse and island content fall under the Fortnite Developer Rules/Terms, not the UE EULA.

## Verse language

- Reference: The Verse book, verselang.github.io/book (repo verselang/book, CC0-1.0); Context7 `/websites/verselang_github_io_book`.
- Effect specifiers: `<computes>` `<reads>` `<writes>` `<allocates>` `<transacts>` `<decides>` (can fail) `<suspends>` (async) `<converges>` `<diverges>` `<predicts>` (client) `<dictates>` (server). Failure contexts: a `<decides>` call must sit in `if` or `or`, or in a `<decides>` function; a failed transaction rolls back every `set`.

## Build CLI and CI (Context7 `/websites/dev_epicgames_unreal-engine`)

- UAT: `Engine/Build/BatchFiles/RunUAT.{bat,sh} BuildCookRun -project=<p>.uproject -platform=Win64|Linux|... -clientconfig=Shipping -build -cook -stage -pak -archive -archivedirectory=<dir>` (add `-prereqs -allmaps -noP4 -nodebuginfo` as needed; UE 5.8 Windows ARM: `-clientarchitecture=arm64+x64`).
- UBT: `Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe <Target> Development Win64`; targets in `<Name>.Target.cs` (`class <Name>Target : TargetRules`), modules in `<Module>.Build.cs` (`ModuleRules`, Public/PrivateDependencyModuleNames).
- Horde: Epic's build/test automation (BuildGraph scripts, Perforce streams, UE 5.4+), Unreal Build Accelerator remote compile, UnrealGameSync metadata server (`ApiUrl=https://<horde>/ugs` in `UnrealGameSync.ini`); source `Engine/Source/Programs/Horde/Horde.Server/` (dev.epicgames.com/documentation/en-us/unreal-engine/horde-in-unreal-engine).
- Containers: official UE container images, quick start at dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-using-container-images-in-unreal-engine.
- Coding standard: prefixes `U` (UObject), `A` (AActor), `F` (structs), `T` (templates), `E` (enums), `I` (interfaces), `b` (bool), `C` (concept-alike structs) (epic-cplusplus-coding-standard-for-unreal-engine).
- Python editor scripting API: Context7 `/websites/dev_epicgames_en-us_unreal-engine_python-api`.

## AI tooling (Claude Code, MCP)

- `EpicGames/unreal-engine-skills-for-claude-code-plugin` (MIT, v3.1.2): skills `unreal-mcp`, `create-toolset`, `unreal-skill`, SessionStart hook (needs bash). Installed here through the `aphrody` marketplace (`plugins/.claude-plugin/marketplace.json`, fork `aphrody-labs/unreal-engine-skills-for-claude-code-plugin`); also listed in `claude-plugins-official`.
- Unreal MCP server (UE 5.8, Experimental): enable `ModelContextProtocol` and `AllToolsets` in the `.uproject`; start with `ModelContextProtocol.StartServer`, or `bAutoStartServer=True` under `[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]` in `Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`; write client config with `ModelContextProtocol.GenerateClientConfig ClaudeCode`. Default endpoint `http://127.0.0.1:8000/mcp`. Only three meta-tools are listed: `list_toolsets`, `describe_toolset`, `call_tool`. Optional stdio proxy `Engine/Plugins/Experimental/ModelContextProtocol/Extras/Proxy`.

## Epic Online Services (EOS)

- SDK 1.19.2.1, 2026-09-22 (UNVERIFIED on an Epic page: third-party winget-extras#2576 and Redpoint changelog; official notes at dev.epicgames.com/docs/epic-online-services/release-notes). Download onlineservices.epicgames.com/sdk.
- C API rules (Context7): `EOS_Initialize` once; one `EOS_Platform_Create` handle per game; `EOS_Platform_Tick` every frame, callbacks only fire inside Tick; not thread-safe, call from the game thread; `EOS_Platform_Release` once then `EOS_Shutdown`, no re-init in the same process; shut EOS down before the host platform SDK; remove every `AddNotify` with its `RemoveNotify`.
- Interfaces (handles from `EOS_Platform_Get*Interface`): Achievements, Anti-Cheat client/server, Auth, Connect, Custom Invites, Ecom, Friends, Leaderboards, Lobby, Metrics, Mods, P2P, Player Data Storage, Presence, Progression Snapshot, RTC/RTC Admin, Reports, Sanctions, Sessions, Stats, Title Storage, User Info (eos-fundamentals/eos-platform-interface). Epic Account Services (Auth, Friends, Presence) need an Epic account; Game Services (Connect, Lobby, P2P...) accept any identity provider and use Product User IDs.
- Login types (`EOS_Auth_Credentials`): Password, ExchangeCode, PersistentAuth, Developer (Dev Auth Tool, `Id`=`localhost:<port>`, `Token`=credential name, dev only), RefreshToken, AccountPortal, ExternalAuth.
- Web API token: `POST https://api.epicgames.dev/auth/v1/oauth/token`, `grant_type=client_credentials&deployment_id=...`, Basic auth with client id/secret from Developer Portal > Product Settings. Hierarchy organization > product > sandbox > deployment.
- Store upload: `BuildPatchTool -mode=UploadBinary` with `-OrganizationID -ProductID -ArtifactID -ClientId -ClientSecretEnvVar -BuildRoot -CloudDir -BuildVersion -AppLaunch -AppArgs` (bpt-instructions-170; a 1.8.8 page exists, bpt-instructions-180: no trailing backslash before a quote, prefer forward slashes). Use `-ClientSecretEnvVar`; BPT has its own credentials, EOS game client ids are rejected.
- Samples: `EpicGames/EOS-Getting-Started` (C#, OnlineSubsystemEOS, EGS mobile; min SDK 1.15.2).

## Other official open source (license = GitHub `license.spdx_id`)

- MIT: PixelStreamingInfrastructure (signalling `ue5.8-0.2.1`, 2026-11-10), raddebugger (v0.9.29-alpha), BlenderTools, OpenRigLogic, WineResources.
- GPL-2.0: LinuxUEKernelTools. Apache-2.0: SPIRV-Tools, SPIRV-Cross forks.
- Not detected (NOASSERTION, read the LICENSE file): MetaHuman-DNA-Calibration, RealityScan (last push 2026-06-23), DirectXShaderCompiler and include-what-you-use forks (LLVM licenses upstream). Full live list: `gh api "orgs/EpicGames/repos?sort=pushed"`.

## Community

Source of every row: `gh api graphql` (repository: primaryLanguage, licenseInfo, pushedAt, latestRelease.tagName), 2026-11-13; live values in docs/epic/snapshot.json.

| Repo | Lang | License | Last push | Latest release | Use |
| :--- | :--- | :--- | :--- | :--- | :--- |
| trumank/repak | Rust | Apache-2.0 | 2026-02-20 | v0.2.3 | .pak read/write |
| AstroTechies/unrealmodding | Rust | MIT | 2026-07-18 | none | unreal_asset parser |
| FabianFG/CUE4Parse | C# | Apache-2.0 | 2026-11-11 | 1.2.2.202611 | asset/IoStore parsing |
| 4sval/FModel | C# | GPL-3.0 | 2026-11-08 | nov-2026 | asset explorer (CUE4Parse) |
| UE4SS-RE/RE-UE4SS | C++ | MIT | 2026-11-12 | v4.0.0 | injectable scripting/modding |
| legendary-gl/legendary | Python | GPL-3.0 | 2026-11-04 | 0.21.1 | EGS CLI launcher |
| Heroic-Games-Launcher/HeroicGamesLauncher | TypeScript | GPL-3.0 | 2026-11-13 | v2.22.4 | GUI launcher |
| RareDevs/Rare | Python | GPL-3.0 | 2026-10-09 | 1.12.0 | Qt UI over legendary |
| 3ddelano/epic-online-services-godot | C++ | MIT | 2026-10-29 | 2.3.1 | EOS for Godot |
| devphmd/eos (eos-sys, eos-rs 0.1.1 on crates.io) | Rust | Apache-2.0 | 2026-04-24 | none | only Rust EOS bindings found by crates.io search q=eos (2026-11-13) |

Launcher protocol references (unofficial, from `legendary/api/egs.py`, `legendary/models/manifest.py`, `legendary/lfs/egl.py`): OAuth at `account-public-service-prod03.ol.epicgames.com`, manifest magic `0x44BEC00C` (zlib body: meta, chunk list, file list, custom fields), installs in `%PROGRAMDATA%\Epic\EpicGamesLauncher\Data\Manifests\*.item` (JSON). The launcher client credentials are Epic's; do not commit them (`docs/PUBLISH-AUDIT.md`).

## Continuous tracking

- `.github/workflows/upstream-sync.yml` (every 6 h): `gh repo sync` of each aphrody-labs fork of EpicGames, bevyengine and tracked community repos listed in `third_party/forks.txt`, then `bun scripts/upstream-recon.ts` regenerates `docs/epic/snapshot.json` (every repo: license, branches count, default-branch head commit, latest release) and commits it on main.
- Bevy: all 18 non-archived `bevyengine` repos forked into aphrody-labs (bevy latest release v0.20.1 per snapshot). `aphrody-labs/bevy` is archived, so its sync fails until it is unarchived.

## In this repository

- Forks in `aphrody-labs` (listed in `third_party/forks.txt`): lore, UnrealEngine, unreal-engine-skills-for-claude-code-plugin, EOS-Getting-Started, lore-js, lore-go, lore-python, lore-dotnet, PixelStreamingInfrastructure, raddebugger, repak, CUE4Parse, RE-UE4SS, legendary, epic-online-services-godot.
- `third_party/lore` and the `crates/lore*` crates carry Lore.
- The former `packages/epic-games` stub (hand-written parsers, embedded launcher secret) was removed on 2026-11-13 (see `git log -- packages/epic-games`); use the upstream libraries above.
