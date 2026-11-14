// SPDX-License-Identifier: Apache-2.0
/**
 * Matrice versionnée des moteurs : dernière version lue en direct à la source officielle (API JSON
 * Chrome for Testing, product-details de Mozilla, GitHub releases, npm, PyPI, crates.io, browsers.json
 * de Playwright à la version épinglée), version installée et exécutable résolu. Consommée par
 * `ay rt matrix` (crates/rt), qui y ajoute les runtimes (Node, Deno, Bun, Python) et V8 / Dawn par canal.
 */
import { basename, dirname } from "node:path";
import {
  type Engine,
  ENGINES,
  type Latest,
  PINS,
  readCftIndex,
  resolveExecutable,
} from "./registry.ts";

export interface MatrixRow {
  readonly id: string;
  readonly role:
    "browser" | "render" | "js-engine" | "gpu" | "tool" | "library";
  readonly protocol: Engine["protocol"];
  readonly language: string;
  readonly js: Engine["js"];
  readonly gpu: Engine["gpu"];
  readonly latest: string | null;
  readonly source: string | null;
  readonly installed: string | null;
  readonly path: string | null;
  readonly third_party: string | null;
}

const CFT =
  "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json";

const token = Bun.env.GITHUB_TOKEN || Bun.env.GH_TOKEN;
const memo = new Map<string, Promise<unknown>>();
function json(url: string, headers: Record<string, string> = {}): Promise<any> {
  if (!memo.has(url))
    memo.set(
      url,
      fetch(url, {
        headers: { "User-Agent": "aphrody-engines-matrix", ...headers },
        signal: AbortSignal.timeout(15_000),
      }).then((r) => (r.ok ? r.json() : null)),
    );
  return memo.get(url)!;
}

export function sourceUrl(l: Latest): string {
  switch (l.from) {
    case "cft":
      return CFT;
    case "github":
      return `https://api.github.com/repos/${l.repo}/releases/latest`;
    case "npm":
      return `https://registry.npmjs.org/${l.name.replace("/", "%2f")}/latest`;
    case "pypi":
      return `https://pypi.org/pypi/${l.name}/json`;
    case "crates":
      return `https://crates.io/api/v1/crates/${l.name}`;
    case "playwright":
      return `https://raw.githubusercontent.com/microsoft/playwright/v${PINS.playwright}/packages/playwright-core/browsers.json`;
  }
}

/** Dernière version publiée selon la source officielle, null si la source ne répond pas. */
export async function latestVersion(l: Latest): Promise<string | null> {
  const url = sourceUrl(l);
  try {
    switch (l.from) {
      case "cft": {
        const j = await json(url);
        const key = l.channel[0]!.toUpperCase() + l.channel.slice(1);
        return j?.channels?.[key]?.version ?? null;
      }
      case "github": {
        const j = await json(
          url,
          token ? { Authorization: `Bearer ${token}` } : {},
        );
        const tag: string | undefined = j?.tag_name;
        return tag ? tag.slice((l.prefix ?? "v").length) : null;
      }
      case "npm":
        return (await json(url))?.version ?? null;
      case "pypi":
        return (await json(url))?.info?.version ?? null;
      case "crates":
        return (await json(url))?.crate?.max_stable_version ?? null;
      case "playwright": {
        const name =
          l.browser === "chromium-headless-shell"
            ? "chromium-headless-shell"
            : l.browser;
        const b = (await json(url))?.browsers?.find(
          (x: { name: string }) => x.name === name,
        );
        return b ? `${b.browserVersion ?? "-"} (r${b.revision})` : null;
      }
    }
  } catch {
    return null;
  }
}

function installedVersion(e: Engine, path: string | null): string | null {
  if (!path) return null;
  const i = e.install;
  if (i.via === "cft")
    return readCftIndex()[`${i.browser}@${i.channel}`]?.buildId ?? null;
  if (i.via === "playwright") {
    // <cache>/<browser>-<révision>/... : la révision est le seul numéro fiable sans lancer le binaire.
    let d = dirname(path);
    while (d !== dirname(d) && !/-\d+$/.test(basename(d))) d = dirname(d);
    const m = /-(\d+)$/.exec(basename(d));
    return m ? `r${m[1]}` : null;
  }
  return "present";
}

export async function engineMatrix(): Promise<MatrixRow[]> {
  return Promise.all(
    ENGINES.map(async (e) => {
      const path = resolveExecutable(e);
      return {
        id: e.id,
        role:
          e.role ??
          (e.protocol === "library"
            ? "library"
            : e.protocol === "mcp" || e.protocol === "cli"
              ? "tool"
              : "browser"),
        protocol: e.protocol,
        language: e.language,
        js: e.js,
        gpu: e.gpu,
        latest: e.latest ? await latestVersion(e.latest) : null,
        source: e.latest ? sourceUrl(e.latest) : null,
        installed: installedVersion(e, path),
        path,
        third_party: e.thirdParty,
      };
    }),
  );
}
