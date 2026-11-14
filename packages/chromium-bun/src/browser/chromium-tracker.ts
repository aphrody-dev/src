// SPDX-License-Identifier: Apache-2.0
/**
 * @aphrody/chromium-bun — Chromium & Google Upstream Tracker, CEF Lock & Patch Matrix
 * Consolidated from `yolo-rs/yolo-web/packages/chromium-tracker`.
 */

export interface ChromiumChannelRelease {
  channel: "Stable" | "Beta" | "Dev" | "Canary";
  version: string;
  revision: string | number;
  milestone: number;
  hashes?: {
    chromium?: string;
    v8?: string;
    skia?: string;
    dawn?: string;
    angle?: string;
    webrtc?: string;
    devtools?: string;
    pdfium?: string;
  };
  time?: number;
}

export interface CefReleaseInfo {
  cefVersion: string;
  chromiumVersion: string;
  channel: string;
  sandboxCompat?: string;
  downloadUrl?: string;
}

export type CefPlatform =
  | "windows32"
  | "windows64"
  | "windowsarm64"
  | "linux32"
  | "linux64"
  | "linuxarm"
  | "linuxarm64"
  | "macosx64"
  | "macosarm64";

export function detectCefPlatform(
  os = process.platform,
  arch = process.arch,
): CefPlatform {
  const platforms: Partial<
    Record<
      typeof process.platform,
      Partial<Record<typeof process.arch, CefPlatform>>
    >
  > = {
    win32: { ia32: "windows32", x64: "windows64", arm64: "windowsarm64" },
    linux: {
      ia32: "linux32",
      x64: "linux64",
      arm: "linuxarm",
      arm64: "linuxarm64",
    },
    darwin: { x64: "macosx64", arm64: "macosarm64" },
  };
  const platform = platforms[os]?.[arch];
  if (!platform) {
    throw new Error(
      `CEF does not publish a supported build for ${os}/${arch}.`,
    );
  }
  return platform;
}

export interface CefIndexFile {
  type: string;
  name: string;
  sha1: string;
  size?: number;
  last_modified?: string;
}

export interface CefIndexVersion {
  cef_version: string;
  chromium_version: string;
  channel: string;
  sandbox_compat?: string;
  files?: CefIndexFile[];
}

export type CefIndex = Partial<
  Record<CefPlatform, { versions: CefIndexVersion[] }>
>;

export interface DownstreamBrowserRelease {
  project: "Brave" | "Helium";
  tag: string;
  title: string;
  targetChromiumVersion: string;
  repoUrl: string;
  publishedAt?: string;
}

export interface DepotToolsStatus {
  latestCommit: string;
  author: string;
  message: string;
  repoUrl: string;
}

export interface ChromiumPatchSpec {
  id: string;
  targetSubsystem: "v8" | "content" | "net" | "chrome" | "blink" | "cdp";
  name: string;
  description: string;
  upstreamFile: string;
  patchStrategy:
    | "chromium_src_override"
    | "cxx_subclass"
    | "preprocessor_hook"
    | "deno_v8_binding";
  status: "proposal" | "applied";
}

export function compareDottedVersions(left: string, right: string): number {
  const parse = (version: string) => {
    if (!/^\d+(?:\.\d+)*$/.test(version)) {
      throw new Error(`Invalid dotted version: ${version}`);
    }
    return version.split(".").map(Number);
  };
  const a = parse(left);
  const b = parse(right);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export class ChromiumTrackingEngine {
  private static CFT_URL =
    "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json";
  private static CHROMIUM_DASH_URL =
    "https://chromiumdash.appspot.com/fetch_releases";
  private static CEF_INDEX_URL = "https://cef-builds.spotifycdn.com/index.json";
  private static DEPOT_TOOLS_LOG_URL =
    "https://chromium.googlesource.com/chromium/tools/depot_tools/+log?format=JSON&n=1";

  async fetchChromiumChannels(): Promise<
    Record<string, ChromiumChannelRelease>
  > {
    const res = await fetch(ChromiumTrackingEngine.CFT_URL);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch Chrome for Testing channels: ${res.statusText}`,
      );
    }
    const data = (await res.json()) as {
      channels: Record<
        string,
        { channel: string; version: string; revision: string }
      >;
    };

    if (!data?.channels || typeof data.channels !== "object") {
      throw new Error(
        "Invalid Chrome for Testing response: missing channels map",
      );
    }

    const results: Record<string, ChromiumChannelRelease> = {};
    for (const [key, ch] of Object.entries(data.channels)) {
      if (!["Stable", "Beta", "Dev", "Canary"].includes(key)) continue;
      if (
        !ch ||
        typeof ch.version !== "string" ||
        !/^\d+(?:\.\d+){3}$/.test(ch.version) ||
        typeof ch.revision !== "string"
      ) {
        throw new Error(`Invalid Chrome for Testing release entry: ${key}`);
      }
      const milestone = Number(ch.version.split(".")[0]);
      results[key] = {
        channel: key as ChromiumChannelRelease["channel"],
        version: ch.version,
        revision: ch.revision,
        milestone,
      };
    }
    return results;
  }

  async fetchChannelDetails(
    channel: "Stable" | "Canary" = "Stable",
    timeoutMs = 2500,
  ): Promise<ChromiumChannelRelease> {
    const url = `${ChromiumTrackingEngine.CHROMIUM_DASH_URL}?channel=${channel}&platform=Windows&num=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch ChromiumDash details for ${channel}: ${res.statusText}`,
        );
      }
      const list = (await res.json()) as Array<{
        channel: string;
        version: string;
        milestone: number;
        chromium_main_branch_position: number;
        hashes: ChromiumChannelRelease["hashes"];
        time: number;
      }>;

      const item = list?.[0];
      if (
        !item ||
        typeof item.version !== "string" ||
        !/^\d+(?:\.\d+){3}$/.test(item.version) ||
        typeof item.milestone !== "number" ||
        typeof item.chromium_main_branch_position !== "number"
      ) {
        throw new Error(`Invalid ChromiumDash release entry for ${channel}`);
      }
      return {
        channel,
        version: item.version,
        milestone: item.milestone,
        revision: item.chromium_main_branch_position,
        hashes: item.hashes,
        time: item.time,
      };
    } catch (error) {
      clearTimeout(timer);
      throw new Error(`Unable to fetch ChromiumDash details for ${channel}`, {
        cause: error,
      });
    }
  }

  async fetchCefIndex(): Promise<CefIndex> {
    const res = await fetch(ChromiumTrackingEngine.CEF_INDEX_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch CEF index: ${res.statusText}`);
    }
    const index = (await res.json()) as CefIndex;
    if (!index || typeof index !== "object" || Array.isArray(index)) {
      throw new Error("Invalid CEF index response: expected a platform map");
    }
    return index;
  }

  async fetchLatestCef(
    platform: CefPlatform = detectCefPlatform(),
  ): Promise<CefReleaseInfo> {
    const index = await this.fetchCefIndex();
    const plat = index[platform];
    if (!plat?.versions?.length) {
      throw new Error(`No CEF versions found for platform ${platform}`);
    }

    const latest = [...plat.versions].sort((a, b) =>
      compareDottedVersions(b.chromium_version, a.chromium_version),
    )[0];
    if (!latest) {
      throw new Error(`No valid CEF release found for platform ${platform}`);
    }

    return {
      cefVersion: latest.cef_version,
      chromiumVersion: latest.chromium_version,
      channel: latest.channel,
      sandboxCompat: latest.sandbox_compat,
      downloadUrl: `https://cef-builds.spotifycdn.com/cef_binary_${latest.cef_version}_${platform}_minimal.tar.bz2`,
    };
  }

  async fetchDepotToolsStatus(): Promise<DepotToolsStatus> {
    const res = await fetch(ChromiumTrackingEngine.DEPOT_TOOLS_LOG_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch depot_tools log: ${res.statusText}`);
    }
    const raw = await res.text();
    const clean = raw.startsWith(")]}'") ? raw.slice(4).trim() : raw.trim();
    const data = JSON.parse(clean) as {
      log: Array<{
        commit: string;
        author: { name: string; email: string };
        message: string;
      }>;
    };

    const latest = data.log?.[0];
    if (!latest) throw new Error("No commits returned from depot_tools log");
    return {
      latestCommit: latest.commit,
      author: `${latest.author.name} <${latest.author.email}>`,
      message: latest.message.split("\n", 1)[0] ?? latest.message,
      repoUrl:
        "https://chromium.googlesource.com/chromium/tools/depot_tools.git",
    };
  }

  getPatchProposals(): ChromiumPatchSpec[] {
    return [
      {
        id: "aphrody-webdriver-mask",
        targetSubsystem: "blink",
        name: "Navigator.webdriver Hardware Mask",
        description:
          "Enforces undefined for navigator.webdriver on standard execution contexts without breaking automation controls",
        upstreamFile: "third_party/blink/renderer/core/frame/navigator.cc",
        patchStrategy: "chromium_src_override",
        status: "applied",
      },
      {
        id: "aphrody-client-hints-align",
        targetSubsystem: "chrome",
        name: "Chromium 157+ Desktop Client Hints Alignment",
        description:
          "Harmonizes sec-ch-ua brand array and sec-ch-ua-platform with native host Windows 11 / Linux",
        upstreamFile: "chrome/browser/profiles/profile.h",
        patchStrategy: "cxx_subclass",
        status: "applied",
      },
      {
        id: "aphrody-v8-isolate-zero-leak",
        targetSubsystem: "v8",
        name: "V8 Isolate Context Separation & Zero Host Leakage",
        description:
          "Enforces strict isolation between Bun JSC host environment and guest V8 contexts",
        upstreamFile: "src/corelib/src/web.rs",
        patchStrategy: "deno_v8_binding",
        status: "applied",
      },
      {
        id: "aphrody-shields-intercept",
        targetSubsystem: "net",
        name: "Sovereign AdBlock & Cosmetic Filter Native Hook",
        description:
          "Hooks URL request stream to filter trackers with SovereignAdblockEngine and strip cosmetic banners",
        upstreamFile: "src/corelib/src/web.rs",
        patchStrategy: "preprocessor_hook",
        status: "applied",
      },
      {
        id: "aphrody-servo-stylo-geometry",
        targetSubsystem: "content",
        name: "Servo Stylo CSS & Euclid Geometry Accelerator",
        description:
          "Provides parallel CSS selector matching and sub-pixel DOM bounds calculation",
        upstreamFile: "third_party/taffy/src/lib.rs",
        patchStrategy: "cxx_subclass",
        status: "applied",
      },
    ];
  }
}
