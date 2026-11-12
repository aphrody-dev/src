// SPDX-License-Identifier: Apache-2.0
/**
 * 3-VPS Sovereign Datacenter Search Cluster Coordinator (fr1 + fr2 + usa)
 * Models the exact WireGuard/MASQUE 10.200.77.0/24 cluster defined in C:\src\deploy.toml:
 *   - fr1 (51.77.147.152 / 10.200.77.1, OVH EU): Primary Search Edge Ingress, Autocomplete & BM25 Shard 0
 *   - fr2 (51.255.162.6  / 10.200.77.3, OVH EU): Headless Chromium CDP Crawler Pool, Spacedrive & BM25 Shard 1
 *   - usa (72.60.186.43  / 10.200.77.5, Hostinger US): Strict Google Search / Gemini Grounding Egress ONLY
 */
import { ChromiumBunCrawler, type CrawlPageResult } from "./crawler.ts";
import {
  APHRODY_TOP1_SUBDOMAIN_CATALOG,
  SovereignSearchShardDb,
  buildKnowledgeCard,
  matchSubdomainCatalog,
  type IndexedWebDocument,
  type SovereignKnowledgeCard,
  type SubdomainAppEntry,
} from "./indexer.ts";

export type ClusterNodeId = "fr1" | "fr2" | "usa";

export interface ClusterNodeSpec {
  id: ClusterNodeId;
  provider: "ovh" | "hostinger";
  region: "eu-fr" | "us-google-egress";
  publicIp: string;
  wireguardIp: string;
  role: string;
  allowNonGoogleWorkloads: boolean;
  services: string[];
}

export const THREE_VPS_CLUSTER_TOPOLOGY: Record<
  ClusterNodeId,
  ClusterNodeSpec
> = {
  fr1: {
    id: "fr1",
    provider: "ovh",
    region: "eu-fr",
    publicIp: "51.77.147.152",
    wireguardIp: "10.200.77.1",
    role: "primary-eu-production-edge",
    allowNonGoogleWorkloads: true,
    services: [
      "search-edge-ingress",
      "fts5-bm25-shard-0",
      "autocomplete",
      "aphrody-web",
      "yolo-web",
    ],
  },
  fr2: {
    id: "fr2",
    provider: "ovh",
    region: "eu-fr",
    publicIp: "51.255.162.6",
    wireguardIp: "10.200.77.3",
    role: "eu-ha-replica-chromium-crawler",
    allowNonGoogleWorkloads: true,
    services: [
      "headless-chromium-cdp-pool",
      "fts5-bm25-shard-1",
      "robots-ssrf-crawler",
      "spacedrive-cas-replica",
    ],
  },
  usa: {
    id: "usa",
    provider: "hostinger",
    region: "us-google-egress",
    publicIp: "72.60.186.43",
    wireguardIp: "10.200.77.5",
    role: "strict-google-gemini-egress-only",
    allowNonGoogleWorkloads: false,
    services: ["google-custom-search-egress", "gemini-grounding-proxy"],
  },
};

export type WorkloadKind =
  | "google-custom-search"
  | "gemini-grounding"
  | "web-crawl"
  | "bm25-index"
  | "app-hosting"
  | "spacedrive-storage";

export function assertNodeWorkloadAllowed(
  nodeId: ClusterNodeId,
  workload: WorkloadKind,
): void {
  const spec = THREE_VPS_CLUSTER_TOPOLOGY[nodeId];
  if (!spec.allowNonGoogleWorkloads) {
    if (
      workload !== "google-custom-search" &&
      workload !== "gemini-grounding"
    ) {
      throw new Error(
        `Sovereign Egress Policy Violation: Node "${nodeId}" (${spec.publicIp} / ${spec.wireguardIp}) is reserved strictly for Google/Gemini egress; "${workload}" must run on fr1 or fr2.`,
      );
    }
  }
}

export interface FusedSearchHit {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  category: string;
  rrfScore: number;
  sources: Array<
    "fr1-shard0" | "fr2-shard1" | "aphrody-catalog" | "usa-google-grounding"
  >;
  subdomain?: string;
  localRoute?: string;
}

export interface ClusterSearchResponse {
  query: string;
  tookMs: number;
  rrfConstantK: number;
  routedVia: {
    ingress: ClusterNodeSpec;
    crawlerReplica: ClusterNodeSpec;
    googleGrounding: ClusterNodeSpec;
    usaGroundingUsed: boolean;
  };
  knowledgeCard: SovereignKnowledgeCard | null;
  subdomainMatches: SubdomainAppEntry[];
  hits: FusedSearchHit[];
  totalIndexedDocs: {
    fr1: number;
    fr2: number;
    catalog: number;
  };
}

export interface ClusterHealthReport {
  checkedAt: string;
  meshSubnet: string;
  rrfConstantK: number;
  nodes: Array<{
    spec: ClusterNodeSpec;
    reachable: boolean;
    latencyMs: number | null;
    indexedDocs: number;
  }>;
}

export interface ThreeVpsClusterOptions {
  fr1DbPath?: string;
  fr2DbPath?: string;
  seedDefaults?: boolean;
  allowPrivateCrawl?: boolean;
  enableUsaGoogleGrounding?: boolean;
}

export class ThreeVpsSearchCluster {
  readonly rrfK = 60;
  readonly shardFr1: SovereignSearchShardDb;
  readonly shardFr2: SovereignSearchShardDb;
  readonly crawlerFr2: ChromiumBunCrawler;
  private readonly enableUsaGoogleGrounding: boolean;

  constructor(options: ThreeVpsClusterOptions = {}) {
    assertNodeWorkloadAllowed("fr1", "bm25-index");
    assertNodeWorkloadAllowed("fr2", "web-crawl");

    this.shardFr1 = new SovereignSearchShardDb(
      "fr1",
      options.fr1DbPath ?? ":memory:",
    );
    this.shardFr2 = new SovereignSearchShardDb(
      "fr2",
      options.fr2DbPath ?? ":memory:",
    );
    this.crawlerFr2 = new ChromiumBunCrawler({
      ssrf: { allowPrivateNetwork: options.allowPrivateCrawl ?? false },
    });
    this.enableUsaGoogleGrounding = options.enableUsaGoogleGrounding ?? false;

    if (options.seedDefaults ?? true) {
      if (this.shardFr1.count() === 0) this.shardFr1.seedDefaults();
      if (this.shardFr2.count() === 0) this.shardFr2.seedDefaults();
    }
  }

  private pickShardForDomain(domain: string): SovereignSearchShardDb {
    let acc = 0;
    for (let i = 0; i < domain.length; i++) {
      acc = (acc * 31 + domain.charCodeAt(i)) >>> 0;
    }
    return acc % 2 === 0 ? this.shardFr1 : this.shardFr2;
  }

  ingestDocument(
    doc: Omit<IndexedWebDocument, "shard" | "crawledAt"> & {
      crawledAt?: number;
    },
  ): {
    shard: "fr1" | "fr2";
    hash: string;
    updated: boolean;
  } {
    const targetShard = this.pickShardForDomain(doc.domain);
    const res = targetShard.upsertDocument({
      ...doc,
      shard: targetShard.shardId,
      crawledAt: doc.crawledAt ?? Date.now(),
    });
    return { shard: targetShard.shardId, ...res };
  }

  async crawlAndIndexOnFr2(
    url: string,
    options?: {
      renderWithChromium?: boolean;
      category?: IndexedWebDocument["category"];
    },
  ): Promise<CrawlPageResult & { indexedShard: "fr1" | "fr2" }> {
    assertNodeWorkloadAllowed("fr2", "web-crawl");
    const parsed = new URL(url);
    const targetShard = this.pickShardForDomain(parsed.hostname.toLowerCase());
    const result = await this.crawlerFr2.crawlPage(url, {
      shardDb: targetShard,
      category: options?.category ?? "web",
      renderWithChromium: options?.renderWithChromium,
    });
    return {
      ...result,
      indexedShard: targetShard.shardId,
    };
  }

  private async fetchOptionalUsaGoogleGrounding(
    query: string,
  ): Promise<
    Array<{ url: string; title: string; snippet: string; domain: string }>
  > {
    if (!this.enableUsaGoogleGrounding || !query.trim()) return [];
    assertNodeWorkloadAllowed("usa", "google-custom-search");

    const apiKey =
      Bun.env.GOOGLE_SEARCH_API_KEY || Bun.env.GEMINI_API_KEY || "";
    const cx = Bun.env.GOOGLE_SEARCH_CX || "";
    if (!apiKey || !cx) return [];

    try {
      const endpoint = new URL(
        "https://customsearch.googleapis.com/customsearch/v1",
      );
      endpoint.searchParams.set("key", apiKey);
      endpoint.searchParams.set("cx", cx);
      endpoint.searchParams.set("q", query);
      endpoint.searchParams.set("num", "5");

      const res = await fetch(endpoint.href, {
        signal: AbortSignal.timeout(3_500),
      });
      if (!res.ok) return [];
      const payload = (await res.json()) as {
        items?: Array<{ link?: string; title?: string; snippet?: string }>;
      };
      return (payload.items ?? [])
        .filter(
          (it) => typeof it.link === "string" && typeof it.title === "string",
        )
        .map((it) => {
          const u = new URL(it.link!);
          return {
            url: u.href,
            title: it.title!,
            snippet: it.snippet ?? "",
            domain: u.hostname.toLowerCase(),
          };
        });
    } catch {
      return [];
    }
  }

  async search(
    rawQuery: string,
    options?: { limit?: number; category?: string; useUsaGrounding?: boolean },
  ): Promise<ClusterSearchResponse> {
    const started = performance.now();
    const query = rawQuery.trim();
    const limit = Math.max(1, Math.min(options?.limit ?? 12, 50));

    const [hitsFr1, hitsFr2, catalogMatches, usaHits] = await Promise.all([
      Promise.resolve(this.shardFr1.search(query, limit * 2)),
      Promise.resolve(this.shardFr2.search(query, limit * 2)),
      Promise.resolve(matchSubdomainCatalog(query)),
      options?.useUsaGrounding
        ? this.fetchOptionalUsaGoogleGrounding(query)
        : Promise.resolve([]),
    ]);

    const fused = new Map<string, FusedSearchHit>();

    const mergeRankedList = (
      items: Array<{
        url: string;
        title: string;
        snippet: string;
        domain: string;
        category: string;
        subdomain?: string;
        localRoute?: string;
      }>,
      source: FusedSearchHit["sources"][number],
      weight = 1.0,
    ) => {
      for (let rank = 0; rank < items.length; rank++) {
        const item = items[rank]!;
        const rrfIncrement = weight / (this.rrfK + rank + 1);
        const existing = fused.get(item.url);
        if (existing) {
          existing.rrfScore += rrfIncrement;
          if (!existing.sources.includes(source)) existing.sources.push(source);
          if (!existing.subdomain && item.subdomain)
            existing.subdomain = item.subdomain;
          if (!existing.localRoute && item.localRoute)
            existing.localRoute = item.localRoute;
        } else {
          fused.set(item.url, {
            url: item.url,
            title: item.title,
            snippet: item.snippet,
            domain: item.domain,
            category: item.category,
            rrfScore: rrfIncrement,
            sources: [source],
            subdomain: item.subdomain,
            localRoute: item.localRoute,
          });
        }
      }
    };

    mergeRankedList(
      catalogMatches.map((app) => ({
        url: app.url,
        title: app.title,
        snippet: app.summary,
        domain: app.subdomain,
        category: app.category,
        subdomain: app.subdomain,
        localRoute: app.localRoute,
      })),
      "aphrody-catalog",
      1.35,
    );

    mergeRankedList(hitsFr1, "fr1-shard0", 1.0);
    mergeRankedList(hitsFr2, "fr2-shard1", 1.0);
    mergeRankedList(
      usaHits.map((h) => ({ ...h, category: "web" })),
      "usa-google-grounding",
      0.95,
    );

    let sortedHits = [...fused.values()]
      .map((h) => ({
        ...h,
        rrfScore: Math.round(h.rrfScore * 100_000) / 100_000,
      }))
      .sort((a, b) => b.rrfScore - a.rrfScore);

    if (options?.category && options.category !== "all") {
      sortedHits = sortedHits.filter((h) => h.category === options.category);
    }

    return {
      query,
      tookMs: Math.round((performance.now() - started) * 100) / 100,
      rrfConstantK: this.rrfK,
      routedVia: {
        ingress: THREE_VPS_CLUSTER_TOPOLOGY.fr1,
        crawlerReplica: THREE_VPS_CLUSTER_TOPOLOGY.fr2,
        googleGrounding: THREE_VPS_CLUSTER_TOPOLOGY.usa,
        usaGroundingUsed: usaHits.length > 0,
      },
      knowledgeCard: query ? buildKnowledgeCard(query) : null,
      subdomainMatches: catalogMatches.slice(0, 6),
      hits: sortedHits.slice(0, limit),
      totalIndexedDocs: {
        fr1: this.shardFr1.count(),
        fr2: this.shardFr2.count(),
        catalog: APHRODY_TOP1_SUBDOMAIN_CATALOG.length,
      },
    };
  }

  suggest(prefix: string, limit = 8): string[] {
    const s1 = this.shardFr1.suggest(prefix, limit);
    const s2 = this.shardFr2.suggest(prefix, limit);
    return [...new Set([...s1, ...s2])].slice(0, limit);
  }

  async probeClusterHealth(probeNetwork = false): Promise<ClusterHealthReport> {
    const entries: ClusterHealthReport["nodes"] = [];
    for (const id of ["fr1", "fr2", "usa"] as const) {
      const spec = THREE_VPS_CLUSTER_TOPOLOGY[id];
      const indexedDocs =
        id === "fr1"
          ? this.shardFr1.count()
          : id === "fr2"
            ? this.shardFr2.count()
            : 0;

      if (!probeNetwork) {
        entries.push({
          spec,
          reachable: true,
          latencyMs: 0,
          indexedDocs,
        });
        continue;
      }

      const t0 = performance.now();
      let reachable = false;
      try {
        const res = await fetch(`https://${spec.publicIp}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(2_000),
        }).catch(() =>
          fetch(`http://${spec.publicIp}`, {
            method: "HEAD",
            signal: AbortSignal.timeout(2_000),
          }),
        );
        reachable = res.status > 0;
      } catch {
        reachable = false;
      }
      entries.push({
        spec,
        reachable,
        latencyMs: reachable
          ? Math.round((performance.now() - t0) * 100) / 100
          : null,
        indexedDocs,
      });
    }

    return {
      checkedAt: new Date().toISOString(),
      meshSubnet: "10.200.77.0/24",
      rrfConstantK: this.rrfK,
      nodes: entries,
    };
  }

  close(): void {
    this.shardFr1.close();
    this.shardFr2.close();
  }
}
