/** Chocolatey community repository: NuGet v2 OData feed (Atom). */

import { getText, LIMIT, SourceError, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const CHOCO_SOURCE = "https://community.chocolatey.org/api/v2/Search()";

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const tag = (xml: string, name: string) =>
  xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))?.[1];

export function parseChocolatey(xml: string): StorePackage[] {
  if (!xml.includes("<feed"))
    throw new SourceError("bad_payload", "response is not an OData feed");
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const e = m[1];
    const id = decode(tag(e, "d:Id") ?? tag(e, "title") ?? "");
    return {
      id: `chocolatey-${id}`,
      name: id,
      ecosystem: "chocolatey" as const,
      version: tag(e, "d:Version"),
      description: decode(tag(e, "summary") ?? tag(e, "d:Title") ?? ""),
      author: decode(tag(e, "name") ?? "") || undefined,
      repoUrl: decode(tag(e, "d:ProjectUrl") ?? "") || undefined,
      url: `https://community.chocolatey.org/packages/${id}`,
      license: decode(tag(e, "d:LicenseUrl") ?? "") || undefined,
      installCmd: `choco install ${id}`,
      tags: (tag(e, "d:Tags") ?? "").split(/\s+/).filter(Boolean),
    };
  });
}

export async function searchChocolatey(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const term = encodeURIComponent(`'${query.replace(/'/g, "''")}'`);
  const url = `${CHOCO_SOURCE}?searchTerm=${term}&targetFramework=''&includePrerelease=false&$filter=IsLatestVersion&$orderby=DownloadCount%20desc&$top=${LIMIT}`;
  return parseChocolatey(await getText(ctx, url));
}
