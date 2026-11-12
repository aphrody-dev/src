// SPDX-License-Identifier: Apache-2.0
// Unreal Engine .pak archive reader, FPakInfo footer & FPakEntry record parser

export const PAK_FILE_MAGIC = 0x5a6f12e1;

export interface PakInfoSummary {
  magic: number;
  version: number;
  indexOffset: bigint;
  indexSize: bigint;
  indexSha1Hex: string;
  isEncrypted: boolean;
  encryptionKeyGuid: string;
}

export interface PakEntryRecord {
  filename: string;
  offset: bigint;
  compressedSize: bigint;
  uncompressedSize: bigint;
  compressionMethodIndex: number;
  sha1Hex: string;
  isEncrypted: boolean;
}

/**
 * Compute Unreal Engine FNV-1a 64-bit path hash used by .pak v10+ path hash indexes.
 */
export function computeUnrealPakPathHash64(relPath: string): bigint {
  const normalized = relPath.replace(/\\/g, "/").toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x00000100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= BigInt(bytes[i]!);
    hash = (hash * prime) & mask;
  }
  return hash;
}

/**
 * Read a length-prefixed Unreal FString (ASCII/UTF-8 or UTF-16LE when negative length).
 */
export function readUnrealFString(
  buffer: Uint8Array,
  offset: number,
): { value: string; nextOffset: number } {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const rawLen = view.getInt32(offset, true);
  let cursor = offset + 4;
  if (rawLen === 0) return { value: "", nextOffset: cursor };
  if (rawLen > 0) {
    const slice = buffer.subarray(cursor, cursor + rawLen);
    const end = slice[slice.length - 1] === 0 ? slice.length - 1 : slice.length;
    return {
      value: new TextDecoder("utf-8").decode(slice.subarray(0, end)),
      nextOffset: cursor + rawLen,
    };
  }
  const charCount = -rawLen;
  const byteCount = charCount * 2;
  const slice = buffer.subarray(cursor, cursor + byteCount);
  const end =
    slice.length >= 2 &&
    slice[slice.length - 2] === 0 &&
    slice[slice.length - 1] === 0
      ? slice.length - 2
      : slice.length;
  return {
    value: new TextDecoder("utf-16le").decode(slice.subarray(0, end)),
    nextOffset: cursor + byteCount,
  };
}

/**
 * Parse Unreal Engine FPakInfo footer from the trailing bytes of a .pak file
 */
export function parsePakFooter(buffer: Uint8Array): PakInfoSummary {
  if (buffer.length < 44) {
    throw new Error("Buffer too short for FPakInfo");
  }

  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const searchStart = Math.max(0, buffer.length - 256);
  let magicPos = -1;

  for (let i = buffer.length - 4; i >= searchStart; i--) {
    if (view.getUint32(i, true) === PAK_FILE_MAGIC) {
      magicPos = i;
      break;
    }
  }

  if (magicPos === -1) {
    throw new Error("PAK_FILE_MAGIC (0x5A6F12E1) not found in footer");
  }

  const version = view.getUint32(magicPos + 4, true);
  const indexOffset = view.getBigUint64(magicPos + 8, true);
  const indexSize = view.getBigUint64(magicPos + 16, true);
  const sha1Slice =
    magicPos + 44 <= buffer.length
      ? buffer.subarray(magicPos + 24, magicPos + 44)
      : new Uint8Array(20);
  const indexSha1Hex = Array.from(sha1Slice)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isEncrypted = magicPos >= 1 ? buffer[magicPos - 1] !== 0 : false;

  let encryptionKeyGuid = "00000000-0000-0000-0000-000000000000";
  if (magicPos >= 17) {
    const guidBytes = buffer.slice(magicPos - 17, magicPos - 1);
    encryptionKeyGuid = Array.from(guidBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return {
    magic: PAK_FILE_MAGIC,
    version,
    indexOffset,
    indexSize,
    indexSha1Hex,
    isEncrypted,
    encryptionKeyGuid,
  };
}

/**
 * Parse an unencrypted Unreal .pak v8 legacy directory index (MountPoint + RecordCount + FPakEntry[]).
 */
export function parsePakLegacyIndex(indexBuffer: Uint8Array): {
  mountPoint: string;
  entries: PakEntryRecord[];
} {
  const mp = readUnrealFString(indexBuffer, 0);
  const view = new DataView(
    indexBuffer.buffer,
    indexBuffer.byteOffset,
    indexBuffer.byteLength,
  );
  const count = view.getInt32(mp.nextOffset, true);
  let cursor = mp.nextOffset + 4;
  const entries: PakEntryRecord[] = [];

  for (let i = 0; i < count; i++) {
    const fn = readUnrealFString(indexBuffer, cursor);
    cursor = fn.nextOffset;
    const offset = view.getBigUint64(cursor, true);
    const compressedSize = view.getBigUint64(cursor + 8, true);
    const uncompressedSize = view.getBigUint64(cursor + 16, true);
    const compressionMethodIndex = view.getUint32(cursor + 24, true);
    const sha1Slice = indexBuffer.subarray(cursor + 28, cursor + 48);
    const sha1Hex = Array.from(sha1Slice)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    cursor += 48;
    if (compressionMethodIndex !== 0) {
      const blockCount = view.getInt32(cursor, true);
      cursor += 4 + blockCount * 16;
    }
    const isEncrypted = indexBuffer[cursor] !== 0;
    cursor += 5; // 1 byte encrypted flag + 4 bytes compressionBlockSize

    entries.push({
      filename: fn.value,
      offset,
      compressedSize,
      uncompressedSize,
      compressionMethodIndex,
      sha1Hex,
      isEncrypted,
    });
  }

  return { mountPoint: mp.value, entries };
}
