// SPDX-License-Identifier: Apache-2.0
/**
 * Sovereign Content Shields & Tracker/Telemetry Filter Engine
 * Blocks ad networks, tracking pixels, and analytics beacons during Chromium crawl & indexing.
 */

export const BLOCKED_TRACKER_DOMAINS: readonly string[] = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "google-analytics.com",
  "googletagmanager.com",
  "connect.facebook.net",
  "analytics.tiktok.com",
  "bat.bing.com",
  "hotjar.com",
  "criteo.com",
  "outbrain.com",
  "taboola.com",
  "scorecardresearch.com",
  "quantserve.com",
  "adnxs.com",
  "rubiconproject.com",
  "pubmatic.com",
  "openx.net",
];

const TRACKER_PATH_PATTERNS: readonly RegExp[] = [
  /\/pixel(\.gif|\.png)?(\?|$)/i,
  /\/collect\?v=\d/i,
  /\/pagead\//i,
  /\/ads\//i,
  /\/beacon(\.js)?(\?|$)/i,
];

export class ContentShieldsEngine {
  private readonly domains: readonly string[];

  constructor(extraBlockedDomains: string[] = []) {
    this.domains = [
      ...BLOCKED_TRACKER_DOMAINS,
      ...extraBlockedDomains.map((d) => d.toLowerCase()),
    ];
  }

  shouldBlockUrl(rawUrl: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    for (const d of this.domains) {
      if (host === d || host.endsWith(`.${d}`)) {
        return true;
      }
    }
    const pathAndSearch = `${parsed.pathname}${parsed.search}`;
    return TRACKER_PATH_PATTERNS.some((re) => re.test(pathAndSearch));
  }

  filterUrls(urls: readonly string[]): {
    allowed: string[];
    blockedCount: number;
  } {
    const allowed: string[] = [];
    let blockedCount = 0;
    for (const u of urls) {
      if (this.shouldBlockUrl(u)) blockedCount++;
      else allowed.push(u);
    }
    return { allowed, blockedCount };
  }

  /**
   * Strips script/style/iframe/noscript tags using Bun's native C-speed HTMLRewriter
   * and extracts clean text, title, description, canonical URL, and outgoing links.
   */
  extractCleanDocument(
    html: string,
    baseUrl: string,
  ): {
    title: string;
    description: string;
    headings: string[];
    text: string;
    links: string[];
    trackersBlocked: number;
  } {
    let title = "";
    let description = "";
    const headings: string[] = [];
    const textParts: string[] = [];
    const rawLinks: string[] = [];

    let currentHeading = "";
    const rewriter = new HTMLRewriter()
      .on("script, style, noscript, iframe, svg", {
        element(el) {
          el.remove();
        },
      })
      .on("title", {
        text(t) {
          title += t.text;
        },
      })
      .on('meta[name="description"], meta[property="og:description"]', {
        element(el) {
          if (!description) {
            description = (el.getAttribute("content") || "").trim();
          }
        },
      })
      .on("h1, h2, h3", {
        element(el) {
          currentHeading = "";
          el.onEndTag(() => {
            const clean = currentHeading.replace(/\s+/g, " ").trim();
            if (clean) headings.push(clean);
            currentHeading = "";
          });
        },
        text(t) {
          currentHeading += t.text;
        },
      })
      .on("a[href]", {
        element(el) {
          const href = el.getAttribute("href");
          if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:")
          )
            return;
          try {
            rawLinks.push(new URL(href, baseUrl).href);
          } catch {}
        },
      })
      .on("body", {
        text(t) {
          const trimmed = t.text.replace(/\s+/g, " ").trim();
          if (trimmed) textParts.push(trimmed);
        },
      });

    rewriter.transform(html);

    const { allowed, blockedCount } = this.filterUrls([...new Set(rawLinks)]);
    return {
      title: title.replace(/\s+/g, " ").trim(),
      description,
      headings,
      text: textParts.join(" ").slice(0, 32_768),
      links: allowed,
      trackersBlocked: blockedCount,
    };
  }
}
