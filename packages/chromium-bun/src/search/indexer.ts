// SPDX-License-Identifier: Apache-2.0
/**
 * Sovereign Search Shard Indexer (bun:sqlite WAL + FTS5 BM25 + Blake3 Deduplication)
 * Merges yolo-web + aphrody-web Top-1 Subdomain Catalog, Knowledge Cards, and Sharded Index.
 */
import { Database } from "bun:sqlite";

export interface IndexedWebDocument {
  url: string;
  title: string;
  description: string;
  headings: string[];
  body: string;
  domain: string;
  category: "app" | "docs" | "web" | "infra" | "design" | "code";
  shard: "fr1" | "fr2";
  qualityScore: number;
  crawledAt: number;
  blake3Hash?: string;
}

export interface ShardSearchHit {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  category: IndexedWebDocument["category"];
  shard: "fr1" | "fr2";
  bm25Score: number;
  qualityScore: number;
  crawledAt: number;
}

export interface SubdomainAppEntry {
  slug: string;
  subdomain: string;
  url: string;
  localRoute: string;
  title: string;
  category:
    "creative" | "office" | "drive" | "framework" | "systems" | "search";
  summary: string;
  keywords: string[];
  stack: string[];
}

export interface SovereignKnowledgeCard {
  title: string;
  subtitle: string;
  summary: string;
  canonicalUrl: string;
  facts: Array<{ label: string; value: string }>;
  subdomain?: string;
}

export const APHRODY_TOP1_SUBDOMAIN_CATALOG: readonly SubdomainAppEntry[] = [
  {
    slug: "craft",
    subdomain: "craft.aphrody.app",
    url: "https://aphrody.com/?suite=craft",
    localRoute: "/?suite=craft",
    title: "Craft Creative Cloud — WASM & WebGPU Studio",
    category: "creative",
    summary:
      "Unified creative studio combining PhotoCraft (RGBA WASM kernels), VectorCraft (SVG path boolean & M3 optimizer), FigCraft (CraftUI auto-layout tokens), ShaderCraft (WGSL 3D raymarching), AudioCraft (PCM16 WAV synthesizer), and CodeCraft (WAT to WASM binary compiler).",
    keywords: [
      "craft",
      "craftui",
      "photocraft",
      "vectorcraft",
      "figcraft",
      "shadercraft",
      "audiocraft",
      "codecraft",
      "adobe",
      "creative",
      "wasm",
      "webgpu",
      "design",
    ],
    stack: ["Bun v1.4.4", "WebAssembly", "WebGPU WGSL", "Material Design 3"],
  },
  {
    slug: "office",
    subdomain: "office.aphrody.app",
    url: "https://aphrody.com/?suite=office",
    localRoute: "/?suite=office",
    title: "Fluent Office 365 — WordCraft, GridCraft & DeckCraft",
    category: "office",
    summary:
      "Zero-dependency Fluent UI 2 productivity suite featuring WordCraft (native OOXML .docx ZIP exporter via Bun.deflateSync), GridCraft (deterministic recursive-descent formula engine with SUM/AVG/MIN/MAX/IF/NPV), and DeckCraft (16:9 vector presentation studio).",
    keywords: [
      "office",
      "word",
      "excel",
      "powerpoint",
      "wordcraft",
      "gridcraft",
      "deckcraft",
      "docx",
      "spreadsheet",
      "fluent",
      "microsoft 365",
    ],
    stack: [
      "Bun v1.4.4",
      "Fluent UI 2",
      "OOXML .docx",
      "Zero-Eval Formula AST",
    ],
  },
  {
    slug: "drive",
    subdomain: "drive.aphrody.app",
    url: "https://aphrody.com/?suite=drive",
    localRoute: "/?suite=drive",
    title: "Spacedrive VDFS — Virtual Distributed File System",
    category: "drive",
    summary:
      "Content-addressed Virtual Distributed File System (sd:// locations, Blake3 CAS deduplication, tags, albums, and instant preview) replicated across fr1 and fr2 NVMe storage.",
    keywords: [
      "spacedrive",
      "drive",
      "vdfs",
      "files",
      "storage",
      "blake3",
      "cas",
      "cloud",
      "google drive",
    ],
    stack: ["Spacedrive VDFS", "bun:sqlite WAL", "Blake3 CAS", "OVH NVMe"],
  },
  {
    slug: "yolo",
    subdomain: "yolo.aphrody.app",
    url: "https://yolo.aphrody.com/",
    localRoute: "/?suite=yolo",
    title: "Yolo Fullstack Framework — Reproducible Bun v1.4.4 Stack",
    category: "framework",
    summary:
      "Deterministic fullstack Bun v1.4.4 framework exploiting Bun.serve, HTMLRewriter SSR CSP nonces, .yolo/graph.sqlite AST module graph, virtual M3 icon/token plugins, <aphrody-pet> WebGPU/Canvas2D companion, and 3-VPS cluster telemetry.",
    keywords: [
      "yolo",
      "yolo-web",
      "yolo-rs",
      "framework",
      "fullstack",
      "bun",
      "ssr",
      "htmlrewriter",
      "m3",
    ],
    stack: ["Bun v1.4.4", "bun:sqlite", "HTMLRewriter", "Google M3 HCT"],
  },
  {
    slug: "search",
    subdomain: "search.aphrody.app",
    url: "https://aphrody.com/?q=aphrody",
    localRoute: "/?q=aphrody",
    title: "Aphrody 3-VPS Datacenter Search & Chromium Crawler",
    category: "search",
    summary:
      "End-to-end distributed search engine uniting fr1 (OVH Edge Ingress & BM25 Shard 0), fr2 (Headless Chromium CDP Render Pool & BM25 Shard 1), and usa (Strict Google/Gemini Grounding Egress) via Reciprocal Rank Fusion (RRF k=60).",
    keywords: [
      "search",
      "crawler",
      "chromium",
      "cdp",
      "bm25",
      "fts5",
      "rrf",
      "cluster",
      "datacenter",
      "google search",
    ],
    stack: [
      "Chromium CDP",
      "Bun v1.4.4",
      "SQLite FTS5 BM25",
      "WireGuard 10.200.77.0/24",
    ],
  },
  {
    slug: "studio",
    subdomain: "studio.aphrody.app",
    url: "https://aphrody.com/?suite=studio",
    localRoute: "/?suite=studio",
    title: "Locally Uncensored Studio — Sovereign Open-Weights Router",
    category: "systems",
    summary:
      "Direct sovereign inference studio routing across ring3-agent (:8787 CUDA sm_89 / AVX2), local llama-server (:8129), OpenCode (:4318), and deterministic local synthesis without cloud refusals.",
    keywords: [
      "locally uncensored",
      "heretic",
      "ring3",
      "studio",
      "cuda",
      "sm_89",
      "local",
      "inference",
      "open weights",
    ],
    stack: ["ring3-agent Rust", "CUDA 13.4 sm_89", "AVX2", "Bun v1.4.4"],
  },
  {
    slug: "zed",
    subdomain: "zed.aphrody.app",
    url: "https://aphrody.com/?suite=craft&tool=codecraft",
    localRoute: "/?suite=craft&tool=codecraft",
    title: "Zed GPUI & CodeCraft — Sub-ms Multiplayer Code Surface",
    category: "systems",
    summary:
      "GPU-accelerated code editing architecture paired with CodeCraft WAT-to-WASM assembler, bytecode inspector, and Tree-sitter syntax primitives.",
    keywords: ["zed", "gpui", "editor", "rust", "code", "wasm", "wat"],
    stack: ["Rust 2024", "GPUI", "WebAssembly", "Tree-sitter"],
  },
  {
    slug: "cosmic",
    subdomain: "cosmic.aphrody.app",
    url: "https://aphrody.com/?suite=workspace",
    localRoute: "/?suite=workspace",
    title: "COSMIC & Hyprland WSLg Wayland Desktop Compositor",
    category: "systems",
    summary:
      "Pure-Rust Wayland compositor and Omarchy + CachyOS + Arch WSL2 distribution architecture integrated with Aphrody M3 + Fluent 2 windowing.",
    keywords: [
      "cosmic",
      "wayland",
      "hyprland",
      "wslg",
      "linux",
      "cachyos",
      "omarchy",
      "desktop",
    ],
    stack: ["Rust 2024", "Smithay / Wayland", "Linux 7.4", "CachyOS"],
  },
  {
    slug: "bun",
    subdomain: "bun.aphrody.app",
    url: "https://yolo.aphrody.com/#primitives",
    localRoute: "/?suite=yolo",
    title: "Aphrody Bun v1.4.4 Full-Rust Fork & Kernel io_uring Runtime",
    category: "framework",
    summary:
      "Zero-dependency Full-Rust JavaScript/TypeScript runtime with native Bun.SQL, bun:sqlite, Bun.Image, Bun.Archive, HTMLRewriter, Bun.password Argon2id, and Linux 7.4 binfmt_bun.",
    keywords: [
      "bun",
      "bunjs",
      "runtime",
      "io_uring",
      "binfmt_bun",
      "sqlite",
      "argon2id",
    ],
    stack: ["Bun v1.4.4 Full-Rust", "Linux 7.4 io_uring", "Zig / Rust"],
  },
  {
    slug: "chromium",
    subdomain: "chromium.aphrody.app",
    url: "https://aphrody.com/?suite=vision",
    localRoute: "/?suite=vision",
    title: "Chromium-Bun Sovereign Browser Engine & CDP Inspector",
    category: "search",
    summary:
      "6-layer Chromium Blink/Skia/Dawn WebGPU extraction paired with Bun networking, SSRF guard, tracker shields, and automated Core Web Vitals verification.",
    keywords: [
      "chromium",
      "blink",
      "v8",
      "dawn",
      "skia",
      "browser",
      "webgpu",
      "lighthouse",
      "vitals",
    ],
    stack: [
      "Chromium M136+",
      "Dawn WebGPU",
      "Bun CDP",
      "SSRF + Tracker Shields",
    ],
  },
];

export const SEED_DOCUMENTS_FR1: readonly Omit<
  IndexedWebDocument,
  "crawledAt" | "blake3Hash"
>[] = [
  {
    url: "https://aphrody.com/",
    title:
      "Aphrody — Sovereign Search, Craft Creative Cloud, Fluent Office & Spacedrive",
    description:
      "Sub-100ms unified web platform built on Pure Bun v1.4.4 Full-Rust: 3-VPS Datacenter Search, Craft WASM/WebGPU Creative Studio, Fluent 2 Office (.docx / Formulas / Decks), Spacedrive VDFS, and M3 Workspace.",
    headings: [
      "Aphrody Sovereign Platform",
      "Craft Creative Cloud",
      "Fluent Office 365",
      "Spacedrive VDFS",
    ],
    body: "Aphrody unifies distributed 3-VPS search, CraftUI creative tools (PhotoCraft, VectorCraft, FigCraft, ShaderCraft, AudioCraft, CodeCraft), Fluent 2 Office (WordCraft OOXML .docx, GridCraft spreadsheet formulas, DeckCraft slides), Spacedrive content-addressed storage, M3 Mail/Notes/Calendar/Contacts/Photos, Aphrody Pet WebGPU companion, and Locally Uncensored open-weights studio.",
    domain: "aphrody.com",
    category: "app",
    shard: "fr1",
    qualityScore: 1.0,
  },
  {
    url: "https://yolo.aphrody.com/",
    title: "Yolo — Reproducible Fullstack Aphrody Bun v1.4.4 Framework",
    description:
      "Pixel-perfect Google Material Design 3 fullstack Bun framework with .yolo/graph.sqlite module graph, HTMLRewriter SSR CSP nonces, virtual M3 icon/token bundler plugins, and Aphrody Pet.",
    headings: [
      "Yolo Fullstack Bun Framework",
      "AST Module Graph",
      "Material Symbols & Aphrody Pet",
      "3-VPS Search Telemetry",
    ],
    body: "Yolo exploits every native capability of Bun v1.4.4: Bun.serve HTTP/WebSocket, HTMLRewriter streaming SSR with per-request CSP nonces, bun:sqlite WAL module dependency graph, Bun.Transpiler zero-dep AST import scanning, Bun.Image, Bun.Archive, Bun.password Argon2id, Bun.CryptoHasher Blake3, Bun.color, Bun.semver, and standalone bytecode compilation.",
    domain: "yolo.aphrody.com",
    category: "code",
    shard: "fr1",
    qualityScore: 0.99,
  },
  {
    url: "https://aphrody.com/?suite=craft",
    title:
      "Craft Creative Cloud — PhotoCraft, VectorCraft, FigCraft, ShaderCraft & CodeCraft",
    description:
      "Zero-dependency browser + Bun WASM/WebGPU creative suite with real binary WebAssembly pixel & audio DSP kernels, SVG path optimization, M3 HCT token generation, and WGSL shaders.",
    headings: [
      "PhotoCraft RGBA WASM",
      "VectorCraft SVG Optimizer",
      "FigCraft M3 UI Studio",
      "ShaderCraft WGSL 3D",
    ],
    body: "Craft Creative Cloud delivers Adobe Creative Cloud class workflows inside a sub-14KB critical path shell: real WebAssembly binary image convolution and exposure kernels, SVG precision path minification, Material Design 3 HCT dynamic color palettes, 60fps WebGPU/Canvas2D shaders, 16-bit PCM WAV synthesis, and WAT to WASM compilation.",
    domain: "aphrody.com",
    category: "design",
    shard: "fr1",
    qualityScore: 0.97,
  },
  {
    url: "https://aphrody.com/?suite=office",
    title:
      "Fluent 2 Office Suite — WordCraft (.docx), GridCraft (Formulas) & DeckCraft",
    description:
      "Native Fluent UI 2 productivity apps with standards-compliant OOXML .docx generation, deterministic spreadsheet formula evaluation, and vector slide decks.",
    headings: [
      "WordCraft OOXML .docx",
      "GridCraft Spreadsheet Engine",
      "DeckCraft Presentations",
    ],
    body: "Edit rich documents and export genuine PKZIP OOXML .docx archives built with Bun.deflateSync, run financial and statistical formulas (SUM, AVG, MIN, MAX, ROUND, IF, NPV) via a pure recursive-descent parser with zero eval(), and present high-contrast 16:9 vector decks.",
    domain: "aphrody.com",
    category: "app",
    shard: "fr1",
    qualityScore: 0.96,
  },
  {
    url: "https://aphrody.com/?suite=drive",
    title:
      "Spacedrive VDFS — Blake3 Content-Addressed Virtual Distributed File System",
    description:
      "Manage files across sd://virtual-root, OVH NVMe nodes, and local workspaces with deterministic Blake3 content hashing, tags, and instant search.",
    headings: [
      "Spacedrive Virtual Locations",
      "Blake3 CAS Storage",
      "Cross-Device File Index",
    ],
    body: "Spacedrive indexes documents, images, vectors, audio, and archives using 256-bit Blake3 content hashes stored in bun:sqlite WAL tables, eliminating duplicate blobs across fr1 and fr2.",
    domain: "aphrody.com",
    category: "infra",
    shard: "fr1",
    qualityScore: 0.95,
  },
  {
    url: "https://dragonballfr.com/",
    title:
      "Shenron — Dragon Ball Encyclopedia, Streaming Engine & Sovereign API",
    description:
      "High-velocity media and encyclopedia platform powered by Aphrody edge caching and Bun v1.4.4.",
    headings: ["Encyclopedia", "Episodes & Kanzenban Index", "Streaming API"],
    body: "Shenron serves structured canon encyclopedia entries, frame-accurate episode metadata, and low-latency media delivery on the OVH EU mesh.",
    domain: "dragonballfr.com",
    category: "web",
    shard: "fr1",
    qualityScore: 0.9,
  },
  {
    url: "https://rosegriffon.fr/",
    title: "RoseGriffon — Literature, Publishing & Interactive Gaming Platform",
    description:
      "Independent French publishing house, editorial studio, and community gaming platform.",
    headings: [
      "Editorial Catalog",
      "Interactive Chronicles",
      "Community Events",
    ],
    body: "RoseGriffon combines digital typography, serialized literature publishing, and community event orchestration hosted on the sovereign EU cluster.",
    domain: "rosegriffon.fr",
    category: "web",
    shard: "fr1",
    qualityScore: 0.9,
  },
];

export const SEED_DOCUMENTS_FR2: readonly Omit<
  IndexedWebDocument,
  "crawledAt" | "blake3Hash"
>[] = [
  {
    url: "https://aphrody.com/docs/cluster-3vps",
    title: "Aphrody 3-VPS WireGuard + Cloudflare MASQUE Datacenter Topology",
    description:
      "Production datacenter architecture uniting fr1 (51.77.147.152 OVH Edge), fr2 (51.255.162.6 OVH Chromium Crawler & Replica), and usa (72.60.186.43 Strict Google/Gemini Egress).",
    headings: [
      "fr1 Primary EU Edge",
      "fr2 Headless Chromium & Replica",
      "usa Strict Google Grounding Egress",
    ],
    body: "WireGuard subnet 10.200.77.0/24 interconnects fr1 (10.200.77.1), fr2 (10.200.77.3), and usa (10.200.77.5). All non-Google workloads are deterministically pinned to EU nodes fr1 and fr2, while usa executes exclusively Google Search Grounding and Gemini API egress.",
    domain: "aphrody.com",
    category: "infra",
    shard: "fr2",
    qualityScore: 0.98,
  },
  {
    url: "https://aphrody.com/docs/chromium-bun-engine",
    title: "Chromium-Bun 6-Layer Browser & Crawler Architecture",
    description:
      "Blink HTML/CSS layout, Skia/Dawn WebGPU rendering, V8/JSC comparison benchmarks, SSRF guard, tracker shields, and Reciprocal Rank Fusion search.",
    headings: [
      "6-Layer Extraction",
      "CDP WebSocket Automation",
      "Core Web Vitals & Lighthouse Gate",
    ],
    body: "Chromium-Bun pairs headless Chromium M136+ over pure-Bun WebSocket CDP with C-speed HTMLRewriter text extraction, DNS-rebinding SSRF protection, tracker domain filtering, and SQLite FTS5 BM25 ranking.",
    domain: "aphrody.com",
    category: "code",
    shard: "fr2",
    qualityScore: 0.97,
  },
  {
    url: "https://aphrody.com/docs/design",
    title: "Aphrody Design System — Material 3 tokens, Material Web, Material Symbols",
    description:
      "Material 3 color roles generated by Material Color Utilities from the brand seed, Material Web components, Material Symbols, Figma variables and DESIGN.md (packages/design).",
    headings: ["Material 3 tokens", "Material Web components", "Material Symbols"],
    body: "packages/design generates CSS, Rust (GPUI), Zig and ANSI tokens in six contrast modes from assets/brand/brand.toml, syncs them to Figma, and ships a Bun plugin for Material Symbols SVG icons.",
    domain: "aphrody.com",
    category: "design",
    shard: "fr2",
    qualityScore: 0.96,
  },
  {
    url: "https://aphrody.com/docs/linux-74-cachyos-rust",
    title:
      "Linux 7.4 Kernel io_uring, CachyOS BORE Scheduler & Rust 2024 Ring-3 Stack",
    description:
      "Systems engineering stack covering binfmt_bun, io_uring zero-copy sockets, gVisor sandboxing, CUDA 13.4 sm_89 kernels, and Wayland compositing.",
    headings: [
      "Linux 7.4 io_uring",
      "ring3-agent CUDA sm_89",
      "Rust 2024 Workspace",
    ],
    body: "Built on Linus Torvalds systems taste: flat data structures, strict ABI boundaries, zero userspace pollution, native Rust 2024 crates, and empirical hardware benchmarks on RTX 4070 Ada Lovelace sm_89 and Core i7-13700F.",
    domain: "aphrody.com",
    category: "docs",
    shard: "fr2",
    qualityScore: 0.94,
  },
];

export function hashDocumentBlake3(
  url: string,
  title: string,
  body: string,
): string {
  const hasher = new Bun.CryptoHasher("blake2b256");
  hasher.update(`${url}\n${title}\n${body}`);
  return hasher.digest("hex");
}

function sanitizeFts5Query(rawQuery: string): string {
  const tokens = rawQuery
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_.-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 12);
  if (tokens.length === 0) return "";
  return tokens.map((tok) => `"${tok.replace(/"/g, "")}"*`).join(" OR ");
}

export class SovereignSearchShardDb {
  readonly shardId: "fr1" | "fr2";
  readonly db: Database;

  constructor(shardId: "fr1" | "fr2", dbPath = ":memory:") {
    this.shardId = shardId;
    this.db = new Database(dbPath, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        url TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        headings_json TEXT NOT NULL,
        body TEXT NOT NULL,
        domain TEXT NOT NULL,
        category TEXT NOT NULL,
        shard TEXT NOT NULL,
        quality_score REAL NOT NULL DEFAULT 1.0,
        crawled_at INTEGER NOT NULL,
        blake3_hash TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
        url UNINDEXED,
        title,
        description,
        headings,
        body,
        domain,
        tokenize = 'unicode61 remove_diacritics 2'
      );
    `);
  }

  seedDefaults(): number {
    const seeds =
      this.shardId === "fr1" ? SEED_DOCUMENTS_FR1 : SEED_DOCUMENTS_FR2;
    const now = Date.now();
    let inserted = 0;
    for (const s of seeds) {
      this.upsertDocument({
        ...s,
        crawledAt: now,
      });
      inserted++;
    }
    return inserted;
  }

  upsertDocument(doc: IndexedWebDocument): { hash: string; updated: boolean } {
    const hash =
      doc.blake3Hash ?? hashDocumentBlake3(doc.url, doc.title, doc.body);
    const existing = this.db
      .query<{ blake3_hash: string }, [string]>(
        "SELECT blake3_hash FROM documents WHERE url = ?1",
      )
      .get(doc.url);

    if (existing && existing.blake3_hash === hash) {
      return { hash, updated: false };
    }

    const headingsText = doc.headings.join(" | ");
    const tx = this.db.transaction(() => {
      this.db.query("DELETE FROM search_fts WHERE url = ?1").run(doc.url);

      this.db
        .query(
          `INSERT INTO documents (
            url, title, description, headings_json, body, domain, category, shard, quality_score, crawled_at, blake3_hash
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
          ON CONFLICT(url) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            headings_json = excluded.headings_json,
            body = excluded.body,
            domain = excluded.domain,
            category = excluded.category,
            shard = excluded.shard,
            quality_score = excluded.quality_score,
            crawled_at = excluded.crawled_at,
            blake3_hash = excluded.blake3_hash`,
        )
        .run(
          doc.url,
          doc.title,
          doc.description,
          JSON.stringify(doc.headings),
          doc.body,
          doc.domain,
          doc.category,
          this.shardId,
          doc.qualityScore,
          doc.crawledAt,
          hash,
        );

      this.db
        .query(
          `INSERT INTO search_fts (url, title, description, headings, body, domain)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .run(
          doc.url,
          doc.title,
          doc.description,
          headingsText,
          doc.body,
          doc.domain,
        );
    });
    tx();
    return { hash, updated: true };
  }

  search(rawQuery: string, limit = 10): ShardSearchHit[] {
    const ftsQuery = sanitizeFts5Query(rawQuery);
    if (!ftsQuery) {
      return this.db
        .query<
          {
            url: string;
            title: string;
            description: string;
            domain: string;
            category: IndexedWebDocument["category"];
            shard: "fr1" | "fr2";
            quality_score: number;
            crawled_at: number;
          },
          [number]
        >(
          `SELECT url, title, description, domain, category, shard, quality_score, crawled_at
           FROM documents
           ORDER BY quality_score DESC, crawled_at DESC
           LIMIT ?1`,
        )
        .all(limit)
        .map((r) => ({
          url: r.url,
          title: r.title,
          snippet: r.description,
          domain: r.domain,
          category: r.category,
          shard: r.shard,
          bm25Score: r.quality_score,
          qualityScore: r.quality_score,
          crawledAt: r.crawled_at,
        }));
    }

    const rows = this.db
      .query<
        {
          url: string;
          title: string;
          snippet_text: string;
          description: string;
          domain: string;
          category: IndexedWebDocument["category"];
          shard: "fr1" | "fr2";
          raw_bm25: number;
          quality_score: number;
          crawled_at: number;
        },
        [string, number]
      >(
        `SELECT
           d.url,
           d.title,
           snippet(search_fts, 4, '[', ']', ' … ', 24) AS snippet_text,
           d.description,
           d.domain,
           d.category,
           d.shard,
           bm25(search_fts, 0.0, 8.0, 4.0, 3.0, 1.5, 2.0) AS raw_bm25,
           d.quality_score,
           d.crawled_at
         FROM search_fts
         JOIN documents d ON d.url = search_fts.url
         WHERE search_fts MATCH ?1
         ORDER BY (bm25(search_fts, 0.0, 8.0, 4.0, 3.0, 1.5, 2.0) * d.quality_score) ASC
         LIMIT ?2`,
      )
      .all(ftsQuery, limit);

    return rows.map((r) => ({
      url: r.url,
      title: r.title,
      snippet: r.snippet_text || r.description,
      domain: r.domain,
      category: r.category,
      shard: r.shard,
      bm25Score:
        Math.round(Math.abs(r.raw_bm25) * r.quality_score * 1000) / 1000,
      qualityScore: r.quality_score,
      crawledAt: r.crawled_at,
    }));
  }

  suggest(prefix: string, limit = 6): string[] {
    const clean = prefix.trim().toLowerCase();
    const out = new Set<string>();

    for (const app of APHRODY_TOP1_SUBDOMAIN_CATALOG) {
      if (
        !clean ||
        app.slug.startsWith(clean) ||
        app.title.toLowerCase().includes(clean) ||
        app.keywords.some((k) => k.includes(clean))
      ) {
        out.add(app.title.split("—")[0]!.trim());
        if (out.size >= limit) return [...out];
      }
    }

    const rows = this.db
      .query<{ title: string }, [string, number]>(
        `SELECT title FROM documents WHERE lower(title) LIKE ?1 ORDER BY quality_score DESC LIMIT ?2`,
      )
      .all(`%${clean}%`, limit);

    for (const r of rows) {
      out.add(r.title);
      if (out.size >= limit) break;
    }
    return [...out];
  }

  count(): number {
    const row = this.db
      .query<{ c: number }, []>("SELECT COUNT(*) AS c FROM documents")
      .get();
    return row?.c ?? 0;
  }

  close(): void {
    this.db.close();
  }
}

export function matchSubdomainCatalog(query: string): SubdomainAppEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...APHRODY_TOP1_SUBDOMAIN_CATALOG.slice(0, 4)];
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = APHRODY_TOP1_SUBDOMAIN_CATALOG.map((entry) => {
    let score = 0;
    if (entry.slug === q || entry.subdomain.toLowerCase() === q) score += 100;
    for (const tok of tokens) {
      if (entry.slug.includes(tok)) score += 25;
      if (entry.title.toLowerCase().includes(tok)) score += 15;
      if (entry.keywords.some((k) => k === tok)) score += 20;
      else if (entry.keywords.some((k) => k.includes(tok))) score += 10;
      if (entry.summary.toLowerCase().includes(tok)) score += 5;
    }
    return { entry, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.entry);
}

export function buildKnowledgeCard(
  query: string,
): SovereignKnowledgeCard | null {
  const matched = matchSubdomainCatalog(query);
  const top = matched[0];
  if (!top) return null;

  return {
    title: top.title,
    subtitle: `${top.subdomain} · ${top.category.toUpperCase()}`,
    summary: top.summary,
    canonicalUrl: top.url,
    subdomain: top.subdomain,
    facts: [
      { label: "Subdomain", value: top.subdomain },
      { label: "Local Route", value: top.localRoute },
      { label: "Stack", value: top.stack.join(" · ") },
      { label: "Cluster Pinning", value: "fr1 + fr2 (EU Sovereign Mesh)" },
    ],
  };
}
