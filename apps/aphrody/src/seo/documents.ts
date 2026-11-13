/**
 * Crawler, agent and compliance documents generated at build time (dist/) and
 * reusable by the server and tests: robots.txt, sitemap index + child sitemaps,
 * llms.txt, llms-full.txt, agent.json, webmcp.json, ads.txt, sellers.json,
 * security.txt, humans.txt and the IndexNow key.
 */

import { APP_URL, HOME, SITE_URL, pathGroups } from "./site";
import {
  HOME_LOCALES as LOCALES,
  PRODUCTS,
  type HoldingLocale as Locale,
} from "../holding/page";
import { catalogs } from "../../../../packages/i18n/src/index.ts";

/** Route of the home page per locale: fr at the root, the others under /<locale>. */
const localizedPath = (path: string, l: Locale): string =>
  l === "fr" ? path : path === "/" ? `/${l}` : `/${l}${path}`;
const HREFLANG: Record<Locale, string> = {
  fr: "fr",
  en: "en",
  "zh-CN": "zh-CN",
  ja: "ja",
  es: "es",
};
const NATIVE: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  "zh-CN": "中文",
  ja: "日本語",
  es: "Español",
};
const homeCopy = (l: Locale) => {
  const c = catalogs[l] as Record<string, string>;
  return { h1: c["home.title"], intro: c["home.desc"] };
};
import { WEBMCP_TOOLS } from "./webmcp-tools";
import type { GoogleConfig } from "../google/config";

export const SITEMAP_FILES = [
  "sitemap-core.xml",
  "sitemap-images.xml",
] as const;

const NS_SITEMAP = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alternates(frPath: string): string {
  const links = LOCALES.map(
    (l) =>
      `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE_URL}${localizedPath(frPath, l)}"/>`,
  );
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(frPath, "fr")}"/>`,
  );
  return links.join("");
}

function urlEntries(paths: string[], lastmod: string): string {
  return paths
    .flatMap((p) =>
      LOCALES.map(
        (l) =>
          `<url><loc>${SITE_URL}${localizedPath(p, l)}</loc><lastmod>${lastmod}</lastmod>${alternates(p)}</url>`,
      ),
    )
    .join("\n");
}

export function buildSitemaps(buildDate: string): Record<string, string> {
  const g = pathGroups();
  const urlset = (extraNs: string, body: string) =>
    `${XML_HEAD}<urlset xmlns="${NS_SITEMAP}" xmlns:xhtml="http://www.w3.org/1999/xhtml"${extraNs}>\n${body}\n</urlset>\n`;

  const imageUrl = (path: string, l: Locale) =>
    `<url><loc>${SITE_URL}${localizedPath(path, l)}</loc><image:image><image:loc>${SITE_URL}/og-image.png</image:loc></image:image></url>`;
  const imagePaths = g.core;
  const images = imagePaths
    .flatMap((p) => LOCALES.map((l) => imageUrl(p, l)))
    .join("\n");

  const files: Record<string, string> = {
    "sitemap-core.xml": urlset("", urlEntries(g.core, buildDate)),
    "sitemap-images.xml": urlset(
      ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
      images,
    ),
  };
  files["sitemap.xml"] =
    `${XML_HEAD}<sitemapindex xmlns="${NS_SITEMAP}">\n` +
    SITEMAP_FILES.map(
      (f) =>
        `<sitemap><loc>${SITE_URL}/${f}</loc><lastmod>${buildDate}</lastmod></sitemap>`,
    ).join("\n") +
    "\n</sitemapindex>\n";
  return files;
}

/** Every indexable absolute URL (used by IndexNow). */
export function allIndexableUrls(): string[] {
  const g = pathGroups();
  return g.core.flatMap((p) =>
    LOCALES.map((l) => SITE_URL + localizedPath(p, l)),
  );
}

export const AI_CRAWLERS = [
  "Googlebot",
  "Google-Extended",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
] as const;
const ROBOTS_DISALLOW = ["/g/", "/api/store/", "/api/seo/"];

export function robotsTxt(): string {
  const rules = [
    "Allow: /",
    ...ROBOTS_DISALLOW.map((d) => `Disallow: ${d}`),
  ].join("\n");
  const groups = ["*", ...AI_CRAWLERS].map(
    (ua) => `User-agent: ${ua}\n${rules}`,
  );
  return `${groups.join("\n\n")}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

/** llms.txt for AI crawlers and chatbots: who Aphrody is and what it offers, in plain language. */
export function llmsTxt(): string {
  return [
    "# Aphrody",
    "",
    `> ${HOME.en.description}`,
    "",
    "Aphrody builds independent digital products, each with its own goals. Content is available in French and English.",
    "",
    "## Products",
    "",
    ...PRODUCTS.map(
      (p) =>
        `- ${p.url ? `[${p.name}](${p.url})` : p.name} (${p.status.en}): ${p.text.en}`,
    ),
    "",
    "## Contact",
    "",
    "- contact@aphrody.com",
    "",
    "## Discovery",
    "",
    `- [Full content](${SITE_URL}/llms-full.txt)`,
    `- [Sitemap index](${SITE_URL}/sitemap.xml)`,
    "",
  ].join("\n");
}

export function llmsFullTxt(): string {
  const parts: string[] = [llmsTxt(), "# Full content", ""];
  for (const l of LOCALES) {
    parts.push(
      `## ${NATIVE[l]}`,
      "",
      `${homeCopy(l).h1} ${homeCopy(l).intro}`,
      "",
    );
    for (const p of PRODUCTS)
      parts.push(
        `### ${p.name}`,
        ...(p.url ? [`URL: ${p.url}`] : []),
        `${p.status[l]}. ${p.text[l]}`,
        "",
      );
  }
  return parts.join("\n");
}

export function agentJson(): Record<string, unknown> {
  return {
    name: "Aphrody",
    description: HOME.en.description,
    url: SITE_URL + "/",
    version: "1.0.0",
    provider: { organization: "Aphrody", url: SITE_URL + "/" },
    documentationUrl: SITE_URL + "/llms.txt",
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["application/json", "text/event-stream"],
    authentication: { schemes: [] },
    skills: WEBMCP_TOOLS.map((t) => ({
      id: t.name,
      name: t.name,
      description: t.description,
      tags: ["search", "read-only"],
      endpoint: `${SITE_URL}${t.http.path}`,
    })),
    note: "Informal discovery document; read-only HTTP endpoints, no authentication.",
  };
}

export function webmcpJson(): Record<string, unknown> {
  return {
    name: "Aphrody",
    description:
      "Read-only tools exposed to in-browser agents through navigator.modelContext.",
    url: SITE_URL + "/",
    status:
      "discovery convention; the WebMCP API itself is a W3C Web Machine Learning CG draft and may change",
    registration:
      "navigator.modelContext.registerTool / provideContext, feature-detected",
    tools: WEBMCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      annotations: t.annotations,
      endpoint: `${SITE_URL}${t.http.path}`,
    })),
  };
}

export function adsTxt(cfg: GoogleConfig): string {
  if (!cfg.adsense) {
    return "# ads.txt for aphrody.com\n# No advertising seller is authorized: AdSense is not configured.\n";
  }
  const pub = cfg.adsense.replace(/^ca-/, "");
  return `# ads.txt for aphrody.com\ngoogle.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
}

export function sellersJson(contactEmail?: string): Record<string, unknown> {
  return {
    ...(contactEmail ? { contact_email: contactEmail } : {}),
    version: "1.0",
    identifiers: [],
    sellers: [],
  };
}

export function securityTxt(buildDate: string, contactEmail?: string): string {
  const exp = new Date(`${buildDate}T00:00:00Z`);
  exp.setUTCFullYear(exp.getUTCFullYear() + 1);
  return [
    `Contact: ${contactEmail ? "mailto:" + contactEmail : APP_URL + "/"}`,
    `Expires: ${exp.toISOString()}`,
    "Preferred-Languages: fr, en, zh-CN, ja, es",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    "",
  ].join("\n");
}

export function humansTxt(buildDate: string): string {
  return [
    "/* SITE */",
    "Name: Aphrody",
    `URL: ${SITE_URL}/`,
    `Last update: ${buildDate}`,
    "Contact: contact@aphrody.com",
    "",
  ].join("\n");
}

/** IndexNow key: 8..128 chars [a-zA-Z0-9-]; env INDEXNOW_KEY, else derived deterministically. */
export function indexNowKey(
  env: Record<string, string | undefined> = {},
): string {
  const k = (env.INDEXNOW_KEY || "").trim();
  if (/^[a-zA-Z0-9-]{8,128}$/.test(k)) return k;
  return new Bun.CryptoHasher("sha256")
    .update(`${SITE_URL}/indexnow`)
    .digest("hex")
    .slice(0, 32);
}

export function indexNowPayload(key: string): Record<string, unknown> {
  return {
    host: new URL(SITE_URL).host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: allIndexableUrls(),
  };
}
