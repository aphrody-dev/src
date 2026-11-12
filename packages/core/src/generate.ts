// Generates skills (~/.claude/skills/<name>/SKILL.md) and docs/reference/<pillar>.md from the index.
// Only code that is indexed AND covered by a test in the same feature is cited.
import type { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { usersOf } from "./store.ts";

export interface Pillar {
  skill: string;
  title: string;
  /** Import/call substrings that mark a file as a user of the pillar. */
  needles: string[];
  /** Upstream sources; [V] = consulted this session, [NV] = not verified. */
  sources: { url: string; verified: boolean }[];
  localClones: string[];
  summary: string;
}

export const PILLARS: Pillar[] = [
  {
    skill: "tree-sitter",
    title: "tree-sitter dans src",
    needles: ["tree_sitter", "aphrody_core", "web-tree-sitter", "TreeSitterEngine"],
    sources: [
      { url: "https://tree-sitter.github.io/tree-sitter/", verified: true },
      { url: "https://tree-sitter.github.io/tree-sitter/using-parsers/queries/", verified: false },
    ],
    localClones: ["third_party/tree-sitter", "third_party/tree-sitter-*"],
    summary:
      "Parsing multi-langage, extraction symboles/appels/imports et requêtes S-expression via crates/core (aphrody-core) ; C ABI core_parse_json/core_query_json ; TS @aphrody/core parse()/query().",
  },
  {
    skill: "llvm-toolchain",
    title: "Toolchain LLVM partagée (clang/lld/rustc) dans src",
    needles: ["cc::Build", "inkwell", "llvm_sys", "clang_sys", "bindgen::Builder"],
    sources: [
      { url: "https://llvm.org/docs/ (LLVM 24.0.0git)", verified: false },
      { url: "https://llvm.org/docs/LinkTimeOptimization.html", verified: true },
    ],
    localClones: ["third_party/llvm-project"],
    summary:
      "C ABI natif (crates/core-capi, cdylib) construit avec la toolchain LLVM partagée pour la LTO inter-langages (docs/llvm/UNIFIED-TOOLCHAIN.md).",
  },
  {
    skill: "bun-ffi",
    title: "bun:ffi dans src",
    needles: ["bun:ffi"],
    sources: [{ url: "https://bun.com/reference/bun/ffi", verified: true }],
    localClones: ["third_party/bun (docs/runtime/ffi.mdx)"],
    summary:
      "Pont TS <-> natif : dlopen + symboles typés, CString + core_free, JSCallback pour le streaming (packages/core/src/ffi.ts).",
  },
];

interface Cited {
  path: string;
  tests: string[];
}

function testedUsers(db: Database, p: Pillar): Cited[] {
  const users = new Set(p.needles.flatMap((n) => usersOf(db, n)));
  const testsByFeature = db
    .query(
      `SELECT layer, feature, path FROM files
       WHERE path LIKE '%test%' OR path LIKE '%/tests/%' OR path LIKE '%.test.ts' OR path LIKE '%_test.%'`,
    )
    .all() as { layer: string; feature: string; path: string }[];
  const rustTests = new Set(
    (db.query(`SELECT DISTINCT path FROM symbols WHERE name = 'tests' AND kind = 'module'`).all() as { path: string }[]).map(
      (r) => r.path,
    ),
  );
  const out: Cited[] = [];
  for (const path of [...users].sort()) {
    if (path.startsWith("third_party/") || path.startsWith("vendor/")) continue;
    const [layer, feature] = path.split("/");
    const tests = testsByFeature.filter((t) => t.layer === layer && t.feature === feature).map((t) => t.path);
    if (rustTests.has(path)) tests.unshift(path);
    if (tests.length) out.push({ path, tests: [...new Set(tests)].slice(0, 3) });
  }
  return out;
}

function upstreamCount(db: Database, p: Pillar): number {
  const prefixes = p.localClones.map((c) => c.split(" ")[0]!.replace("*", "%"));
  let n = 0;
  for (const pre of prefixes)
    n += (db.query("SELECT COUNT(*) AS n FROM files WHERE path LIKE ?").get(`${pre}%`) as { n: number }).n;
  return n;
}

function render(p: Pillar, cited: Cited[], upstream: number, forSkill: boolean): string {
  const lines = [
    ...(forSkill
      ? ["---", `name: ${p.skill}`, `description: ${p.title}. ${p.summary} Utiliser avant d'écrire ou modifier du code ${p.skill} dans C:\\src.`, "---", ""]
      : []),
    `# ${p.title}`,
    "",
    p.summary,
    "",
    "Sources :",
    ...p.sources.map((s) => `- ${s.verified ? "[V]" : "[NV]"} ${s.url}`),
    ...p.localClones.map((c) => `- clone local : ${c} (${upstream} fichiers indexés)`),
    "",
    `Code testé qui l'utilise (${cited.length}, généré par \`bun packages/core/src/cli.ts gen\`) :`,
    ...cited.map((c) => `- \`${c.path}\` — tests : ${c.tests.map((t) => `\`${t}\``).join(", ")}`),
    "",
    "Scripts :",
    "- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).",
    `- \`bun packages/core/src/cli.ts users ${p.needles[0]}\` : liste les fichiers qui l'importent/l'appellent.`,
    "- `bun test packages/core` : round-trip bun:ffi <-> core-capi.",
    "",
  ];
  return lines.join("\n");
}

export interface GenerateResult {
  skill: string;
  cited: number;
  skillPath: string;
  docPath: string;
}

export async function generate(db: Database, srcRoot: string, skillsRoot = join(homedir(), ".claude", "skills")) {
  const results: GenerateResult[] = [];
  mkdirSync(join(srcRoot, "docs", "reference"), { recursive: true });
  for (const p of PILLARS) {
    const cited = testedUsers(db, p);
    const up = upstreamCount(db, p);
    const skillDir = join(skillsRoot, p.skill);
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    const docPath = join(srcRoot, "docs", "reference", `${p.skill}.md`);
    await Bun.write(skillPath, render(p, cited, up, true));
    await Bun.write(docPath, render(p, cited, up, false));
    results.push({ skill: p.skill, cited: cited.length, skillPath, docPath });
  }
  return results;
}
