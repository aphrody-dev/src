// SPDX-License-Identifier: Apache-2.0
// Unreal Engine .uasset package summary parser

export const PACKAGE_FILE_TAG = 0x9E2A83C1;

export interface UAssetSummary {
  tag: number;
  legacyFileVersion: number;
  fileVersionUE4: number;
  fileVersionUE5: number;
  totalHeaderSize: number;
  nameCount: number;
  nameOffset: number;
  exportCount: number;
  exportOffset: number;
  importCount: number;
  importOffset: number;
}

/**
 * Parse Unreal Engine package summary from the start of a .uasset file
 */
export function parseUAssetSummary(buffer: Uint8Array): UAssetSummary {
  if (buffer.length < 32) {
    throw new Error("Buffer too short for UAsset summary");
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const tag = view.getUint32(0, true);

  if (tag !== PACKAGE_FILE_TAG) {
    throw new Error(`Invalid PACKAGE_FILE_TAG: expected 0x9E2A83C1, got 0x${tag.toString(16).toUpperCase()}`);
  }

  const legacyFileVersion = view.getInt32(4, true);
  const fileVersionUE4 = view.getInt32(12, true);
  const fileVersionUE5 = view.getInt32(16, true);
  const totalHeaderSize = buffer.length >= 24 ? view.getInt32(20, true) : 0;

  let nameCount = 0;
  let nameOffset = 0;
  let exportCount = 0;
  let exportOffset = 0;
  let importCount = 0;
  let importOffset = 0;

  if (buffer.length >= 52) {
    nameCount = view.getInt32(28, true);
    nameOffset = view.getInt32(32, true);
    exportCount = view.getInt32(36, true);
    exportOffset = view.getInt32(40, true);
    importCount = view.getInt32(44, true);
    importOffset = view.getInt32(48, true);
  }

  return {
    tag,
    legacyFileVersion,
    fileVersionUE4,
    fileVersionUE5,
    totalHeaderSize,
    nameCount,
    nameOffset,
    exportCount,
    exportOffset,
    importCount,
    importOffset,
  };
}
