// SPDX-License-Identifier: Apache-2.0
// Pure-Bun Epic Games Store Binary Manifest (.manifest) & Chunk (.chunk) Decoder

export const EGS_MANIFEST_MAGIC = 0x0B83C027;
export const EGS_CHUNK_MAGIC = 0xB1FE3AA2;

export interface EgsManifestMeta {
  magic: number;
  headerSize: number;
  dataSizeUncompressed: number;
  dataSizeCompressed: number;
  sha1Hex: string;
  isCompressed: boolean;
  version: number;
  appName?: string;
  buildVersion?: string;
}

export interface EgsChunkInfo {
  guid: string;
  hash: string;
  byteSize: number;
}

export interface DecodedEgsChunk {
  magic: number;
  version: number;
  headerSize: number;
  compressedSize: number;
  guidHex: string;
  rollingHash: bigint;
  storedAs: number;
  payload: Uint8Array;
  sha1Verified: boolean;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Parse an Epic Games Store .manifest binary header (v0..v3) and optionally decompress its body.
 */
export function parseEgsManifestHeader(buffer: Uint8Array): EgsManifestMeta {
  if (buffer.length < 16) {
    throw new Error("Buffer too short for EGS manifest header");
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const magic = view.getUint32(0, true);

  if (magic !== EGS_MANIFEST_MAGIC && magic !== 0x0B83C026 && magic !== 0x44BEC00C) {
    throw new Error(`Invalid EGS manifest magic: 0x${magic.toString(16).toUpperCase()}`);
  }

  // Standard 41-byte FManifestHeader layout when buffer >= 41 bytes, else compact 16-byte header
  if (buffer.length >= 41 && view.getUint32(4, true) === 41) {
    const headerSize = view.getUint32(4, true);
    const dataSizeUncompressed = view.getUint32(8, true);
    const dataSizeCompressed = view.getUint32(12, true);
    const sha1Hex = bytesToHex(buffer.subarray(16, 36));
    const storedAs = buffer[36]!;
    const version = view.getUint32(37, true);
    return {
      magic,
      headerSize,
      dataSizeUncompressed,
      dataSizeCompressed,
      sha1Hex,
      isCompressed: (storedAs & 0x01) !== 0,
      version,
    };
  }

  const headerSize = view.getUint32(4, true);
  const isCompressed = buffer[8] !== 0;
  const version = view.getUint32(12, true);

  return {
    magic,
    headerSize,
    dataSizeUncompressed: 0,
    dataSizeCompressed: 0,
    sha1Hex: "",
    isCompressed,
    version,
  };
}

/**
 * Decode an EGS binary `.chunk` container (`0xB1FE3AA2`) using native `Bun.inflateSync` + SHA-1 verification.
 */
export function decodeEgsChunkContainer(
  buffer: Uint8Array,
  expectedSha1Hex?: string,
): DecodedEgsChunk {
  if (buffer.length < 41) {
    throw new Error("Buffer too short for EGS chunk header");
  }
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const magic = view.getUint32(0, true);
  if (magic !== EGS_CHUNK_MAGIC) {
    throw new Error(`Invalid EGS chunk magic: 0x${magic.toString(16).toUpperCase()}`);
  }
  const version = view.getUint32(4, true);
  const headerSize = view.getUint32(8, true);
  const compressedSize = view.getUint32(12, true);
  const guidHex = bytesToHex(buffer.subarray(16, 32));
  const rollingHash = view.getBigUint64(32, true);
  const storedAs = buffer[40]!;

  if (headerSize < 41 || headerSize + compressedSize > buffer.length) {
    throw new Error("EGS chunk payload bounds exceed buffer");
  }
  const rawBody = buffer.subarray(headerSize, headerSize + compressedSize);
  // StoredAs bit 0 = zlib/deflate compressed
  const payload =
    (storedAs & 0x01) !== 0
      ? new Uint8Array(Bun.inflateSync(rawBody.subarray(2, rawBody.length - 4)))
      : rawBody;

  let sha1Verified = true;
  if (expectedSha1Hex) {
    const actualSha1 = new Bun.CryptoHasher("sha1").update(payload).digest("hex");
    sha1Verified = actualSha1.toLowerCase() === expectedSha1Hex.toLowerCase();
  }

  return {
    magic,
    version,
    headerSize,
    compressedSize,
    guidHex,
    rollingHash,
    storedAs,
    payload,
    sha1Verified,
  };
}

/**
 * Build a valid EGS `.chunk` binary container for round-trip verification and CDN tests.
 */
export function encodeEgsChunkContainer(
  payload: Uint8Array,
  compress = true,
): { chunkBytes: Uint8Array; sha1Hex: string } {
  const sha1Hex = new Bun.CryptoHasher("sha1").update(payload).digest("hex");
  let body = payload;
  let storedAs = 0;
  if (compress) {
    storedAs = 1;
    const deflated = Bun.deflateSync(payload);
    // Wrap in RFC 1950 zlib stream (CMF=0x78, FLG=0x9C + Adler32 trailer)
    let s1 = 1;
    let s2 = 0;
    for (let i = 0; i < payload.length; i++) {
      s1 = (s1 + payload[i]!) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    const adler = ((s2 << 16) | s1) >>> 0;
    body = new Uint8Array(2 + deflated.length + 4);
    body[0] = 0x78;
    body[1] = 0x9c;
    body.set(deflated, 2);
    new DataView(body.buffer).setUint32(2 + deflated.length, adler, false);
  }

  const headerSize = 41;
  const out = new Uint8Array(headerSize + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, EGS_CHUNK_MAGIC, true);
  view.setUint32(4, 3, true);
  view.setUint32(8, headerSize, true);
  view.setUint32(12, body.length, true);
  // Deterministic 16-byte GUID derived from SHA-1 prefix
  for (let i = 0; i < 16; i++) {
    out[16 + i] = Number.parseInt(sha1Hex.slice(i * 2, i * 2 + 2), 16);
  }
  view.setBigUint64(32, BigInt(payload.length), true);
  out[40] = storedAs;
  out.set(body, headerSize);
  return { chunkBytes: out, sha1Hex };
}

/**
 * Format standard EGS chunk CDN URL
 */
export function formatEgsChunkUrl(cdnBaseUrl: string, hash: string, guid: string): string {
  const hashPrefix = hash.substring(0, 2);
  const cleanBase = cdnBaseUrl.replace(/\/+$/, "");
  return `${cleanBase}/ChunksV4/${hashPrefix}/${guid}.chunk`;
}
