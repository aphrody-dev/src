/**
 * Arch User Repository (AUR) RPC v5 & Pacman / CachyOS Driver
 * Queries official https://aur.archlinux.org/rpc/v5/search/... with offline resilience
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const AUR_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "aur-cachyos-kernel",
    name: "linux-cachyos",
    ecosystem: "aur",
    version: "6.13.0",
    description:
      "Linux CachyOS kernel with BORE scheduler, BBRv3 and x86-64-v3 / v4 microarchitectural optimizations",
    author: "CachyOS Team",
    category: "Kernel / OS",
    stars: 840,
    installCmd: "paru -S linux-cachyos linux-cachyos-headers",
    runCmd: "uname -r",
    sandboxed: false,
    tags: ["cachyos", "kernel", "arch", "performance"],
  },
  {
    id: "aur-bun-bin",
    name: "bun-bin",
    ecosystem: "aur",
    version: "1.4.4",
    description:
      "The all-in-one JavaScript & TypeScript runtime (official binary package)",
    author: "Jarred Sumner / Oven",
    category: "Runtime / Toolchain",
    stars: 1250,
    installCmd: "yay -S bun-bin",
    runCmd: "bun -v",
    sandboxed: false,
    tags: ["bun", "runtime", "javascript"],
  },
  {
    id: "aur-hyprland-git",
    name: "hyprland-git",
    ecosystem: "aur",
    version: "0.47.0.r1",
    description:
      "Dynamic tiling Wayland compositor with authentic smooth animations and GPU acceleration",
    author: "Vaxry",
    category: "Wayland / Compositor",
    stars: 3200,
    installCmd: "yay -S hyprland-git",
    runCmd: "Hyprland",
    sandboxed: false,
    tags: ["wayland", "hyprland", "gui", "compositor"],
  },
];

export async function searchAurPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.trim();
  if (!q) return AUR_CURATED_PACKAGES;

  // Attempt live AUR RPC v5 query with timeout
  try {
    const url = `https://aur.archlinux.org/rpc/v5/search/${encodeURIComponent(q)}?by=name`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && Array.isArray(data.results)) {
        return data.results.slice(0, 15).map((r: any) => ({
          id: `aur-${r.Name}`,
          name: r.Name,
          ecosystem: "aur",
          version: r.Version || "1.0.0",
          description: r.Description || "AUR Package",
          author: r.Maintainer || "Unknown",
          repoUrl: r.URL || `https://aur.archlinux.org/packages/${r.Name}`,
          category: r.NumVotes > 50 ? "Popular" : "AUR",
          stars: r.NumVotes || 0,
          installCmd: `yay -S ${r.Name}`,
          sandboxed: false,
          tags: ["aur", "archlinux", "pacman"],
        }));
      }
    }
  } catch (e) {
    // Network fallback to curated list
  }

  return AUR_CURATED_PACKAGES.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()),
  );
}
