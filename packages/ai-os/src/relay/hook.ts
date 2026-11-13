#!/usr/bin/env bun
// Hook Claude Code (PostToolUse, outil Bash, asynchrone) : après un `git commit` dans un dépôt sous SRC_ROOT, soumet le
// commit à Gemini via le relais (outil gemini_review) et archive le verdict dans <dépôt>/docs/reviews/auto/.
// Règle du propriétaire : « tout livrable de src est soumis à Gemini ; verdict archivé dans le dépôt ».
// Silencieux si le relais ne répond pas ; ne bloque jamais l'outil (hook async).
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { relayToken } from "./server.ts";

const input = await Bun.stdin.json().catch(() => null);
const cmd: string = input?.tool_input?.command ?? "";
if (
  input?.tool_name !== "Bash" ||
  !/\bgit\b[^|;&]*\bcommit\b/.test(cmd) ||
  /--dry-run/.test(cmd)
)
  process.exit(0);

const cwd: string = input?.cwd ?? process.cwd();
const src = resolve(
  Bun.env.SRC_ROOT ??
    (process.platform === "win32"
      ? `${Bun.env.SystemDrive ?? "C:"}\\src`
      : join(Bun.env.HOME ?? "", "src")),
);
const git = (...a: string[]) =>
  Bun.spawnSync(["git", "-C", cwd, ...a])
    .stdout.toString()
    .trim();
const repo = git("rev-parse", "--show-toplevel");
if (!repo || !resolve(repo).toLowerCase().startsWith(src.toLowerCase()))
  process.exit(0);

const sha = git("rev-parse", "--short=12", "HEAD");
const subject = git("log", "-1", "--format=%s");
const outDir = join(repo, "docs", "reviews", "auto");
const out = join(outDir, `${sha}.md`);
if (await Bun.file(out).exists()) process.exit(0);
const patch = git("show", "--stat", "--patch", "--no-color", "HEAD").slice(
  0,
  120_000,
);

const port = Bun.env.RELAY_PORT ?? "8790";
const res = await fetch(`http://127.0.0.1:${port}/rpc`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${await relayToken()}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "gemini_review",
    params: {
      title: `${repo.split(/[\\/]/).at(-1)}@${sha} ${subject}`,
      content: patch,
    },
  }),
  signal: AbortSignal.timeout(900_000),
}).catch(() => null);
const j: any = await res?.json().catch(() => null);
if (!j?.result?.text) process.exit(0);
mkdirSync(outDir, { recursive: true });
await Bun.write(
  out,
  `# Revue Gemini ${sha}\n\n- Commit : ${subject}\n- Moteur : ${j.result.engine} (${j.result.ms} ms)${j.result.chat ? `\n- Conversation : ${j.result.chat}` : ""}\n\n${j.result.text}\n`,
);
