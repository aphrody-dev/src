/** Arch User Repository RPC v5 (aur.archlinux.org). */

import { getJson, need, LIMIT, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const AUR_SOURCE = "https://aur.archlinux.org/rpc/v5/search";

interface AurSearch {
  resultcount: number;
  results: {
    Name: string;
    Version: string;
    Description: string | null;
    URL: string | null;
    Maintainer: string | null;
    NumVotes: number;
    Popularity: number;
    License?: string[];
  }[];
}

export function parseAur(raw: AurSearch): StorePackage[] {
  return need(raw.results, "results")
    .sort((a, b) => b.Popularity - a.Popularity || b.NumVotes - a.NumVotes)
    .slice(0, LIMIT)
    .map((p) => ({
      id: `aur-${p.Name}`,
      name: p.Name,
      ecosystem: "aur",
      version: p.Version,
      description: p.Description ?? "",
      author: p.Maintainer ?? undefined,
      repoUrl: p.URL ?? undefined,
      url: `https://aur.archlinux.org/packages/${p.Name}`,
      license: p.License?.join(", "),
      installCmd: `git clone https://aur.archlinux.org/${p.Name}.git && cd ${p.Name} && makepkg -si`,
      tags: [],
    }));
}

export async function searchAurPackages(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const url = `${AUR_SOURCE}/${encodeURIComponent(query)}?by=name-desc`;
  return parseAur(await getJson<AurSearch>(ctx, url));
}
