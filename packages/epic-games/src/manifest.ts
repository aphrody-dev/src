// SPDX-License-Identifier: Apache-2.0
// Epic Games Store binary manifest (.manifest) parser

export const EGS_MANIFEST_MAGIC = 0x0B83C027;

export interface EgsManifestMeta {
  magic: number;
  headerSize: number;
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

/**
 * Parse an Epic Games Store .manifest header from a binary buffer
 */
export function parseEgsManifestHeader(buffer: Uint8Array): EgsManifestMeta {
  if (buffer.length < 16) {
    throw new Error("Buffer too short for EGS manifest header");
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const magic = view.getUint32(0, true);

  if (magic !== EGS_MANIFEST_MAGIC && magic !== 0x0B83C026) {
    throw new Error(`Invalid EGS manifest magic: 0x${magic.toString(16).toUpperCase()}`);
  }

  const headerSize = view.getUint32(4, true);
  const isCompressed = buffer[8] !== 0;
  const version = view.getUint32(12, true);

  return {
    magic,
    headerSize,
    isCompressed,
    version,
  };
}

/**
 * Format standard EGS chunk CDN URL
 */
export function formatEgsChunkUrl(cdnBaseUrl: string, hash: string, guid: string): string {
  const hashPrefix = hash.substring(0, 2);
  const cleanBase = cdnBaseUrl.replace(/\/+$/, "");
  return `${cleanBase}/ChunksV4/${hashPrefix}/${guid}.chunk`;
}
