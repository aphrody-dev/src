/**
 * Google Play Store & Android APK Pipeline Driver
 * Inspired by apkeep / gplaycli / Aurora Store / adb install workflows
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const PLAYSTORE_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "play-termux",
    name: "com.termux",
    ecosystem: "playstore",
    version: "0.118.1",
    description:
      "Termux combines powerful terminal emulation with an extensive Linux package collection",
    author: "Fredrik Fornwall",
    category: "Tools & Productivity",
    stars: 28000,
    installCmd: "adb install com.termux.apk || apkeep -a com.termux .",
    runCmd: "am start -n com.termux/.app.TermuxActivity",
    sandboxed: true,
    tags: ["android", "terminal", "linux", "playstore"],
  },
  {
    id: "play-chrome",
    name: "com.android.chrome",
    ecosystem: "playstore",
    version: "133.0.0",
    description:
      "Fast, simple, and secure Google Chrome web browser for Android devices",
    author: "Google LLC",
    category: "Communication",
    stars: 180000,
    installCmd: "apkeep -a com.android.chrome .",
    runCmd:
      "am start -n com.android.chrome/com.google.android.apps.chrome.Main",
    sandboxed: true,
    tags: ["chrome", "google", "browser", "playstore"],
  },
  {
    id: "play-vlc-android",
    name: "org.videolan.vlc",
    ecosystem: "playstore",
    version: "3.5.4",
    description:
      "VLC media player for Android can play any video and audio files, network streams and DVD ISOs",
    author: "Videolabs",
    category: "Media & Video",
    stars: 45000,
    installCmd: "adb install org.videolan.vlc.apk",
    runCmd: "am start -n org.videolan.vlc/.gui.MainActivity",
    sandboxed: true,
    tags: ["media", "video", "player", "playstore"],
  },
];

export async function searchPlayStorePackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.toLowerCase().trim();
  if (!q) return PLAYSTORE_CURATED_PACKAGES;
  return PLAYSTORE_CURATED_PACKAGES.filter(
    (p) => p.name.includes(q) || p.description.toLowerCase().includes(q),
  );
}
