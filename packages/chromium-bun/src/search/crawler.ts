// SPDX-License-Identifier: Apache-2.0
/**
 * Sovereign Chromium + Bun Web Crawler (RFC 9309 robots.txt + SSRF Guard + Tracker Shields + CDP Render)
 */
import { launchHeadlessChromium } from "../browser/launcher.ts";
import { ContentShieldsEngine } from "../browser/shields.ts";
import { SsrfGuard, type SsrfGuardOptions } from "../browser/ssrf.ts";
import type { IndexedWebDocument, SovereignSearchShardDb } from "./indexer.ts";

export interface RobotsRuleSet {
  allow: string[];
  disallow: string[];
  crawlDelaySec?: number;
}

export interface CrawlPageResult {
  url: string;
  status: number;
  renderedWithChromium: boolean;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
  trackersBlocked: number;
  durationMs: number;
  blake3Hash?: string;
}

export function parseRobotsTxt(
  rawText: string,
  userAgent = "aphrodybot",
): RobotsRuleSet {
  const lines = rawText.split(/\r?\n/);
  const targetAgent = userAgent.toLowerCase();
  const specific: RobotsRuleSet = { allow: [], disallow: [] };
  const wildcard: RobotsRuleSet = { allow: [], disallow: [] };

  let currentAgents: string[] = [];
  let sawRuleInGroup = false;

  for (const rawLine of lines) {
    const clean = rawLine.split("#")[0]?.trim() ?? "";
    if (!clean) {
      currentAgents = [];
      sawRuleInGroup = false;
      continue;
    }
    const colonIdx = clean.indexOf(":");
    if (colonIdx <= 0) continue;

    const field = clean.slice(0, colonIdx).trim().toLowerCase();
    const value = clean.slice(colonIdx + 1).trim();

    if (field === "user-agent") {
      if (sawRuleInGroup) {
        currentAgents = [];
        sawRuleInGroup = false;
      }
      currentAgents.push(value.toLowerCase());
      continue;
    }

    sawRuleInGroup = true;
    const matchesSpecific = currentAgents.some(
      (ua) => targetAgent.includes(ua) && ua !== "*",
    );
    const matchesWildcard = currentAgents.includes("*");

    const pushTo = (bucket: RobotsRuleSet) => {
      if (field === "allow" && value) bucket.allow.push(value);
      else if (field === "disallow" && value) bucket.disallow.push(value);
      else if (field === "crawl-delay") {
        const delay = Number.parseFloat(value);
        if (!Number.isNaN(delay) && delay >= 0) bucket.crawlDelaySec = delay;
      }
    };

    if (matchesSpecific) pushTo(specific);
    if (matchesWildcard) pushTo(wildcard);
  }

  if (
    specific.allow.length > 0 ||
    specific.disallow.length > 0 ||
    specific.crawlDelaySec !== undefined
  ) {
    return specific;
  }
  return wildcard;
}

function patternMatchesPath(pattern: string, pathAndQuery: string): boolean {
  if (!pattern) return false;
  let regexStr = "^";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === "*") {
      regexStr += ".*";
    } else if (ch === "$" && i === pattern.length - 1) {
      regexStr += "$";
    } else {
      regexStr += ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(regexStr).test(pathAndQuery);
}

export function isAllowedByRobotsTxt(
  rules: RobotsRuleSet,
  targetUrl: string | URL,
): boolean {
  const u = typeof targetUrl === "string" ? new URL(targetUrl) : targetUrl;
  const pathAndQuery = `${u.pathname || "/"}${u.search || ""}`;

  let longestAllow = -1;
  let longestDisallow = -1;

  for (const allowPattern of rules.allow) {
    if (patternMatchesPath(allowPattern, pathAndQuery)) {
      longestAllow = Math.max(longestAllow, allowPattern.length);
    }
  }
  for (const disallowPattern of rules.disallow) {
    if (patternMatchesPath(disallowPattern, pathAndQuery)) {
      longestDisallow = Math.max(longestDisallow, disallowPattern.length);
    }
  }

  if (longestDisallow < 0) return true;
  if (longestAllow >= longestDisallow) return true;
  return false;
}

export interface ChromiumBunCrawlerOptions {
  ssrf?: SsrfGuardOptions;
  userAgent?: string;
  respectRobotsTxt?: boolean;
  renderMode?: "fast-html" | "chromium-cdp";
  timeoutMs?: number;
}

export class ChromiumBunCrawler {
  readonly ssrf: SsrfGuard;
  readonly shields: ContentShieldsEngine;
  readonly userAgent: string;
  readonly respectRobotsTxt: boolean;
  readonly renderMode: "fast-html" | "chromium-cdp";
  readonly timeoutMs: number;
  private readonly robotsCache = new Map<string, RobotsRuleSet>();

  constructor(options: ChromiumBunCrawlerOptions = {}) {
    this.ssrf = new SsrfGuard(options.ssrf);
    this.shields = new ContentShieldsEngine();
    this.userAgent =
      options.userAgent ??
      "AphrodyBot/2.1 (+https://aphrody.com/bot; Chromium-Bun Sovereign Indexer)";
    this.respectRobotsTxt = options.respectRobotsTxt ?? true;
    this.renderMode = options.renderMode ?? "fast-html";
    this.timeoutMs = options.timeoutMs ?? 12_000;
  }

  private async getRobotsRules(origin: string): Promise<RobotsRuleSet> {
    const cached = this.robotsCache.get(origin);
    if (cached) return cached;

    try {
      const robotsUrl = `${origin}/robots.txt`;
      await this.ssrf.validateUrl(robotsUrl);
      const res = await fetch(robotsUrl, {
        headers: { "User-Agent": this.userAgent },
        signal: AbortSignal.timeout(4_000),
      });
      if (!res.ok) {
        const open: RobotsRuleSet = { allow: [], disallow: [] };
        this.robotsCache.set(origin, open);
        return open;
      }
      const txt = await res.text();
      const parsed = parseRobotsTxt(txt, "aphrodybot");
      this.robotsCache.set(origin, parsed);
      return parsed;
    } catch {
      const open: RobotsRuleSet = { allow: [], disallow: [] };
      this.robotsCache.set(origin, open);
      return open;
    }
  }

  async crawlPage(
    rawUrl: string,
    options?: {
      shardDb?: SovereignSearchShardDb;
      category?: IndexedWebDocument["category"];
      renderWithChromium?: boolean;
    },
  ): Promise<CrawlPageResult> {
    const started = performance.now();
    const parsedUrl = new URL(rawUrl);

    await this.ssrf.validateUrl(parsedUrl);
    if (this.shields.shouldBlockUrl(parsedUrl.href)) {
      throw new Error(`Content Shields blocked tracker URL: ${parsedUrl.href}`);
    }

    if (this.respectRobotsTxt) {
      const rules = await this.getRobotsRules(parsedUrl.origin);
      if (!isAllowedByRobotsTxt(rules, parsedUrl)) {
        throw new Error(`Blocked by robots.txt policy for ${parsedUrl.href}`);
      }
    }

    const useChromium =
      options?.renderWithChromium ?? this.renderMode === "chromium-cdp";
    let html = "";
    let status = 200;

    if (useChromium) {
      await using browser = await launchHeadlessChromium({
        timeoutMs: this.timeoutMs,
      });
      const nav = await browser.client.navigate(parsedUrl.href, {
        waitUntil: "load",
      });
      if (nav.errorText) {
        throw new Error(`Chromium navigation failed: ${nav.errorText}`);
      }
      html = await browser.client.evaluate<string>(
        "document.documentElement.outerHTML",
      );
    } else {
      const res = await fetch(parsedUrl.href, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      status = res.status;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} while crawling ${parsedUrl.href}`);
      }
      html = await res.text();
    }

    const clean = this.shields.extractCleanDocument(html, parsedUrl.href);
    let blake3Hash: string | undefined;

    if (options?.shardDb) {
      const upserted = options.shardDb.upsertDocument({
        url: parsedUrl.href,
        title: clean.title || parsedUrl.hostname,
        description: clean.description || clean.text.slice(0, 220),
        headings: clean.headings,
        body: clean.text,
        domain: parsedUrl.hostname.toLowerCase(),
        category: options.category ?? "web",
        shard: options.shardDb.shardId,
        qualityScore: 0.92,
        crawledAt: Date.now(),
      });
      blake3Hash = upserted.hash;
    }

    return {
      url: parsedUrl.href,
      status,
      renderedWithChromium: useChromium,
      title: clean.title || parsedUrl.hostname,
      description: clean.description || clean.text.slice(0, 220),
      headings: clean.headings,
      text: clean.text,
      links: clean.links,
      trackersBlocked: clean.trackersBlocked,
      durationMs: Math.round((performance.now() - started) * 100) / 100,
      blake3Hash,
    };
  }
}
