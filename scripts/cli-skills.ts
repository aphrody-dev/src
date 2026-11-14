// Generates .agents/skills/cli-<tool>/SKILL.md from the manual of each tool declared in tools.toml.
// Deterministic and idempotent: same binaries -> same files. `bun scripts/cli-skills.ts [--check] [tool...]`.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export type Tool = { name: string; version?: string; bin: string[]; verify?: string[]; why?: string };

const ROOT = join(import.meta.dir, "..");
const MAX_HELP = 70;
const MAX_LINE = 110;

/** Tools whose `--help` needs a context (workspace) or is not the tool's own: fixed one-line summary. */
const STATIC: Record<string, { summary: string; help: string[] }> = {
  bazelisk: {
    summary: "Launcher that downloads and runs the Bazel version pinned by .bazelversion or USE_BAZEL_VERSION.",
    help: [
      "bazelisk <bazel arguments>      every argument is forwarded to the resolved bazel",
      "BAZELISK_HOME                   cache directory of downloaded bazel binaries",
      "BAZELISK_SKIP_WRAPPER=1         skip tools/bazel wrapper scripts",
      "USE_BAZEL_VERSION=<v|latest>    override .bazelversion",
    ],
  },
};

/** One-line summaries for tools whose --help opens with noise (option dump, wrapped sentence, no prose). */
const SUMMARY: Record<string, string> = {
  "llama.cpp": "llama-server: local OpenAI-compatible inference server for GGUF models.",
  "whisper.cpp": "whisper-cli: offline speech-to-text with Whisper models.",
  ruff: "Extremely fast Python linter and code formatter.",
  coreutils: "Single multi-call binary providing the uutils (Rust) coreutils applets.",
  "ms-coreutils": "Single multi-call binary providing the Microsoft coreutils applets.",
  tealdeer: "Fast tldr client: community cheat sheets for command-line tools.",
  "cargo-machete": "Finds unused dependencies in Cargo.toml files.",
  lazygit: "Terminal UI for git.",
  zig: "Zig compiler, build system and C/C++ cross toolchain.",
  sccache: "Compiler cache for rustc and C/C++ with local or remote storage.",
  "hostinger-api-mcp": "MCP server exposing the Hostinger API.",
  wrangler: "Cloudflare Workers CLI: develop, deploy and manage Workers and bindings.",
  rclone: "Syncs files to and from cloud storage providers.",
  ripgrep: "Recursive regex search over files, honoring gitignore.",
  bottom: "Cross-platform terminal system and process monitor.",
  just: "Command runner for project recipes.",
  bun: "JavaScript and TypeScript runtime, package manager, bundler and test runner.",
  yq: "Portable command-line processor for YAML, JSON, TOML and XML.",
  "cargo-nextest": "Next-generation test runner for Rust.",
  "cargo-shear": "Detects and removes unused dependencies in Cargo.toml files.",
  jj: "Jujutsu, a Git-compatible version control system.",
  oha: "HTTP load generator with a terminal UI.",
};

/** [[tool]] tables of tools.toml that ship at least one executable. */
export function parseTools(toml: string): Tool[] {
  const doc = Bun.TOML.parse(toml) as { tool?: Tool[] };
  return (doc.tool ?? []).filter((t) => t.name && Array.isArray(t.bin) && t.bin.length > 0);
}

export const skillName = (tool: string) => `cli-${tool.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
const EMAIL = /<[^<>\s]+@[^<>\s]+>|\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const HEADING = /^\s*(usage|options|flags|commands|subcommands|available commands|arguments|args|examples?|environment|description)\b.*:?\s*$/i;

/** Plain ASCII only: strips colors, CR, emoji and any non-ASCII; caps line length and block length. */
export function cleanHelp(raw: string, maxLines = MAX_HELP): string[] {
  const lines = raw
    .replace(ANSI, "")
    .replace(/\r/g, "")
    .replace(/[^\x09\x0a\x20-\x7e]/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, "").replace(/\t/g, "  "))
    .filter((l) => !EMAIL.test(l))
    .map((l) => (l.length > MAX_LINE ? `${l.slice(0, MAX_LINE - 3)}...` : l));
  while (lines.length && lines[0] === "") lines.shift();
  const out: string[] = [];
  for (const l of lines) {
    if (l === "" && out[out.length - 1] === "") continue;
    out.push(l);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.slice(0, maxLines);
}

/** Subcommand names from a "Commands:" / "SUBCOMMANDS:" section of a help text. */
export function subcommands(lines: string[]): string[] {
  const res: string[] = [];
  let inside = false;
  for (const l of lines) {
    if (/^\s*(commands|subcommands|available commands)\s*:?\s*$/i.test(l)) {
      inside = true;
      continue;
    }
    if (inside) {
      const m = l.match(/^\s{2,}([a-z][\w-]*)(?:,\s*[\w-]+)?(?:\s{2,}|\s*$)/i);
      if (m) res.push(m[1]!);
      else if (l.trim() === "" || /^\S/.test(l)) inside = false;
    }
  }
  return [...new Set(res)].filter((c) => c !== "help").slice(0, 24);
}

/** A prose sentence usable as a summary: 3+ words, starts with a letter, no flag, path, env or bracket noise. */
export const isSummary = (l: string) => {
  const s = l.trim();
  if (s.split(/\s+/).length < 3 || !/^[A-Za-z]/.test(s)) return false;
  if (HEADING.test(s) || /:$/.test(s) || /^(usage|error|warning)\b/i.test(s)) return false;
  if (/^\S+ v?\d+\.\d+/.test(s) || /^[A-Z_ ]+$/.test(s)) return false;
  if (/^[A-Za-z]:[\\/]/.test(s) || /--[a-z]/.test(s) || /[[\]()<>{}]/.test(s.slice(0, 2)) || /^\S+\s{2,}/.test(s)) return false;
  const bal = (a: string, b: string) => s.split(a).length === s.split(b).length;
  if (!bal("[", "]") || !bal("(", ")") || /^\w+:\s/.test(s)) return false;
  return /[a-z]/.test(s);
};

/** One sentence: the first prose line before the first heading, else the tools.toml `why`, else a generic line. */
export function summary(tool: Tool, help: string[]): string {
  const head: string[] = [];
  for (const l of help) {
    if (HEADING.test(l) || /^\s*usage\b/i.test(l)) break;
    head.push(l);
  }
  const line = head.find(isSummary) ?? help.find(isSummary);
  const text = line?.trim() ?? tool.why ?? `${tool.name} command-line tool`;
  return text.replace(/"/g, "'").replace(/\s+/g, " ").slice(0, 200);
}

async function run(cmd: string[]): Promise<string | null> {
  try {
    const p = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe", stdin: "ignore", timeout: 15_000, env: { ...process.env, NO_COLOR: "1", TERM: "dumb" } });
    const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
    await p.exited;
    const text = out.trim() ? out : err;
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

const VERSION = /\d+\.\d+(?:\.\d+)?(?:-(?:canary|alpha|beta|rc|dev|nightly)[\w.]*)?/;
const SEMVER = /^\d+\.\d+/;

export type Manual = { version: string; help: string[] };

export async function readManual(tool: Tool, exe: string): Promise<Manual | null> {
  const base = tool.bin[0]!.split("/").pop()!;
  const fixed = STATIC[tool.name];
  const sub = base.startsWith("cargo-") ? base.slice(6) : null;
  const raw = fixed ? fixed.help.join("\n") : ((sub && (await run([exe, sub, "--help"]))) || (await run([exe, "--help"])));
  if (!raw) return null;
  const verify = tool.verify ? [Bun.which(tool.verify[0]!) ?? tool.verify[0]!, ...tool.verify.slice(1)] : [exe, "--version"];
  const probed = fixed ? null : (await run(verify))?.replace(ANSI, "").match(VERSION)?.[0];
  // Build-number versions (llama.cpp b12317) are not what `--version` prints: keep the manifest value.
  const version = tool.version && !SEMVER.test(tool.version) ? tool.version : (probed ?? tool.version ?? "unknown");
  let help = cleanHelp(raw);
  // `bun --help` prints a random example argument in the command table: drop that column.
  if (tool.name === "bun") help = help.map((l) => l.replace(/^(\s{2}[a-z][\w-]*)\s+\S+\s{2,}(\S.*)$/, "$1  $2"));
  return { version, help };
}

export function render(tool: Tool, m: Manual): string {
  const bin = tool.bin[0]!.split("/").pop()!;
  const sum = STATIC[tool.name]?.summary ?? SUMMARY[tool.name] ?? summary(tool, m.help);
  const desc = `Use \`${bin}\` (${tool.name} ${m.version}): ${sum}`.slice(0, 300);
  const subs = subcommands(m.help);
  const out = [
    "---",
    `name: ${skillName(tool.name)}`,
    `description: ${desc}`,
    "---",
    "",
    `# ${tool.name} ${m.version}`,
    "",
    `Binary: \`${tool.bin.map((b) => b.split("/").pop()).join("`, `")}\`. Declared in \`tools.toml\`; install or update with \`ay up ${tool.name}\`.`,
    "Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.",
  ];
  if (tool.why) out.push("", `Why it is here: ${tool.why}`);
  if (subs.length) out.push("", `Subcommands: ${subs.map((s) => `\`${s}\``).join(", ")}. Details: \`${bin} <subcommand> --help\`.`);
  out.push("", `## \`${bin} --help\``, "", "```text", ...m.help, "```", "");
  return out.join("\n");
}

export async function generate(opts: { check?: boolean; only?: string[]; tools?: string } = {}) {
  const toml = opts.tools ?? (await Bun.file(join(ROOT, "tools.toml")).text());
  const result = { written: 0, same: 0, skipped: [] as string[], drift: [] as string[] };
  for (const tool of parseTools(toml)) {
    if (opts.only?.length && !opts.only.includes(tool.name)) continue;
    const exe = Bun.which(tool.bin[0]!.split("/").pop()!);
    const manual = exe ? await readManual(tool, exe) : null;
    if (!manual) {
      result.skipped.push(tool.name);
      continue;
    }
    const file = join(ROOT, ".agents", "skills", skillName(tool.name), "SKILL.md");
    const next = render(tool, manual);
    const cur = (await Bun.file(file).exists()) ? await Bun.file(file).text() : null;
    if (cur === next) {
      result.same++;
      continue;
    }
    if (opts.check) {
      result.drift.push(tool.name);
      continue;
    }
    mkdirSync(join(file, ".."), { recursive: true });
    await Bun.write(file, next);
    result.written++;
  }
  return result;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const r = await generate({ check: args.includes("--check"), only: args.filter((a) => !a.startsWith("--")) });
  console.log(`cli-skills: ${r.written} written, ${r.same} unchanged, ${r.skipped.length} skipped${r.skipped.length ? ` (${r.skipped.join(", ")})` : ""}`);
  if (r.drift.length) {
    console.error(`cli-skills: drift in ${r.drift.join(", ")} (run: just cli-skills)`);
    process.exitCode = 1;
  }
}
