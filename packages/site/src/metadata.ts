import { type ResolvedSite, localizedPath, origin } from "./config.ts";
import { type Html, html, jsonScript } from "./html.ts";

export interface Metadata {
  title: string;
  description?: string;
  /** Excluded from sitemap, llms.txt and indexing when false. */
  public?: boolean;
  image?: { url: string; width: number; height: number; alt: string };
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  themeColor?: string;
}

/** <head> metadata of a page: title, description, canonical, hreflang alternates, Open Graph, JSON-LD. */
export function headTags(
  site: ResolvedSite,
  path: string,
  locale: string,
  m: Metadata,
): Html {
  const base = origin(site);
  const canonical = base + localizedPath(site, locale, path);
  const alternates =
    site.locales.length > 1
      ? [
          ...site.locales.map(
            (l) =>
              html`<link
                rel="alternate"
                hreflang="${l}"
                href="${base + localizedPath(site, l, path)}"
              />`,
          ),
          html`<link
            rel="alternate"
            hreflang="x-default"
            href="${base + localizedPath(site, site.defaultLocale, path)}"
          />`,
        ]
      : [];
  const ld = m.jsonLd ? (Array.isArray(m.jsonLd) ? m.jsonLd : [m.jsonLd]) : [];
  return html`<title>${m.title}</title
    >${m.description ? html`<meta name="description" content="${m.description}" />` : ""}${
      m.public === false ? html`<meta name="robots" content="noindex" />` : ""
    }<link rel="canonical" href="${canonical}" />${alternates}<meta
      property="og:type"
      content="website"
    /><meta property="og:site_name" content="${site.name}" /><meta
      property="og:title"
      content="${m.title}"
    />${
      m.description
        ? html`<meta property="og:description" content="${m.description}" />`
        : ""
    }<meta property="og:url" content="${canonical}" /><meta
      property="og:locale"
      content="${locale}"
    />${
      m.image
        ? html`<meta
              property="og:image"
              content="${new URL(m.image.url, base).href}"
            /><meta property="og:image:width" content="${m.image.width}" /><meta
              property="og:image:height"
              content="${m.image.height}"
            /><meta property="og:image:alt" content="${m.image.alt}" />`
        : ""
    }${m.themeColor ? html`<meta name="theme-color" content="${m.themeColor}" />` : ""}${ld.map(
      (j) =>
        html`<script type="application/ld+json">
          ${jsonScript(j)}
        </script>`,
    )}`;
}

export interface PublicPage {
  path: string; // localized path
  locale: string;
  title: string;
  description?: string;
}

export const robotsTxt = (site: ResolvedSite): string =>
  `User-agent: *\nAllow: /\nSitemap: ${origin(site)}/sitemap.xml\n`;

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function sitemapXml(site: ResolvedSite, pages: PublicPage[]): string {
  const base = origin(site);
  const byPath = new Map<string, PublicPage[]>();
  for (const p of pages) {
    const key =
      p.locale === site.defaultLocale
        ? p.path
        : p.path.replace(`/${p.locale}`, "") || "/";
    byPath.set(key, [...(byPath.get(key) ?? []), p]);
  }
  const multi = site.locales.length > 1;
  const urls = [...pages]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((p) => {
      const key =
        p.locale === site.defaultLocale
          ? p.path
          : p.path.replace(`/${p.locale}`, "") || "/";
      const alts = multi
        ? (byPath.get(key) ?? [])
            .map(
              (a) =>
                `<xhtml:link rel="alternate" hreflang="${a.locale}" href="${xml(base + a.path)}"/>`,
            )
            .join("")
        : "";
      return `<url><loc>${xml(base + p.path)}</loc>${alts}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
    multi ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""
  }>${urls}</urlset>\n`;
}

export function llmsTxt(
  site: ResolvedSite,
  pages: PublicPage[],
  summary?: string,
): string {
  const base = origin(site);
  const lines = [`# ${site.name}`, ""];
  if (summary) lines.push(`> ${summary}`, "");
  lines.push("## Pages", "");
  for (const p of [...pages].sort((a, b) => a.path.localeCompare(b.path)))
    lines.push(
      `- [${p.title}](${base + p.path})${p.description ? `: ${p.description}` : ""}`,
    );
  return `${lines.join("\n")}\n`;
}
