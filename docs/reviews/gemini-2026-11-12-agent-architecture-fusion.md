Gemini said
Review 1: agent/docs/ARCHITECTURE.md

Score: 8 / 20 — Clear layered vision with an initial working packages/core slice, but undermined by wrong Transformer/IR math, a benchmark that empirically disproves its own multi-head design, broken runtime layering (bun:sqlite / native C++ over Cloudflare Workers), unredacted secret leakage to remote embedding APIs, and 11 undeclared module paths.

Criterion	Score	Verdict
Factual & mathematical accuracy	2 / 6	Wrong AI SDK symbol, false 
O(n
2
) / 
W
O
 / KV-cache claims, benchmark regression ignored
Internal & monorepo consistency	2 / 4	Violates own ADR 0008, C:\src flat-root & no-absolute-path rules; 11 phantom paths
Architectural & security soundness	2 / 5	Post-ingest redaction leaks secrets; bun:sqlite locks & breaks Workers; pyo3 ↔ Bun gap
Completeness & operational readiness	2 / 5	Linux prd CI cannot run Windows-first tests; no vector index, IPC spec, or capability gates
1. Factual Errors

Wrong Vercel AI SDK API symbol (## Feature mapping):

Claim: Vercel AI SDK generateText + isStepCount.

Fact: The AI SDK loop-termination helper is stepCountIs(n) (passed to stopWhen: stepCountIs(n)), not isStepCount. Also avoid hardcoding patch version 7.0.170 in ADR 0001 (bun.lock is the single source of truth).

Three mathematical/architectural errors in ## Context (attention-style selection):

False 
𝑂
(
𝑛
2
)
O(n
2
) complexity (top-k, O(n²) bound): Scoring 1 task query against 
𝑁
N stored entries is 
𝑂
(
𝑁
⋅
𝑑
)
O(N⋅d) linear cross-retrieval (and sublinear posting-list traversal for FTS5 BM25), not 
𝑂
(
𝑛
2
)
O(n
2
) self-attention (
𝑁
N tokens attending to 
𝑁
N tokens). Furthermore, with 39 entries in the benchmark, candidate cap (200) is never exercised.

Wrong 
𝑊
𝑂
W
O
 & pre-softmax scalar merge (scaling + softmax): In Vaswani et al. (§3.2.2), each head computes an independent softmax over keys, and 
𝑊
𝑂
∈
𝑅
ℎ
𝑑
𝑣
×
𝑑
model
W
O
∈R
hd
v
	​

×d
model
	​

 projects concatenated post-softmax value vectors. Averaging standardized scalar scores before a single softmax collapses multi-head retrieval into single-head linear score fusion—diluting sharp semantic matches with noisy lexical scores.

Misclassified hash512 & "KV-cache": Feature hashing (hash512) is lexical token hashing, not semantic embedding ("car" and "automobile" remain orthogonal). Caching static document embeddings by (embedder, sha256(text)) is an embedding lookup table, not a Transformer KV-cache, and uses sha256 despite L3 standardizing on blake3.

Benchmark disproves the merged head design & hides cold latency (## Context Bench):

bge-m3 (merged 0.5/0.5) regresses on every single metric compared to bge-m3 (semantic) alone (P@1: 0.200 → 0.167, R@5: 0.800 → 0.733, MRR: 0.423 → 0.371), yet the text ignores the regression.

Reporting 2.5 ms/query for merged 0.5/0.5 measures only warm cached queries; unseen live queries still pay the ~228 ms Workers AI network + inference RTT because query strings miss the cache.

Reusing each item's own description as the query contaminates the eval with exact lexical overlap; if multiple item × field rows match one item, single-label P@1 is misdefined rather than "low by construction" (use multi-label Recall@K and nDCG@K over the full ground-truth field set).

Impossible L0–L5 vertical layering (## Layers & ADR 0002):

Placing Cloudflare Workers/DO and Vercel Functions at L0 beneath L1 (CUDA, Vulkan, DirectML, AVX-512), L2 (llama.cpp, ONNX Runtime, vLLM), and ADR 0002 (bun:sqlite file in AGENT_HOME) is false: V8 isolates (workerd) cannot load bun:sqlite, windows-rs, pyo3, native GPU runtimes, or host filesystems.

Requiring Linux 7.x at L0 excludes standard production Linux 6.x LTS kernels/containers.

Windows AppContainer mischaracterized as a container sandbox (## Feature mapping):

Windows AppContainer (windows-rs) is a low-integrity token capability jail, not a copy-on-write filesystem/network sandbox like Docker, Vercel Sandbox, or CF Sandbox. Processes inside an AppContainer cannot even read workspace files unless explicit AppContainer SID DACLs are mutated on host NTFS folders.

Blanket MIT claim & Apache-2.0 NOTICE confusion (ADR 0005):

MIT requires preserving copyright + permission text, not NOTICE files (NOTICE is an Apache-2.0 §4(d) mechanism, applicable to Google A2A/adk-python and wgpu). Upstream dependencies also include BSD-3 (Dawn) and LGPL/GPL (ffmpeg-wasm in FUSION.md).

Corrupted U+00A0 (NBSP) & policy violations:

Every line in the ## Layers code block is prefixed/padded with non-breaking spaces (U+00A0).

Hardcodes Windows absolute paths (C:\src\docs\llvm\UNIFIED-TOOLCHAIN.md, C:\src\var\data\... pointing inside ephemeral var/), violating C:\src relative-path invariants.

Violates its own ADR 0008 (Product name only in identity.toml) by hardcoding agent, agent run, agent research, AGENT_HOME, and python/agent_py.

Claims native/dev work never runs on the PC, yet cites done: agent run, e2e test green on Windows and Bench (... Windows PC, 2026-11-12) while prd is Linux.

2. Design Flaws

Monorepo vs Sub-repo Split Brain & 11 Phantom Paths:

Located at agent/docs/ARCHITECTURE.md inside C:\src, yet declares its own root workspaces (packages/*, crates/*, python/*, legacy/*, identity.toml), colliding with C:\src's single flat Cargo/Bun workspace rule.

Even internally, ## Feature mapping and ## Context reference 11 paths absent from ## Modules: packages/research, packages/runtime-adapter, protocols, web, desktop, tools/{research,council,sentinel,code}, crates/desktop-use, crates/gpu, and crates/core.

Plaintext Secret Leakage in Context.ingest (## Context):

Applying redactText after selection (redactText on every selected entry) means raw secrets from MEMORY.md, transcripts, and code chunks are stored unredacted in SQLite FTS5 and transmitted in plaintext to Cloudflare Workers AI (bge-m3) during ingestion. Redaction must happen before persistence and embedding.

Single-File bun:sqlite Contention & Sync-API Lock-In (ADR 0002):

Sharing one synchronous bun:sqlite file across CLI, TUI, desktop, HTTP/MCP servers, background heartbeat daemons, and parallel batch_size workers without WAL + busy_timeout + write serialization triggers SQLITE_BUSY under load on NTFS, and prevents async D1/DO storage swapping on Workers.

Undefined Bun ↔ Rust ↔ Python (pyo3) Boundary:

pyo3 binds Rust to CPython (libpython), not to Bun/JavaScriptCore. packages/core (Bun TS) cannot invoke python/agent_py via pyo3 in-process without either C-ABI bun:ffi (cdylib without Python GIL) or an out-of-process RPC/MCP boundary.

Linux-Only Native CI (prd) vs Windows-First Architecture (ADR 0006 & 0007):

Building/testing windows-rs, DirectML, AppContainer, and desktop-use (SendInput/UIA) exclusively on Linux prd leaves Windows-native runtime paths completely untested in CI.

Verbatim legacy/* Commit Bloat (ADR 0004):

Importing dead legacy packages verbatim into HEAD (legacy/*) bloats indexing, context windows, and security scans when git history/tags already archive them.

3. Missing Items

Vector storage & index specification: Embedding dimensions (1024 for bge-m3), binary packing (Float32Array BLOB), sqlite-vec / HNSW index, and (model_id, model_rev, blake3(redacted_text)) cache-key invalidation.

Capability & prompt-injection security model: Untrusted inputs (messaging gateways, web research, external MCP servers) reach bash, write, edit, and desktop-use with zero taint tracking, path allowlists, or approval gates.

Budget, telemetry, and loop-runaway circuit breakers: Dropping finops leaves recursive sub-agents, parallel research batches, and multi-LLM councils without token/cost caps or OpenTelemetry traces.

Database schema migration strategy (PRAGMA user_version / deterministic SQL migrations).

4. Concrete Fixes
Fix 1 — Align workspace paths, fix L0–L7 cloud vs native split, and purge U+00A0 / hardcoded paths

Replace the header, ## Layers, and ADR 0001–0008 errors in agent/docs/ARCHITECTURE.md:

Markdown
# Agent Architecture

Unified agent subsystem within the root monorepo (`identity.toml` governs CLI binary, env prefix, and home directory name; `<cli>` and `<CLI_HOME>` below denote values resolved from `identity.toml`).
Toolchain: shared LLVM toolchain (`docs/llvm/UNIFIED-TOOLCHAIN.md`). CI: Bun unit tests on Linux + Windows runners; native Linux builds on `prd`; native Windows (`windows-rs`, DirectML, UIA) builds/tests on dedicated Windows runner `prd-win`.

## Layers

| Layer | Native Host Profile (Windows 11 / Linux 6.6+) | Edge / Serverless Profile (CF Workers + DO / Vercel) |
|---|---|---|
| L7 Surfaces | `<cli>`, TUI, Desktop (`windows-rs`/WebView), HTTP, MCP, A2A/ACP/AG-UI | HTTP API, Webhook Channels, MCP/A2A/AG-UI, Web UI |
| L6 Gateway | Chat SDK adapters, local session auth, routing | Chat SDK adapters, Access/OAuth, DO session routing |
| L5 Core | AI SDK loop (`stopWhen: stepCountIs(n)`), tools, `StoragePort` memory, skills, cron, hooks | Same TS core over async `StoragePort`, Workflow/DO alarms, remote sandbox |
| L4 Providers | `@ai-sdk/*`, AI Gateway, local OpenAI-compatible server | `@ai-sdk/*`, AI Gateway, Workers AI |
| L3 Weights | HF fetch → `blake3` CAS store → R2 mirror | N/A (remote inference only) |
| L2 Inference | `llama.cpp`, ONNX Runtime (DirectML/CUDA), `vLLM` (Linux `prd`) | Workers AI / external endpoints |
| L1 Compute | `wgpu`/Dawn, CUDA, Vulkan, DirectML, CPU (`x86-64-v3`/`v4`, NEON) | V8 isolate (`workerd` / Node compat) |
| L0 Platform | Windows 11 (`windows-rs`, Job Objects + Restricted Tokens / Hyper-V), Linux 6.6+ (`namespaces`/`landlock`) | Cloudflare Workers + Durable Objects + D1, Vercel Functions + Sandbox |

Fix 2 — Reconcile ## Modules so zero undeclared paths exist

Add missing modules explicitly and drop verbatim legacy/* from HEAD (keep as an immutable Git tag archive/legacy-pre-fusion):

Markdown
| Module | Monorepo Path | Runtime | Status |
|---|---|---|---|
| Agent core (loop, context, memory, skills, hooks, sessions) | `packages/agent-core` | Bun / Edge TS | active |
| Runtime storage & sandbox adapters (SQLite vs D1/DO, Win32 vs CF/Vercel) | `packages/agent-runtime` | Bun / Edge TS | planned |
| Research, council & sentinel tools | `packages/agent-tools` | Bun TS | planned |
| Gateway + Chat SDK / A2A / ACP / AG-UI protocols | `packages/agent-gateway` | Bun / Edge TS | planned |
| MCP client/server | `packages/agent-mcp` | Bun / Edge TS | planned |
| Scheduler / durable workflows | `packages/agent-scheduler` | Bun / Edge TS | planned |
| TUI & Web surfaces | `packages/agent-tui`, `apps/agent-web` | Bun TS | planned |
| Native desktop & UIA computer-use | `crates/agent-desktop` | Rust (`windows-rs`) | planned |
| Code graph & AST indexing | `crates/agent-code` | Rust (`tree-sitter`) | planned |
| Local inference, GPU & `blake3` weight store | `crates/agent-infer`, `crates/agent-gpu`, `crates/agent-weights` | Rust | planned |
| Out-of-process Python tool worker (MCP stdio) | `python/agent_worker` | Python (`uv`) | planned |

Fix 3 — Pre-ingest redaction, WAL concurrency, and Reciprocal Rank Fusion (context.ts)

Replace the broken pre-softmax logit merge (which degraded bge-m3 MRR from 0.423 to 0.371) with Reciprocal Rank Fusion (RRF) + pre-ingest secret redaction + blake3 keyed embedding cache:

TypeScript
// packages/agent-core/src/context.ts
// 1. SQLite init (native host adapter): prevent SQLITE_BUSY across CLI/daemon/workers
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
`);

// 2. Redact BEFORE writing to FTS5 or sending text to remote Workers AI embedders
export async function ingestEntry(rawText: string, meta: EntryMeta): Promise<void> {
  const safeText = redactSecrets(rawText);
  const digest = blake3Hex(`${EMBEDDER_ID}:${EMBEDDER_REV}:${safeText}`);
  const vec = await getOrComputeEmbedding(digest, safeText); // cached by blake3
  await store.upsertEntry({ ...meta, text: safeText, digest, vec });
}

// 3. Reciprocal Rank Fusion (k = 60) over pre-masked SQL/vector candidates — scale-invariant, O(N)
export function fuseRankedHeads(heads: ReadonlyArray<{ weight: number; ids: readonly string[] }>, k = 60): string[] {
  const scores = new Map<string, number>();
  for (const { weight, ids } of heads) {
    for (let rank = 0; rank < ids.length; rank++) {
      const id = ids[rank]!;
      scores.set(id, (scores.get(id) ?? 0) + weight / (k + rank + 1));
    }
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

Review 2: agent/docs/FUSION.md

Score: 6 / 20 — Useful raw GitHub org inventory, but directly contradicts its sibling ARCHITECTURE.md written the same day, specifies a runtime-impossible Python ↔ bun:ffi/pyo3 ↔ TypeScript bridge and a Bun-only → Cloudflare Workers deployment, schedules macOS-only crawlers for Windows porting, and commits to rewriting/maintaining 60+ external repositories with zero prioritization, commit SHAs, or license checks.

Criterion	Score	Verdict
Factual & runtime accuracy	1 / 6	Impossible Python→bun:ffi/pyo3→TS bridge; Bun.* breaks Workers; macOS crawlers in todo
Cross-doc & monorepo consistency	1 / 4	Contradicts ARCHITECTURE.md paths, module statuses, FFI policy, and identity.toml rules
Scope & architectural realism	2 / 5	60+ repo rewrite ("boil the ocean"), needless Go→TS rewrites, dual TS+Python plugin split brain
Governance, licensing & phasing	2 / 5	Wildcard repo names (*), GPL/LGPL blind spots (ffmpeg-wasm), missing commit pins & P0–P3 tiers
1. Factual Errors

Physically impossible Python ↔ Core FFI rule (## Rules):

Claim: Hermes (Python): stays under uv (python/), calls the core through pyo3 (crates) or bun:ffi.

Fact: bun:ffi is a JavaScript host API inside Bun for calling C-ABI shared libraries from JS—a Python process cannot call anything "through bun:ffi". Likewise, pyo3 binds Rust ↔ CPython and cannot call TypeScript modules in packages/core (core/context.ts, core/model.ts).

Incompatible Bun-only rewrite vs Cloudflare Workers deploy (## Rules vs ## Skills, plugins, registry):

Claim: Rewrites OpenClaw TS exclusively onto Bun.serve, Bun.$, bun:sqlite, bun:ffi, and Bun.file, then targets openclaw/clawhub -> packages/hub (client) + Workers deploy.

Fact: Cloudflare Workers (workerd) supports Web-standard fetch and select node:* compat APIs, none of Bun.serve, Bun.$, bun:sqlite, bun:ffi, or Bun.file.

Four direct contradictions with agent/docs/ARCHITECTURE.md (same date 2026-11-12):

Identity & Home dir: Hardcodes aphrody-labs/agent and ~/.agent (agent init), violating ARCHITECTURE.md ADR 0008 (identity.toml), ADR 0002 (AGENT_HOME), and Windows path hygiene (%LOCALAPPDATA% vs ambiguous ~).

FFI rule: ARCHITECTURE.md replaces bun:ffi with windows-rs; FUSION.md mandates bun:ffi.

Status conflict: ARCHITECTURE.md marks scheduler/heartbeat and skill lint/provenance/lock as planned, whereas FUSION.md marks heartbeat, cron, and skill lint/usage/curation as partial (already implemented).

Directory collisions: Invents python/hermes, python/plugins, crates/windows, crates/ocm, packages/plugins, packages/hub, packages/media, packages/crawl, apps/web, packaging/, skills/, firmware/, bench/, evals/ — none of which exist in ARCHITECTURE.md ## Modules or C:\src/docs/ARCHITECTURE-ROOT.md.

macOS-only Apple repos scheduled as todo on a Windows/Linux stack (## Channels and crawlers & ## Protocols):

Marks imsg as skip (macOS-only), yet marks imsgcrawl (macOS Messages chat.db), photoscrawl (macOS Photos library), and remindctl (macOS EventKit Reminders) as todo!

Literal glob wildcards in an "enumerated" API inventory (## Eval, ops):

Lists clawsweeper* and nix-openclaw* with unresolved * wildcards instead of exact repository names.

Unflagged copyleft / SaaS licensing hazards (## Protocols & ## Skills):

ffmpeg-wasm carries LGPLv2.1+ / GPLv2+ obligations depending on compiled codecs; NemoClaw (NVIDIA OpenShell) and third-party SaaS memory plugins (mem0, supermemory, honcho, byterover) are non-MIT or proprietary-backend wrappers, contradicting ARCHITECTURE.md ADR 0005.

Hardcoded Windows path & ambiguous short SHA (Header):

C:\src\docs\agents\WINDOWS-NATIVE-PORT.md, 16eea3d uses a non-portable Windows drive path and a 7-char short SHA without specifying whether 16eea3d belongs to C:\src, aphrody-labs/openclaw, or aphrody-labs/hermes-agent.

2. Design Flaws

Unbounded 60+ Repo Rewrite Scope ("Boil the Ocean"):

Commits to porting ~60 external repos—including 10+ chat/SaaS scrapers, media codecs (clawpdf, ffmpeg-wasm, libopus-wasm, rastermill), ESP32 C firmware, MSIX installers, and 6 competing external memory SaaS backends—before core gateway, mcp, scheduler, or tui even exist.

Value-Destroying Go → TypeScript Rewrites (clawscan, turnwire, crawlkit):

Rewriting working Go binaries (clawscan security analyzer, turnwire MCP relay, crawlkit) into TypeScript destroys upstream sync (git fetch upstream) and risks parser/security bugs in clawscan, even though C:\src already supports Go (infra/) and MCP stdio/HTTP tools are language-agnostic.

Dual-Ecosystem Plugin & Runtime Bloat (packages/plugins + python/plugins):

Maintaining both OpenClaw TS plugins and Hermes Python plugins (hermes-official-plugins, hermes-labs-plugins) permanently forces shipping Python + uv alongside Bun + Rust for overlapping features (memory, skills, cron, ACP). Port the small algorithmic wins from Hermes (SKILL.md linter, trajectory compression) cleanly into TypeScript/Rust, and isolate any remaining Python tools behind standard MCP over stdio/HTTP so core has zero Python dependency.

Account-Ban & Maintenance Liability of Bundled Unofficial Scrapers:

Shipping unofficial WhatsApp (wacli/wacrawl), Telegram (telecrawl), Discord (discrawl), and X (birdclaw) crawlers inside core packages/crawl creates constant ToS/account-ban liability and brittle scraper churn in monorepo CI.

Prompt Bloat from Unscoped Template Merging (## Rules):

Merging OpenClaw's multi-file workspace templates with Hermes SOUL.md without a strict schema and token cap inflates every turn's system prompt.

3. Missing Items

Strict Phased Cutline (P0 Core / P1 Ecosystem / P2 Optional MCP / Skip): No execution order or feature freeze protecting MVP delivery.

Per-Repo Provenance Manifest (src.lock.json / ORIGIN.toml): Full 40-char commit SHAs, SPDX license IDs, and intake mode (VENDOR-FORK in third_party/ vs PORT-ONCE into packages/).

Plugin Sandbox & Permission Manifest: No capability model (fs, net, env, exec) governing babelfish, clawhub, or Hermes third-party plugins.

Windows Home Directory Resolution Spec: Must follow %LOCALAPPDATA%\<product> (Windows) and $XDG_DATA_HOME/<product> / $XDG_CONFIG_HOME/<product> (Linux), overridden by $<PRODUCT>_HOME from identity.toml.

4. Concrete Fixes
Fix 1 — Replace Header & ## Rules in agent/docs/FUSION.md

Fixes identity hardcoding, broken ~/.agent path, impossible Python bun:ffi/pyo3 calls, and Workers runtime incompatibility:

Markdown
# Fusion: OpenClaw + Hermes Ecosystems

Inventory date: 2026-11-12 (`gh api orgs/openclaw/repos`, `gh api orgs/NousResearch/repos`).
Upstream forks (locked in root `src.lock.json`):
- `third_party/openclaw` (`aphrody-labs/openclaw`, branch `windows-native`, rev `<40-char-sha>`)
- `third_party/hermes-agent` (`aphrody-labs/hermes-agent`, branch `windows-native`, rev `<40-char-sha>`)
Reference: `docs/agents/WINDOWS-NATIVE-PORT.md`.

## Fusion Rules

1. **Identity & Home (`identity.toml`)**: Zero hardcoded `agent` / `~/.agent` strings. Home resolves via `$<UPPER_PREFIX>_HOME`, defaulting to `%LOCALAPPDATA%\<name>` on Windows and `$XDG_DATA_HOME/<name>` on Linux.
2. **Runtime Portability**:
   - Shared packages targeting Cloudflare Workers (`packages/agent-core`, `packages/agent-gateway`, `packages/agent-mcp`, `apps/agent-hub`) MUST use Web-standard APIs + `StoragePort`/`SandboxPort` interfaces (zero direct `bun:sqlite`, `bun:ffi`, `Bun.$`, or `Bun.file` imports).
   - Host-only Bun APIs (`bun:sqlite`, `Bun.$`) live exclusively inside `packages/agent-runtime/src/bun-host/`.
3. **Python Boundary (No In-Process FFI)**: Core never embeds CPython. High-value Hermes logic (`SKILL.md` lint/provenance, context compression, SOUL template) is ported once to TypeScript (`packages/agent-core`). Remaining Python-only integrations run strictly out-of-process as optional **MCP servers** (`python/agent_worker` via `uv`), never via `pyo3` or `bun:ffi`.
4. **No Needless Language Rewrites**: Keep working Go security/relay tools (`clawscan`, `turnwire`) as locked upstream binaries or invoke via CLI/MCP until a concrete bottleneck justifies a port.
5. **License Gate**: Every ported file requires an entry in `THIRD_PARTY_NOTICES.md` with upstream repo URL, 40-char commit SHA, and verified permissive SPDX license (`MIT`, `Apache-2.0`, `BSD-3-Clause`). Copyleft (`GPL`/`LGPL` e.g. `ffmpeg-wasm`) is banned from core packages.

Fix 2 — Enforce a Phased Cutline & Correct Misclassified Repos

Replace the flat todo sprawl across agent/docs/FUSION.md with explicit P0–Skip dispositions:

Markdown
## Prioritized Intake Matrix (Cutline)

| Tier | Scope | Included Upstream Repos | Target Monorepo Path | Disposition |
|---|---|---|---|---|
| **P0 (MVP)** | Loop, context, memory, skills, templates, MCP, CLI/TUI | `openclaw` (core/templates), `hermes-agent` (SOUL, compression, skill lint), `mcporter`, `libterminal`, `fs-safe`, `proc-safe` | `packages/agent-{core,runtime,mcp,tui}` | Port to TS (`done` / `active`) |
| **P1 (Next)** | Gateway, official channels, durable cron, Windows host | `openclaw` (gateway), `acpx`, `hermes-agent` (`acp_adapter`, cron), `clawrouter`, `catalog`, `openclaw-windows-node` | `packages/agent-{gateway,scheduler}`, `crates/agent-desktop` | Planned after P0 |
| **P2 (Sidecars)** | Registry, security scan, evals (no core rewrite) | `clawhub`, `clawscan` (keep Go bin), `turnwire` (keep Go bin), `crabline`, `Kova`, `hermes-toolperf-evals`, `hermes-compression-eval` | `apps/agent-hub`, `third_party/{clawscan,turnwire}`, `packages/agent-evals` | Keep upstream lang / isolated evals |
| **Skip (Platform / Legal / Bloat)** | macOS-only, unofficial scrapers, copyleft media, external SaaS wrappers, C firmware | `imsgcrawl`, `photoscrawl`, `remindctl` (macOS-only); `wacli`, `wacrawl`, `telecrawl`, `slacrawl`, `discrawl`, `birdclaw` (ban/ToS risk → external optional MCP only); `ffmpeg-wasm` (GPL/LGPL); `esp-openclaw-node`; `hermes-plugin-{honcho,mem0,openviking,supermemory,retaindb,byterover}` | — | **Skip** (out of core monorepo) |

Fix 3 — Expand wildcard entries (clawsweeper*, nix-openclaw*) via gh

Run once and commit exact repository names so FUSION.md is deterministic and auditable:

Bash
gh api --paginate orgs/openclaw/repos --jq '.[] | select(.archived == false) | "\(.name)\t\(.license.spdx_id // "NOASSERTION")\t\(.pushed_at)"' | sort

