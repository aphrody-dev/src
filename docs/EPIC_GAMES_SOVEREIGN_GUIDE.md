# Sovereign Epic Games & Unreal Engine Engineering Guide

Comprehensive specification, open-source library reference, file format atlas, and protocol architecture for the **Epic Games** ecosystem (Unreal Engine, Epic Games Store, Epic Online Services, Easy Anti-Cheat, and OpenUSD) across the sovereign monorepo.

---

## 1. Open-Source Ecosystem Roster & GitHub Repository Atlas

| Domain | Canonical Repository | Language | Description | Monorepo Surface |
| :--- | :--- | :--- | :--- | :--- |
| **Unreal .pak Engine** | [`trumank/repak`](https://github.com/trumank/repak) | Rust | Pure-Rust Unreal Engine `.pak` archive reader, writer, and patcher. Supports PAK v1..v11, AES-256, Oodle/Zlib. | `crates/corelib`, `crates/depot` |
| **Asset Parsing** | [`atenfyr/unreal_asset`](https://github.com/atenfyr/unreal_asset) | Rust | Parser, serializer, and AST explorer for Unreal Engine `.uasset`, `.uexp`, and `.ubulk` files. | `crates/corelib`, `packages/epic-games` |
| **EGS Client & CDN** | [`derrod/legendary`](https://github.com/derrod/legendary) | Python | Free and open-source CLI alternative to the Epic Games Launcher. Manifest v2/v3 parser, chunk downloader. | `packages/epic-games` |
| **GUI Launcher** | [`Heroic-Games-Launcher/HeroicGamesLauncher`](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher) | TS / Electron | Cross-platform open-source launcher for Epic Games, GOG, and Amazon Games. | Protocol Reference |
| **GUI Frontend** | [`Dummerle/Rare`](https://github.com/Dummerle/Rare) | Python / Qt | Open-source PyQt GUI for Legendary on Linux, Windows, and macOS. | Protocol Reference |
| **EOS SDK Bindings** | [`bevy_eos`](https://github.com/smokey-sh/bevy_eos) | Rust | Bevy plugin and Rust bindings for Epic Online Services (P2P, auth, lobbies). | `crates/corelib::emulation` |
| **Unreal Engine** | [`EpicGames/UnrealEngine`](https://github.com/EpicGames/UnrealEngine) | C++ / C# | Official source repository for Unreal Engine 5. | Architecture Reference |
| **OpenUSD** | [`PixarAnimationStudios/OpenUSD`](https://github.com/PixarAnimationStudios/OpenUSD) | C++ / Python | Universal Scene Description 3D pipeline specification supported by Unreal Engine. | Graphics Pipeline |

---

## 2. Binary Specifications: Unreal Engine Package Formats

### 2.1 Unreal Engine `.pak` Archive Specification (`FPakInfo`)

Unreal Engine `.pak` files store their primary directory index metadata at the **end of the file** within a standardized footer structure:

```text
+-----------------------------------------------------------------------+
| File Payload 0 | File Payload 1 | ... | Primary Directory Index Table |
+-----------------------------------------------------------------------+
                                        ^                               ^
                                        | Index Offset                  | Footer (FPakInfo)
```

#### The `FPakInfo` Footer Layout (Magic: `0x5A6F12E1` / `1517228769` Little-Endian)
The footer is read backwards from the end of the file (varying from 44 to 228 bytes depending on PAK version):

| Field | Type | Description |
| :--- | :--- | :--- |
| `EncryptionKeyGuid` | `[u8; 16]` | GUID identifying the AES-256 decryption key for encrypted archives |
| `EncryptedIndex` | `u8` | `1` if the primary index is AES-256 encrypted, `0` if plaintext |
| `Magic` | `u32` | `0x5A6F12E1` (`PAK_FILE_MAGIC`) validating archive integrity |
| `Version` | `u32` | PAK format version (1 to 11; UE 4.0..4.27 uses v7..v8, UE 5.0+ uses v11) |
| `IndexOffset` | `u64` | Byte offset from the start of the file where the index table begins |
| `IndexSize` | `u64` | Byte length of the serialized index table |
| `IndexHash` | `[u8; 20]` | SHA-1 hash of the index table |
| `CompressionMethods` | `[u8; 128]` | Array of 4-byte ANSI compression method names (`Oodle`, `Zlib`, `Gzip`, `LZ4`, `Zstd`) |

---

### 2.2 Unreal Engine `.uasset` / `.uexp` Package File Summary

Unreal Engine serialized packages are split into:
1. `.uasset`: Package header, name map, import table, and export table metadata.
2. `.uexp`: Package binary export data (bytecode, textures, mesh vertices).
3. `.ubulk`: Optional uncompressed streaming data (mipmaps, audio streams).

#### Package File Summary Header (Magic: `0x9E2A83C1` / `-1641380927`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `Tag` | `i32` | `0x9E2A83C1` (`PACKAGE_FILE_TAG`) |
| `LegacyFileVersion` | `i32` | Negative integer representing engine version (e.g. `-7` for UE4/UE5) |
| `LegacyUE3Version` | `i32` | Legacy UE3 version flag (typically `0` or `864`) |
| `FileVersionUE4` | `i32` | File version enum (e.g. `522` for UE 4.27, `524` for UE 5.3) |
| `FileVersionUE5` | `i32` | File version enum for UE5 features |
| `FileVersionLicensee` | `i32` | Custom licensee file version |
| `CustomVersions` | `Array` | List of GUID + Version pairs tracking engine feature flags |
| `TotalHeaderSize` | `i32` | Total byte size of `.uasset` header before `.uexp` export payload |
| `FolderName` | `String` | Package mount path (e.g. `/Game/Characters/Hero`) |
| `PackageFlags` | `u32` | Bitmask (`PKG_FilterEditorOnly`, `PKG_CompiledIn`, etc.) |
| `NameCount` / `NameOffset` | `i32, i32` | Count and byte offset to the Name Map table |
| `ImportCount` / `ImportOffset` | `i32, i32` | Count and byte offset to the Import Table |
| `ExportCount` / `ExportOffset` | `i32, i32` | Count and byte offset to the Export Table |

---

## 3. Epic Games Store (EGS) Content Distribution Protocol

### 3.1 Authentication & Token Exchange Flow
Epic Games uses standard OAuth2 endpoints with authorization code and exchange code grants:
1. **OAuth2 Token Endpoint**:
   ```http
   POST https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token
   Content-Type: application/x-www-form-urlencoded
   Authorization: Basic <base64(client_id:client_secret)>

   grant_type=exchange_code&exchange_code=<code_from_auth>
   ```
2. **Entitlements & Asset Discovery**:
   ```http
   GET https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/v2/platform/Windows/namespace/{namespace}/catalogItem/{catalogItemId}/app/{appName}/label/Live
   Authorization: Bearer <access_token>
   ```

### 3.2 Manifest Architecture (`.manifest`)
EGS games are distributed as content-addressed chunk streams governed by a binary manifest:
- **Magic Signature**: `0x0b83c027` (JSON-header binary format) or `0x0b83c026`.
- **Chunk Catalog**: Contains a list of all content chunks identified by a 64-bit chunk GUID and a 32-bit CRC or SHA-1 hash.
- **File Manifest**: Maps logical game file paths (e.g. `Engine/Binaries/Win64/UnrealEditor.exe`) to an ordered list of chunks with byte offsets and sizes.
- **CDN Base URL**: Chunks are fetched via HTTPS from Akamai, Fastly, or Cloudflare CDNs:
  ```text
  https://content-cache.epicgames.com/Builds/{namespace}/{appName}/CloudDir/ChunksV4/{hash_prefix}/{chunk_guid}.chunk
  ```

---

## 4. Epic Online Services (EOS) & Easy Anti-Cheat (EAC)

### 4.1 EOS SDK Architecture
- **Platform Interface**: Manages thread loop (`EOS_Platform_Tick`), memory allocations, and network logging.
- **Auth Interface**: Supports account link, persistent login, and OpenID Connect tokens.
- **P2P Interface**: Encrypted, NAT-punched peer-to-peer data transport over WebRTC / DTLS.
- **Lobby & Matchmaking**: Cloud-coordinated session discovery and search filters.

### 4.2 Easy Anti-Cheat (EAC) CDN Architecture
EAC client modules are distributed from the official Epic Games EAC CDN:
```text
https://modules-cdn.eac-prod.on.epicgames.com/modules/{game_guid}/{platform}/eac_module.bin
```
The payload is encrypted with an 8-byte rolling chain-cipher inspected via `crates/shenron-re/src/fs/eac.rs` and `crates/corelib::re`.

---

## 5. Monorepo Integration & Tooling Surface

1. **`crates/corelib::epic`**:
   - Native Rust parsers for Unreal `.pak` headers and `.uasset` package summaries.
   - Fast binary sniffing distinguishing `.pak`, `.uasset`, `.utoc`, and EGS `.manifest`.
2. **`crates/depot`**:
   - `depot epic inspect <file>`: CLI tool providing instant metadata, version, table offsets, and encryption diagnostics.
3. **`packages/epic-games` (`@aphrody/epic-games`)**:
   - Zero-dependency Bun/TypeScript client for Epic Games Store manifests, asset structures, and OAuth2 workflows.
