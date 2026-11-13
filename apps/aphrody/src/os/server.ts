// Server side of /os: the VM image proxy, the console data of the former aphrody-webos Worker, and the open
// package catalog. Wired from apps/aphrody/server.ts (handleOs) before static assets.
import { OS_CSP } from "./page.ts";
import type { UniversalStoreManager } from "../store/universal-manager";

export const isOs = (pathname: string) =>
  pathname === "/os" || pathname.startsWith("/os/");

/** Same-origin only; gamepad allowed; wasm needs 'wasm-unsafe-eval' (OS_CSP). */
export const osHeaders = (
  base: Record<string, string>,
): Record<string, string> => ({
  ...base,
  "Content-Security-Policy": OS_CSP,
  "Permissions-Policy":
    "microphone=(), camera=(), geolocation=(), gamepad=(self), fullscreen=(self)",
});

/** The Alpine ISO of the aphrody-webos Worker (R2 key webos/vm/alpine-virt-3.24.2-x86.iso in aphrody-assets). */
const VM_URL =
  process.env.OS_VM_URL ||
  "https://assets.aphrody.app/webos/vm/alpine-virt-3.24.2-x86.iso";

/** Data of console.aphrody.com (aphrody-webos Worker), same values; a static snapshot, not live telemetry. */
export const CONSOLE: Record<string, unknown> = {
  status: {
    system: "YOLO & Aphrody Unified Ecosystem",
    version: "1.0.0-canary.20261107",
    engine:
      "Upstream Bun v1.4.4-canary + Rust 2024 (GPUI / Dioxus / Analytical SDF)",
    workspaces: [
      { name: "yolo", branch: "main", clean: true, commits: 63836 },
      { name: "yolo-ui", branch: "main", clean: true, commits: 1420 },
      { name: "yolo-web", branch: "main", clean: true, commits: 2150 },
      { name: "yolo-ai", branch: "main", clean: true, commits: 890 },
      { name: "yolo-os", branch: "main", clean: true, commits: 1120 },
      { name: "yolo-bun", branch: "main", clean: true, commits: 740 },
    ],
    gitHistorySummary: { totalCommits: 63836, totalRepositories: 26 },
  },
  orgs: {
    summary: { totalRepos: 423, keepCount: 104, archiveCount: 319 },
    namespaces: {
      aphrodyLabs: { repoCount: 200 },
      yoloRs: { repoCount: 200 },
      aphrodyDev: { repoCount: 23 },
    },
  },
  fleet: {
    meshSubnet: "10.200.77.0/24",
    hosts: [
      {
        name: "prod",
        hostname: "srv2116886",
        provider: "Hostinger",
        meshIp: "10.200.77.5",
        publicIp: "72.60.186.43",
        status: "online",
      },
      {
        name: "vps",
        hostname: "vps-203bea89",
        provider: "OVH",
        meshIp: "10.200.77.1",
        publicIp: "51.77.147.152",
        status: "online",
      },
      {
        name: "bunos",
        hostname: "bunos",
        provider: "OVH",
        meshIp: "10.200.77.3",
        publicIp: "51.255.162.6",
        status: "online",
      },
    ],
    activeTunnels: 3,
  },
  registries: {
    registries: [
      {
        name: "npm",
        scope: "@yolo-rs, @aphrody",
        ready: true,
        packagesCount: 213,
      },
      {
        name: "crates.io",
        scope: "yolo-*, aphrody-*",
        ready: true,
        packagesCount: 1021,
      },
      {
        name: "PyPI",
        scope: "aphrody, yolo-cli",
        ready: true,
        packagesCount: 2,
      },
    ],
  },
  arena: {
    scoreboard: { claude: 808, opencode: 573, agy: 422, codex: 145 },
    protocol: "ZHITL / NHITL Continuous Autonomous Loop",
  },
};

/** Ecosystems of the open catalog: everything but the Play Store driver (no scraping of Google Play). */
const OPEN_ECOSYSTEMS = [
  "bun",
  "winget",
  "aur",
  "nix",
  "flatpak",
  "wasm-hub",
] as const;

export async function handleOs(
  req: Request,
  url: URL,
  store: UniversalStoreManager,
  json: (d: unknown, s?: number, r?: Request) => Response,
): Promise<Response | null> {
  const p = url.pathname;
  if (p.startsWith("/os/api/console/")) {
    const data = CONSOLE[p.slice("/os/api/console/".length)];
    return data ? json(data, 200, req) : json({ error: "not_found" }, 404, req);
  }
  if (p === "/os/catalog.json") {
    const q = (url.searchParams.get("q") || "").slice(0, 100);
    const found = (
      await Promise.all(
        OPEN_ECOSYSTEMS.map((e) => store.search(q, e).catch(() => [])),
      )
    ).flat();
    const seen = new Set<string>();
    const packages = found
      .filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
      .slice(0, 40);
    return json(
      { query: q, source: "open", count: packages.length, packages },
      200,
      req,
    );
  }
  if (
    p === "/os/vm/alpine.iso" &&
    (req.method === "GET" || req.method === "HEAD")
  ) {
    const up = await fetch(VM_URL, {
      method: req.method,
      headers: req.headers.get("range")
        ? { range: req.headers.get("range")! }
        : {},
    }).catch(() => null);
    if (!up || (!up.ok && up.status !== 206))
      return new Response("Disk image not published.", { status: 404 });
    const h = new Headers({
      "accept-ranges": "bytes",
      "content-type": "application/octet-stream",
      "cache-control": "no-store",
      "cross-origin-resource-policy": "same-origin",
    });
    for (const k of ["content-length", "content-range", "etag"])
      if (up.headers.get(k)) h.set(k, up.headers.get(k)!);
    return new Response(req.method === "HEAD" ? null : up.body, {
      status: up.status,
      headers: h,
    });
  }
  return null;
}
