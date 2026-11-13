/** crates.io API (crates.io requires a descriptive User-Agent, set by the shared client). */

import { getJson, need, LIMIT, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const CRATES_SOURCE = "https://crates.io/api/v1/crates";

interface CratesSearch {
  crates: {
    name: string;
    max_version: string;
    description?: string | null;
    repository?: string | null;
    homepage?: string | null;
    keywords?: string[] | null;
  }[];
}

export function parseCrates(raw: CratesSearch): StorePackage[] {
  return need(raw.crates, "crates").map((c) => ({
    id: `crates-${c.name}`,
    name: c.name,
    ecosystem: "crates",
    version: c.max_version,
    description: c.description ?? "",
    repoUrl: c.repository ?? undefined,
    url: `https://crates.io/crates/${c.name}`,
    installCmd: `cargo add ${c.name}`,
    tags: c.keywords ?? [],
  }));
}

export async function searchCrates(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const url = `${CRATES_SOURCE}?q=${encodeURIComponent(query)}&per_page=${LIMIT}`;
  return parseCrates(await getJson<CratesSearch>(ctx, url));
}
