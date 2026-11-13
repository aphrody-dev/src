# Epic Games ecosystem: official and community resources

Checked 2026-11-13 with `gh api`, Context7 (`/websites/dev_epicgames`) and the web pages cited. Anything without a source here is unverified; do not add it from memory. Versions and dates are a snapshot; community rows come from the GitHub GraphQL API (see Community).

## Epic philosophy (as stated by Epic)

Source: unrealengine.com/news/state-of-unreal-2026-top-news-from-the-show (2026-06-17).
- Build once, deploy to traditional platforms, Fortnite or your own ecosystems (UE 6 aim).

## Engine and languages

| Item | Fact | Source |
| :--- | :--- | :--- |
| Unreal Engine (C++) | Latest stable 5.8 (2026-06-17); last planned UE5 major; the private repo had tag 5.8.4-release when read with an Epic-linked gh login on 2026-11-13 (`gh api graphql` repository.latestRelease), not visible to the CI snapshot | 5.8 release notes (dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes); State of Unreal 2026 page |
| UE source access | Private `EpicGames/UnrealEngine`; link GitHub account at unrealengine.com/ue4-on-github | `gh api repos/EpicGames/Signup/readme`; `gh api repos/EpicGames/UnrealEngine` returns private |
| Lore (Rust VCS) | MIT, pre-1.0, v0.13.0 2026-11-06, centralized content-addressed, built into UEFN; docs epicgames.github.io/lore | `gh api repos/EpicGames/lore` |
| Lore SDKs | lore-js, lore-go, lore-python, lore-dotnet (MIT, no releases yet) | `gh api repos/EpicGames/lore-js` (and lore-go, lore-python, lore-dotnet) |
| Zen | UE5 local/shared DDC and cook storage server, C++20, xmake; v5.8.27 2026-10-20; no open-source license (GitHub license=null, no LICENSE file, headers say Copyright Epic Games, All Rights Reserved) | `gh api repos/EpicGames/zen` |

## Unreal Engine 6 and Verse direction

- UE 6 (official, unrealengine.com/news/state-of-unreal-2026-top-news-from-the-show, 2026-06-17, page text read on 2026-11-13): in development, Early Access targeted end of 2027. Three initiatives: gameplay programming model moves to Verse ("transactionalizes C++"); portable, interoperable content, code and economies through open standards; pipeline features such as MCP with integrations for Claude, Gemini and others. UE 5.8 is the last planned UE5 major release (5.9 kept as an option).
- Same page: a full rebuild of the Launcher and storefront backend is under way; the UE 5.8 MCP plugin is Experimental and model-agnostic.
- Scene Graph: animation, itemization and gameplay abilities arrive as Verse-scriptable components (same page).
- UEFN: v43.00 (2026-11-01) adds Verse material inheritance; Verse does not run on the client yet. v42.40 (2026-10-15): UEFN source assets licensable on Fab, `text_channel` API in `/Verse.org/Chat` (dev.epicgames.com/documentation/fortnite release notes).
- MetaHuman: Creator web app access closed 2026-11-05, then 90 more days to retrieve gallery MetaHumans (forums.unrealengine.com/t/metahuman-creator-web-application-is-being-discontinued/2695297); creation is in-engine. UE 5.8 ships a MetaHuman Devkit and Animator markerless mocap (State of Unreal 2026 news page).
- Licensing (unrealengine.com/ue-devs-can-now-choose-to-train-ai-models-on-their-projects): UE and MetaHuman projects can opt in to AI training; UEFN, Verse and island content fall under the Fortnite Developer Rules/Terms, not the UE EULA.

## UEFN and Fab (Context7 `/websites/dev_epicgames_fortnite`, dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab)

- UEFN scripting: a Verse device is `class(creative_device)` with `OnBegin<override>()<suspends>:void`; `@editable` fields appear in the editor Details panel (editable-properties-in-verse); devices subscribe to events such as `InteractedWithEvent.Subscribe(...)`.
- Publishing: not from UEFN itself; UEFN checks project size and memory, then the Creator Portal handles versions, media and release (publishing-projects-in-unreal-editor-for-fortnite).
- Fab licenses: CC-BY (free only) or Standard (free or paid). Standard has Personal and Professional price tiers with the same rights; Personal applies when the buyer group made at most US$100,000 gross revenue in the digital content industry in the last 12 months. Standard allows commercial use, modification and any tool; no resale of the asset alone; no credit required. The NoAI tag requires the Standard license. Assets bought on the old UE Marketplace keep the Epic Content License. Binding text: fab.com/eula.
- Epic Games Terms of Service (updated 2026-05-27, cdn1.epicgames.com/eulatracking-download/epicgames_tos/en/v2/r6/11807f59e3a9791c73e10754aa377d94.pdf) do not apply to Unreal Engine, the Epic Games Store or Fab.

## Verse language

- Reference: The Verse book, verselang.github.io/book (repo verselang/book, CC0-1.0); Context7 `/websites/verselang_github_io_book`.
- Effect specifiers: `<computes>` `<reads>` `<writes>` `<allocates>` `<transacts>` `<decides>` (can fail) `<suspends>` (async) `<converges>` (guaranteed to terminate) `<diverges>` (may not terminate) `<predicts>` (may run predictively on clients; everything it calls must also predict). Functions are server-authoritative (`dictates` effect) by default; `dictates` has no specifier (verselang.github.io/book/13_effects/). Failure contexts: a `<decides>` call must sit in `if` or `or`, or in a `<decides>` function; a failed transaction rolls back every `set`.

## Build CLI and CI (Context7 `/websites/dev_epicgames_unreal-engine`)

- UAT: `Engine/Build/BatchFiles/RunUAT.{bat,sh} BuildCookRun -project=<p>.uproject -platform=Win64|Linux|... -clientconfig=Shipping -build -cook -stage -pak -archive -archivedirectory=<dir>` (add `-prereqs -allmaps -noP4 -nodebuginfo` as needed; UE 5.8 Windows ARM: `-clientarchitecture=arm64+x64`).
- UBT: `Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe <Target> Development Win64`; targets in `<Name>.Target.cs` (`class <Name>Target : TargetRules`), modules in `<Module>.Build.cs` (`ModuleRules`, Public/PrivateDependencyModuleNames).
- Horde: Epic's build/test automation (BuildGraph scripts, Perforce streams, UE 5.4+), Unreal Build Accelerator remote compile, UnrealGameSync metadata server (`ApiUrl=https://<horde>/ugs` in `UnrealGameSync.ini`); source `Engine/Source/Programs/Horde/Horde.Server/` (dev.epicgames.com/documentation/en-us/unreal-engine/horde-in-unreal-engine).
- Containers: official UE container images, quick start at dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-using-container-images-in-unreal-engine.
- Coding standard: prefixes `U` (UObject), `A` (AActor), `F` (structs), `T` (templates), `E` (enums), `I` (interfaces), `b` (bool), `C` (concept-alike structs) (dev.epicgames.com/documentation/en-us/unreal-engine/epic-cplusplus-coding-standard-for-unreal-engine).
- Python editor scripting API: Context7 `/websites/dev_epicgames_en-us_unreal-engine_python-api`.

## AI tooling (Claude Code, MCP)

- `EpicGames/unreal-engine-skills-for-claude-code-plugin` (MIT; v3.1.2 in `.claude-plugin/plugin.json` per `gh api` on 2026-11-13): skills `unreal-mcp`, `create-toolset`, `unreal-skill`, SessionStart hook (needs bash); listed in `claude-plugins-official`.
- Unreal MCP server (UE 5.8, Experimental): enable `ModelContextProtocol` and `AllToolsets` in the `.uproject`; start with `ModelContextProtocol.StartServer`, or `bAutoStartServer=True` under `[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]` in `Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`; write client config with `ModelContextProtocol.GenerateClientConfig ClaudeCode`. Default endpoint `http://127.0.0.1:8000/mcp`. Only three meta-tools are listed: `list_toolsets`, `describe_toolset`, `call_tool`. Source: the plugin file `skills/unreal-mcp/references/setup.md`. Optional stdio proxy `Engine/Plugins/Experimental/ModelContextProtocol/Extras/Proxy`.

## Epic Online Services (EOS)

- SDK 1.19.2.1-CL58105819, 2026-09-22 (dev.epicgames.com/docs/epic-online-services/release-notes, read 2026-11-13). Notable changes: EAS access tokens grow up to 8 KB from 2026-10-01 (never assume a fixed token size); `EOS_AntiCheatClient_GetSystemRequirementStatus` (Secure Boot, TPM); Apple CTC tokens in `EOS_Ecom_Checkout`. 1.19.1.2 (2026-05-19): Windows on Arm (no Social Overlay; anti-cheat only for emulated x64). 1.19.0.3 (2026-02-10): no 32-bit Windows/Android, `EOS_Initialize` no longer raises main-thread priority on Windows. 1.17.1.3: four-part version numbers; `EOS_Ecom_QueryOwnership` for durable ownership. Download onlineservices.epicgames.com/sdk.
- C API rules (Context7): `EOS_Initialize` once; one `EOS_Platform_Create` handle per game; `EOS_Platform_Tick` every frame, callbacks only fire inside Tick; not thread-safe, call from the game thread; `EOS_Platform_Release` once then `EOS_Shutdown`, no re-init in the same process; shut EOS down before the host platform SDK; remove every `AddNotify` with its `RemoveNotify`.
- Interfaces (handles from `EOS_Platform_Get*Interface`): Achievements, Anti-Cheat client/server, Auth, Connect, Custom Invites, Ecom, Friends, Leaderboards, Lobby, Metrics, Mods, P2P, Player Data Storage, Presence, Progression Snapshot, RTC/RTC Admin, Reports, Sanctions, Sessions, Stats, Title Storage, User Info (eos-fundamentals/eos-platform-interface). Epic Account Services (Auth, Friends, Presence) need an Epic account; Game Services (Connect, Lobby, P2P...) accept any identity provider and use Product User IDs.
- Login types (`EOS_Auth_Credentials`): Password, ExchangeCode, PersistentAuth, Developer (Dev Auth Tool, `Id`=`localhost:<port>`, `Token`=credential name, dev only), RefreshToken, AccountPortal, ExternalAuth.
- Web API token: `POST https://api.epicgames.dev/auth/v1/oauth/token`, `grant_type=client_credentials&deployment_id=...`, Basic auth with client id/secret from Developer Portal > Product Settings. Hierarchy organization > product > sandbox > deployment.
- Store upload: `BuildPatchTool -mode=UploadBinary` with `-OrganizationID -ProductID -ArtifactID -ClientId -ClientSecretEnvVar -BuildRoot -CloudDir -BuildVersion -AppLaunch -AppArgs` (dev.epicgames.com/docs/epic-games-store/publishing-tools/uploading-binaries/bpt-instructions-170; the newer bpt-instructions-180 page for BuildPatch Tool 1.8.8 adds: no trailing backslash before a quote, prefer forward slashes). Use `-ClientSecretEnvVar`; BPT has its own credentials, EOS game client ids are rejected.
- Samples: `EpicGames/EOS-Getting-Started` (C#, OnlineSubsystemEOS, EGS mobile; README states min SDK 1.15.2, `gh api repos/EpicGames/EOS-Getting-Started/readme`).

## Other official open source (license = GitHub `license.spdx_id`)

- MIT: PixelStreamingInfrastructure, raddebugger, BlenderTools, OpenRigLogic, WineResources.
- GPL-2.0: LinuxUEKernelTools. Apache-2.0: SPIRV-Tools, SPIRV-Cross forks.
- NOASSERTION (no SPDX license detected): MetaHuman-DNA-Calibration, RealityScan, DirectXShaderCompiler and include-what-you-use forks. Versions, tags and dates of every EpicGames repo: docs/epic/snapshot.json (regenerated by upstream-sync).

## Community

Versions, licenses, push dates and releases: docs/epic/snapshot.json (`community` key, GitHub GraphQL). Roles:

- trumank/repak: .pak read/write (Rust).
- AstroTechies/unrealmodding: unreal_asset parser (Rust).
- FabianFG/CUE4Parse: asset/IoStore parsing (C#); 4sval/FModel: explorer built on it.
- UE4SS-RE/RE-UE4SS: injectable scripting/modding (C++).
- legendary-gl/legendary: EGS CLI launcher; Heroic-Games-Launcher/HeroicGamesLauncher: GUI; RareDevs/Rare: Qt UI over legendary.
- 3ddelano/epic-online-services-godot: EOS for Godot.
- devphmd/eos: repo of the crates.io crates eos-sys and eos-rs; the only Rust EOS bindings returned by crates.io search q=eos on 2026-11-13.

Launcher protocol references (unofficial, derrod/legendary @170964e7: `legendary/api/egs.py`, `legendary/models/manifest.py:69` header_magic `0x44BEC00C`, `legendary/lfs/egl.py`): OAuth at `account-public-service-prod03.ol.epicgames.com`, zlib manifest body (meta, chunk list, file list, custom fields), installs in `%PROGRAMDATA%\Epic\EpicGamesLauncher\Data\Manifests\*.item` (JSON). The launcher client credentials are Epic's; do not commit them (`docs/PUBLISH-AUDIT.md`).

Repository-side setup (forks, fork sync on fr1, CI snapshot, local plugin install): docs/epic/TRACKING.md.
