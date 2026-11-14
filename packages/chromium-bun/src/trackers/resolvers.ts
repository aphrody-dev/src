// SPDX-License-Identifier: Apache-2.0
/**
 * Live version resolvers. Every value comes from a source fetched during the run (chromiumdash, Chrome for Testing,
 * versionhistory, gitiles, crates.io, GitHub through gh, vendor indexes); each result records its sources and the fetch time.
 */
import type { Resolver, TrackerConfig } from "./config.ts";
import {
  ROOT,
  ghApi,
  ghFile,
  ghLatestTag,
  http,
  httpJson,
  nowIso,
  once,
  parseV8Header,
  run,
} from "./net.ts";

export interface Found {
  value: string;
  /** Chromium version this value is built on, when known (drives the V8 lookup of embedders and forks). */
  chromium?: string;
  published?: string;
  source: string[];
  fetched_at: string;
  channels?: Record<string, { value: string; revision?: string }>;
  extra?: Record<string, unknown>;
  label?: string;
}

export interface ChannelInfo {
  version: string;
  milestone: number;
  released: string;
  hashes: Record<string, string>;
  v8_version?: string;
}

export interface Channels {
  fetched_at: string;
  chromiumdash: Record<string, Record<string, ChannelInfo>>;
  chrome_for_testing: Record<string, string>;
  versionhistory_win64: Record<string, string>;
  chrome_channels_toml: Record<string, string>;
  checkout_version?: string;
  sources: string[];
  conflicts: string[];
}

export interface Ctx {
  channels: Channels;
  version: Map<string, Found>;
  chrome: Map<string, Found>;
}

const CHANNELS = ["Stable", "Beta", "Dev", "Canary"] as const;
const GITILES = "https://chromium.googlesource.com";

async function gitilesText(path: string): Promise<string> {
  const url = `${GITILES}/${path}?format=TEXT`;
  const r = await http(url, { max: 4_000_000 });
  if (r.status !== 200) throw new Error(`${url}: HTTP ${r.status}`);
  return new TextDecoder().decode(Buffer.from(r.text, "base64"));
}

export const v8VersionAt = (rev: string): Promise<string> =>
  once(`v8@${rev}`, async () =>
    parseV8Header(await gitilesText(`v8/v8/+/${rev}/include/v8-version.h`)),
  );

/** V8 version of a Chromium release tag: DEPS at the tag gives v8_revision, the header at that revision gives the version. */
export function v8OfChromium(
  version: string,
): Promise<{ v8: string; revision: string }> {
  return once(`chromium-v8@${version}`, async () => {
    const deps = await gitilesText(`chromium/src/+/refs/tags/${version}/DEPS`);
    const rev = deps.match(/'v8_revision':\s*'([0-9a-f]{40})'/)?.[1];
    if (!rev) throw new Error(`DEPS at ${version}: no v8_revision`);
    return { v8: await v8VersionAt(rev), revision: rev };
  });
}

export async function fetchChannels(): Promise<Channels> {
  const sources: string[] = [];
  const conflicts: string[] = [];
  const chromiumdash: Channels["chromiumdash"] = {};
  const jobs: Promise<void>[] = [];
  for (const platform of ["Windows", "Linux"]) {
    chromiumdash[platform] = {};
    for (const ch of CHANNELS) {
      const url = `https://chromiumdash.appspot.com/fetch_releases?channel=${ch}&platform=${platform}&num=1`;
      sources.push(url);
      jobs.push(
        (async () => {
          const o = (await httpJson<any[]>(url))[0];
          if (!o) return;
          const info: ChannelInfo = {
            version: o.version,
            milestone: o.milestone,
            released: new Date(o.time).toISOString(),
            hashes: o.hashes ?? {},
          };
          if (platform === "Windows" && o.hashes?.v8)
            info.v8_version = await v8VersionAt(o.hashes.v8).catch(
              () => undefined,
            );
          (chromiumdash[platform] as Record<string, ChannelInfo>)[
            ch.toLowerCase()
          ] = info;
        })().catch((e) => void conflicts.push(`${url}: ${e}`)),
      );
    }
  }
  const cftUrl =
    "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json";
  sources.push(cftUrl);
  const cft: Record<string, string> = {};
  jobs.push(
    httpJson<{ channels: Record<string, { version: string }> }>(cftUrl).then(
      (j) => {
        for (const [k, v] of Object.entries(j.channels))
          cft[k.toLowerCase()] = v.version;
      },
    ),
  );
  const vh: Record<string, string> = {};
  for (const ch of CHANNELS) {
    const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/win64/channels/${ch.toLowerCase()}/versions?pageSize=1`;
    sources.push(url);
    jobs.push(
      httpJson<{ versions: { version: string }[] }>(url).then(
        (j) => void (vh[ch.toLowerCase()] = j.versions[0]?.version ?? ""),
      ),
    );
  }
  await Promise.all(
    jobs.map((j) => j.catch((e) => void conflicts.push(String(e)))),
  );

  const toml: Record<string, string> = {};
  try {
    const t = Bun.TOML.parse(
      await Bun.file(`${ROOT()}/third_party/chrome-channels.toml`).text(),
    ) as {
      channel?: Record<string, { chromium?: string }>;
    };
    for (const [k, v] of Object.entries(t.channel ?? {}))
      if (v.chromium) toml[k] = v.chromium;
  } catch {
    /* absent file: nothing to compare */
  }
  let checkout: string | undefined;
  try {
    const v = await Bun.file(
      `${ROOT()}/third_party/chromium/src/chrome/VERSION`,
    ).text();
    const g = (k: string) => v.match(new RegExp(`^${k}=(\\d+)`, "m"))?.[1];
    checkout = [g("MAJOR"), g("MINOR"), g("BUILD"), g("PATCH")].join(".");
  } catch {
    /* no checkout */
  }
  const lin = chromiumdash.Linux ?? {};
  for (const ch of ["stable", "beta", "dev", "canary"]) {
    const live = lin[ch]?.version;
    if (live && toml[ch] && live !== toml[ch])
      conflicts.push(
        `third_party/chrome-channels.toml ${ch}=${toml[ch]} but chromiumdash Linux ${ch}=${live}`,
      );
    const w = chromiumdash.Windows?.[ch]?.version;
    if (w && live && w !== live)
      conflicts.push(
        `chromiumdash ${ch}: Windows ${w} but Linux ${live} (staged rollout: Linux factory builds follow Linux)`,
      );
    if (w && cft[ch] && w !== cft[ch])
      conflicts.push(
        `Chrome for Testing ${ch}=${cft[ch]} differs from chromiumdash Windows ${ch}=${w} (CfT lags the release)`,
      );
  }
  return {
    fetched_at: nowIso(),
    chromiumdash,
    chrome_for_testing: cft,
    versionhistory_win64: vh,
    chrome_channels_toml: toml,
    checkout_version: checkout,
    sources,
    conflicts,
  };
}

// --- semver subset (cargo default requirement = caret) -------------------------------------------------------------

const nums = (s: string): number[] =>
  (s.split(/[-+]/)[0] ?? "").split(".").map((x) => Number(x) || 0);
const cmp = (a: number[], b: number[]): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
  return 0;
};

export function satisfies(ver: string, req: string): boolean {
  const r = req.trim();
  if (r.startsWith("=")) return ver === r.slice(1).trim();
  if (ver.includes("-")) return false;
  const b = nums(r.replace(/^[\^~]/, ""));
  while (b.length < 3) b.push(0);
  const v = nums(ver);
  if (cmp(v, b) < 0) return false;
  if ((b[0] ?? 0) > 0) return v[0] === b[0];
  if ((b[1] ?? 0) > 0) return v[0] === 0 && v[1] === b[1];
  return v[0] === 0 && v[1] === 0 && v[2] === b[2];
}

export const maxSatisfying = (
  versions: string[],
  req: string,
): string | undefined =>
  versions
    .filter((v) => satisfies(v, req))
    .sort((x, y) => cmp(nums(y), nums(x)))[0];

const crateVersions = (c: string): Promise<string[]> =>
  once(`crate-versions:${c}`, async () => {
    const j = await httpJson<{ versions: { num: string; yanked: boolean }[] }>(
      `https://crates.io/api/v1/crates/${c}`,
    );
    return j.versions.filter((v) => !v.yanked).map((v) => v.num);
  });

const crateDeps = (
  c: string,
  v: string,
): Promise<{ crate_id: string; req: string; kind: string }[]> =>
  once(
    `crate-deps:${c}@${v}`,
    async () =>
      (
        await httpJson<{
          dependencies: { crate_id: string; req: string; kind: string }[];
        }>(`https://crates.io/api/v1/crates/${c}/${v}/dependencies`)
      ).dependencies,
  );

// --- V8 of rusty_v8 (the v8 crate): the submodule commit of the tag carries include/v8-version.h --------------------

export function rustyV8At(
  tag: string,
): Promise<{ v8: string; submodule: string }> {
  return once(`rusty_v8@${tag}`, async () => {
    const m = await ghApi<{ sha: string }>(
      `repos/denoland/rusty_v8/contents/v8?ref=${encodeURIComponent(tag)}`,
    );
    const h = await ghFile("denoland/v8", "include/v8-version.h", m.sha);
    return { v8: parseV8Header(h), submodule: m.sha };
  });
}

const first = (s: string, re: RegExp): string | undefined => s.match(re)?.[1];

export function parseFeed(xml: string): {
  title?: string;
  date?: string;
  link?: string;
} {
  const block = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/)?.[0];
  if (!block) return {};
  const clean = (s?: string) =>
    s
      ?.replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#8217;|&#039;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  return {
    title: clean(first(block, /<title[^>]*>([\s\S]*?)<\/title>/)),
    date: clean(
      first(block, /<(?:pubDate|updated|published|dc:date)[^>]*>([^<]+)</),
    ),
    link:
      first(block, /<link[^>]*href="([^"]+)"/) ??
      clean(first(block, /<link>([^<]+)</)),
  };
}

type Fn = (r: Resolver, t: TrackerConfig, ctx: Ctx) => Promise<Found>;
const str = (r: Resolver, k: string): string => {
  const v = r[k];
  if (typeof v !== "string" || !v)
    throw new Error(`resolver ${r.from}: missing "${k}"`);
  return v;
};
const found = (p: Omit<Found, "fetched_at">): Found => ({
  ...p,
  fetched_at: nowIso(),
});

async function chromiumFor(
  r: Resolver,
  t: TrackerConfig,
  ctx: Ctx,
): Promise<string> {
  if (r.chromium_from === "file") {
    const v = first(
      await ghFile(str(r, "repo"), str(r, "path"), r.ref as string | undefined),
      new RegExp(str(r, "regex"), "m"),
    );
    if (!v) throw new Error(`${t.id}: chromium version not found in ${r.path}`);
    return v;
  }
  const f =
    r.chromium_from === "chrome" ? ctx.chrome.get(t.id) : ctx.version.get(t.id);
  const c =
    f?.chromium ??
    (f && /^\d+\.\d+\.\d+\.\d+$/.test(f.value) ? f.value : undefined);
  if (!c || !/^\d+\.\d+\.\d+\.\d+$/.test(c))
    throw new Error(
      `${t.id}: no full Chromium version to resolve V8 from (got ${c ?? "none"})`,
    );
  return c;
}

export const RESOLVERS: Record<string, Fn> = {
  "chromium-channels": async (r, _t, ctx) => {
    const key = typeof r.key === "string" ? r.key : "chromium";
    const channels: NonNullable<Found["channels"]> = {};
    for (const [ch, i] of Object.entries(
      ctx.channels.chromiumdash.Windows ?? {},
    )) {
      if (key === "chromium")
        channels[ch] = { value: i.version, revision: i.hashes.chromium };
      else if (key === "v8")
        channels[ch] = { value: i.v8_version ?? "", revision: i.hashes.v8 };
      else
        channels[ch] = {
          value: `${key} ${(i.hashes[key] ?? "").slice(0, 12)}`,
          revision: i.hashes[key],
        };
    }
    return found({
      value: channels.stable?.value ?? "",
      channels,
      source: ctx.channels.sources.filter((s) => s.includes("Windows")),
    });
  },
  "in-chromium": async (_r, _t, ctx) => {
    const s = ctx.channels.chromiumdash.Windows?.stable;
    return found({
      value: s?.version ?? "",
      chromium: s?.version,
      source: ["third_party/chromium/src (in-tree)"],
      extra: {
        note: "Blink is built from the Chromium tree: it carries the Chromium version",
      },
    });
  },
  "github-release": async (r, t) => {
    const repo = (r.repo as string | undefined) ?? t.repo;
    if (!repo) throw new Error(`${t.id}: github-release needs repo`);
    const rel = await ghLatestTag(repo);
    let chromium: string | undefined;
    if (typeof r.chromium_regex === "string")
      chromium = first(
        r.chromium_from === "tag" ? rel.tag : rel.name,
        new RegExp(r.chromium_regex),
      );
    return found({
      value: rel.tag.replace(/^v/, ""),
      chromium,
      published: rel.published,
      source: [`gh api repos/${repo}/releases/latest`],
      extra: { tag: rel.tag, name: rel.name },
    });
  },
  crates: async (r) => {
    const name = str(r, "name");
    const j = await httpJson<{
      crate: { max_version: string; updated_at: string };
    }>(`https://crates.io/api/v1/crates/${name}`);
    const v = j.crate.max_version;
    return found({
      value: v,
      published: j.crate.updated_at,
      source: [`https://crates.io/api/v1/crates/${name}`],
      extra: v.includes("+") ? { build_metadata: v.split("+")[1] } : undefined,
    });
  },
  "cef-builds": async (r) => {
    const url = "https://cef-builds.spotifycdn.com/index.json";
    const j = await httpJson<
      Record<
        string,
        {
          versions: {
            cef_version: string;
            chromium_version: string;
            channel: string;
          }[];
        }
      >
    >(url);
    const v = j.windows64?.versions.find(
      (x) => x.channel === (r.channel ?? "stable"),
    );
    if (!v) throw new Error("cef-builds: no matching version");
    return found({
      value: v.cef_version,
      chromium: v.chromium_version,
      source: [url],
    });
  },
  "electron-index": async () => {
    const url = "https://electronjs.org/headers/index.json";
    const e = (
      await httpJson<
        {
          version: string;
          fullDate?: string;
          date: string;
          chrome: string;
          v8: string;
          node: string;
        }[]
      >(url)
    )[0];
    if (!e) throw new Error("electron index empty");
    return found({
      value: e.version,
      chromium: e.chrome,
      published: e.fullDate ?? e.date,
      source: [url],
      extra: { v8: e.v8, node: e.node },
    });
  },
  cft: async (r, _t, ctx) => {
    const ch = String(r.channel ?? "Stable").toLowerCase();
    const v = ctx.channels.chrome_for_testing[ch];
    if (!v) throw new Error(`Chrome for Testing: no ${ch}`);
    return found({
      value: v,
      chromium: v,
      source: [
        "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json",
      ],
    });
  },
  "edge-api": async () => {
    const url = "https://edgeupdates.microsoft.com/api/products";
    const j = await httpJson<
      {
        Product: string;
        Releases: {
          Platform: string;
          Architecture: string;
          ProductVersion: string;
          PublishedTime: string;
        }[];
      }[]
    >(url);
    const rel = j
      .find((p) => p.Product === "Stable")
      ?.Releases.find(
        (x) => x.Platform === "Windows" && x.Architecture === "x64",
      );
    if (!rel) throw new Error("edge: no Windows x64 stable");
    const beta = j
      .find((p) => p.Product === "Beta")
      ?.Releases.find(
        (x) => x.Platform === "Windows" && x.Architecture === "x64",
      );
    return found({
      value: rel.ProductVersion,
      published: rel.PublishedTime,
      source: [url],
      extra: {
        chromium_major: rel.ProductVersion.split(".")[0],
        beta: beta?.ProductVersion,
        note: "Edge version = Chromium major + Edge build; the Chromium build number is not published",
      },
    });
  },
  feed: async (_r, t) => {
    const url = t.news;
    if (!url) throw new Error(`${t.id}: feed resolver needs news`);
    const r = await http(url);
    const f = parseFeed(r.text);
    if (!f.title) throw new Error(`${url}: no feed item (HTTP ${r.status})`);
    return found({
      value: f.title,
      published: f.date,
      source: [url],
      extra: { link: f.link },
    });
  },
  "git-head": async (r) => {
    const url = str(r, "url");
    const o = await run(["git", "ls-remote", url, "HEAD"]);
    const sha = o.out.split(/\s/)[0];
    if (o.code !== 0 || !sha)
      throw new Error(`git ls-remote ${url}: ${o.err.slice(0, 100)}`);
    return found({
      value: sha.slice(0, 12),
      source: [`git ls-remote ${url} HEAD`],
      extra: { sha },
    });
  },
  "gh-regex": async (r) => {
    const repo = str(r, "repo");
    const text = await ghFile(
      repo,
      str(r, "path"),
      r.ref as string | undefined,
    );
    const v = first(text, new RegExp(str(r, "regex"), "m"));
    if (!v) throw new Error(`${repo}:${r.path}: pattern not found`);
    return found({
      value: v,
      chromium: r.chromium ? v : undefined,
      source: [
        `gh api repos/${repo}/contents/${r.path}?ref=${r.ref ?? "default"}`,
      ],
    });
  },
  "local-regex": async (r) => {
    const text = await Bun.file(`${ROOT()}/${str(r, "path")}`).text();
    const v = first(text, new RegExp(str(r, "regex"), "m"));
    if (!v) throw new Error(`${r.path}: pattern not found`);
    return found({ value: v, source: [`local:${r.path}`] });
  },
  // --- V8 pins -------------------------------------------------------------------------------------------------
  "chromium-tag": async (r, t, ctx) => {
    const c = await chromiumFor(r, t, ctx);
    const x = await v8OfChromium(c);
    return found({
      value: x.v8,
      chromium: c,
      source: [
        `${GITILES}/chromium/src/+/refs/tags/${c}/DEPS`,
        `${GITILES}/v8/v8/+/${x.revision}/include/v8-version.h`,
      ],
      extra: { v8_revision: x.revision },
    });
  },
  "gh-header": async (r) => {
    const repo = str(r, "repo");
    let ref = String(r.ref ?? "HEAD");
    if (ref === "@release") ref = (await ghLatestTag(repo)).tag;
    if (ref === "@node-lts") {
      const idx = await httpJson<{ version: string; lts: string | false }[]>(
        "https://nodejs.org/dist/index.json",
      );
      ref = idx.find((x) => x.lts)?.version ?? ref;
    }
    const h = await ghFile(repo, str(r, "path"), ref);
    return found({
      value: parseV8Header(h),
      source: [`gh api repos/${repo}/contents/${r.path}?ref=${ref}`],
      extra: { ref },
    });
  },
  "rusty-v8-tag": async (r) => {
    let tag = String(r.tag ?? "@release");
    if (tag === "@release") tag = (await ghLatestTag("denoland/rusty_v8")).tag;
    const x = await rustyV8At(tag);
    return found({
      value: x.v8,
      source: [
        `gh api repos/denoland/rusty_v8/contents/v8?ref=${tag}`,
        `denoland/v8@${x.submodule}:include/v8-version.h`,
      ],
      extra: { rusty_v8_tag: tag, submodule: x.submodule },
    });
  },
  "crate-chain": async (r, t, ctx) => {
    const start = str(r, "start");
    const chain: string[] = [];
    const src: string[] = [];
    let ver: string | undefined;
    const sr = r.start_req as
      { repo: string; path: string; regex: string } | undefined;
    if (sr) {
      const req = first(
        await ghFile(sr.repo, sr.path),
        new RegExp(sr.regex, "m"),
      );
      if (!req)
        throw new Error(
          `${sr.repo}:${sr.path}: ${start} requirement not found`,
        );
      ver = maxSatisfying(await crateVersions(start), req);
      chain.push(`${start} ${req} -> ${ver}`);
      src.push(`gh api repos/${sr.repo}/contents/${sr.path}`);
    } else {
      ver = ctx.version.get(t.id)?.value;
      chain.push(`${start} ${ver} (latest on crates.io)`);
    }
    let crate = start;
    for (const next of (r.follow as string[]) ?? []) {
      if (!ver)
        throw new Error(`${crate}: no version satisfies the requirement`);
      const dep = (await crateDeps(crate, ver)).find(
        (d) => d.crate_id === next && d.kind === "normal",
      );
      if (!dep) throw new Error(`${crate}@${ver} has no dependency ${next}`);
      src.push(`https://crates.io/api/v1/crates/${crate}/${ver}/dependencies`);
      const nv = maxSatisfying(await crateVersions(next), dep.req);
      chain.push(`${next} ${dep.req} -> ${nv}`);
      crate = next;
      ver = nv;
    }
    if (crate !== "v8" || !ver)
      throw new Error(
        `crate-chain must end on the v8 crate (ended on ${crate})`,
      );
    const x = await rustyV8At(`v${ver}`);
    return found({
      value: x.v8,
      source: [
        ...src,
        `gh api repos/denoland/rusty_v8/contents/v8?ref=v${ver}`,
        `denoland/v8@${x.submodule}:include/v8-version.h`,
      ],
      extra: { chain, v8_crate: ver },
    });
  },
};

export async function resolve(
  r: Resolver,
  t: TrackerConfig,
  ctx: Ctx,
  as: "version" | "v8" | "pin" | "chrome" = "version",
): Promise<Found> {
  const fn = RESOLVERS[r.from];
  if (!fn) throw new Error(`${t.id}: unknown resolver ${r.from}`);
  const f = await fn(r, t, ctx);
  // Embedders publish their V8 in the version record: expose it as the V8 pin.
  if (as === "v8" && r.from === "electron-index") {
    const e = f.extra as { v8: string };
    return { ...f, value: e.v8 };
  }
  return typeof r.label === "string" ? { ...f, label: r.label } : f;
}
