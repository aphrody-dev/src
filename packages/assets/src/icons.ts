// Real product icons: the favicon / apple-touch-icon each vendor publishes on its own site.
// Nominative use only, to identify the real products; not Aphrody branding. Origin URL, owner and sha256 go to
// assets/library/icons/vendors/index.json; ATTRIBUTION.md gets a trademark section from it.
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { optimize as svgo } from "svgo";
import { hashBytes } from "./util.ts";

export interface Vendor {
  id: string;
  name: string;
  owner: string;
  site: string;
  /** Page whose <link rel=icon> is read; defaults to site. */
  page?: string;
  /** Direct icon URL when the site publishes none in its markup (project repository icon). */
  icon?: string;
}

export const VENDORS: Vendor[] = [
  {
    id: "steam",
    name: "Steam",
    owner: "Valve Corporation",
    site: "https://store.steampowered.com",
  },
  {
    id: "xbox",
    name: "Xbox",
    owner: "Microsoft Corporation",
    site: "https://www.xbox.com",
  },
  {
    id: "playstation",
    name: "PlayStation",
    owner: "Sony Interactive Entertainment",
    site: "https://www.playstation.com",
  },
  {
    id: "epic",
    name: "Epic Games",
    owner: "Epic Games, Inc.",
    site: "https://www.epicgames.com",
  },
  {
    id: "gog",
    name: "GOG",
    owner: "GOG sp. z o.o.",
    site: "https://www.gog.com",
  },
  {
    id: "fdroid",
    name: "F-Droid",
    owner: "F-Droid Limited and contributors",
    site: "https://f-droid.org",
  },
  {
    id: "googleplay",
    name: "Google Play",
    owner: "Google LLC",
    site: "https://play.google.com",
  },
  {
    id: "bevy",
    name: "Bevy",
    owner: "Bevy Foundation",
    site: "https://bevy.org",
  },
  {
    id: "artcraft",
    name: "ArtCraft",
    owner: "storytold",
    site: "https://github.com/storytold/artcraft",
    icon: "https://raw.githubusercontent.com/storytold/artcraft/main/crates/desktop/artcraft/icons/128x128%402x.png",
  },
  {
    id: "nintendo",
    name: "Nintendo",
    owner: "Nintendo Co., Ltd.",
    site: "https://www.nintendo.com",
  },
  { id: "itch", name: "itch.io", owner: "itch corp", site: "https://itch.io" },
  {
    id: "flathub",
    name: "Flathub",
    owner: "Flathub contributors",
    site: "https://flathub.org",
  },
  {
    id: "winget",
    name: "winget",
    owner: "Microsoft Corporation",
    site: "https://learn.microsoft.com/windows/package-manager/",
  },
  {
    id: "alpine",
    name: "Alpine Linux",
    owner: "Alpine Linux Development Team",
    site: "https://alpinelinux.org",
  },
  {
    id: "ruffle",
    name: "Ruffle",
    owner: "Ruffle contributors",
    site: "https://ruffle.rs",
  },
  {
    id: "unreal",
    name: "Unreal Engine",
    owner: "Epic Games, Inc.",
    site: "https://www.unrealengine.com",
  },
  {
    id: "github",
    name: "GitHub",
    owner: "GitHub, Inc.",
    site: "https://github.com",
  },
];

export interface IconRecord {
  id: string;
  name: string;
  owner: string;
  origin: string;
  file: string;
  sha256: string;
  bytes: number;
}

export const iconsDir = (root: string) =>
  join(root, "assets", "library", "icons", "vendors");
const UA = "Mozilla/5.0 (compatible; AphrodyAssets/1.0; +https://aphrody.com)";
const attr = (tag: string, a: string) =>
  tag
    .match(new RegExp(`${a}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>"']+))`, "i"))
    ?.slice(2, 5)
    .find(Boolean);

/** Candidate icon URLs of a page, best first: apple-touch-icon (largest), svg icon, png icon, ico, /favicon.ico. */
export function candidates(html: string, base: string): string[] {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const scored: [number, string][] = [];
  for (const l of links) {
    const rel = (attr(l, "rel") ?? "").toLowerCase();
    const href = attr(l, "href");
    if (!href || !rel.includes("icon")) continue;
    const size = parseInt((attr(l, "sizes") ?? "0").split("x")[0] ?? "0") || 0;
    let url: string;
    try {
      url = new URL(href, base).href;
    } catch {
      continue;
    }
    const svg =
      /\.svg(\?|$)/i.test(url) || (attr(l, "type") ?? "").includes("svg");
    const s = (rel.includes("apple") ? 1000 : svg ? 900 : 500) + size / 10;
    scored.push([s, url]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return [...scored.map((x) => x[1]), new URL("/favicon.ico", base).href];
}

async function get(
  url: string,
): Promise<{ bytes: Uint8Array; type: string } | null> {
  try {
    const r = await fetch(url, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return {
      bytes: new Uint8Array(await r.arrayBuffer()),
      type: r.headers.get("content-type") ?? "",
    };
  } catch {
    return null;
  }
}

const sniff = (
  b: Uint8Array,
  type: string,
): "png" | "svg" | "ico" | "jpg" | "webp" | null => {
  if (b[0] === 0x89 && b[1] === 0x50) return "png";
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return "ico";
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57) return "webp";
  const head = new TextDecoder().decode(b.slice(0, 400));
  if (head.includes("<svg") || type.includes("svg")) return "svg";
  return null;
};

async function run(cmd: string[]) {
  const p = Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" });
  return (await p.exited) === 0;
}

export async function fetchVendor(
  root: string,
  v: Vendor,
): Promise<IconRecord | null> {
  const page = v.page ?? v.site;
  const html = await get(page);
  const urls = v.icon
    ? [v.icon]
    : candidates(html ? new TextDecoder().decode(html.bytes) : "", page);
  const dir = iconsDir(root);
  mkdirSync(dir, { recursive: true });
  for (const url of urls) {
    const got = await get(url);
    if (!got || got.bytes.length < 100) continue;
    const kind = sniff(got.bytes, got.type);
    if (!kind) continue;
    let bytes = got.bytes;
    const file = join(dir, `${v.id}.${kind}`);
    if (kind === "svg") {
      bytes = new TextEncoder().encode(
        svgo(new TextDecoder().decode(bytes), { multipass: true }).data,
      );
      await Bun.write(file, bytes);
    } else {
      await Bun.write(file, bytes);
      if (kind === "png") {
        await run(["oxipng", "-o", "4", "--strip", "safe", "-q", file]);
        bytes = new Uint8Array(await Bun.file(file).arrayBuffer());
      }
    }
    return {
      id: v.id,
      name: v.name,
      owner: v.owner,
      origin: url,
      file: `${v.id}.${kind}`,
      sha256: await hashBytes(bytes),
      bytes: bytes.length,
    };
  }
  return null;
}

export async function syncIcons(
  root: string,
  only?: string,
): Promise<{ ok: IconRecord[]; failed: string[] }> {
  const ok: IconRecord[] = [];
  const failed: string[] = [];
  const todo = VENDORS.filter((v) => !only || v.id === only);
  const res = await Promise.all(
    todo.map(async (v) => [v, await fetchVendor(root, v)] as const),
  );
  for (const [v, r] of res) r ? ok.push(r) : failed.push(v.id);
  const idx = join(iconsDir(root), "index.json");
  const prev: IconRecord[] = existsSync(idx)
    ? JSON.parse(readFileSync(idx, "utf8"))
    : [];
  const merged = [
    ...prev.filter((p) => !ok.some((o) => o.id === p.id)),
    ...ok,
  ].sort((a, b) => a.id.localeCompare(b.id));
  await Bun.write(idx, JSON.stringify(merged, null, 2) + "\n");
  return { ok, failed };
}

export function renderIconAttribution(root: string): string {
  const idx = join(iconsDir(root), "index.json");
  if (!existsSync(idx)) return "";
  const recs: IconRecord[] = JSON.parse(readFileSync(idx, "utf8"));
  const lines = [
    "",
    "## Vendor icons (trademarks)",
    "",
    "Favicons and touch icons fetched from each product's own site by `ay assets icons`. They are trademarks of their owners, used nominatively to identify the real products, not as Aphrody branding, and are not covered by the licenses above.",
    "",
    ...recs.map(
      (r) =>
        `- \`icons/vendors/${r.file}\`: ${r.name}, trademark of ${r.owner}; origin ${r.origin}; sha256 ${r.sha256}`,
    ),
    "",
  ];
  return lines.join("\n");
}
