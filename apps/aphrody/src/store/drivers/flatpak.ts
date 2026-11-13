/**
 * Flatpak & Flathub Driver
 * Integrates Flathub API v2 with sandboxed application manifests
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const FLATPAK_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "flatpak-obs-studio",
    name: "com.obsproject.Studio",
    ecosystem: "flatpak",
    version: "31.0.0",
    description:
      "Free and open source software for video recording and live streaming",
    author: "OBS Project",
    category: "Audio & Video",
    stars: 56000,
    installCmd: "flatpak install flathub com.obsproject.Studio -y",
    runCmd: "flatpak run com.obsproject.Studio",
    sandboxed: true,
    tags: ["flatpak", "flathub", "video", "streaming", "sandbox"],
  },
  {
    id: "flatpak-blender",
    name: "org.blender.Blender",
    ecosystem: "flatpak",
    version: "4.3.2",
    description:
      "Free and open source 3D creation suite supporting modeling, rigging, animation and simulation",
    author: "Blender Foundation",
    category: "Graphics & 3D",
    stars: 108000,
    installCmd: "flatpak install flathub org.blender.Blender -y",
    runCmd: "flatpak run org.blender.Blender",
    sandboxed: true,
    tags: ["flatpak", "3d", "blender", "creative", "sandbox"],
  },
  {
    id: "flatpak-vlc",
    name: "org.videolan.VLC",
    ecosystem: "flatpak",
    version: "3.0.21",
    description:
      "VLC is a free and open source cross-platform multimedia player and framework",
    author: "VideoLAN",
    category: "Audio & Video",
    stars: 12000,
    installCmd: "flatpak install flathub org.videolan.VLC -y",
    runCmd: "flatpak run org.videolan.VLC",
    sandboxed: true,
    tags: ["flatpak", "media", "player", "sandbox"],
  },
];

export async function searchFlatpakPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.trim();
  if (!q) return FLATPAK_CURATED_PACKAGES;

  try {
    const url = `https://flathub.org/api/v2/search?query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data.hits)) {
        return data.hits.slice(0, 15).map((h: any) => ({
          id: `flatpak-${h.app_id}`,
          name: h.app_id,
          ecosystem: "flatpak" as const,
          version: h.current_release_version || "1.0.0",
          description: h.summary || "Flathub Sandboxed App",
          author: h.developer_name || "Flathub Publisher",
          category: h.categories?.[0] || "Applications",
          stars: 100,
          installCmd: `flatpak install flathub ${h.app_id} -y`,
          runCmd: `flatpak run ${h.app_id}`,
          sandboxed: true,
          tags: ["flathub", "flatpak", "sandboxed"],
        }));
      }
    }
  } catch (e) {
    // Fallback to curated
  }

  return FLATPAK_CURATED_PACKAGES.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()),
  );
}
