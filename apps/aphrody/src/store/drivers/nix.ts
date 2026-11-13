/** nixpkgs through the Nixhub API (search.devbox.sh): search, then the latest release of each hit. */

import { getJson, need, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const NIX_SOURCE = "https://search.devbox.sh/v2";
const DETAILS = 8;

interface NixSearch {
  results: { name: string; summary?: string; last_updated?: string }[];
}
interface NixPkg {
  homepage_url?: string;
  license?: string;
  releases?: { version: string }[];
}

export function parseNix(
  raw: NixSearch,
  details: Record<string, NixPkg | undefined> = {},
): StorePackage[] {
  return need(raw.results, "results").map((r) => {
    const d = details[r.name];
    return {
      id: `nix-${r.name}`,
      name: r.name,
      ecosystem: "nix",
      version: d?.releases?.[0]?.version,
      description: r.summary ?? "",
      repoUrl: d?.homepage_url,
      url: `https://www.nixhub.io/packages/${r.name}`,
      license: d?.license,
      installCmd: `nix profile install nixpkgs#${r.name}`,
      tags: [],
    };
  });
}

export async function searchNixPackages(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const raw = await getJson<NixSearch>(
    ctx,
    `${NIX_SOURCE}/search?q=${encodeURIComponent(query)}`,
  );
  const details: Record<string, NixPkg | undefined> = {};
  await Promise.all(
    need(raw.results, "results")
      .slice(0, DETAILS)
      .map(async (r) => {
        try {
          details[r.name] = await getJson<NixPkg>(
            ctx,
            `${NIX_SOURCE}/pkg?name=${encodeURIComponent(r.name)}`,
            undefined,
            8000,
          );
        } catch {
          /* version stays absent */
        }
      }),
  );
  return parseNix(raw, details).slice(0, 20);
}
