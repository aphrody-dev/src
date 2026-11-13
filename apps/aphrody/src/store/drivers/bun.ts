/** npm registry (the registry `bun add` installs from): registry.npmjs.org search API. */

import { getJson, need, LIMIT, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const BUN_SOURCE = "https://registry.npmjs.org/-/v1/search";

interface NpmSearch {
  objects: {
    package: {
      name: string;
      version: string;
      description?: string;
      keywords?: string[];
      publisher?: { username?: string };
      license?: string;
      links?: { npm?: string; repository?: string; homepage?: string };
    };
  }[];
}

export function parseNpm(raw: NpmSearch): StorePackage[] {
  return need(raw.objects, "objects").map(({ package: p }) => ({
    id: `bun-${p.name}`,
    name: p.name,
    ecosystem: "bun",
    version: p.version,
    description: p.description ?? "",
    author: p.publisher?.username,
    repoUrl: p.links?.repository,
    url: p.links?.npm ?? `https://www.npmjs.com/package/${p.name}`,
    license: p.license,
    installCmd: `bun add ${p.name}`,
    tags: p.keywords ?? [],
  }));
}

export async function searchBunPackages(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const url = `${BUN_SOURCE}?text=${encodeURIComponent(query)}&size=${LIMIT}`;
  return parseNpm(await getJson<NpmSearch>(ctx, url));
}
