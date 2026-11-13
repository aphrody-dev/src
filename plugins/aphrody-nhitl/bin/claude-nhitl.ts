#!/usr/bin/env bun
// claude-nhitl: launch Claude Code headless with no human in the loop.
//
// Usage: bun claude-nhitl.ts [options] [--] <prompt...>      (prompt "-" = read stdin)
//   --goal <text>        open goal: the Stop hook keeps the run going until the reply contains NHITL_DONE (loop-capped)
//   --resume <id>        resume a session (UUID or name); --continue resumes the latest in --cwd
//   --session-id <uuid>  fix the id of a new session (default: random UUID)
//   --cwd <dir>          working directory (default: current)
//   --model <m> --max-turns <n> --max-budget-usd <x> --add-dir <d> (repeatable) --append-system-prompt <t>
//   --log-dir <dir>      where to tee the stream (default ~/.claude/learning/runs)
//   --quiet              print only the final result text instead of the raw stream
//
// Contract for runners: stdout = Claude Code stream-json lines (last one is {"type":"result",...});
// stderr first line = `nhitl-run {"sid":...,"log":...,"cwd":...}`; exit code = claude's exit code
// (1 also when the result reports is_error). The full stream is also written to <log-dir>/<sid>.jsonl.
import { mkdirSync } from "node:fs";
import { HOME, writeGoal } from "../src/lib.ts";

const argv = Bun.argv.slice(2);
const opt: Record<string, string | boolean> = {};
const addDirs: string[] = [];
const prompt: string[] = [];
const valued = new Set(["goal", "resume", "session-id", "cwd", "model", "max-turns", "max-budget-usd", "log-dir", "append-system-prompt", "add-dir"]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]!;
  if (a === "--") {
    prompt.push(...argv.slice(i + 1));
    break;
  }
  if (a.startsWith("--") && valued.has(a.slice(2))) {
    const v = argv[++i] ?? "";
    if (a === "--add-dir") addDirs.push(v);
    else opt[a.slice(2)] = v;
  } else if (a === "--continue" || a === "--quiet" || a === "-h" || a === "--help") opt[a.replace(/^-+/, "")] = true;
  else prompt.push(a);
}
if (opt.help || opt.h) {
  console.log((await Bun.file(import.meta.path).text()).split("\n").slice(1, 15).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}

let text = prompt.join(" ");
if (text === "-") text = await Bun.stdin.text();
const resume = typeof opt.resume === "string" ? opt.resume : "";
const uuidRx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sid = resume && uuidRx.test(resume) ? resume : typeof opt["session-id"] === "string" ? opt["session-id"] : crypto.randomUUID();
if (!text && !opt.goal) {
  console.error("claude-nhitl: prompt or --goal required (see --help)");
  process.exit(2);
}
if (!text) text = `Objectif : ${opt.goal}. Travailler jusqu'au bout sans poser de question ; terminer par NHITL_DONE.`;
if (typeof opt.goal === "string" && opt.goal) writeGoal(sid, opt.goal);

const cwd = typeof opt.cwd === "string" ? opt.cwd : process.cwd();
const logDir = typeof opt["log-dir"] === "string" ? opt["log-dir"] : `${HOME}/.claude/learning/runs`;
mkdirSync(logDir, { recursive: true });
const logPath = `${logDir}/${sid}.jsonl`;

const args = ["claude", "-p", text, "--permission-mode", "bypassPermissions", "--permission-prompts", "none", "--output-format", "stream-json", "--verbose"];
if (resume) args.push("--resume", resume);
else if (opt.continue) args.push("--continue");
else args.push("--session-id", sid);
for (const k of ["model", "max-turns", "max-budget-usd", "append-system-prompt"]) if (typeof opt[k] === "string") args.push(`--${k}`, opt[k] as string);
for (const d of addDirs) args.push("--add-dir", d);

console.error(`nhitl-run ${JSON.stringify({ sid, log: logPath, cwd })}`);
const child = Bun.spawn(args, { cwd, stdin: "ignore", stdout: "pipe", stderr: "inherit", env: { ...process.env, NHITL_RUN: "1" }, windowsHide: true });
const sink = Bun.file(logPath).writer();
const dec = new TextDecoder();
let buf = "";
let result: any = null;
for await (const chunk of child.stdout) {
  sink.write(chunk);
  if (!opt.quiet) process.stdout.write(chunk);
  buf += dec.decode(chunk, { stream: true });
  let nl: number;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl);
    buf = buf.slice(nl + 1);
    if (line.includes('"type":"result"')) {
      try {
        result = JSON.parse(line);
      } catch {}
    }
  }
}
await sink.end();
const code = await child.exited;
if (opt.quiet) process.stdout.write(`${result?.result ?? ""}\n`);
process.exit(code || (result?.is_error ? 1 : 0));
