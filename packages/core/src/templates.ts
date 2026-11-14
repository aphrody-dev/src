// Declarative template engine and programmatic Bun Docs MDX builders driven by MonorepoSnapshot.
import type { MonorepoSnapshot } from "./scanner.ts";

export interface MdxFrontmatter {
  title: string;
  description: string;
  body: string;
}

/** Wraps markdown/MDX body with Bun Docs YAML frontmatter. */
export function renderMdx(doc: MdxFrontmatter): string {
  const safeTitle = doc.title.replace(/"/g, '\\"');
  const safeDesc = doc.description.replace(/"/g, '\\"');
  return [
    "---",
    `title: "${safeTitle}"`,
    `description: "${safeDesc}"`,
    "---",
    "",
    doc.body.trimEnd(),
    "",
  ].join("\n");
}

function lookupPath(ctx: Record<string, unknown>, path: string): unknown {
  const parts = path.trim().split(".");
  let cur: unknown = ctx;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur ?? "";
}

/** Renders `{{path}}` placeholders and `{{#each list}}...{{/each}}` blocks against `ctx`. */
export function renderTemplate(
  template: string,
  ctx: Record<string, unknown>,
): string {
  const withLoops = template.replace(
    /\{\{#each\s+([A-Za-z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, listKey: string, block: string) => {
      const items = lookupPath(ctx, listKey);
      if (!Array.isArray(items)) return "";
      return items
        .map((item) => {
          if (item !== null && typeof item === "object") {
            return renderTemplate(block, {
              ...ctx,
              ...(item as Record<string, unknown>),
            });
          }
          return block.replace(/\{\{this\}\}/g, String(item ?? ""));
        })
        .join("");
    },
  );
  return withLoops.replace(/\{\{([A-Za-z0-9_.]+)\}\}/g, (_, key: string) => {
    const val = lookupPath(ctx, key);
    return val === undefined || val === null ? "" : String(val);
  });
}

/** Replaces `<!-- @gen:id -->...<!-- @end:id -->` regions in an existing document. */
export function applyTemplateSections(
  doc: string,
  sections: Record<string, string>,
): string {
  return doc.replace(
    /<!--\s*@gen:([A-Za-z0-9_-]+)\s*-->[\s\S]*?<!--\s*@end:\1\s*-->/g,
    (full, id: string) => {
      if (!(id in sections)) return full;
      return `<!-- @gen:${id} -->\n${sections[id]!.trimEnd()}\n<!-- @end:${id} -->`;
    },
  );
}

function formatLayerSummary(snap: MonorepoSnapshot): string {
  const counts = new Map<string, number>();
  for (const c of snap.crates) {
    const key = c.layer ?? "unlayered";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const p of snap.packages) {
    const key = p.layer ?? "unlayered";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([layer, n]) => `| ${layer} | ${n} |`)
    .join("\n");
}

function formatHeadersTable(snap: MonorepoSnapshot): string {
  if (snap.headers.length === 0) return "_No C ABI headers found._";
  const rows = snap.headers.map(
    (h) =>
      `| \`${h.file}\` | ${h.defines.length} | ${h.functions.length} | ${h.functions
        .slice(0, 6)
        .map((f) => `\`${f}\``)
        .join(", ")} |`,
  );
  return [
    "| Header | Defines | Exports | Sample Symbols |",
    "| :--- | ---: | ---: | :--- |",
    ...rows,
  ].join("\n");
}

function formatBunFlatTable(snap: MonorepoSnapshot): string {
  if (!snap.bunFlat) return "_crates/bun-flat/flat.toml not found._";
  const rows = snap.bunFlat.modules.map(
    (m) =>
      `| \`${m.name}\` | \`${m.crate}\` | ${m.files.map((f) => `\`${f}\``).join(", ")} | ${m.license} |`,
  );
  return [
    `Fork: \`${snap.bunFlat.fork}\` @ \`${snap.bunFlat.commit.slice(0, 12)}\` (handwritten: ${snap.bunFlat.handwritten.map((h) => `\`${h}\``).join(", ")})`,
    "",
    "| Module | Upstream Crate | Source Files | License |",
    "| :--- | :--- | :--- | :--- |",
    ...rows,
  ].join("\n");
}

/** Generates C:\src\README.md from live monorepo snapshot and SQLite/graph stats. */
export function buildReadme(snap: MonorepoSnapshot): string {
  const pkgNames = snap.packages
    .map((p) => `\`${p.dir.replace("packages/", "")}\``)
    .join(", ");
  const appNames = snap.apps
    .map((a) => `\`${a.name}\`${a.isSubmodule ? " (submodule)" : ""}`)
    .join(", ");
  const idxLine = snap.indexCounts
    ? `SQLite index (\`var/index/core.db\`): ${snap.indexCounts.files} files, ${snap.indexCounts.symbols} symbols, ${snap.indexCounts.imports} imports, ${snap.indexCounts.refs} call refs.`
    : "SQLite index: run `bun packages/core/src/cli.ts gen-docs` to populate or refresh.";
  const graphLine = snap.graphify
    ? `Code graph (\`${snap.graphify.source}\`): ${snap.graphify.nodes} nodes, ${snap.graphify.edges} edges, ${snap.graphify.communities} communities.`
    : "";

  const tpl = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/gen/logo/aphrody-labs-wordmark-dark.svg">
  <img alt="Aphrody Labs" src="assets/brand/gen/logo/aphrody-labs-wordmark-light.svg" height="56">
</picture>

<img alt="license: MIT OR Apache-2.0" src="assets/brand/gen/badges/license.svg"> <img alt="rust toolchain" src="assets/brand/gen/badges/rust.svg"> <img alt="runtime: bun" src="assets/brand/gen/badges/bun.svg"> <img alt="workflow: main only" src="assets/brand/gen/badges/main-only.svg">

Brand, tokens and icons: [assets/brand](assets/brand) (\`ay brand build\`, design system in [packages/design](packages/design/DESIGN.md)).

# src

Monorepo of Aphrody. Contract: [AGENTS.md](AGENTS.md) and [GEMINI.md](GEMINI.md). Master plan: [docs/PLAN.mdx](docs/PLAN.mdx).

## Stack Overview

- **Pure C23 LLVM ABI Core**: [crates/core-capi](crates/core-capi) (\`aphrody_core.h\` exporting \`core_*\` and unified \`ai_os_*\`, \`aphrody_zig.h\`, \`aphrody_mwg.h\`) compiled with \`clang\` ThinLTO and \`-Wall -Wextra -Wpedantic -Werror\`. See [docs/llvm/PURE-C-LLVM.mdx](docs/llvm/PURE-C-LLVM.mdx).
- **Agent OS (\`@aphrody/ai-os\`)**: cross-platform sandboxed Unix/GNU-like OS distribution for agents unifying FHS VFS (\`/etc/ai-os\`, \`/var/lib/ai-os\`, \`/proc/agent\`, \`/dev/{llm,rag,world,sys1}\`), LLM, RAG, World Model, and System 1 decision under one C ABI (\`aphrody_core_capi\`).
- **Bun v1.4.5+ Runtime**: pure Bun TypeScript packages with zero third-party npm dependencies (\`bun:ffi\`, \`bun:sqlite\`, \`Bun.Glob\`, \`Bun.serve\`).
- **Rust {{workspace.edition}} Workspace**: {{cratesCount}} crates in \`crates/*\` (edition {{workspace.edition}}, rust-version {{workspace.rustVersion}}, {{workspace.workspaceDepsCount}} workspace dependencies) including \`ay\` CLI, \`archguard\`, \`core\`, \`core-capi\`, \`ffi\`, \`bun-flat\`, \`tv-*\`, \`steam-depot\`, \`lore*\`.
- **Zig 0.17.1 Native Cores**: \`packages/native/native\` and browser cores exporting stable C ABI symbols via \`aphrody_zig.h\`.
- **Modern Web Guidance (\`@aphrody/wck\`)**: pure Bun + \`mwg_capi\` (\`packages/wck/native\`) hybrid RAG search, Baseline gates, and MCP tools. See [docs/web/MODERN-WEB-GUIDANCE.mdx](docs/web/MODERN-WEB-GUIDANCE.mdx).
- **\`ay\` Multicall CLI**: unified repository interface (\`ay arch check --strict\`, \`ay manifests\`, \`ay flat check\`, \`ay gaming\`, \`ay steam\`).

## Layout

| Directory | Count / Content |
| :--- | :--- |
| [\`apps/\`](apps) | {{appsCount}} apps: {{appNames}} |
| [\`packages/\`](packages) | {{packagesCount}} Bun \`@aphrody/*\` packages: {{pkgNames}} |
| [\`crates/\`](crates) | {{cratesCount}} Rust {{workspace.edition}} crates (\`ay\`, \`archguard\`, \`core-capi\`, \`bun-flat\`, \`ffi\`, \`rust-stack\`, \`tv-*\`, \`steam-depot\`, \`lore*\`) |
| [\`infra/\`](infra) | Fleet, Docker, Cloudflare, and Chromium factory configuration |
| [\`third_party/\`](third_party) | Pinned upstream checkouts and forks in \`src.lock.json\` (\`DEPS\`, \`.gitmodules\`) |
| [\`docs/\`](docs) | Architecture MDX plans, LLVM/C ABI docs, Modern Web Guidance, and generated [\`docs/reference/\`](docs/reference) |

## Live Graph and Index

- {{idxLine}}
{{#each extraGraphLines}}- {{this}}
{{/each}}
## Commands

Rust compiles in CI or on the build host (\`fr1\`), never on the workstation.

\`\`\`sh
just doctor                            # toolchain doctor
just arch-check                        # architecture gate (ay arch check --strict)
bun scripts/checkdeps.ts               # Chromium-style DEPS.rules layer gate
bun packages/core/src/cli.ts gen-docs  # regenerate README.md, MDX plans, and docs/reference/*.md
bun packages/core/src/cli.ts search <q> # fuzzy symbol and doc search
bun test packages/wck                  # @aphrody/wck Modern Web Guidance suite
\`\`\`

## Key Documents

| Topic | Document |
| :--- | :--- |
| Master Architectural Plan | [docs/PLAN.mdx](docs/PLAN.mdx) |
| Pure C23 LLVM Core & C ABI | [docs/llvm/PURE-C-LLVM.mdx](docs/llvm/PURE-C-LLVM.mdx) |
| Modern Web Guidance & RAG | [docs/web/MODERN-WEB-GUIDANCE.mdx](docs/web/MODERN-WEB-GUIDANCE.mdx) |
| Reference Pillars | [docs/reference/tree-sitter.md](docs/reference/tree-sitter.md), [docs/reference/llvm-toolchain.md](docs/reference/llvm-toolchain.md), [docs/reference/bun-ffi.md](docs/reference/bun-ffi.md) |
| Games & Creative Suite Plan | [docs/games/PLAN.md](docs/games/PLAN.md) |
`;

  return renderTemplate(tpl, {
    workspace: snap.workspace,
    cratesCount: snap.crates.length,
    packagesCount: snap.packages.length,
    appsCount: snap.apps.length,
    appNames,
    pkgNames,
    idxLine,
    extraGraphLines: graphLine ? [graphLine] : [],
  });
}

/** Generates C:\src\docs\PLAN.mdx in Bun Docs MDX format. */
export function buildPlanMdx(snap: MonorepoSnapshot): string {
  const layerTable = formatLayerSummary(snap);
  const headersTable = formatHeadersTable(snap);
  const bunFlatTable = formatBunFlatTable(snap);
  const topLangs = snap.topClasses
    .slice(0, 8)
    .map(
      (c) =>
        `| \`${c.layer}/${c.feature}\` | ${c.language} | ${c.files} | ${c.symbols} |`,
    )
    .join("\n");

  const body = `# Aphrody Master Architectural Plan

<Callout type="info" title="Live Snapshot">
Generated from live monorepo metadata on \`${snap.collectedAt}\` (${snap.crates.length} crates, ${snap.packages.length} packages, ${snap.apps.length} apps).
</Callout>

<Cards>
  <Card title="Pure C23 LLVM Core" href="/docs/llvm/PURE-C-LLVM" description="C23/C++23 ABI headers, ThinLTO, DEPS.rules layers, and bun-flat crates." />
  <Card title="Modern Web Guidance" href="/docs/web/MODERN-WEB-GUIDANCE" description="@aphrody/wck hybrid BM25+Int8 RAG, mwg_capi.dll, and agent MCP." />
</Cards>

## 1. Monorepo Topology

- **Rust Workspace**: edition \`${snap.workspace.edition}\`, MSRV \`${snap.workspace.rustVersion}\`, \`${snap.crates.length}\` crates in \`crates/*\`, \`${snap.workspace.workspaceDepsCount}\` workspace dependencies in \`Cargo.toml\`.
- **Bun Packages**: \`${snap.packages.length}\` zero-dependency \`@aphrody/*\` packages in \`packages/*\` targeting Bun v1.4.4+.
- **Applications**: \`${snap.apps.length}\` directories in \`apps/*\`.
${snap.graphify ? `- **Code Graph**: \`${snap.graphify.nodes}\` nodes, \`${snap.graphify.edges}\` edges, \`${snap.graphify.communities}\` communities (\`${snap.graphify.source}\`).` : ""}
${snap.indexCounts ? `- **SQLite Index**: \`${snap.indexCounts.files}\` files, \`${snap.indexCounts.symbols}\` symbols, \`${snap.indexCounts.imports}\` imports, \`${snap.indexCounts.refs}\` calls.` : ""}

## 2. Layered Dependency Architecture (\`DEPS.rules\`)

Every unit declares its layer (\`L0\` toolchain through \`L5\` surfaces) enforced by \`bun scripts/checkdeps.ts\`.

| Layer | Units |
| :--- | ---: |
${layerTable}

## 3. Pure C23 LLVM ABI Core

All native cross-language boundaries converge on C ABI headers in \`crates/core-capi/include/\` consumed by Bun (\`bun:ffi\`), Rust (\`crates/ffi\`), and Zig 0.17.1.

${headersTable}

## 4. Bun Fork Absorption (\`crates/bun-flat\`)

${bunFlatTable}

## 5. Modern Web Guidance & Agent Tooling

\`@aphrody/wck\` (\`packages/wck\`) combines pure Bun RAG hybrid search (BM25 + Int8 quantized embeddings + RRF), \`.mwgrc\` Baseline gates, and \`mwg_capi.dll\` (\`aphrody_mwg.h\`) with \`packages/ai-os\` MCP tools.

## 6. Top Indexed Codebase Clusters

${topLangs ? `| Cluster | Language | Files | Symbols |\n| :--- | :--- | ---: | ---: |\n${topLangs}` : "_Run `bun packages/core/src/cli.ts index` or `gen-docs --scan` to populate cluster metrics._"}
`;

  return renderMdx({
    title: "Aphrody Master Architectural Plan",
    description:
      "Live monorepo architecture: Pure C23 LLVM ABI core, Bun v1.4.4+, Rust 2024, Zig 0.17.1, DEPS.rules layers, and @aphrody/wck.",
    body,
  });
}

/** Generates C:\src\docs\llvm\PURE-C-LLVM.mdx in Bun Docs MDX format. */
export function buildPureCLlvmMdx(snap: MonorepoSnapshot): string {
  const headersTable = formatHeadersTable(snap);
  const bunFlatTable = formatBunFlatTable(snap);
  const l0l1 = snap.crates
    .filter((c) => c.layer === "L0" || c.layer === "L1")
    .map((c) => `- \`${c.dir}\` (\`${c.name}\`, ${c.layer})`)
    .join("\n");

  const body = `# Pure C23 LLVM Core and C ABI

<Callout type="warn" title="Compiler & ABI Contract">
Every header in \`crates/core-capi/include/*.h\` must pass \`clang -std=c23 -Wall -Wextra -Wpedantic -Werror -fsyntax-only\` and \`clang++ -std=c++23 -Wall -Wextra -Werror -fno-exceptions -fno-rtti -fsyntax-only\` with zero warnings.
</Callout>

Generated from \`crates/core-capi/include/*.h\`, \`crates/*/DEPS.rules\`, and \`crates/bun-flat/flat.toml\`.

## 1. Compiler and ABI Rigor

- **C Standard**: C23 (\`-std=c23 -Wall -Wextra -Wpedantic -Werror\`) with C++23 header compatibility (\`-fno-exceptions -fno-rtti\`).
- **Linker & LTO**: shared LLVM toolchain (\`clang\` / \`clang-cl\`, \`lld\` / \`lld-link\`) with ThinLTO (\`-flto=thin\`, \`-Clinker-plugin-lto\`) across C, Rust, and Zig 0.17.1.
- **Memory Ownership**: caller frees returned strings via the matching \`*_free(char *p)\` function; ABI version is queried via \`*_abi_version()\`.

## 2. Exported C ABI Headers

${headersTable}

## 3. Base Layers (\`L0\` / \`L1\` in \`DEPS.rules\`)

${l0l1 || "_No L0/L1 crates found._"}

## 4. Bun Fork Crates (\`crates/bun-flat/flat.toml\`)

${bunFlatTable}

## 5. Verification Commands

<Tabs items={["C23", "C++23", "Bun"]}>
<Tab value="C23">

\`\`\`sh
clang -std=c23 -Wall -Wextra -Wpedantic -Werror -fsyntax-only -x c crates/core-capi/include/aphrody_core.h crates/core-capi/include/aphrody_zig.h crates/core-capi/include/aphrody_mwg.h
\`\`\`

</Tab>
<Tab value="C++23">

\`\`\`sh
clang++ -std=c++23 -Wall -Wextra -Werror -fno-exceptions -fno-rtti -fsyntax-only -x c++ crates/core-capi/include/aphrody_zig.h crates/core-capi/include/aphrody_mwg.h
\`\`\`

</Tab>
<Tab value="Bun">

\`\`\`sh
bun test ./packages/core/test/
\`\`\`

</Tab>
</Tabs>
`;

  return renderMdx({
    title: "Pure C23 LLVM Core and C ABI",
    description:
      "C23/C++23 ABI headers, -Wall -Wextra -Wpedantic -Werror, ThinLTO, DEPS.rules base layers, and bun-flat crates.",
    body,
  });
}

/** Generates C:\src\docs\web\MODERN-WEB-GUIDANCE.mdx in Bun Docs MDX format. */
export function buildModernWebGuidanceMdx(snap: MonorepoSnapshot): string {
  const wckPkg = snap.packages.find((p) => p.dir === "packages/wck");
  const mwgHeader = snap.headers.find((h) => h.file.endsWith("aphrody_mwg.h"));

  const body = `# Modern Web Guidance, RAG, and @aphrody/wck

<Callout type="info" title="Zero-Dependency Pure Bun + C23 Native Core">
\`@aphrody/wck\` runs with zero external npm dependencies on Bun v1.4.4+, pairing \`mwg_capi.dll\` (\`bun:ffi\`) with a deterministic pure-Bun fallback.
</Callout>

Generated from \`packages/wck\`, \`crates/core-capi/include/\`, and \`packages/ai-os\`.

## 1. Package Overview

- **Package**: \`${wckPkg?.name ?? "@aphrody/wck"}\` v${wckPkg?.version ?? "1.0.0"} (${wckPkg?.depsCount ?? 0} external npm dependencies).
- **Description**: ${wckPkg?.description ?? "Compile-Time Web Validator (Google SEO + AI Mode SEO + Modern Web Guidelines + Core Web Vitals + Lighthouse 100 + WASM + WebGPU Chromium Spec)"}.
- **Native Core**: \`mwg_capi.dll\` compiled from \`crates/core-capi/c/mwg_core.c\` with C23 strict flags and \`bun:ffi\` bridge (\`packages/wck/src/mwg-ffi.ts\`) plus deterministic pure-Bun fallback.

## 2. C ABI Surface (\`aphrody_mwg.h\`)

${
  mwgHeader
    ? `- **Defines (${mwgHeader.defines.length})**: ${mwgHeader.defines.map((d) => `\`${d}\``).join(", ")}\n- **Functions (${mwgHeader.functions.length})**: ${mwgHeader.functions.map((f) => `\`${f}\``).join(", ")}`
    : "- Expected exports: `mwg_abi_version`, `mwg_free`, `mwg_audit_html_json`, `mwg_audit_css_json`, `mwg_audit_js_json`, `mwg_parse_mdx_json`, `mwg_search_guidance_json`, `mwg_feature_lookup_json`, `mwg_hash64`."
}

## 3. Hybrid RAG Search and Baseline Gates

<Cards>
  <Card title="Hybrid Retrieval" description="Okapi BM25 lexical scoring + Int8 quantized 256d static embeddings fused via Reciprocal Rank Fusion (RRF) over packages/wck/data/." />
  <Card title="Baseline Gates & MCP" description=".mwgrc configuration, legacy-scan/search/retrieve/list/baselinestatus/mdx CLI subcommands, and packages/ai-os MCP tool integration." />
</Cards>

## 4. Verification

\`\`\`sh
bun test ./packages/wck
bun check packages/wck
\`\`\`
`;

  return renderMdx({
    title: "Modern Web Guidance and @aphrody/wck",
    description:
      "Pure Bun Modern Web Guidance validator, hybrid BM25+Int8 RAG, mwg_capi.dll C23 FFI, and agent MCP integration.",
    body,
  });
}
