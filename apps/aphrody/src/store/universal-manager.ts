/**
 * Aphrody Universal Package & Store Manager
 * Queries the real registry of each ecosystem at request time. A source that fails is reported with
 * its reason in `sources`; no catalog is bundled and nothing is substituted for missing data.
 */

import { join } from "path";
import { searchAurPackages, AUR_SOURCE } from "./drivers/aur";
import { searchBunPackages, BUN_SOURCE } from "./drivers/bun";
import { searchChocolatey, CHOCO_SOURCE } from "./drivers/chocolatey";
import { searchCrates, CRATES_SOURCE } from "./drivers/crates";
import { searchFdroid, FDROID_SOURCE } from "./drivers/fdroid";
import { searchFlatpakPackages, FLATPAK_SOURCE } from "./drivers/flatpak";
import { searchGames, GAMES_DB } from "./drivers/games";
import { addStars, searchGithub, GITHUB_SOURCE } from "./drivers/github";
import { searchNixPackages, NIX_SOURCE } from "./drivers/nix";
import { searchWingetPackages, WINGET_SOURCE } from "./drivers/winget";
import { SourceError, type DriverContext } from "./http";
import {
  ECOSYSTEMS,
  type Ecosystem,
  type SourceReport,
  type StorePackage,
  type StoreSearch,
} from "./types";

type Driver = (q: string, ctx: DriverContext) => Promise<StorePackage[]>;

const DRIVERS: Record<Ecosystem, { source: string; run: Driver }> = {
  bun: { source: BUN_SOURCE, run: searchBunPackages },
  crates: { source: CRATES_SOURCE, run: searchCrates },
  github: { source: GITHUB_SOURCE, run: searchGithub },
  winget: { source: WINGET_SOURCE, run: searchWingetPackages },
  chocolatey: { source: CHOCO_SOURCE, run: searchChocolatey },
  aur: { source: AUR_SOURCE, run: searchAurPackages },
  nix: { source: NIX_SOURCE, run: searchNixPackages },
  flatpak: { source: FLATPAK_SOURCE, run: searchFlatpakPackages },
  fdroid: { source: FDROID_SOURCE, run: searchFdroid },
  steam: { source: GAMES_DB, run: (q, c) => searchGames(q, "steam", c) },
  epic: { source: GAMES_DB, run: (q, c) => searchGames(q, "epic", c) },
};

/** Ecosystems with no public search API: asking for them is an explicit error, not an empty list. */
const NO_PUBLIC_API: Record<string, string> = {
  playstore:
    "Google Play has no public search API and its pages must not be scraped",
};

const CACHE_TTL_MS = 10 * 60_000;

export class UniversalStoreManager {
  private static instance: UniversalStoreManager;
  private cache = new Map<string, { at: number; packages: StorePackage[] }>();
  private ctx: DriverContext;

  /** `varDir` receives downloaded indexes; `fetcher` and `env` are injectable for tests. */
  constructor(
    varDir = "var",
    fetcher: DriverContext["fetch"] = (u, i) => fetch(u, i),
    env: DriverContext["env"] = process.env,
  ) {
    this.ctx = { fetch: fetcher, env, cacheDir: join(varDir, "store-cache") };
  }

  public static getInstance(varDir?: string): UniversalStoreManager {
    return (UniversalStoreManager.instance ??= new UniversalStoreManager(
      varDir && varDir.endsWith(".sqlite") ? join(varDir, "..") : varDir,
    ));
  }

  private async one(
    eco: string,
    query: string,
  ): Promise<{
    report: SourceReport;
    packages: StorePackage[];
  }> {
    const fetchedAt = new Date().toISOString();
    const drv = DRIVERS[eco as Ecosystem];
    const base = { ecosystem: eco, fetchedAt };
    if (!drv) {
      const noApi = NO_PUBLIC_API[eco];
      return {
        packages: [],
        report: {
          ...base,
          ok: false,
          count: 0,
          source: "",
          error: noApi
            ? { code: "no_public_api", message: noApi }
            : {
                code: "unknown_ecosystem",
                message: `unknown ecosystem "${eco}"`,
              },
        },
      };
    }
    const key = `${eco}\0${query.toLowerCase()}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS)
      return {
        packages: hit.packages,
        report: {
          ...base,
          ok: true,
          count: hit.packages.length,
          source: drv.source,
          fetchedAt: new Date(hit.at).toISOString(),
        },
      };
    try {
      const packages = await drv.run(query, this.ctx);
      if (eco === "bun" || eco === "crates" || eco === "aur")
        await addStars(packages, this.ctx);
      this.cache.set(key, { at: Date.now(), packages });
      return {
        packages,
        report: {
          ...base,
          ok: true,
          count: packages.length,
          source: drv.source,
        },
      };
    } catch (e) {
      const err =
        e instanceof SourceError
          ? e
          : new SourceError("network", String((e as Error)?.message ?? e));
      return {
        packages: [],
        report: {
          ...base,
          ok: false,
          count: 0,
          source: drv.source,
          error: { code: err.code, message: err.message, status: err.status },
        },
      };
    }
  }

  public async searchDetailed(
    query: string,
    ecosystem: string = "all",
  ): Promise<StoreSearch> {
    const q = query.trim().slice(0, 100);
    const ecosystem_ = ecosystem || "all";
    if (!q)
      return {
        query: q,
        ecosystem: ecosystem_,
        count: 0,
        packages: [],
        sources: [],
        empty: "empty_query",
      };
    const ecos =
      ecosystem_ === "all"
        ? [...ECOSYSTEMS]
        : ecosystem_ === "software"
          ? ECOSYSTEMS.filter((e) => e !== "steam" && e !== "epic")
          : [ecosystem_];
    const done = await Promise.all(ecos.map((e) => this.one(e, q)));
    // Round-robin so a prolific ecosystem does not bury the others.
    const packages: StorePackage[] = [];
    const seen = new Set<string>();
    for (let i = 0; done.some((d) => i < d.packages.length); i++)
      for (const d of done) {
        const p = d.packages[i];
        if (p && !seen.has(p.id)) (seen.add(p.id), packages.push(p));
      }
    return {
      query: q,
      ecosystem: ecosystem_,
      count: packages.length,
      packages,
      sources: done.map((d) => d.report),
    };
  }

  /** Flat list for callers that do not show source errors. */
  public async search(
    query: string,
    ecosystem: string = "all",
  ): Promise<StorePackage[]> {
    return (await this.searchDetailed(query, ecosystem)).packages;
  }
}
