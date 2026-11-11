// SPDX-License-Identifier: Apache-2.0
// Easy Anti-Cheat (EAC) CDN endpoints, Settings.json parser, and integrity catalog verifier

export const EAC_MODULES_CDN_BASE = "https://modules-cdn.eac-prod.on.epicgames.com/modules";

export interface EacGameConfig {
  gameId: string;
  deploymentId?: string;
  sandboxId?: string;
  executable: string;
  parameters?: string;
  useOodle?: boolean;
}

export interface EacIntegrityEntry {
  relativePath: string;
  sha256Hex: string;
  byteLength: number;
}

/**
 * Format official EAC client module download URL
 */
export function formatEacModuleUrl(gameGuid: string, platform = "win64"): string {
  const cleanGuid = gameGuid.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${EAC_MODULES_CDN_BASE}/${cleanGuid}/${platform}/eac_module.bin`;
}

/**
 * Parse standard EasyAntiCheat Settings.json
 */
export function parseEacSettings(jsonContent: string): EacGameConfig {
  const data = JSON.parse(jsonContent);
  return {
    gameId: data.productid || data.game_id || "",
    deploymentId: data.deploymentid || undefined,
    sandboxId: data.sandboxid || undefined,
    executable: data.executable || "",
    parameters: data.parameters,
    useOodle: data.use_oodle ?? false,
  };
}

/**
 * Compute deterministic EAC SHA-256 file integrity manifest entry for an executable or asset buffer.
 */
export function computeEacIntegrityEntry(
  relativePath: string,
  bytes: Uint8Array,
): EacIntegrityEntry {
  const sha256Hex = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  return {
    relativePath: relativePath.replace(/\\/g, "/"),
    sha256Hex,
    byteLength: bytes.byteLength,
  };
}

/**
 * Verify a map of local file buffers against an EAC integrity catalog.
 */
export function verifyEacIntegrityCatalog(
  entries: readonly EacIntegrityEntry[],
  files: Readonly<Record<string, Uint8Array>>,
): { valid: boolean; mismatches: string[] } {
  const mismatches: string[] = [];
  for (const entry of entries) {
    const actual = files[entry.relativePath];
    if (!actual) {
      mismatches.push(`missing:${entry.relativePath}`);
      continue;
    }
    if (actual.byteLength !== entry.byteLength) {
      mismatches.push(`size:${entry.relativePath}`);
      continue;
    }
    const digest = new Bun.CryptoHasher("sha256").update(actual).digest("hex");
    if (digest !== entry.sha256Hex.toLowerCase()) {
      mismatches.push(`hash:${entry.relativePath}`);
    }
  }
  return { valid: mismatches.length === 0, mismatches };
}
