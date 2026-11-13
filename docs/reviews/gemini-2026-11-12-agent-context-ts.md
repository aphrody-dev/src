Gemini said
Review: agent/packages/core/src/context.ts

Score: 6 / 20 — Compact prototype, but unsuitable for production: SQL LIMIT runs before Mask filtering (starving multi-scope queries), semantic search is blind beyond the 200 newest rows, Float32Array views crash on unaligned SQLite blobs, select() leaks write locks and unbounded query rows into kv, secrets are persisted in plaintext and exfiltrated to remote embedders, and double z-score standardization amplifies float noise into false matches.

Criterion Score Verdict
Factual & algorithmic accuracy 2 / 5 False parallel/cache-friendly claims, double standardize(), broken floor - 1 BM25 fill
Correctness & bug freedom 1 / 5 Pre-mask LIMIT starvation, unaligned Float32Array crash, future-at NaN, budget mismatch
Security 1 / 5 Plaintext secrets in SQLite/FTS5 & remote embedders, unredacted title/get/list, prompt injection
Performance & concurrency 2 / 5 Full-table filesort (no indexes), 400× SHA-256 + SELECT + Array.from per query, missing busy_timeout

1. Factual Errors (Comments vs Code & Math)

False parallel execution claim (Line 3):

Claim: Heads (parallel): lexical (FTS5 bm25), semantic ...

Fact: Every head in select() runs strictly sequentially (entries_fts → this.list() → await this.vectors() → structural → recency).

Contradictory & broken double standardization (Lines 4, 51–64, 194–198):

Claim: Header (L4) says "Each head's scores go through a temperature softmax; heads merge linearly", whereas L194–198 merges standardized logits first and then calls softmax(logits, t).

Fact: Because softmax() calls standardize() internally (L59), logits is standardized a second time. When heads disagree and nearly cancel out (sd ≈ 1e-9), or when all entries in a batch share at = Date.now() ± 1 ms, standardize() divides tiny noise by sd and stretches trivial differences to ±1σ full-strength logits.

False pre-scoring mask guarantee (Line 5):

Claim: Masks: scope allowlist + predicate (permission) applied before scoring.

Fact: Both list() (L114) and entries_fts (L159) execute LIMIT ? in SQL before calling this.visible() in JS.

False prompt-cache stability in renderContext (Lines 226–234):

Claim: stable order by source then score, for prompt-cache friendliness.

Fact: by is a Map populated in sel (descending score) order—it never sorts by source, and sorting items by dynamic query score permutes prompt prefixes across turns, busting LLM prefix caches.

Ephemeral design-doc reference & U+00A0 pollution (Line 1, All lines):

L1 cites var/data/... (an unversioned ephemeral directory per root invariants). Indentation throughout the file uses U+00A0 (NBSP).

2. Bugs, Security & Performance Flaws
   Correctness Bugs

[BUG-1] Multi-tenant / multi-scope starvation (list L112–118, select L157–165): SELECT * FROM entries ORDER BY at DESC, rid DESC LIMIT 200 fetches globally newest rows before this.visible(e, mask). If scope = "a" writes 200 entries, select(q, { scopes: ["b"], candidates: 200 }) returns [] even when "b" has thousands of entries. Same bug in entries_fts ... LIMIT nCand.

[BUG-2] Semantic & structural recall blindness (L164–175): pool only ever contains (top nCand FTS hits) ∪ (nCand newest rows). Once a scope exceeds 200 entries, older entries without exact keyword overlap (synonyms, cross-lingual matches—the entire purpose of bge-m3) are never evaluated by heads.semantic or heads.structural.

[BUG-3] Unaligned Float32Array crash (vectors L135): new Float32Array(r.vec.buffer, r.vec.byteOffset, r.vec.byteLength / 4) throws RangeError: byteOffset of Float32Array should be a multiple of 4 whenever bun:sqlite returns a Uint8Array view at a non-4-byte-aligned slab offset.

[BUG-4] NaN poisoning on temperature <= 0 or future timestamps (L59, L191):

temperature: 0 computes 0 / 0 = NaN in softmax(), poisoning all scores.

If e.at > now (clock skew or imported future timestamp), Math.pow(0.5, (now - at) / hl) overflows to Infinity, turning standardize() (Infinity - Infinity) into NaN across the entire result set.

[BUG-5] Token budget vs renderContext truncation mismatch (L205, L211–218, L232): select() charges estimateTokens(e.text) on the full untruncated text (ignoring e.title), whereas renderContext() slices x.text to 1200 chars (~300 tokens). Any entry >16 KB (>4000 tokens) is permanently dropped even if ranked #1; a 12 KB entry consumes 3000/4000 budget tokens while only rendering 300 tokens. s.length / 4 also undercounts CJK/code UTF-16 strings by 2×–4×.

[BUG-6] Dimensionally broken floor - 1 lexical fill (L167–170): Negated FTS5 bm25() values are unnormalized ([0.001, 100+]). Subtracting a fixed 1 treats zero-hit documents as -0.99 against a 0.01 weak hit (1.0 gap), yet 49 against a 50..100 match distribution (making non-matches nearly indistinguishable from real hits).

[BUG-7] Call-stack overflow in hashEmbedder (L31): Math.hypot(...v) spreads v onto the JS call stack (RangeError for large dim), while [...feats] clones the token array twice.

[BUG-8] Unhandled FTS5 AST explosion & CJK drop (L155): Passing a long task/log as query creates a multi-thousand-clause OR query without deduplication or cap, triggering SQLite FTS5 complexity errors; x.length > 1 drops all single-character CJK queries.

Security Flaws

[SEC-1] Plaintext secret persistence & remote exfiltration (ingest L95–102, select L173): ingest() stores unredacted title and text in entries + entries_fts and sends them in cleartext to external embedding APIs (aiEmbedder → Workers AI / OpenAI). select() sends raw query to external embedders and persists its SHA-256 + vector in SQLite kv.

[SEC-2] Incomplete read-side redaction (L108–118, L204, L232): e.title is never passed through redactText() before renderContext() injects it into prompts; get() and list() bypass redactText() completely.

[SEC-3] Prompt / Markdown injection in renderContext (L231–233): src (string & {}) and x.title are interpolated raw into ## ${src} and - ${x.title}: without stripping \r/\n or # headers, letting untrusted research or code entries inject fake system headers (\n\n## system\n...).

[SEC-4] Empty-string scope bypass (visible L125): If an uninitialized caller passes scopes: [""], e.scope.startsWith(":") matches malformed scopes; scopes lacks validation against empty strings.

Performance & Concurrency Flaws

[PERF-1] Full-table scan + filesort on every query (L79–81, L114): entries has zero index on (at DESC, rid DESC) or (scope, source, at DESC). Every list() / select() scans all rows (including full text blobs) into a temp B-tree.

[PERF-2] Read-path SQLite write locks + unbounded kv leak (vectors L130–149, select L173): Every select() with a new query opens a write transaction (INSERT OR REPLACE INTO kv). Combined with a missing PRAGMA busy_timeout, concurrent readers throw SQLITE_BUSY. kv also leaks orphaned vectors forever on ingest() updates, remove(), and every unique user query.

[PERF-3] Per-query hashing, 400× SELECT, and boxed array churn (vectors L131–136): Every select() slices and SHA-256 hashes up to 400 candidate texts on the main thread, fires 400 separate SQLite point-selects, allocates 400 boxed number[] via Array.from(), and sends duplicate texts in a batch multiple times to emb.embed().

3. Missing Items

SQLite PRAGMA busy_timeout & synchronous = NORMAL for concurrent multi-process WAL access.

Schema versioning (PRAGMA user_version) & vector dimension validation when switching embedders or dimensions.

Disposable support ([Symbol.dispose](<>)) so using ctx = new Context(...) closes file locks deterministically on Windows (C:\src).

Bounded query-embedding LRU in memory (separating ephemeral query vectors from persistent document vectors).

4. Concrete Fixes

Drop-in replacement for agent/packages/core/src/context.ts (ASCII spaces only, pre-ingest redaction, SQL pushdown masks + composite indexes, cascading entry_vecs table, safe aligned Float32Array dot product, bounded query LRU, RRF + guarded z-score, and prompt-cache-deterministic rendering):

TypeScript
// Multi-signal context store & selector (SQLite FTS5 + L2-normalized Float32 vectors + symbol overlap + recency).
import { Database } from "bun:sqlite";
import { embedMany, type EmbeddingModel } from "ai";
import { redactText } from "./secrets";

export type Source = "memory" | "skill" | "research" | "code" | "doc" | (string & {});
export type Entry = { id: string; source: Source; scope: string; text: string; title?: string; symbols?: string[]; at: number };
export type Scored = Entry & { score: number; heads: Record<string, number>; tokens: number };
export type Embedder = { id: string; embed(texts: string[]): Promise<number[][]> };

const MAX_RENDER_CHARS = 1200;
const MAX_FTS_TERMS = 64;
const MAX_QUERY_CACHE = 256;
const EMBED_BATCH_SIZE = 128;

export const aiEmbedder = (model: EmbeddingModel, id = String((model as { modelId?: string }).modelId ?? "ai")): Embedder => ({
id,
embed: async (values) => (await embedMany({ model, values, maxParallelCalls: 4 })).embeddings,
});

export const hashEmbedder = (dim = 512): Embedder => {
if (!Number.isInteger(dim) || dim <= 0) throw new RangeError(`Invalid hashEmbedder dim: ${dim}`);
return {
id: `hash${dim}`,
embed: async (texts) =>
texts.map((t) => {
const v = new Float32Array(dim);
const words = t.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
const addFeat = (f: string) => {
const h = Bun.hash.wyhash(f);
const idx = Number(h & 0xffffffffn) % dim;
v[idx] = (v[idx] ?? 0) + ((h >> 63n) !== 0n ? -1 : 1);
};
for (const w of words) {
addFeat(w);
for (let i = 0; i + 3 <= w.length; i++) addFeat(`#${w.slice(i, i + 3)}`);
}
let sumSq = 0;
for (let i = 0; i < dim; i++) sumSq += v[i]! * v[i]!;
const inv = sumSq > 0 ? 1 / Math.sqrt(sumSq) : 1;
return Array.from(v, (x) => x * inv);
}),
};
};

/** Conservative token estimate accounting for non-ASCII / CJK UTF-8 expansion. */
export const estimateTokens = (s: string): number => {
let units = 0;
for (let i = 0; i < s.length; i++) units += s.charCodeAt(i) > 0x7f ? 3 : 1;
return Math.ceil(units / 4);
};

export type Mask = { scopes?: string[]; sources?: Source[]; allow?: (e: Entry) => boolean };
export type SelectOptions = Mask & {
k?: number;
budgetTokens?: number;
weights?: Partial<Record<"lexical" | "semantic" | "structural" | "recency", number>>;
temperature?: number;
halfLifeDays?: number;
candidates?: number;
semanticScanLimit?: number;
now?: number;
redact?: Record<string, string | undefined>;
};

const DEFAULT_WEIGHTS = { lexical: 0.3, semantic: 0.5, structural: 0.1, recency: 0.1 };

function standardize(xs: Map<string, number>): Map<string, number> {
if (xs.size === 0) return xs;
let sum = 0;
for (const v of xs.values()) sum += v;
const mean = sum / xs.size;
let varSum = 0;
for (const v of xs.values()) varSum += (v - mean) ** 2;
const sd = Math.sqrt(varSum / xs.size);
// Suppress pure float/timestamp noise instead of amplifying it to +-1 sigma
if (!Number.isFinite(sd) || sd < 1e-6) return new Map([...xs.keys()].map((k) => [k, 0]));
return new Map([...xs].map(([k, v]) => [k, (v - mean) / sd]));
}

function softmaxFromLogits(logits: Map<string, number>, temperature: number): Map<string, number> {
if (logits.size === 0) return logits;
const t = Math.max(temperature, 1e-3);
let max = -Infinity;
for (const v of logits.values()) if (v / t > max) max = v / t;
const exps: Array<readonly [string, number]> = [];
let sum = 0;
for (const [k, v] of logits) {
const e = Math.exp(v / t - max);
exps.push([k, e]);
sum += e;
}
const denom = sum || 1;
return new Map(exps.map(([k, e]) => [k, e / denom]));
}

function l2Normalize(vec: readonly number[]): Float32Array {
const out = new Float32Array(vec.length);
let sumSq = 0;
for (let i = 0; i < vec.length; i++) {
const x = Number.isFinite(vec[i]) ? vec[i]! : 0;
out[i] = x;
sumSq += x * x;
}
if (sumSq > 0) {
const inv = 1 / Math.sqrt(sumSq);
for (let i = 0; i < out.length; i++) out[i]! *= inv;
}
return out;
}

function toFloat32View(u8: Uint8Array): Float32Array {
if (u8.byteLength === 0 || (u8.byteLength & 3) !== 0) return new Float32Array(0);
return (u8.byteOffset & 3) === 0
? new Float32Array(u8.buffer, u8.byteOffset, u8.byteLength >>> 2)
: new Float32Array(u8.slice().buffer);
}

function dot(a: Float32Array, b: Float32Array): number {
const n = Math.min(a.length, b.length);
let s = 0;
for (let i = 0; i < n; i++) s += a[i]! * b[i]!;
return s;
}

const identifiers = (s: string) => new Set((s.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) ?? []).map((x) => x.toLowerCase()));
const sanitizeInline = (s: string) => s.replace(/[\r\n#]+/g, " ").replace(/\s+/g, " ").trim();
const hashText = (s: string) => new Bun.CryptoHasher("blake2b256").update(s).digest("hex");

export class Context {
readonly db: Database;
private readonly queryVecCache = new Map<string, Float32Array>();

constructor(
path: string,
readonly embedder: Embedder | undefined = hashEmbedder(),
private readonly baseRedact: Record<string, string | undefined> = {},
) {
this.db = new Database(path, { create: true });
this.db.run("PRAGMA journal_mode = WAL");
this.db.run("PRAGMA synchronous = NORMAL");
this.db.run("PRAGMA busy_timeout = 5000");
this.db.run("PRAGMA foreign_keys = ON");
this.db.run(
"CREATE TABLE IF NOT EXISTS entries(rid INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, source TEXT NOT NULL, scope TEXT NOT NULL, title TEXT, text TEXT NOT NULL, symbols TEXT, hash TEXT NOT NULL, at INTEGER NOT NULL)",
);
this.db.run("CREATE INDEX IF NOT EXISTS idx_entries_at ON entries(at DESC, rid DESC)");
this.db.run("CREATE INDEX IF NOT EXISTS idx_entries_scope_at ON entries(scope, at DESC, rid DESC)");
this.db.run("CREATE INDEX IF NOT EXISTS idx_entries_source_at ON entries(source, at DESC, rid DESC)");
this.db.run("CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(title, text, content='entries', content_rowid='rid')");
this.db.run(
"CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN INSERT INTO entries_fts(rowid, title, text) VALUES (new.rid, new.title, new.text); END",
);
this.db.run(
"CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN INSERT INTO entries_fts(entries_fts, rowid, title, text) VALUES ('delete', old.rid, old.title, old.text); END",
);
this.db.run(
"CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE OF title, text ON entries BEGIN INSERT INTO entries_fts(entries_fts, rowid, title, text) VALUES ('delete', old.rid, old.title, old.text); INSERT INTO entries_fts(rowid, title, text) VALUES (new.rid, new.title, new.text); END",
);
this.db.run(
"CREATE TABLE IF NOT EXISTS entry_vecs(rid INTEGER NOT NULL REFERENCES entries(rid) ON DELETE CASCADE, embedder TEXT NOT NULL, hash TEXT NOT NULL, vec BLOB NOT NULL, PRIMARY KEY(rid, embedder))",
);
}

/** Redacts secrets BEFORE persistence and BEFORE remote embedding calls. */
async ingest(
entries: Omit<Entry, "at">[] | Omit<Entry, "at">,
at = Date.now(),
redact: Record<string, string | undefined> = this.baseRedact,
) {
const rawList = Array.isArray(entries) ? entries : [entries];
if (rawList.length === 0) return;

    const prepared = rawList.map((e) => {
      const title = e.title !== undefined ? redactText(e.title, redact) : undefined;
      const text = redactText(e.text, redact);
      const embedInput = `${title ?? ""}\n${text}`.slice(0, 8000);
      return { ...e, title, text, embedInput, hash: hashText(embedInput) };
    });

    const up = this.db.query(
      "INSERT INTO entries(id, source, scope, title, text, symbols, hash, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source=excluded.source, scope=excluded.scope, title=excluded.title, text=excluded.text, symbols=excluded.symbols, hash=excluded.hash, at=excluded.at RETURNING rid, hash",
    );

    const rids = this.db.transaction(() =>
      prepared.map((e) => {
        const symbolsJson = e.symbols ? JSON.stringify(e.symbols) : null;
        const row = up.get(e.id, e.source, e.scope, e.title ?? null, e.text, symbolsJson, e.hash, at) as { rid: number; hash: string };
        return { rid: row.rid, hash: e.hash, text: e.embedInput };
      }),
    )();

    if (!this.embedder) return;
    const emb = this.embedder;
    const check = this.db.query<{ hash: string }, [number, string]>("SELECT hash FROM entry_vecs WHERE rid = ? AND embedder = ?");
    const uniqueMissing = new Map<string, string>();
    for (const item of rids) {
      const existing = check.get(item.rid, emb.id);
      if (!existing || existing.hash !== item.hash) uniqueMissing.set(item.hash, item.text);
    }
    if (uniqueMissing.size === 0) return;

    const hashes = [...uniqueMissing.keys()];
    const computed = new Map<string, Uint8Array>();
    for (let i = 0; i < hashes.length; i += EMBED_BATCH_SIZE) {
      const batchHashes = hashes.slice(i, i + EMBED_BATCH_SIZE);
      const rawVecs = await emb.embed(batchHashes.map((h) => uniqueMissing.get(h)!));
      batchHashes.forEach((h, idx) => {
        const f32 = l2Normalize(rawVecs[idx] ?? []);
        computed.set(h, new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength));
      });
    }

    const putVec = this.db.query("INSERT OR REPLACE INTO entry_vecs(rid, embedder, hash, vec) VALUES (?, ?, ?, ?)");
    this.db.transaction(() => {
      for (const item of rids) {
        const blob = computed.get(item.hash);
        if (blob) putVec.run(item.rid, emb.id, item.hash, blob);
      }
    })();

}

remove(id: string) {
this.db.query("DELETE FROM entries WHERE id = ?").run(id);
}

get(id: string, redact: Record<string, string | undefined> = this.baseRedact): Entry | undefined {
const r = this.db.query<any, [string]>("SELECT * FROM entries WHERE id = ?").get(id);
return r ? this.redactEntry(this.row(r), redact) : undefined;
}

list(mask: Mask = {}, limit = 1000, redact: Record<string, string | undefined> = this.baseRedact): Entry[] {
const { where, params } = this.sqlMask(mask, "entries");
const overfetch = mask.allow ? Math.min(limit * 4, 10_000) : limit;
const rows = this.db
.query<any, any[]>(`SELECT * FROM entries ${where} ORDER BY at DESC, rid DESC LIMIT ?`)
.all(...params, overfetch);
const out: Entry[] = [];
for (const r of rows) {
const e = this.row(r);
if (this.visible(e, mask)) out.push(this.redactEntry(e, redact));
if (out.length >= limit) break;
}
return out;
}

private row(r: any): Entry {
let symbols: string[] | undefined;
if (r.symbols) {
try {
symbols = JSON.parse(r.symbols);
} catch {
symbols = undefined;
}
}
return { id: r.id, source: r.source, scope: r.scope, title: r.title ?? undefined, text: r.text, symbols, at: r.at };
}

private redactEntry(e: Entry, redact: Record<string, string | undefined>): Entry {
return {
...e,
title: e.title !== undefined ? redactText(e.title, redact) : undefined,
text: redactText(e.text, redact),
};
}

private sqlMask(m: Mask, alias: string): { where: string; params: (string | number)[] } {
const clauses: string[] = [];
const params: (string | number)[] = [];
if (m.scopes) {
const valid = m.scopes.filter((s) => s.length > 0);
if (valid.length === 0) return { where: "WHERE 0", params: [] };
if (!valid.includes("*")) {
const sub = valid.map(() => `(${alias}.scope = ? OR ${alias}.scope GLOB ?)`).join(" OR ");
clauses.push(`(${sub})`);
for (const s of valid) params.push(s, `${s.replace(/[*?[\]]/g, "\\$&")}:*`);
}
}
if (m.sources) {
if (m.sources.length === 0) return { where: "WHERE 0", params: [] };
clauses.push(`${alias}.source IN (${m.sources.map(() => "?").join(",")})`);
params.push(...m.sources);
}
return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

private visible(e: Entry, m: Mask): boolean {
if (m.scopes) {
const valid = m.scopes.filter((s) => s.length > 0);
if (!valid.some((s) => s === "*" || e.scope === s || e.scope.startsWith(`${s}:`))) return false;
}
if (m.sources && !m.sources.includes(e.source)) return false;
return m.allow ? m.allow(e) : true;
}

private async queryVector(query: string, redact: Record<string, string | undefined>): Promise<Float32Array> {
const emb = this.embedder!;
const safeQuery = redactText(query, redact).slice(0, 8000);
const key = `${emb.id}:${hashText(safeQuery)}`;
const hit = this.queryVecCache.get(key);
if (hit) return hit;
const [raw] = await emb.embed([safeQuery]);
const vec = l2Normalize(raw ?? []);
if (this.queryVecCache.size >= MAX_QUERY_CACHE) {
const oldest = this.queryVecCache.keys().next().value;
if (oldest !== undefined) this.queryVecCache.delete(oldest);
}
this.queryVecCache.set(key, vec);
return vec;
}

async select(query: string, o: SelectOptions = {}): Promise<Scored[]> {
const now = o.now ?? Date.now();
const w = { ...DEFAULT_WEIGHTS, ...o.weights };
const t = Math.max(o.temperature ?? 1, 1e-3);
const nCand = o.candidates ?? 200;
const semLimit = o.semanticScanLimit ?? 5000;
const redact = { ...this.baseRedact, ...o.redact };

    const heads: Record<string, Map<string, number>> = {};
    const pool = new Map<string, Entry>();
    const sqlFilter = this.sqlMask(o, "e");
    if (sqlFilter.where === "WHERE 0") return [];

    // 1. Lexical head: SQL-masked FTS5 BM25 with deduplicated, capped terms (supports single-char CJK)
    const rawTerms = query.match(/[\p{L}\p{N}_]+/gu) ?? [];
    const uniqTerms = [...new Set(rawTerms.filter((x) => x.length > 1 || x.charCodeAt(0) > 0x2e80))].slice(0, MAX_FTS_TERMS);
    const lexHits = new Map<string, number>();
    if (uniqTerms.length > 0 && w.lexical > 0) {
      const matchExpr = uniqTerms.map((x) => `"${x}"`).join(" OR ");
      const extraWhere = sqlFilter.where ? `AND ${sqlFilter.where.slice(6)}` : "";
      const rows = this.db
        .query<any, any[]>(
          `SELECT e.*, bm25(entries_fts, 2.0, 1.0) AS s FROM entries_fts JOIN entries e ON e.rid = entries_fts.rowid WHERE entries_fts MATCH ? ${extraWhere} ORDER BY s LIMIT ?`,
        )
        .all(matchExpr, ...sqlFilter.params, nCand);
      for (const r of rows) {
        const e = this.row(r);
        if (this.visible(e, o)) {
          pool.set(e.id, e);
          lexHits.set(e.id, -r.s);
        }
      }
    }

    // 2. Semantic head: scan SQL-masked vectors directly so older synonyms are NOT missed
    const semHits = new Map<string, number>();
    if (this.embedder && w.semantic > 0) {
      const qv = await this.queryVector(query, redact);
      const vecWhere = sqlFilter.where ? `${sqlFilter.where} AND v.embedder = ?` : "WHERE v.embedder = ?";
      const vecRows = this.db
        .query<any, any[]>(
          `SELECT e.*, v.vec FROM entries e JOIN entry_vecs v ON v.rid = e.rid ${vecWhere} ORDER BY e.at DESC, e.rid DESC LIMIT ?`,
        )
        .all(...sqlFilter.params, this.embedder.id, semLimit);
      const scoredSem: Array<{ e: Entry; sim: number }> = [];
      for (const r of vecRows) {
        const e = this.row(r);
        if (!this.visible(e, o)) continue;
        const sim = dot(qv, toFloat32View(r.vec));
        scoredSem.push({ e, sim });
      }
      scoredSem.sort((a, b) => b.sim - a.sim);
      for (const { e, sim } of scoredSem.slice(0, nCand)) {
        pool.set(e.id, e);
        semHits.set(e.id, sim);
      }
      for (const { e, sim } of scoredSem) if (pool.has(e.id)) semHits.set(e.id, sim);
    }

    // 3. Recent masked entries ensure recency/structural coverage
    for (const e of this.list(o, nCand, redact)) if (!pool.has(e.id)) pool.set(e.id, e);
    const ids = [...pool.keys()];
    if (ids.length === 0) return [];

    // Rank-based reciprocal scores (1 / (60 + rank)) avoid arbitrary floor-1 BM25 distortion
    if (lexHits.size > 0) {
      const ranked = [...lexHits.entries()].sort((a, b) => b[1] - a[1]);
      const lex = new Map<string, number>(ids.map((id) => [id, 0]));
      ranked.forEach(([id], rank) => lex.set(id, 1 / (60 + rank + 1)));
      heads.lexical = lex;
    }
    if (semHits.size > 0) {
      heads.semantic = new Map(ids.map((id) => [id, semHits.get(id) ?? 0]));
    }
    if (w.structural > 0) {
      const q = identifiers(query);
      if (q.size > 0) {
        const st = new Map<string, number>();
        let anyHit = false;
        for (const id of ids) {
          const syms = pool.get(id)!.symbols;
          if (!syms?.length) {
            st.set(id, 0);
            continue;
          }
          const lower = new Set(syms.map((s) => s.toLowerCase()));
          let hit = 0;
          for (const tok of q) if (lower.has(tok)) hit++;
          if (hit > 0) anyHit = true;
          st.set(id, hit / Math.sqrt(lower.size));
        }
        if (anyHit) heads.structural = st;
      }
    }
    if (w.recency > 0) {
      const hl = Math.max((o.halfLifeDays ?? 14) * 86_400_000, 1);
      heads.recency = new Map(ids.map((id) => [id, Math.pow(0.5, Math.max(0, now - pool.get(id)!.at) / hl)]));
    }

    // Single z-score standardization per active head -> weighted logit merge -> single temperature softmax
    const W = w as Record<string, number>;
    const activeHeads = Object.keys(heads);
    const wsum = activeHeads.reduce((a, h) => a + (W[h] ?? 0), 0) || 1;
    const z = Object.fromEntries(activeHeads.map((h) => [h, standardize(heads[h]!)]));
    const logits = new Map(
      ids.map((id) => [id, activeHeads.reduce((a, h) => a + ((W[h] ?? 0) / wsum) * (z[h]!.get(id) ?? 0), 0)]),
    );
    const attn = softmaxFromLogits(logits, t);
    const headProbs = Object.fromEntries(activeHeads.map((h) => [h, softmaxFromLogits(z[h]!, t)]));

    const scored: Scored[] = ids.map((id) => {
      const safe = this.redactEntry(pool.get(id)!, redact);
      const hs: Record<string, number> = {};
      for (const h of activeHeads) hs[h] = headProbs[h]!.get(id) ?? 0;
      const renderedSnippet = renderLine(safe);
      return { ...safe, score: attn.get(id) ?? 0, heads: hs, tokens: estimateTokens(renderedSnippet) };
    });

    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const k = o.k ?? 8;
    const budget = o.budgetTokens ?? 4000;
    const out: Scored[] = [];
    let used = 0;
    for (const s of scored) {
      if (out.length >= k) break;
      if (used + s.tokens > budget) continue;
      out.push(s);
      used += s.tokens;
    }
    return out;

}

close() {
this.db.close();
}

[Symbol.dispose](<>) {
this.close();
}
}

function renderLine(x: Pick<Entry, "title" | "text">): string {
const title = x.title ? `${sanitizeInline(x.title)}: ` : "";
const body = x.text.replace(/\s+/g, " ").trim().slice(0, MAX_RENDER_CHARS);
return `- ${title}${body}`;
}

/** Deterministic ordering (source ASC, id ASC) so identical selections maximize LLM prompt-cache hits. */
export function renderContext(sel: Scored[]): string {
if (!sel.length) return "";
const by = new Map<string, Scored[]>();
for (const s of sel) {
const src = sanitizeInline(String(s.source)) || "context";
let bucket = by.get(src);
if (!bucket) {
bucket = [];
by.set(src, bucket);
}
bucket.push(s);
}
return [...by.entries()]
.sort(([a], [b]) => a.localeCompare(b))
.map(([src, xs]) => {
const lines = [...xs].sort((a, b) => a.id.localeCompare(b.id)).map(renderLine);
return `## ${src}\n${lines.join("\n")}`;
})
.join("\n\n");
}
