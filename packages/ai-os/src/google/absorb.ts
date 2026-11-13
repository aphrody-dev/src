#!/usr/bin/env bun
// Suivi des copies absorbées de google-labs-code et miroirs de skills. Source unique : les forks
// third_party/<checkout> décrits par infra/upstream/stacks.d/google-labs.toml (section `absorbed`).
//   check            pour chaque copie absorbée : fichiers amont modifiés depuis le commit enregistré
//                    (fork absent = ignoré, sauf --strict)
//   skills [--write] miroirs générés des skills stitch-skills et jules-skills dans .agents/skills/<préfixe>-<nom>
//                    (lus par tous les agents ; Claude Code par le lien .claude/skills). Sans --write : écart
//                    seulement, code 1 si le miroir dérive.
// Les commandes de skills sont réécrites pour bun (npx/npm/node -> bunx/bun) et un bandeau renvoie aux
// surfaces de src (outils relais stitch__*, ay design, ay jules).
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(
  Bun.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..", ".."),
);
const STACKS = join(root, "infra", "upstream", "stacks.d", "google-labs.toml");

type Absorbed = { commit: string; paths: string[]; into: string };
type Stack = {
  checkout: string;
  upstream: string;
  ref: string;
  absorbed?: Absorbed;
};

export function stacks(): Record<string, Stack> {
  return (
    Bun.TOML.parse(readFileSync(STACKS, "utf8")) as {
      stack: Record<string, Stack>;
    }
  ).stack;
}

const git = (cwd: string, args: string[]) => {
  const r = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return { ok: r.exitCode === 0, out: r.stdout.toString().trim() };
};

export function check(strict: boolean): number {
  let drift = 0;
  for (const [name, s] of Object.entries(stacks())) {
    if (!s.absorbed) continue;
    const dir = join(root, s.checkout);
    if (!existsSync(join(dir, ".git"))) {
      console.log(`${name}: ${s.checkout} absent${strict ? "" : " (ignoré)"}`);
      if (strict) drift++;
      continue;
    }
    git(dir, [
      "fetch",
      "--quiet",
      `https://github.com/${s.upstream}.git`,
      `+refs/heads/${s.ref}:refs/remotes/upstream/${s.ref}`,
    ]);
    const tip =
      git(dir, ["rev-parse", `refs/remotes/upstream/${s.ref}`]).out ||
      git(dir, ["rev-parse", "HEAD"]).out;
    const changed = git(dir, [
      "diff",
      "--name-only",
      s.absorbed.commit,
      tip,
      "--",
      ...s.absorbed.paths,
    ]).out;
    const files = changed ? changed.split("\n") : [];
    console.log(
      files.length
        ? `${name}: ${files.length} fichier(s) amont modifié(s) depuis ${s.absorbed.commit.slice(0, 12)} -> ${tip.slice(0, 12)} (copie : ${s.absorbed.into})\n  ${files.join("\n  ")}`
        : `${name}: à jour (${s.absorbed.commit.slice(0, 12)}, ${s.absorbed.into})`,
    );
    drift += files.length ? 1 : 0;
  }
  return drift ? 1 : 0;
}

/** Skill sources: [prefix, directory holding <skill>/SKILL.md, fork checkout]. */
function skillSources(): Array<{ prefix: string; dir: string; repo: string }> {
  const s = stacks();
  const out: Array<{ prefix: string; dir: string; repo: string }> = [];
  const stitch = join(root, s["stitch-skills"]!.checkout, "plugins");
  if (existsSync(stitch))
    for (const plugin of readdirSync(stitch).sort())
      if (existsSync(join(stitch, plugin, "skills")))
        out.push({
          prefix: "stitch",
          dir: join(stitch, plugin, "skills"),
          repo: "google-labs-code/stitch-skills",
        });
  const jules = join(root, s["jules-skills"]!.checkout, "skills");
  if (existsSync(jules))
    out.push({
      prefix: "jules",
      dir: jules,
      repo: "google-labs-code/jules-skills",
    });
  return out;
}

const BANNER = (repo: string, rel: string) =>
  `> Mirror generated from ${repo} (${rel}) by \`bun packages/ai-os/src/google/absorb.ts skills --write\`; do not edit here.
> In src: relay Stitch tools \`stitch__<tool>\` (MCP \`mcp__relay__stitch__*\`, gcloud auth), CLI \`ay design stitch <cmd>\`
> (upload, design-md, generate, html, download), DESIGN.md \`ay design lint|export\` (system: packages/design/DESIGN.md),
> Jules \`ay jules run|sessions\` and tools \`jules_run\`, \`jules_status\`. JS/TS: bun only.
`;

/** bun en place des outils qu'il remplace, dans le texte des skills et de leurs scripts. */
export function bunify(text: string): string {
  return text
    .replace(/\bnpx tsx\b/g, "bun")
    .replace(/\bnpx\b/g, "bunx")
    .replace(/\bnpm install -g\b/g, "bun add -g")
    .replace(/\bnpm install -D\b/g, "bun add -d")
    .replace(/\bnpm (install|i)\b/g, "bun install")
    .replace(/\bnpm (run|create|test)\b/g, "bun $1")
    .replace(/\bnode -e\b/g, "bun -e");
}

function files(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

export function mirror(
  write: boolean,
): { skill: string; file: string; kind: string }[] {
  const dst = join(root, ".agents", "skills");
  const drift: { skill: string; file: string; kind: string }[] = [];
  for (const src of skillSources()) {
    for (const skill of readdirSync(src.dir)
      .filter((n) => existsSync(join(src.dir, n, "SKILL.md")))
      .sort()) {
      const from = join(src.dir, skill);
      const name = `${src.prefix}-${skill.replace(new RegExp(`^${src.prefix}-`), "")}`;
      const to = join(dst, name);
      const rel = relative(join(root, "third_party"), from).replaceAll(
        "\\",
        "/",
      );
      const want = new Map<string, string>();
      for (const f of files(from)) {
        const r = relative(from, f).replaceAll("\\", "/");
        let text = readFileSync(f, "utf8");
        if (/\.(md|sh|ts|tsx|js|json|yml)$/.test(f)) text = bunify(text);
        if (r === "SKILL.md") {
          // Frontmatter name aligned on the directory (agents index skills by folder); banner after it.
          text = text.replace(
            /^(---\r?\n[\s\S]*?\r?\n)---\r?\n/,
            (_m, fm: string) =>
              `${fm.replace(/^name:.*$/m, `name: ${name}`)}---\n\n${BANNER(src.repo, rel)}\n`,
          );
        }
        want.set(r, text);
      }
      const have = existsSync(to)
        ? files(to).map((f) => relative(to, f).replaceAll("\\", "/"))
        : [];
      for (const [r, text] of want) {
        const target = join(to, r);
        const cur = existsSync(target) ? readFileSync(target, "utf8") : null;
        if (cur === text) continue;
        drift.push({
          skill: name,
          file: r,
          kind: cur === null ? "missing" : "changed",
        });
        if (write) {
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, text);
        }
      }
      for (const r of have)
        if (!want.has(r)) {
          drift.push({ skill: name, file: r, kind: "extra" });
          if (write) rmSync(join(to, r));
        }
    }
  }
  return drift;
}

if (import.meta.main) {
  const [cmd, ...rest] = Bun.argv.slice(2);
  if (cmd === "check") process.exit(check(rest.includes("--strict")));
  if (cmd === "skills") {
    if (!skillSources().length) {
      console.log(
        "skills : forks stitch-skills / jules-skills absents (third_party), rien à comparer",
      );
      process.exit(0);
    }
    const write = rest.includes("--write");
    const d = mirror(write);
    for (const x of d) console.log(`${x.kind}\t${x.skill}/${x.file}`);
    console.log(`${d.length} écart(s)${write ? " corrigé(s)" : ""}`);
    process.exit(!write && d.length ? 1 : 0);
  }
  console.error("usage: absorb.ts check [--strict] | skills [--write]");
  process.exit(2);
}
