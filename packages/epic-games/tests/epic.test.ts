// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import {
  computeEacIntegrityEntry,
  computeUnrealPakPathHash64,
  decodeEgsChunkContainer,
  EGS_MANIFEST_MAGIC,
  encodeEgsChunkContainer,
  formatEacModuleUrl,
  formatEgsChunkUrl,
  getEpicBasicAuth,
  PACKAGE_FILE_TAG,
  PAK_FILE_MAGIC,
  parseEgsManifestHeader,
  parsePakFooter,
  parsePakLegacyIndex,
  parseUAssetNameTable,
  parseUAssetSummary,
  verifyEacIntegrityCatalog,
} from "../src/index";

describe("Epic Games & Unreal Engine Sovereign SDK", () => {
  test("Basic Auth header formats client credentials", () => {
    const header = getEpicBasicAuth("test_client", "test_secret");
    expect(header.startsWith("Basic ")).toBeTrue();
    const decoded = Buffer.from(header.replace("Basic ", ""), "base64").toString("utf-8");
    expect(decoded).toBe("test_client:test_secret");
  });

  test("UAsset package summary & FName string table parser", () => {
    const buffer = new Uint8Array(128);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, PACKAGE_FILE_TAG, true);
    view.setInt32(4, -7, true);
    view.setInt32(12, 522, true);
    view.setInt32(16, 0, true);
    view.setInt32(28, 2, true); // nameCount = 2
    view.setInt32(32, 64, true); // nameOffset = 64
    view.setInt32(36, 3, true);

    // Write two FNameEntrySerialized entries at offset 64: "None\0" + 4B hash, "HeroActor\0" + 4B hash
    let c = 64;
    view.setInt32(c, 5, true);
    c += 4;
    buffer.set(new TextEncoder().encode("None\0"), c);
    c += 5 + 4;
    view.setInt32(c, 10, true);
    c += 4;
    buffer.set(new TextEncoder().encode("HeroActor\0"), c);

    const summary = parseUAssetSummary(buffer);
    expect(summary.tag).toBe(PACKAGE_FILE_TAG);
    expect(summary.fileVersionUE4).toBe(522);
    expect(summary.nameCount).toBe(2);

    const names = parseUAssetNameTable(buffer, summary.nameOffset, summary.nameCount);
    expect(names).toEqual(["None", "HeroActor"]);
  });

  test("Pak footer, FNV64 path hash, and FPakEntry legacy index parser", () => {
    const buffer = new Uint8Array(256);
    const view = new DataView(buffer.buffer);
    const magicPos = 200;

    view.setUint32(magicPos, PAK_FILE_MAGIC, true);
    view.setUint32(magicPos + 4, 8, true);
    view.setBigUint64(magicPos + 8, 4096n, true);
    view.setBigUint64(magicPos + 16, 1024n, true);

    const pak = parsePakFooter(buffer);
    expect(pak.magic).toBe(PAK_FILE_MAGIC);
    expect(pak.version).toBe(8);
    expect(pak.indexOffset).toBe(4096n);
    expect(pak.indexSize).toBe(1024n);
    expect(pak.isEncrypted).toBeFalse();

    const hashA = computeUnrealPakPathHash64("Game/Content/Maps/Main.umap");
    const hashB = computeUnrealPakPathHash64("game\\content\\maps\\main.umap");
    expect(hashA).toBe(hashB);

    // Build synthetic legacy Pak index with 1 entry
    const idx = new Uint8Array(128);
    const iv = new DataView(idx.buffer);
    let p = 0;
    iv.setInt32(p, 10, true);
    p += 4;
    idx.set(new TextEncoder().encode("../../../\0"), p);
    p += 10;
    iv.setInt32(p, 1, true); // 1 record
    p += 4;
    iv.setInt32(p, 9, true);
    p += 4;
    idx.set(new TextEncoder().encode("init.lua\0"), p);
    p += 9;
    iv.setBigUint64(p, 512n, true); // offset
    iv.setBigUint64(p + 8, 64n, true); // compressedSize
    iv.setBigUint64(p + 16, 64n, true); // uncompressedSize
    iv.setUint32(p + 24, 0, true); // uncompressed

    const parsedIdx = parsePakLegacyIndex(idx);
    expect(parsedIdx.mountPoint).toBe("../../../");
    expect(parsedIdx.entries.length).toBe(1);
    expect(parsedIdx.entries[0]?.filename).toBe("init.lua");
    expect(parsedIdx.entries[0]?.offset).toBe(512n);
  });

  test("EGS manifest header + compressed .chunk round-trip decoder", () => {
    const buffer = new Uint8Array(16);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, EGS_MANIFEST_MAGIC, true);
    view.setUint32(4, 256, true);
    buffer[8] = 1;
    view.setUint32(12, 3, true);

    const meta = parseEgsManifestHeader(buffer);
    expect(meta.magic).toBe(EGS_MANIFEST_MAGIC);
    expect(meta.headerSize).toBe(256);
    expect(meta.isCompressed).toBeTrue();
    expect(meta.version).toBe(3);

    const rawPayload = new TextEncoder().encode("Unreal Engine Chunk Payload Data ".repeat(8));
    const { chunkBytes, sha1Hex } = encodeEgsChunkContainer(rawPayload, true);
    const decoded = decodeEgsChunkContainer(chunkBytes, sha1Hex);
    expect(decoded.sha1Verified).toBeTrue();
    expect(new TextDecoder().decode(decoded.payload)).toBe(
      new TextDecoder().decode(rawPayload),
    );
  });

  test("CDN URL formatters and EAC SHA-256 integrity catalog verifier", () => {
    const chunkUrl = formatEgsChunkUrl("https://content.epicgames.com", "a1b2c3d4", "guid-1234");
    expect(chunkUrl).toBe("https://content.epicgames.com/ChunksV4/a1/guid-1234.chunk");

    const eacUrl = formatEacModuleUrl("DBXV2_TEST", "win64");
    expect(eacUrl).toBe("https://modules-cdn.eac-prod.on.epicgames.com/modules/dbxv2test/win64/eac_module.bin");

    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const entry = computeEacIntegrityEntry("Binaries/Win64/Game.exe", exeBytes);
    expect(
      verifyEacIntegrityCatalog([entry], { "Binaries/Win64/Game.exe": exeBytes }).valid,
    ).toBeTrue();
    expect(
      verifyEacIntegrityCatalog([entry], { "Binaries/Win64/Game.exe": new Uint8Array([0]) }).valid,
    ).toBeFalse();
  });
});
