// ai-os review : point d'entrée du tribunal (src/review/index.ts, docs/reviews/README.md). Sortie JSON sur stdout,
// journal JSONL sur stderr. Code de sortie : 0 note >= seuil, 1 sous le seuil (ou gelé), 2 aucun moteur.
//   ai-os review <chemins|diff|A..B|commit> [-- chemins] [--voices gemini,claude,judge] [--threshold 16]
//                [--fix] [--rounds 4] [--check "<cmd>"] [--slug s] [--title t] [--timeout 420] [--no-cache]
//                [--out <dossier>] [--no-write] [--dry-run] [--host H] [--summary <fichier>]
//   ai-os review sources [--force]   rafraîchit les sources officielles (var/review/sources, commit source noté)
//   ai-os review mine                notes de tous les verdicts archivés, par voix
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { srcRoot } from "../orch/fleet";
import { loadConfig, mine, review } from "./index";
import { SourceCache } from "./sources";

export async function main(argv: string[]): Promise<number> {
  const dash = argv.indexOf("--");
  const { positionals, values } = parseArgs({
    args: dash >= 0 ? argv.slice(0, dash) : argv,
    allowPositionals: true,
    options: {
      voices: { type: "string" },
      threshold: { type: "string" },
      fix: { type: "boolean" },
      rounds: { type: "string" },
      check: { type: "string" },
      slug: { type: "string" },
      title: { type: "string" },
      timeout: { type: "string" },
      "no-cache": { type: "boolean" },
      out: { type: "string" },
      "no-write": { type: "boolean" },
      "dry-run": { type: "boolean" },
      host: { type: "string" },
      summary: { type: "string" },
      force: { type: "boolean" },
      quiet: { type: "boolean" },
    },
  });
  const print = (x: unknown) => console.log(JSON.stringify(x, null, 2));
  const num = (s: string | undefined, name: string) => {
    if (s === undefined) return undefined;
    const n = Number(s);
    if (s.trim() === "" || !Number.isFinite(n) || n <= 0)
      throw new Error(`--${name} : nombre positif attendu`);
    return n;
  };
  if (positionals[0] === "sources" && dash < 0) {
    print(
      await new SourceCache(srcRoot()).refresh(
        loadConfig().sources,
        values.force === true,
      ),
    );
    return 0;
  }
  if (positionals[0] === "mine" && dash < 0) {
    print(mine());
    return 0;
  }
  const spec = [...positionals, ...(dash >= 0 ? argv.slice(dash) : [])];
  if (!positionals.length)
    throw new Error(
      "usage : ai-os review <chemins|diff|A..B|commit> [-- chemins] [--voices …] [--threshold 16] [--fix]",
    );
  const r = await review({
    spec,
    voices: values.voices
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    threshold: num(values.threshold, "threshold"),
    fix: values.fix,
    rounds: num(values.rounds, "rounds"),
    check: values.check,
    slug: values.slug,
    title: values.title,
    timeoutS: num(values.timeout, "timeout"),
    noCache: values["no-cache"],
    out: values.out,
    write: values["no-write"] ? false : undefined,
    dryRun: values["dry-run"],
    host: values.host,
    log: values.quiet ? undefined : (e) => console.error(JSON.stringify(e)),
  });
  print(r);
  if (values.summary)
    appendFileSync(
      values.summary,
      `## ai-os review : ${r.status}, ${r.score ?? "?"}/20 (seuil ${r.threshold})\n\n${r.voices.map((v) => `- ${v.voice} : ${v.score ?? "?"}/20 (${v.provider ?? "aucun moteur"})`).join("\n")}\n\n${r.verdict}\n`,
    );
  if (values["dry-run"]) return 0;
  return r.status === "sans moteur" ? 2 : r.ok ? 0 : 1;
}

// Lancé directement ou par le répartiteur src/cli.ts ; importé par les tests sans exécution (bun test : NODE_ENV=test).
if (import.meta.main || Bun.env.NODE_ENV !== "test") {
  try {
    process.exitCode = await main(Bun.argv.slice(2));
  } catch (e: any) {
    console.error(String(e?.message ?? e));
    process.exitCode = 2;
  }
}
