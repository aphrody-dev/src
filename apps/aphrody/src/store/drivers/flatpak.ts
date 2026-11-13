/** Flathub API v2 search. */

import { getJson, need, LIMIT, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const FLATPAK_SOURCE = "https://flathub.org/api/v2/search";

interface FlathubSearch {
  hits: {
    name: string;
    summary?: string;
    app_id: string;
    developer_name?: string | null;
    project_license?: string | null;
    icon?: string | null;
    keywords?: string[] | null;
  }[];
}

export function parseFlathub(raw: FlathubSearch): StorePackage[] {
  return need(raw.hits, "hits")
    .slice(0, LIMIT)
    .map((h) => ({
      id: `flatpak-${h.app_id}`,
      name: h.name,
      ecosystem: "flatpak",
      description: h.summary ?? "",
      author: h.developer_name ?? undefined,
      url: `https://flathub.org/apps/${h.app_id}`,
      image: h.icon ?? undefined,
      license: h.project_license ?? undefined,
      installCmd: `flatpak install flathub ${h.app_id}`,
      tags: h.keywords ?? [],
    }));
}

export async function searchFlatpakPackages(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  return parseFlathub(
    await getJson<FlathubSearch>(ctx, FLATPAK_SOURCE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    }),
  );
}
