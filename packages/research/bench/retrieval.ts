// Retrieval benchmark on the research pack (39 entries = 3 items x 13 fields).
// Query per (item, field) = field description + outline item description (text not present verbatim in the entry).
// Target = entry research:<topic>/<item>#<field>. Reports P@1, R@5, MRR and select() latency per head config.
import { Context, type Embedder, hashEmbedder } from "@aphrody/agent-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Fields, fileName, loadYaml, type Outline, researchEntries } from "../src";

export const PACK = join(import.meta.dir, "..", "fixtures", "ai_foundations_to_agi");

export const CONFIGS = {
  lexical: { lexical: 1, semantic: 0, structural: 0, recency: 0 },
  semantic: { lexical: 0, semantic: 1, structural: 0, recency: 0 },
  merged: { lexical: 0.5, semantic: 0.5, structural: 0, recency: 0 },
  default: undefined,
} as const;

export async function bench(embedder: Embedder = hashEmbedder()) {
  const outline = await loadYaml<Outline>(join(PACK, "outline.yaml"));
  const fields = await loadYaml<Fields>(join(PACK, "fields.yaml"));
  const ctx = new Context(join(mkdtempSync(join(tmpdir(), "agent-bench-")), "c.sqlite"), embedder);
  const t0 = performance.now();
  for (const it of outline.items) {
    const data = await Bun.file(join(PACK, "results", `${fileName(it.name)}.json`)).json();
    await ctx.ingest(researchEntries(outline.topic, data));
  }
  const ingestMs = performance.now() - t0;
  const queries = outline.items.flatMap((it) =>
    fields.required_fields
      .filter((f) => !["name", "source_url", "category"].includes(f.name))
      .map((f) => ({ q: `${f.description} ${it.description}`, target: `research:${outline.topic}/${fileName(it.name)}#${f.name}` })),
  );
  const out: Record<string, { p1: number; r5: number; mrr: number; msPerQuery: number }> = {};
  for (const [name, weights] of Object.entries(CONFIGS)) {
    let p1 = 0;
    let r5 = 0;
    let mrr = 0;
    const t = performance.now();
    for (const { q, target } of queries) {
      const sel = await ctx.select(q, { sources: ["research"], k: 10, budgetTokens: 1e9, weights });
      const rank = sel.findIndex((s) => s.id === target);
      if (rank === 0) p1++;
      if (rank >= 0 && rank < 5) r5++;
      if (rank >= 0) mrr += 1 / (rank + 1);
    }
    const n = queries.length;
    out[name] = { p1: p1 / n, r5: r5 / n, mrr: mrr / n, msPerQuery: (performance.now() - t) / n };
  }
  ctx.close();
  return { entries: outline.items.length * fields.required_fields.length, queries: queries.length, ingestMs, embedder: embedder.id, results: out };
}

if (import.meta.main) {
  const { aiEmbedder } = await import("@aphrody/agent-core");
  let emb: Embedder = hashEmbedder();
  if (Bun.argv.includes("--workers-ai")) {
    const { createWorkersAI } = await import("workers-ai-provider");
    const w = createWorkersAI({ accountId: Bun.env.CLOUDFLARE_ACCOUNT_ID!, apiKey: Bun.env.CLOUDFLARE_API_TOKEN! });
    emb = aiEmbedder(w.textEmbedding("@cf/baai/bge-m3"), "workers-ai:bge-m3");
  }
  const r = await bench(emb);
  console.log(`embedder=${r.embedder} entries=${r.entries} queries=${r.queries} ingest=${r.ingestMs.toFixed(0)}ms`);
  for (const [k, v] of Object.entries(r.results))
    console.log(`${k.padEnd(9)} P@1=${v.p1.toFixed(3)} R@5=${v.r5.toFixed(3)} MRR=${v.mrr.toFixed(3)} ${v.msPerQuery.toFixed(2)}ms/query`);
}
