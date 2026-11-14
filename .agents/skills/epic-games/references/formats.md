# Unreal archive and asset formats

Folded from the former epic-games-engineering skill. EGS manifest magic, EAC module notes and the `depot epic` commands were dropped: the manifest magic conflicts with docs/epic/RESOURCES.md (`0x44BEC00C`, derrod/legendary) and the commands do not exist in crates/depot-*.
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
