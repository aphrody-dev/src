// SPDX-License-Identifier: Apache-2.0
// Easy Anti-Cheat (EAC) CDN endpoints and installation audit

export const EAC_MODULES_CDN_BASE = "https://modules-cdn.eac-prod.on.epicgames.com/modules";

export interface EacGameConfig {
  gameId: string;
  executable: string;
  parameters?: string;
  useOodle?: boolean;
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
    executable: data.executable || "",
    parameters: data.parameters,
    useOodle: data.use_oodle ?? false,
  };
}
