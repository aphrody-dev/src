// Gaming forks of the monorepo: pins from src.lock.json (third_party/<name>), forks in aphrody-labs,
// variants as remotes and fork branches (one Wine, one Proton, one DXVK). List: docs/gaming/OWNERSHIP.md.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const GAMING_CHECKOUTS = [
  "Proton",
  "wine",
  "dxvk",
  "vkd3d-proton",
  "gamescope",
  "mesa",
  "Vulkan-Headers",
  "Vulkan-Loader",
  "Vulkan-ValidationLayers",
  "Vulkan-Tools",
  "SPIRV-Headers",
  "SPIRV-Tools",
  "SPIRV-Cross",
  "DirectX-Headers",
  "DirectXShaderCompiler",
  "bazzite",
  "steamos-manager",
  "steam-runtime-tools",
  "steam-devices",
  "GameNetworkingSockets",
  "umu-launcher",
  "MangoHud",
  "gamemode",
  "steamroom",
] as const;

export interface ForkPin {
  name: string;
  url: string | null;
  upstream: string | null;
  commit: string | null;
  branch: string | null;
  variants: string[];
}

export function forkPins(root: string): ForkPin[] {
  const lock = JSON.parse(readFileSync(join(root, "src.lock.json"), "utf8")) as {
    repositories: Record<string, { url?: string; upstream_url?: string; commit?: string; branch?: string; remotes?: Record<string, string> }>;
  };
  return GAMING_CHECKOUTS.map((name) => {
    const e = lock.repositories[`third_party/${name}`];
    return {
      name,
      url: e?.url ?? null,
      upstream: e?.upstream_url ?? null,
      commit: e?.commit ?? null,
      branch: e?.branch ?? null,
      variants: Object.keys(e?.remotes ?? {}).filter((r) => r !== "origin" && r !== "upstream"),
    };
  });
}
