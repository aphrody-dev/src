// SPDX-License-Identifier: Apache-2.0
/**
 * Search cluster coordinator. The topology is read from infra/deploy.toml (`[nodes.*]`): a node's
 * `role` decides which workloads it may run. Nothing here names a host.
 *   - role "production": crawl, indexing, BM25 shards, app hosting, search egress
 *   - role "cdn-edge-and-test": proxy / CDN only
 *   - any other role (for example "build"): excluded from the search cluster
 */
import fleet from "../../../../infra/deploy.toml";
import { ChromiumBunCrawler, type CrawlPageResult } from "./crawler.ts";
import {
  APHRODY_TOP1_SUBDOMAIN_CATALOG,
  SovereignSearchShardDb,
  buildKnowledgeCard,
  matchSubdomainCatalog,
  type IndexedWebDocument,
  type ShardId,
  type SovereignKnowledgeCard,
  type SubdomainAppEntry,
} from "./indexer.ts";

export type WorkloadKind =
  | "google-custom-search"
  | "gemini-grounding"
  | "web-crawl"
  | "bm25-index"
  | "app-hosting"
  | "spacedrive-storage"
  | "proxy-cdn";

/** Workloads allowed per deploy.toml role. Unknown roles get none. */
export const ROLE_WORKLOADS: Readonly<Record<string, readonly WorkloadKind[]>> =
  {
    production: [
      "web-crawl",
      "bm25-index",
      "app-hosting",
      "spacedrive-storage",
      "google-custom-search",
      "gemini-grounding",
    ],
    "cdn-edge-and-test": ["proxy-cdn"],
  };

export type ClusterNodeId = string;

export interface ClusterNodeSpec {
  id: ClusterNodeId;
  provider: string;
  region: string;
  publicIp: string;
  wireguardIp: string;
  /** Verbatim `role` from infra/deploy.toml. */
  role: string;
  workloads: readonly WorkloadKind[];
}

interface FleetNodeToml {
  provider?: string;
  region?: string;
  public_ip: string;
  mesh_ip: string;
  role: string;
}

export function loadClusterTopology(
  nodes: Record<string, FleetNodeToml> = (
    fleet as unknown as { nodes: Record<string, FleetNodeToml> }
  ).nodes,
): Record<ClusterNodeId, ClusterNodeSpec> {
  const out: Record<ClusterNodeId, ClusterNodeSpec> = {};
  for (const [id, n] of Object.entries(nodes)) {
    out[id] = {
      id,
      provider: n.provider ?? "unknown",
      region: n.region ?? "unknown",
      publicIp: n.public_ip,
      wireguardIp: n.mesh_ip,
      role: n.role,
      workloads: ROLE_WORKLOADS[n.role] ?? [],
    };
  }
  return out;
}

export const CLUSTER_TOPOLOGY: Record<ClusterNodeId, ClusterNodeSpec> =
  loadClusterTopology();

export function nodesWithRole(
  role: string,
  topology: Record<ClusterNodeId, ClusterNodeSpec> = CLUSTER_TOPOLOGY,
): ClusterNodeSpec[] {
  return Object.values(topology).filter((n) => n.role === role);
}

/** The node that runs crawl, index and shards. Throws when deploy.toml declares none. */
export function productionNode(
  topology: Record<ClusterNodeId, ClusterNodeSpec> = CLUSTER_TOPOLOGY,
): ClusterNodeSpec {
  const node = nodesWithRole("production", topology)[0];
  if (!node) {
    throw new Error(
      'infra/deploy.toml declares no node with role = "production"',
    );
  }
  return node;
}

export function assertNodeWorkloadAllowed(
  nodeId: ClusterNodeId,
  workload: WorkloadKind,
  topology: Record<ClusterNodeId, ClusterNodeSpec> = CLUSTER_TOPOLOGY,
): void {
  const spec = topology[nodeId];
  if (!spec) {
    throw new Error(`Unknown cluster node "${nodeId}" (not in deploy.toml)`);
  }
  if (!spec.workloads.includes(workload)) {
    throw new Error(
      `Placement Policy Violation: node "${nodeId}" (role "${spec.role}") may not run "${workload}"; it belongs on a node with the matching role in infra/deploy.toml.`,
    );
  }
}

export interface FusedSearchHit {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  category: string;
  rrfScore: number;
  sources: Array<"shard0" | "shard1" | "aphrody-catalog" | "google-grounding">;
  subdomain?: string;
  localRoute?: string;
}

export interface ClusterSearchResponse {
  query: string;
  tookMs: number;
  rrfConstantK: number;
  routedVia: {
    /** Node with role "production": crawl, index, shards, grounding. */
    production: ClusterNodeSpec;
    /** Nodes with role "cdn-edge-and-test": proxy / CDN in front of production. */
    edgeProxies: ClusterNodeSpec[];
    groundingUsed: boolean;
  };
  knowledgeCard: SovereignKnowledgeCard | null;
  subdomainMatches: SubdomainAppEntry[];
  hits: FusedSearchHit[];
  totalIndexedDocs: {
    shard0: number;
    shard1: number;
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
  shard0DbPath?: string;
  shard1DbPath?: string;
  seedDefaults?: boolean;
  allowPrivateCrawl?: boolean;
  enableGoogleGrounding?: boolean;
  topology?: Record<ClusterNodeId, ClusterNodeSpec>;
}

export class ThreeVpsSearchCluster {
  readonly rrfK = 60;
  readonly topology: Record<ClusterNodeId, ClusterNodeSpec>;
  readonly production: ClusterNodeSpec;
  readonly shard0: SovereignSearchShardDb;
  readonly shard1: SovereignSearchShardDb;
  readonly crawler: ChromiumBunCrawler;
  private readonly enableGoogleGrounding: boolean;

  constructor(options: ThreeVpsClusterOptions = {}) {
    this.topology = options.topology ?? CLUSTER_TOPOLOGY;
    this.production = productionNode(this.topology);
    assertNodeWorkloadAllowed(this.production.id, "bm25-index", this.topology);
    assertNodeWorkloadAllowed(this.production.id, "web-crawl", this.topology);

    this.shard0 = new SovereignSearchShardDb(
      "shard0",
      options.shard0DbPath ?? ":memory:",
    );
    this.shard1 = new SovereignSearchShardDb(
      "shard1",
      options.shard1DbPath ?? ":memory:",
    );
    this.crawler = new ChromiumBunCrawler({
      ssrf: { allowPrivateNetwork: options.allowPrivateCrawl ?? false },
    });
    this.enableGoogleGrounding = options.enableGoogleGrounding ?? false;

    if (options.seedDefaults ?? true) {
      if (this.shard0.count() === 0) this.shard0.seedDefaults();
      if (this.shard1.count() === 0) this.shard1.seedDefaults();
    }
  }

  private pickShardForDomain(domain: string): SovereignSearchShardDb {
    let acc = 0;
    for (let i = 0; i < domain.length; i++) {
      acc = (acc * 31 + domain.charCodeAt(i)) >>> 0;
    }
    return acc % 2 === 0 ? this.shard0 : this.shard1;
  }

  ingestDocument(
    doc: Omit<IndexedWebDocument, "shard" | "crawledAt"> & {
      crawledAt?: number;
    },
  ): {
    shard: ShardId;
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

  async crawlAndIndex(
    url: string,
    options?: {
      renderWithChromium?: boolean;
      category?: IndexedWebDocument["category"];
    },
  ): Promise<CrawlPageResult & { indexedShard: ShardId }> {
    assertNodeWorkloadAllowed(this.production.id, "web-crawl", this.topology);
    const parsed = new URL(url);
    const targetShard = this.pickShardForDomain(parsed.hostname.toLowerCase());
    const result = await this.crawler.crawlPage(url, {
      shardDb: targetShard,
      category: options?.category ?? "web",
      renderWithChromium: options?.renderWithChromium,
    });
    return {
      ...result,
      indexedShard: targetShard.shardId,
    };
  }

  private async fetchOptionalGoogleGrounding(
    query: string,
  ): Promise<
    Array<{ url: string; title: string; snippet: string; domain: string }>
  > {
    if (!this.enableGoogleGrounding || !query.trim()) return [];
    assertNodeWorkloadAllowed(
      this.production.id,
      "google-custom-search",
      this.topology,
    );

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
    options?: { limit?: number; category?: string; useGrounding?: boolean },
  ): Promise<ClusterSearchResponse> {
    const started = performance.now();
    const query = rawQuery.trim();
    const limit = Math.max(1, Math.min(options?.limit ?? 12, 50));

    const [hits0, hits1, catalogMatches, groundingHits] = await Promise.all([
      Promise.resolve(this.shard0.search(query, limit * 2)),
      Promise.resolve(this.shard1.search(query, limit * 2)),
      Promise.resolve(matchSubdomainCatalog(query)),
      options?.useGrounding
        ? this.fetchOptionalGoogleGrounding(query)
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

    mergeRankedList(hits0, "shard0", 1.0);
    mergeRankedList(hits1, "shard1", 1.0);
    mergeRankedList(
      groundingHits.map((h) => ({ ...h, category: "web" })),
      "google-grounding",
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
        production: this.production,
        edgeProxies: nodesWithRole("cdn-edge-and-test", this.topology),
        groundingUsed: groundingHits.length > 0,
      },
      knowledgeCard: query ? buildKnowledgeCard(query) : null,
      subdomainMatches: catalogMatches.slice(0, 6),
      hits: sortedHits.slice(0, limit),
      totalIndexedDocs: {
        shard0: this.shard0.count(),
        shard1: this.shard1.count(),
        catalog: APHRODY_TOP1_SUBDOMAIN_CATALOG.length,
      },
    };
  }

  suggest(prefix: string, limit = 8): string[] {
    const s1 = this.shard0.suggest(prefix, limit);
    const s2 = this.shard1.suggest(prefix, limit);
    return [...new Set([...s1, ...s2])].slice(0, limit);
  }

  async probeClusterHealth(probeNetwork = false): Promise<ClusterHealthReport> {
    const entries: ClusterHealthReport["nodes"] = [];
    for (const spec of Object.values(this.topology)) {
      const indexedDocs =
        spec.id === this.production.id
          ? this.shard0.count() + this.shard1.count()
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
    this.shard0.close();
    this.shard1.close();
  }
}
