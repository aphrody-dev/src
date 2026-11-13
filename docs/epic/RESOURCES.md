# Epic Games ecosystem: official and community resources

Checked 2026-11-13 with `gh api`, Context7 (`/websites/dev_epicgames`) and the web pages cited. Anything without a source here is unverified; do not add it from memory. Stars and dates are a snapshot.

## Engine and languages

| Item | Fact | Source |
| :--- | :--- | :--- |
| Unreal Engine (C++) | Latest stable seen: 5.8, 2026-06-17 (State of Unreal, UE 6 announced; UE 6 release status not verified) | dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes |
| UE source access | Private `EpicGames/UnrealEngine`; link GitHub account at unrealengine.com/ue4-on-github | `gh api repos/EpicGames/Signup` |
| UE royalty | 5% above first US$1M gross per product; 3.5% under Launch Everywhere with Epic; EGS and Fab revenue excluded | unrealengine.com/release (secondary quotes; EULA not read) |
| Lore (Rust VCS) | MIT, pre-1.0, v0.13.0 2026-11-06, centralized content-addressed, built into UEFN; docs epicgames.github.io/lore | `gh api repos/EpicGames/lore` |
| Lore SDKs | lore-js, lore-go, lore-python, lore-dotnet (MIT, no releases yet) | `gh api repos/EpicGames/lore-*` |
| Zen | UE5 local/shared DDC and cook storage server, C++20, xmake; v5.8.27 2026-10-20; no SPDX license | `gh api repos/EpicGames/zen` |

## AI tooling (Claude Code, MCP)

- `EpicGames/unreal-engine-skills-for-claude-code-plugin` (MIT, v3.1.2): skills `unreal-mcp`, `create-toolset`, `unreal-skill`, SessionStart hook (needs bash). Installed here through the `aphrody` marketplace (`plugins/.claude-plugin/marketplace.json`, fork `aphrody-labs/unreal-engine-skills-for-claude-code-plugin`); also listed in `claude-plugins-official`.
- Unreal MCP server (UE 5.8, Experimental): enable `ModelContextProtocol` and `AllToolsets` in the `.uproject`; start with `ModelContextProtocol.StartServer`, or `bAutoStartServer=True` under `[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]` in `Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`; write client config with `ModelContextProtocol.GenerateClientConfig ClaudeCode`. Default endpoint `http://127.0.0.1:8000/mcp`. Only three meta-tools are listed: `list_toolsets`, `describe_toolset`, `call_tool`. Optional stdio proxy `Engine/Plugins/Experimental/ModelContextProtocol/Extras/Proxy`.

## Epic Online Services (EOS)

- SDK 1.19.2.1, 2026-09-22 (winget-extras#2576; official notes at dev.epicgames.com/docs/epic-online-services/release-notes). Download onlineservices.epicgames.com/sdk.
- C API rules (Context7): `EOS_Initialize` once; one `EOS_Platform_Create` handle per game; `EOS_Platform_Tick` every frame, callbacks only fire inside Tick; not thread-safe, call from the game thread; `EOS_Platform_Release` once then `EOS_Shutdown`, no re-init in the same process; shut EOS down before the host platform SDK; remove every `AddNotify` with its `RemoveNotify`.
- Login types (`EOS_Auth_Credentials`): Password, ExchangeCode, PersistentAuth, Developer (Dev Auth Tool, `Id`=`localhost:<port>`, `Token`=credential name, dev only), RefreshToken, AccountPortal, ExternalAuth.
- Web API token: `POST https://api.epicgames.dev/auth/v1/oauth/token`, `grant_type=client_credentials&deployment_id=...`, Basic auth with client id/secret from Developer Portal > Product Settings. Hierarchy organization > product > sandbox > deployment.
- Store upload: `BuildPatchTool -mode=UploadBinary` with `-OrganizationID -ProductID -ArtifactID -ClientId -ClientSecretEnvVar -BuildRoot -CloudDir -BuildVersion -AppLaunch -AppArgs` (bpt-instructions-170). Use `-ClientSecretEnvVar`; BPT has its own credentials, EOS game client ids are rejected.
- Samples: `EpicGames/EOS-Getting-Started` (C#, OnlineSubsystemEOS, EGS mobile; min SDK 1.15.2).

## Other official open source (all MIT unless noted)

PixelStreamingInfrastructure (signalling `ue5.8-0.2.1`, 2026-11-10), raddebugger (v0.9.29-alpha), BlenderTools, OpenRigLogic, MetaHuman-DNA-Calibration, RealityScan, LinuxUEKernelTools, WineResources, forks of DirectXShaderCompiler, SPIRV-Tools, SPIRV-Cross, include-what-you-use. Full live list: `gh api "orgs/EpicGames/repos?sort=pushed"`.

## Community

| Repo | Lang | License | Use |
| :--- | :--- | :--- | :--- |
| trumank/repak | Rust | Apache-2.0 | .pak read/write |
| AstroTechies/unrealmodding | Rust | MIT | unreal_asset parser |
| FabianFG/CUE4Parse | C# | Apache-2.0 | asset/IoStore parsing |
| 4sval/FModel | C# | GPL-3.0 | asset explorer (CUE4Parse) |
| UE4SS-RE/RE-UE4SS | C++ | MIT | injectable scripting/modding |
| legendary-gl/legendary | Python | GPL-3.0 | EGS CLI launcher, 0.21.1 |
| Heroic-Games-Launcher/HeroicGamesLauncher | TS | GPL-3.0 | GUI launcher, v2.22.4 |
| RareDevs/Rare | Python | GPL-3.0 | Qt UI over legendary |
| 3ddelano/epic-online-services-godot | C++ | MIT | EOS for Godot 4.2+ |
| devphmd/eos (eos-sys, eos-rs 0.1.1) | Rust | Apache-2.0 | only Rust EOS bindings found; 1 star, idle since 2026-04 |

Launcher protocol references (unofficial, from `legendary/api/egs.py`, `legendary/models/manifest.py`, `legendary/lfs/egl.py`): OAuth at `account-public-service-prod03.ol.epicgames.com`, manifest magic `0x44BEC00C` (zlib body: meta, chunk list, file list, custom fields), installs in `%PROGRAMDATA%\Epic\EpicGamesLauncher\Data\Manifests\*.item` (JSON). The launcher client credentials are Epic's; do not commit them (`docs/PUBLISH-AUDIT.md`).

## In this repository

- Forks in `aphrody-labs` (listed in `third_party/forks.txt`): lore, UnrealEngine, unreal-engine-skills-for-claude-code-plugin, EOS-Getting-Started, lore-js, lore-go, lore-python, lore-dotnet, PixelStreamingInfrastructure, raddebugger, repak, CUE4Parse, RE-UE4SS, legendary, epic-online-services-godot.
- `third_party/lore` and the `crates/lore*` crates carry Lore.
- The former `packages/epic-games` stub (hand-written parsers, embedded launcher secret) was removed on 2026-11-13; use the upstream libraries above.
