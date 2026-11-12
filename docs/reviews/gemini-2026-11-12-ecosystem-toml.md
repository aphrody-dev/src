Gemini said
Review: third_party/ECOSYSTEM.toml

Score: 4 / 20 — Speculative inventory disguised as an active build manifest: 129 of 131 visible entries reference a non-existent crates/core (and docs/llvm), 30 status values have unclosed quotes, the file truncates mid-token, llvm-project claims CC=clang from an unbuilt sparse checkout missing clang, and placing a tracked TOML inside third_party/ violates the root monorepo invariants.

Criterion	Score	Verdict
Factual & repo-truth accuracy	1 / 6	Phantom crates/core & docs/llvm; false "registered" status; impossible CC=clang; multi-grammar bug
Syntax & cross-doc consistency	1 / 4	30 unclosed string quotes; truncated at ["SPIRV-T; contradicts ARCHITECTURE-ROOT.md & TARGETS.md
Build & systems architecture	1 / 5	Statically links 127 C/C++ grammars (incl. poe-filter, nqc) into core; breaks offline & WASM builds
Completeness & schema rigor	1 / 5	No commit SHAs, SPDX licenses, ABI versions, sub-grammar paths, or query/extension mappings
1. Factual Errors

Vaporware consumers & fabricated "registered" status (Header & 129/131 entries):

Claim: # Read by crates/core/build.rs, used_by = ["crates/core"] across all 127 grammars + tree-sitter + llvm-project, and used_by = [..., "docs/llvm", ...].

Fact: Neither crates/core nor docs/llvm exists in C:\src today. Marking 96 grammars "registered" and 29 "registered-legacy" when crates/core/build.rs does not exist misrepresents unimplemented plans as working integration.

Impossible CC=clang from sparse llvm-project ([entry.llvm-project]):

Claim: status = "sparse and used_by = [..., "crates/core (CC=clang for grammar build)"].

Fact: Per docs/compat/TARGETS.md (2026-11-12), (a) the sparse llvm-project checkout excluded clang from disk, (b) nothing is compiled on the PC (clang binary does not exist), and (c) TARGETS.md's own footer states llvm-project switched to a full checkout—making "sparse" stale and CC=clang non-functional. Furthermore, windows-msvc grammar builds require clang-cl + Windows SDK/UCRT headers, not POSIX CC=clang.

30 unclosed string literals & truncated file ([entry.*]):

Every single "registered-legacy entry (all 29 occurrences, from tree-sitter-astro to tree-sitter-wgsl) plus [entry.llvm-project] ("sparse) is missing its closing " quote—either invalid TOML on disk or a buggy summary serializer.

Entry 131 ([entry.SPIRV-Headers]) cuts off mid-string at used_by = ["SPIRV-T, omitting SPIRV-Tools, wgpu, dawn, mesa, edk2, coreboot, and the remaining ~180 repos of the 309-repo third_party/ tree.

Multi-grammar repositories misrepresented as single flat grammars:

tree-sitter-typescript (typescript/, tsx/), tree-sitter-ocaml (grammars/{ocaml,interface,type}), tree-sitter-markdown (tree-sitter-markdown/, tree-sitter-markdown-inline/), tree-sitter-php (php/, php_only/), tree-sitter-xml (xml/, dtd/), and tree-sitter-csv (csv/, psv/, tsv/) contain multiple nested src/parser.c directories, not a single root grammar.

Self-referential used_by on [entry.tree-sitter]:

Lists "tree-sitter-highlight", "tree-sitter-tags", and "tree-sitter-loader" as consumers—those are internal crates inside third_party/tree-sitter itself, not monorepo dependents.

2. Design Flaws

Direct violations of docs/ARCHITECTURE-ROOT.md Invariants 1, 2, 3, and 4:

Invariants 1 & 4: third_party/ is gitignored/unversioned and materialized solely from root src.lock.json. Putting third_party/ECOSYSTEM.toml inside an unversioned directory either leaves it untracked or creates a second competing manifest alongside src.lock.json.

Invariant 2: crates/core violates mandatory <couche>-<nom> naming (crates/sys-*, crates/code-*), and scripts/ecosystem-check.ts introduces a banned root scripts/ folder instead of crates/depot-* (ay) or packages/machine.

Invariant 3: docs/core/grammars.patch stores code patches inside docs/ instead of committing tree-sitter.json directly to pinned aphrody-labs forks.

Monolithic C/C++ bloat in a foundational core crate:

Generated src/parser.c state tables across 127 grammars total ~250–400 MB of C source (plus external scanner.c and legacy C++ scanner.cc files requiring CXX + C++ stdlib linkage). Compiling all 127 statically into crates/core adds 40–90+ MB of .rodata/.rdata to every binary, breaks pure-Rust / wasm32 builds without a C sysroot, and ships absurd bloat in core (poe-filter for Path of Exile loot filters, nqc for 1990s Lego Mindstorms, cyberchef, chatito, uxntal, yuck, cst, test).

needs-generate breaks offline hermetic builds (tree-sitter-sql, tree-sitter-swift):

Generating src/parser.c during cargo build invokes the tree-sitter CLI + JS evaluation of grammar.js (and npm imports), breaking cargo build --offline (ARCHITECTURE-ROOT.md §1.4).

Unstructured prose stuffed into used_by path arrays:

Mixing Markdown docs ("docs/compat/TARGETS.md") and parenthetical prose ("crates/core (CC=clang for grammar build)") with crate paths prevents strict machine validation of the dependency graph.

Unresolved .wgsl collision:

Registers both tree-sitter-wgsl and tree-sitter-wgsl-bevy with no extension priority or dialect routing.

3. Missing Items

Provenance & license gates: Missing 40-char rev SHA, upstream/fork URL, and SPDX license per grammar (several community tree-sitter grammars are GPL-3.0 / LGPL, which taint static C linking into proprietary/MIT binaries).

Tree-sitter build & runtime metadata: Missing subpath (multi-grammar repos), C symbol name (tree_sitter_<name>), abi version (13..15), external scanner type ("none" | "c" | "cxx"), file extensions, and .scm query paths (highlights.scm, tags.scm for symbol indexing, injections.scm).

Missing Tier-1 monorepo languages: Includes poe-filter and nqc, yet omits wat/wast (WebAssembly Text) and wit (WASI Preview 2 interfaces).

Existence & integrity check in CI: No check verifying that every used_by path and src/parser.c exists on disk.

4. Concrete Fixes
Fix 1 — Architecture & File Placement

Delete third_party/ECOSYSTEM.toml and docs/core/grammars.patch. Keep repository URLs/SHAs exclusively in root src.lock.json.

Keep crates/sys-core 100% pure Rust. Create a dedicated crates/code-grammars crate with a versioned crates/code-grammars/grammars.toml manifest.

Tier the grammars:

Tier 1 (static Cargo features, ~15 languages actually used by the monorepo): rust, typescript + tsx, javascript, python, go, c, cpp, json, toml, yaml, markdown + markdown-inline, bash, powershell, html, css, wgsl, wat, wit.

Tier 2 (on-demand .wasm via wasmtime/WebAssembly or dlopen): Secondary languages; pre-generate sql and swift in aphrody-labs forks so needs-generate is eliminated.

Drop from core: poe-filter, nqc, cyberchef, chatito, uxntal, cpon, squirrel, gstlaunch, cst, test, and duplicate wgsl-bevy.

Fix 2 — Valid, Typed Schema (crates/code-grammars/grammars.toml)

Replaces broken quotes, untyped used_by prose, and flat single-grammar assumptions:

Ini, TOML
schema_version = 1

[toolchains.tree-sitter]
path = "third_party/tree-sitter"
status = "vendored" # source present; CLI not invoked during offline cargo build
license = "MIT"
used_by = ["crates/code-grammars"]

[toolchains.llvm-project]
path = "third_party/llvm-project"
status = "vendored-source" # full checkout per TARGETS.md; host binaries not built locally
license = "Apache-2.0 WITH LLVM-exception"
used_by = []
doc_refs = ["docs/compat/TARGETS.md"]
notes = "Host clang-cl/clang toolchain provisioned on prd/fr2 runners, not compiled from C:\\src"

# Multi-grammar repo example (fixes typescript + tsx)
[[grammars]]
id = "typescript"
repo = "third_party/tree-sitter-typescript"
subpath = "typescript"
symbol = "tree_sitter_typescript"
abi = 14
scanner = "c"
tier = 1
status = "unwired" # flip to "registered" ONLY after crates/code-grammars/build.rs exists & passes CI
license = "MIT"
extensions = ["ts", "mts", "cts"]
queries = { highlights = "queries/highlights.scm", tags = "queries/tags.scm" }
used_by = ["crates/code-grammars"]

[[grammars]]
id = "tsx"
repo = "third_party/tree-sitter-typescript"
subpath = "tsx"
symbol = "tree_sitter_tsx"
abi = 14
scanner = "c"
tier = 1
status = "unwired"
license = "MIT"
extensions = ["tsx"]
queries = { highlights = "queries/highlights.scm", tags = "queries/tags.scm" }
used_by = ["crates/code-grammars"]

Fix 3 — Enforce Truth-on-Disk in packages/machine/src/check-grammars.ts (invoked by just ci)

Rejects phantom used_by paths, copyleft licenses, C++ scanners, and missing src/parser.c:

TypeScript
import { existsSync } from "node:fs";
import { join } from "node:path";

const ALLOWED_LICENSES = new Set(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense"]);

type Grammar = {
  id: string;
  repo: string;
  subpath?: string;
  scanner: "none" | "c";
  status: "unwired" | "registered" | "wasm";
  license: string;
  used_by: string[];
};

const raw = await Bun.file("crates/code-grammars/grammars.toml").text();
const doc = Bun.TOML.parse(raw) as { grammars: Grammar[]; toolchains: Record<string, { path: string; used_by: string[] }> };
const errors: string[] = [];

for (const [name, tc] of Object.entries(doc.toolchains ?? {})) {
  if (!existsSync(tc.path)) errors.push(`[toolchain:${name}] missing path: ${tc.path}`);
  for (const consumer of tc.used_by) {
    if (!existsSync(consumer)) errors.push(`[toolchain:${name}] phantom used_by: ${consumer}`);
  }
}

for (const g of doc.grammars ?? []) {
  if (!ALLOWED_LICENSES.has(g.license)) errors.push(`[${g.id}] forbidden/unverified license: ${g.license}`);
  const dir = g.subpath ? join(g.repo, g.subpath) : g.repo;
  if (!existsSync(join(dir, "src/parser.c"))) errors.push(`[${g.id}] missing pre-generated ${dir}/src/parser.c`);
  if (existsSync(join(dir, "src/scanner.cc"))) errors.push(`[${g.id}] C++ scanner.cc forbidden; port or move to wasm tier`);
  for (const consumer of g.used_by) {
    if (!existsSync(consumer)) errors.push(`[${g.id}] phantom used_by: ${consumer}`);
    if (g.status === "registered" && !existsSync(join(consumer, "build.rs"))) {
      errors.push(`[${g.id}] marked registered but ${consumer}/build.rs does not exist`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

