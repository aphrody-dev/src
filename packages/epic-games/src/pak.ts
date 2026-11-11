// SPDX-License-Identifier: Apache-2.0
// Unreal Engine .pak archive reader & FPakInfo parser

export const PAK_FILE_MAGIC = 0x5A6F12E1;

export interface PakInfoSummary {
  magic: number;
  version: number;
  indexOffset: bigint;
  indexSize: bigint;
  isEncrypted: boolean;
  encryptionKeyGuid: string;
}

/**
 * Parse Unreal Engine FPakInfo footer from the trailing bytes of a .pak file
 */
export function parsePakFooter(buffer: Uint8Array): PakInfoSummary {
  if (buffer.length < 44) {
    throw new Error("Buffer too short for FPakInfo");
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Search backwards for PAK_FILE_MAGIC (0x5A6F12E1) in the trailing 256 bytes
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
    isEncrypted,
    encryptionKeyGuid,
  };
}
