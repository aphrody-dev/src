/** F-Droid: the public search page of the official repository (search.f-droid.org has no JSON endpoint). */

import { getText, LIMIT, SourceError, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const FDROID_SOURCE = "https://search.f-droid.org/";

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .trim();

export function parseFdroid(html: string): StorePackage[] {
  if (!html.includes("search-input"))
    throw new SourceError("bad_payload", "not an F-Droid search page");
  const out: StorePackage[] = [];
  const re =
    /<a class="package-header" href="https:\/\/f-droid\.org\/[a-z-]+\/packages\/([^"]+)">([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const body = m[2];
    const name = body.match(
      /<h4 class="package-name">\s*([\s\S]*?)\s*<\/h4>/,
    )?.[1];
    if (!name) continue;
    out.push({
      id: `fdroid-${m[1]}`,
      name: decode(name),
      ecosystem: "fdroid",
      description: decode(
        body.match(/<span class="package-summary">([\s\S]*?)<\/span>/)?.[1] ??
          "",
      ),
      url: `https://f-droid.org/packages/${m[1]}`,
      image: body.match(/<img class="package-icon" src="([^"]+)"/)?.[1],
      license:
        decode(
          body.match(/<span class="package-license">([\s\S]*?)<\/span>/)?.[1] ??
            "",
        ) || undefined,
      installCmd: "",
      tags: [m[1]],
    });
  }
  return out.slice(0, LIMIT);
}

export async function searchFdroid(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  return parseFdroid(
    await getText(
      ctx,
      `${FDROID_SOURCE}?q=${encodeURIComponent(query)}&lang=en`,
    ),
  );
}
