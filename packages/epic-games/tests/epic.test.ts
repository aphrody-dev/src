// SPDX-License-Identifier: Apache-2.0
import { expect, test, describe } from "bun:test";
import {
  parsePakFooter,
  PAK_FILE_MAGIC,
  parseUAssetSummary,
  PACKAGE_FILE_TAG,
  parseEgsManifestHeader,
  EGS_MANIFEST_MAGIC,
  formatEgsChunkUrl,
  formatEacModuleUrl,
  getEpicBasicAuth,
} from "../src/index";

describe("Epic Games & Unreal Engine Sovereign SDK", () => {
  test("Basic Auth header formats client credentials", () => {
    const header = getEpicBasicAuth("test_client", "test_secret");
    expect(header.startsWith("Basic ")).toBeTrue();
    const decoded = Buffer.from(header.replace("Basic ", ""), "base64").toString("utf-8");
    expect(decoded).toBe("test_client:test_secret");
  });

  test("UAsset package summary parser extracts header tags", () => {
    const buffer = new Uint8Array(64);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, PACKAGE_FILE_TAG, true); // 0x9E2A83C1
    view.setInt32(4, -7, true); // legacy file version
    view.setInt32(12, 522, true); // UE4 version 522
    view.setInt32(16, 0, true); // UE5 version
    view.setInt32(28, 15, true); // nameCount
    view.setInt32(36, 3, true); // exportCount

    const summary = parseUAssetSummary(buffer);
    expect(summary.tag).toBe(PACKAGE_FILE_TAG);
    expect(summary.legacyFileVersion).toBe(-7);
    expect(summary.fileVersionUE4).toBe(522);
    expect(summary.nameCount).toBe(15);
    expect(summary.exportCount).toBe(3);
  });

  test("Pak footer parser detects PAK_FILE_MAGIC and index bounds", () => {
    const buffer = new Uint8Array(256);
    const view = new DataView(buffer.buffer);
    const magicPos = 200;

    view.setUint32(magicPos, PAK_FILE_MAGIC, true); // 0x5A6F12E1
    view.setUint32(magicPos + 4, 8, true); // version 8
    view.setBigUint64(magicPos + 8, 4096n, true); // indexOffset
    view.setBigUint64(magicPos + 16, 1024n, true); // indexSize

    const pak = parsePakFooter(buffer);
    expect(pak.magic).toBe(PAK_FILE_MAGIC);
    expect(pak.version).toBe(8);
    expect(pak.indexOffset).toBe(4096n);
    expect(pak.indexSize).toBe(1024n);
    expect(pak.isEncrypted).toBeFalse();
  });

  test("EGS manifest header parser validates version and compression", () => {
    const buffer = new Uint8Array(16);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, EGS_MANIFEST_MAGIC, true);
    view.setUint32(4, 256, true);
    buffer[8] = 1; // isCompressed
    view.setUint32(12, 3, true); // version 3

    const meta = parseEgsManifestHeader(buffer);
    expect(meta.magic).toBe(EGS_MANIFEST_MAGIC);
    expect(meta.headerSize).toBe(256);
    expect(meta.isCompressed).toBeTrue();
    expect(meta.version).toBe(3);
  });

  test("CDN URL formatters generate valid HTTPS endpoints", () => {
    const chunkUrl = formatEgsChunkUrl("https://content.epicgames.com", "a1b2c3d4", "guid-1234");
    expect(chunkUrl).toBe("https://content.epicgames.com/ChunksV4/a1/guid-1234.chunk");

    const eacUrl = formatEacModuleUrl("DBXV2_TEST", "win64");
    expect(eacUrl).toBe("https://modules-cdn.eac-prod.on.epicgames.com/modules/dbxv2test/win64/eac_module.bin");
  });
});
