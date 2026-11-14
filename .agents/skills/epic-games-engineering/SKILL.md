---
name: epic-games-engineering
description: End-to-end engineering reference and tooling for Epic Games, Unreal Engine, EOS SDK, repak .pak archives, unreal_asset, EGS manifest protocols, and Easy Anti-Cheat.
---

# Epic Games & Unreal Engine Sovereign Engineering Reference

This skill guides development, reverse-engineering, package extraction, manifest downloading, and asset inspection across the **Epic Games** open-source ecosystem (`repak`, `unreal_asset`, `legendary`, `bevy_eos`, and `depot epic`).

---

## 1. Unreal Engine Archive Formats (`repak`)

### 1.1 `.pak` Archive Structure

Unreal Engine `.pak` files place the index metadata in the `FPakInfo` footer at the very end of the file.

- **Magic Signature**: `0x5A6F12E1` (`PAK_FILE_MAGIC`)
- **Key Fields**:
  - `Version`: Format version (typically `v8` for UE4.25+, `v11` for UE5).
  - `IndexOffset`: Byte position of the primary directory index.
  - `IndexSize`: Length in bytes of the index table.
  - `EncryptedIndex`: Flag indicating AES-256 encrypted directory table.
  - `CompressionMethods`: Array of 4-character strings (`Oodle`, `Zlib`, `Gzip`, `LZ4`, `Zstd`).

### 1.2 IoStore Containers (`.utoc` & `.ucas`)

In Unreal Engine 5 Zen Loader:

- `.utoc`: Table of contents container mapping ChunkIDs to container offsets and compression blocks.
- `.ucas`: Chunk container file containing raw or compressed payload blocks.

---

## 2. Unreal Engine Asset Serialization (`unreal_asset`)

### 2.1 `.uasset` Package Header

- **Magic Signature**: `0x9E2A83C1` (represented as `-1641380927` in signed 32-bit integer).
- **Package Layout**:
  - `NameMap`: Array of FString symbols referenced by exports and imports.
  - `ImportTable`: External types, functions, and parent classes.
  - `ExportTable`: Objects and components defined within the package.
  - `Payload`: Binary data in companion `.uexp` / `.ubulk` files.

---

## 3. Epic Games Store (EGS) Distribution Protocol (`legendary`)

### 3.1 Binary Manifest Format (`.manifest`)

- **Magic**: `0x0b83c027`
- EGS downloads break files down into 1MB..16MB content chunks indexed by 64-bit GUIDs.
- Manifest files contain a complete dependency DAG mapping file slices to CDN chunks.

### 3.2 Authentication Endpoints

- Token URL: `https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token`
- User Info URL: `https://account-public-service-prod03.ol.epicgames.com/account/api/public/account/{account_id}`
- Assets Catalog URL: `https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/v2`

---

## 4. Easy Anti-Cheat (EAC) CDN & Module Inspection

- Modules CDN: `https://modules-cdn.eac-prod.on.epicgames.com/modules/{game_guid}/{platform}/eac_module.bin`
- Decryption: 8-byte rolling chain-cipher with payload validation.
- Inspection: Inspect `GameBootstrapper.ini` and `EasyAntiCheat/Settings.json` in game root directories.

---

## 5. Sovereign CLI Commands

- `depot epic inspect <file>`: Inspect `.pak`, `.uasset`, or `.manifest` files.
- `depot epic eac <dir>`: Audit Easy Anti-Cheat configuration and check-site signatures.
