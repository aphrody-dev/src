# Free assets and code: inclusion and exclusion record

Generated 2026-11-13 by `ay assets scan` (GitHub `license.spdx_id` per repository, public repositories only). Included entries are pinned to a 40-char commit in `assets/library/repos.toml` and fetched into the remote store (`ay assets fetch --repos`), never copied into git. File assets (Poly Haven, ambientCG, google/fonts) are in `assets/library/manifest.*.toml` with SPDX, sha256 and source URL.

Rule: OSI-approved license or CC0 only. `NOASSERTION` (custom text or EULA), no license file, private repositories and anything under the Unreal Engine EULA are excluded.

## Included

| Owner      | Repositories | Licenses                               |
| ---------- | ------------ | -------------------------------------- |
| EpicGames  | 43           | MIT, Apache-2.0, BSD-3-Clause, GPL-2.0 |
| KenneyNL   | 9            | MIT, GPL-3.0                           |
| bevyengine | 18           | MIT, Apache-2.0                        |

## Never redistributable (not copied, not fetched)

- Unreal Engine source (`EpicGames/UnrealEngine`, `UnrealTournament`): UE EULA; private repositories visible through the Epic org membership only.
- Fab, Unreal Marketplace and Epic Games Store content (including Quixel Megascans bundles on Fab, MetaHuman): UE/Fab EULA, usable inside Unreal projects only, redistribution forbidden.
- Oodle, MSVC SDKs and any other proprietary SDK.

## Excluded repositories

### EpicGames

| Repository                          | License     | Reason                                                       |
| ----------------------------------- | ----------- | ------------------------------------------------------------ |
| EpicGames/.github                   | none        | no license file: all rights reserved                         |
| EpicGames/ARTv2                     | private     | not public (visible through membership only); never mirrored |
| EpicGames/DirectXShaderCompiler     | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/MayaLiveLink              | none        | no license file: all rights reserved                         |
| EpicGames/MetaHuman-DNA-Calibration | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/PythonSamples             | none        | no license file: all rights reserved                         |
| EpicGames/RealityScan               | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/Shave-And-A-Haircut       | NOASSERTION | not public (visible through membership only); never mirrored |
| EpicGames/Signup                    | none        | no license file: all rights reserved                         |
| EpicGames/ThirdParty                | none        | no license file: all rights reserved                         |
| EpicGames/UGCExample                | private     | not public (visible through membership only); never mirrored |
| EpicGames/UnrealEngine              | NOASSERTION | not public (visible through membership only); never mirrored |
| EpicGames/UnrealTournament          | NOASSERTION | not public (visible through membership only); never mirrored |
| EpicGames/include-what-you-use      | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/tk-config-unreal          | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/tk-config-unrealbasic     | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/tk-framework-unrealqt     | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/tk-unreal                 | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms)       |
| EpicGames/zen                       | private     | not public (visible through membership only); never mirrored |

### KenneyNL

| Repository                                  | License     | Reason                                                 |
| ------------------------------------------- | ----------- | ------------------------------------------------------ |
| KenneyNL/Adobe-Alternatives                 | none        | no license file: all rights reserved                   |
| KenneyNL/Godot-SplashScreens                | none        | no license file: all rights reserved                   |
| KenneyNL/Nationaal-Archief-Educatieve-Games | none        | no license file: all rights reserved                   |
| KenneyNL/Skyrim-Mods                        | NOASSERTION | custom or unrecognized license (EULA or non-OSI terms) |
| KenneyNL/Unearthed-mods                     | none        | no license file: all rights reserved                   |

### bevyengine

| Repository                        | License | Reason                               |
| --------------------------------- | ------- | ------------------------------------ |
| bevyengine/bevy-assets            | none    | no license file: all rights reserved |
| bevyengine/bevy-community         | none    | no license file: all rights reserved |
| bevyengine/bevy_asset_files       | none    | no license file: all rights reserved |
| bevyengine/cratesio-dbdump-csvtab | none    | no license file: all rights reserved |

## Excluded sources (not repositories)

| Source                   | Reason                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| kenney.nl site downloads | answers 403 to non-browser clients, no pinned URL; CC0 content is taken from the KenneyNL GitHub starter kits (MIT per GitHub) instead              |
| Quaternius packs         | CC0 per the author, but hosted on Google Drive/itch links with no stable pinned URL or checksum; revisit when a pinned mirror exists                |
| OpenGameArt              | per-asset licenses (CC-BY, CC-BY-SA, GPL, CC0 mixed) and no machine-readable catalog API; only individually verified CC0 pages may be added by hand |
