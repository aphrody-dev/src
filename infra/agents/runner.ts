#!/usr/bin/env bun
// Agent fleet runner: executes queued tasks with the agent CLIs, inside one tmux session per host.
// Routing belongs to packages/ai-os: it writes `providers` into each task (or the relay answers
// llm_models). This file only executes them in the given order, moves to the next one on a
// quota/rate/auth error, judges with the task's acceptance check, commits on main, keeps tmux alive.
// Doc: docs/agents/AGENT-FIRST.md. Zero npm dependencies.
//
//   bun infra/agents/runner.ts up                      start/repair the tmux session (one window per role)
//   bun infra/agents/runner.ts work <role>             worker loop (what each tmux window runs)
//   bun infra/agents/runner.ts health                  repair session, requeue orphans, probe CLIs, ship logs
//   bun infra/agents/runner.ts enqueue [--template NAME] --role R --prompt P [--host H] [--check C] [--paths a,b] [--message M]
//                                     [--providers p1,p2] [--cwd dir] [--approval owner] [--id ID]
//   bun infra/agents/runner.ts status                  queue counts + last events (JSON)

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join, resolve } from "node:path";

type Role = { timeout_s: number; budget_usd: number };
type Host = { roles: string[]; src: string; ssh?: string[] };
type Fleet = {
  schedule?: Record<string, number>;
  roles: Record<string, Role>;
  hosts: Record<string, Host>;
  ship: { host: string; dir: string };
};
type Task = {
  v: 1;
  id: string;
  role: string;
  host: string; // "prd" | "fr1" | "fr2" | "pc" | "any"
  prompt: string;
  providers?: string[]; // set by ai-os: "<cli>[:<model>]" or "<provider>/<model>" (relay)
  cwd?: string; // relative to the host src checkout
  check?: string; // acceptance command, run with `just`-capable shell in cwd; exit 0 = accepted
  commit?: { paths: string[]; message: string }; // commit only changed files under these prefixes
  approval?: "none" | "owner"; // owner = drafts only, never commit/publish
  timeout_s?: number;
  budget_usd?: number;
  max_attempts?: number;
  attempts?: Attempt[];
  not_before?: string; // set on requeue: not claimable before this time
  created_by?: string;
  created_at?: string;
};
type Attempt = {
  provider: string;
  exit: number;
  reason: string;
  started: string;
  ended: string;
  check_exit?: number;
};

const HERE = import.meta.dir;
const FLEET: Fleet = Bun.TOML.parse(
  readFileSync(join(HERE, "fleet.toml"), "utf8"),
) as Fleet;
const WIN = process.platform === "win32";
// Same PATH whether started by systemd, ssh or tmux: user-level CLI dirs first.
if (!WIN && process.env.HOME)
  process.env.PATH = `${process.env.HOME}/.bun/bin:${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH ?? "/usr/bin:/bin"}`;
const HOST = process.env.AGENTS_HOST ?? hostAlias(hostname());
const SRC = resolve(
  process.env.SRC_ROOT ?? FLEET.hosts[HOST]?.src ?? join(HERE, "..", ".."),
);
const HOME = resolve(process.env.AGENTS_HOME ?? join(SRC, "var", "agents"));
const Q = {
  tmp: join(HOME, "queue", "tmp"),
  new: join(HOME, "queue", "new"),
  claimed: join(HOME, "queue", "claimed"),
  done: join(HOME, "queue", "done"),
  failed: join(HOME, "queue", "failed"),
};
const STATE = join(HOME, "state");
const PUBLISH = join(HOME, "publish"); // approval=owner drafts: the owner publishes from here, agents never do
const RESULTS = join(HOME, "results");
const LOG = join(HOME, "log.jsonl");
const SESSION = "agents";
const POLL_MS = 10_000;
const COOLDOWN_MS = 15 * 60_000;
// Quota, rate-limit, auth or overload: try the next provider instead of failing the task.
const RETRYABLE =
  /\b429\b|rate.?limit|quota|usage limit|overloaded|insufficient.?credit|credit balance|billing|unauthori[sz]ed|\b401\b|\b403\b|\b5\d\d\b|ECONNRESET|ETIMEDOUT|not logged in|login required|command not found|ENOENT/i;

function hostAlias(h: string): string {
  if (WIN) return "pc";
  const map: Record<string, string> = {
    "vps-203bea89": "fr1",
    bunos: "fr2",
    srv2116886: "prd",
  };
  return map[h] ?? h;
}
const now = () => new Date().toISOString();
function ensureDirs() {
  for (const d of [...Object.values(Q), STATE, RESULTS, PUBLISH])
    mkdirSync(d, { recursive: true });
}
function log(event: string, data: Record<string, unknown> = {}) {
  appendFileSync(
    LOG,
    JSON.stringify({ ts: now(), host: HOST, event, ...data }) + "\n",
  );
}
// Children use their own CLI logins, never the parent agent session's credentials/session vars.
const SCRUB =
  /^(ANTHROPIC_|CLAUDECODE$|CLAUDE_CODE_|CLAUDE_PID$|CLAUDE_EFFORT$|CODEX_THREAD|OPENCODE_SESSION)/;
function childEnv(extra: Record<string, string> = {}): Record<string, string> {
  const e: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env))
    if (
      v !== undefined &&
      (process.env.AGENTS_KEEP_ENV === "1" || !SCRUB.test(k))
    )
      e[k] = v;
  return { ...e, ...extra };
}
function sh(
  cmd: string[],
  opts: {
    cwd?: string;
    stdin?: string;
    timeoutMs?: number;
    env?: Record<string, string>;
  } = {},
) {
  const r = Bun.spawnSync(cmd, {
    cwd: opts.cwd,
    stdin: opts.stdin ? Buffer.from(opts.stdin) : "ignore",
    stdout: "pipe",
    stderr: "pipe",
    timeout: opts.timeoutMs,
    env: childEnv(opts.env),
  });
  return {
    exit: r.exitCode ?? (r.signalCode ? 124 : 1),
    out: r.stdout.toString(),
    err: r.stderr.toString(),
  };
}
// Windows: .cmd shims must go through cmd.exe; resolve the real path first.
function argv0(name: string, args: string[]): string[] {
  const p = Bun.which(name);
  if (!p) return [name, ...args];
  return WIN && /\.(cmd|bat)$/i.test(p)
    ? ["cmd.exe", "/d", "/c", p, ...args]
    : [p, ...args];
}
function shellCmd(cmd: string): string[] {
  return WIN ? [Bun.which("niu") ?? "sh", "-c", cmd] : ["sh", "-c", cmd];
}

// ---------- providers ----------
// A task names what runs it (ai-os decides; this file never picks):
//   "<cli>" or "<cli>:<model>"  coding CLI (claude, codex, opencode, pi, agy), optional model
//   "<provider>/<model>"         model from relay llm_models, answered through relay llm_ask (text only)
// With no name, the relay's llm_models answer (available providers, relay order) is used as is.
// Prompt goes on stdin where the CLI supports it (no argv length or quoting limits).
const CLIS = new Set(["claude", "codex", "opencode", "pi", "agy"]);
function providerCmd(
  p: string,
  t: Task,
  budget: number,
): { cmd: string[]; stdin?: string } {
  const [cli, model] = p.split(/:(.*)/s);
  const m = (flag: string) => (model ? [flag, model] : []);
  switch (cli) {
    case "claude": {
      // Prefer the NHITL headless launcher (plugins/aphrody-nhitl) when the checkout has it.
      const nhitl = join(
        SRC,
        "plugins",
        "aphrody-nhitl",
        "bin",
        "claude-nhitl.ts",
      );
      if (existsSync(nhitl))
        return {
          cmd: [
            process.execPath,
            "--no-env-file", // a checkout .env must not override the CLI's own login
            nhitl,
            "--cwd",
            resolve(SRC, t.cwd ?? "."),
            "--max-turns",
            "200",
            "--max-budget-usd",
            String(budget),
            ...m("--model"),
            "-",
          ],
          stdin: t.prompt,
        };
      return {
        cmd: argv0("claude", [
          "-p",
          "--permission-mode",
          "bypassPermissions",
          "--output-format",
          "json",
          "--max-turns",
          "200",
          "--max-budget-usd",
          String(budget),
          ...m("--model"),
        ]),
        stdin: t.prompt,
      };
    }
    case "codex":
      return {
        cmd: argv0("codex", [
          "exec",
          "--json",
          "--skip-git-repo-check",
          "--dangerously-bypass-approvals-and-sandbox",
          ...m("-m"),
          "-",
        ]),
        stdin: t.prompt,
      };
    case "opencode":
      return {
        cmd: argv0("opencode", [
          "run",
          "--format",
          "json",
          ...m("-m"),
          t.prompt,
        ]),
      };
    case "pi":
      return { cmd: argv0("pi", ["-p", ...m("--model"), t.prompt]) };
    case "agy":
      return {
        cmd: argv0("agy", [
          "-p",
          t.prompt,
          "--output-format",
          "json",
          "--dangerously-skip-permissions",
          ...m("--model"),
        ]),
      };
    default:
      throw new Error(`unknown cli ${cli}`);
  }
}
// ai-os relay (JSON-RPC on 127.0.0.1:8790/rpc, token from the relay state dir; never logged).
async function rpc(
  method: string,
  params: unknown,
): Promise<{ exit: number; out: string; result?: any }> {
  const tokPath = WIN
    ? join(process.env.LOCALAPPDATA ?? "", "aphrody", "relay", "token")
    : join(
        process.env.RELAY_HOME ??
          join(process.env.HOME ?? "", ".local", "state", "aphrody", "relay"),
        "token",
      );
  const token = existsSync(tokPath) ? readFileSync(tokPath, "utf8").trim() : "";
  try {
    const r = await fetch(
      process.env.RELAY_URL ?? "http://127.0.0.1:8790/rpc",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(600_000),
      },
    );
    const body = await r.text();
    let j: any = {};
    try {
      j = JSON.parse(body);
    } catch {}
    return {
      exit: r.ok && !j.error ? 0 : r.status === 200 ? 1 : r.status,
      out: body,
      result: j.result,
    };
  } catch (e) {
    return { exit: 1, out: String(e) };
  }
}
async function relayChain(): Promise<string[]> {
  const r = await rpc("llm_models", {});
  if (r.exit || !Array.isArray(r.result)) return [];
  return r.result
    .filter((p: any) => p.available && p.models?.length)
    .map((p: any) => p.models[0].id as string);
}
function cooling(p: string): boolean {
  const f = join(STATE, `cooldown-${p.replace(/[^\w.-]/g, "_")}`);
  return existsSync(f) && Date.now() - statSync(f).mtimeMs < COOLDOWN_MS;
}
function coolDown(p: string) {
  writeFileSync(join(STATE, `cooldown-${p.replace(/[^\w.-]/g, "_")}`), now());
}

// ---------- git helpers ----------
function dirty(cwd: string): Set<string> {
  const r = sh(
    ["git", "status", "--porcelain", "-z", "--untracked-files=all"],
    { cwd },
  );
  const s = new Set<string>();
  for (const e of r.out.split("\0")) if (e.length > 3) s.add(e.slice(3));
  return s;
}
function commit(
  t: Task,
  cwd: string,
  before: Set<string>,
  provider: string,
): { sha?: string; files: string[]; error?: string } {
  const after = dirty(cwd);
  const pre = t.commit!.paths.map((p) =>
    p.replace(/\\/g, "/").replace(/\/$/, ""),
  );
  const files = [...after].filter(
    (f) =>
      !before.has(f) &&
      pre.some(
        (p) => p === "" || p === "." || f === p || f.startsWith(p + "/"),
      ),
  );
  if (files.length === 0) return { files };
  let r = sh(["git", "add", "--", ...files], { cwd });
  if (r.exit) return { files, error: r.err };
  const msg = `${t.commit!.message}\n\nAgent-Task: ${t.id}\nAgent-Role: ${t.role}\nAgent-Provider: ${provider}\nAgent-Host: ${HOST}`;
  r = sh(["git", "commit", "-m", msg, "--", ...files], { cwd });
  if (r.exit) return { files, error: r.out + r.err };
  for (let i = 0; i < 3; i++) {
    r = sh(["git", "push", "origin", "HEAD:main"], { cwd, timeoutMs: 120_000 });
    if (!r.exit)
      return {
        sha: sh(["git", "rev-parse", "HEAD"], { cwd }).out.trim(),
        files,
      };
    sh(["git", "fetch", "origin", "main"], { cwd, timeoutMs: 120_000 });
    sh(["git", "rebase", "--autostash", "origin/main"], {
      cwd,
      timeoutMs: 120_000,
    });
  }
  return { files, error: `push failed: ${r.err}` };
}

// approval=owner: move what the agent produced into publish/<id>/ (patch + new files + logs) and
// restore the checkout. The task ends `done`; nothing is published or sent.
function stageDraft(
  t: Task,
  cwd: string,
  before: Set<string>,
  out: string,
): { dir: string; files: string[] } {
  const dir = join(PUBLISH, t.id);
  mkdirSync(join(dir, "files"), { recursive: true });
  const files = [...dirty(cwd)].filter((f) => !before.has(f));
  const tracked = files.filter(
    (f) =>
      sh(["git", "ls-files", "--error-unmatch", "--", f], { cwd }).exit === 0,
  );
  if (tracked.length)
    writeFileSync(
      join(dir, "changes.patch"),
      sh(["git", "diff", "--", ...tracked], { cwd }).out,
    );
  for (const f of files) {
    if (tracked.includes(f)) continue;
    const dst = join(dir, "files", f);
    mkdirSync(resolve(dst, ".."), { recursive: true });
    renameSync(join(cwd, f), dst);
  }
  if (tracked.length) sh(["git", "checkout", "--", ...tracked], { cwd });
  for (const f of readdirSync(out))
    writeFileSync(join(dir, f), readFileSync(join(out, f)));
  writeFileSync(
    join(dir, "README.txt"),
    `Draft for owner review. Task ${t.id} (${t.role}).\nPrompt:\n${t.prompt}\n`,
  );
  return { dir, files };
}

// ---------- queue ----------
function newId(role: string) {
  return `${now().replace(/[-:]/g, "").replace(/\..*/, "")}-${role}-${Math.random().toString(36).slice(2, 8)}`;
}
function writeTask(dir: string, t: Task) {
  const tmp = join(Q.tmp, `${t.id}.json`);
  writeFileSync(tmp, JSON.stringify(t, null, 2));
  renameSync(tmp, join(dir, `${t.id}.json`));
}
// Atomic claim: rename new/<id>.json -> claimed/<id>@<host>.<pid>.json (only one worker wins).
function claim(role: string): { t: Task; path: string } | null {
  for (const f of readdirSync(Q.new).sort()) {
    if (!f.endsWith(".json")) continue;
    let t: Task;
    try {
      t = JSON.parse(readFileSync(join(Q.new, f), "utf8"));
    } catch {
      continue;
    }
    if (t.role !== role || (t.host && t.host !== "any" && t.host !== HOST))
      continue;
    if ((role === "chromium") !== (t.host === "fr1")) continue; // fr1 = Chromium/LLVM builds only
    if (t.not_before && Date.parse(t.not_before) > Date.now()) continue;
    const dst = join(Q.claimed, `${t.id}@${HOST}.${process.pid}.json`);
    try {
      renameSync(join(Q.new, f), dst);
      return { t, path: dst };
    } catch {
      continue; // someone else won
    }
  }
  return null;
}

// Runner-owned checkout (<home>/agents/src): the runner may undo task leftovers. The PC works in
// C:/src, shared with other agents: there nothing is undone, only in-scope files are committed.
const OWNED = /[\\/]agents[\\/]src$/.test(SRC);

// Roles whose output is text only may use relay models; every other role edits the checkout.
const TEXT_ROLES = new Set(["reviewer", "growth"]);

// One editing task at a time per checkout (no worktrees by policy): directory lock with owner pid.
async function lockCheckout(): Promise<() => void> {
  const lock = join(STATE, "checkout.lock");
  for (;;) {
    try {
      mkdirSync(lock);
      writeFileSync(join(lock, "pid"), String(process.pid));
      return () => rmSync(lock, { recursive: true, force: true });
    } catch {
      let owner = 0;
      try {
        owner = Number(readFileSync(join(lock, "pid"), "utf8"));
        process.kill(owner, 0);
      } catch {
        if (owner || Date.now() - statSync(lock).mtimeMs > 60_000)
          rmSync(lock, { recursive: true, force: true });
      }
      await Bun.sleep(5_000);
    }
  }
}

// Undo what a task changed in the checkout (files that were clean before it started).
function restore(cwd: string, files: string[]) {
  if (!files.length) return;
  const tracked = files.filter(
    (f) =>
      sh(["git", "ls-files", "--error-unmatch", "--", f], { cwd }).exit === 0,
  );
  if (tracked.length) sh(["git", "checkout", "--", ...tracked], { cwd });
  for (const f of files)
    if (!tracked.includes(f))
      rmSync(join(cwd, f), { force: true, recursive: true });
}
function inScope(t: Task, f: string): boolean {
  const pre = (t.commit?.paths ?? []).map((p) =>
    p.replace(/\\/g, "/").replace(/\/$/, ""),
  );
  return pre.some(
    (p) => p === "" || p === "." || f === p || f.startsWith(p + "/"),
  );
}

async function runTask(t: Task, claimedPath: string) {
  if (t.role === "growth") t.approval = "owner"; // enforced in code, whatever the JSON says
  const named = t.providers?.length
    ? t.providers
    : TEXT_ROLES.has(t.role)
      ? await relayChain()
      : [];
  const editing = named.some((p) => CLIS.has(p.split(":")[0]));
  const unlock = editing ? await lockCheckout() : () => {};
  try {
    await runTaskLocked(t, claimedPath, named);
  } finally {
    unlock();
  }
}
async function runTaskLocked(t: Task, claimedPath: string, named: string[]) {
  const role = FLEET.roles[t.role];
  const cwd = resolve(SRC, t.cwd ?? ".");
  const out = join(RESULTS, t.id);
  mkdirSync(out, { recursive: true });
  // Editing roles never fall back to text-only relay models (they would "succeed" without a diff).
  const chain = named.filter(
    (p) => !cooling(p) && (TEXT_ROLES.has(t.role) || CLIS.has(p.split(":")[0])),
  );
  const timeoutMs = (t.timeout_s ?? role.timeout_s) * 1000;
  const budget = t.budget_usd ?? role.budget_usd;
  const attempts: Attempt[] = t.attempts ?? [];
  const before = dirty(cwd);
  log("claim", {
    id: t.id,
    role: t.role,
    chain,
    prompt: t.prompt.slice(0, 200),
  });
  let status: "done" | "failed" = "failed";
  let final: Record<string, unknown> = {};
  for (const p of chain) {
    let prompt = t.prompt;
    // One self-fix round: the same provider gets the failing check output.
    for (let round = 0; round < 2; round++) {
      const started = now();
      let exit: number, text: string;
      if (!CLIS.has(p.split(":")[0])) {
        const r = await rpc("llm_ask", { model: p, prompt });
        exit = r.exit;
        text = r.out;
      } else {
        const { cmd, stdin } = providerCmd(p, { ...t, prompt }, budget);
        const proc = Bun.spawn(cmd, {
          cwd,
          stdin: stdin ? Buffer.from(stdin) : "ignore",
          stdout: "pipe",
          stderr: "pipe",
          env: childEnv({ AGENT_TASK_ID: t.id, AGENT_ROLE: t.role }),
        });
        const timer = setTimeout(() => proc.kill(), timeoutMs);
        const [o, e] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);
        exit = await proc.exited;
        clearTimeout(timer);
        text = o + (e ? `\n[stderr]\n${e}` : "");
      }
      writeFileSync(
        join(out, `${attempts.length}-${p.replace(/[^\w.-]/g, "_")}.log`),
        text,
      );
      const a: Attempt = {
        provider: p,
        exit,
        reason: "",
        started,
        ended: now(),
      };
      attempts.push(a);
      if (exit === 137 || exit === 143) {
        a.reason = "killed"; // OOM killer or timeout: no self-fix, no next provider
        log("attempt", { id: t.id, provider: p, exit, reason: a.reason });
        break;
      }
      if (exit !== 0) {
        a.reason = RETRYABLE.test(text)
          ? "provider_unavailable"
          : "agent_error";
        if (a.reason === "provider_unavailable") coolDown(p);
        log("attempt", { id: t.id, provider: p, exit, reason: a.reason });
        break; // next provider
      }
      if (t.commit && t.approval !== "owner") {
        const outside = [...dirty(cwd)].filter(
          (f) => !before.has(f) && !inScope(t, f),
        );
        if (outside.length && OWNED) {
          restore(cwd, outside); // out-of-scope edits are dropped before judging
          log("out_of_scope", {
            id: t.id,
            provider: p,
            files: outside.slice(0, 20),
          });
        }
      }
      if (!t.check) {
        a.reason = "ok";
        status = "done";
        break;
      }
      const c = sh(shellCmd(t.check), { cwd, timeoutMs: 1_800_000 });
      a.check_exit = c.exit;
      writeFileSync(
        join(out, `${attempts.length - 1}-check.log`),
        c.out + c.err,
      );
      if (c.exit === 0) {
        a.reason = "ok";
        status = "done";
        break;
      }
      a.reason = "check_failed";
      log("attempt", {
        id: t.id,
        provider: p,
        exit,
        reason: a.reason,
        check_exit: c.exit,
      });
      prompt = `${t.prompt}\n\nThe acceptance check \`${t.check}\` failed (exit ${c.exit}). Output tail:\n${(c.out + c.err).slice(-6000)}\nFix the cause, then stop.`;
    }
    if (attempts.at(-1)?.reason === "killed") break;
    if (status === "done") {
      if (t.approval === "owner")
        final.publish = stageDraft(t, cwd, before, out);
      else if (t.commit) {
        final.commit = commit(t, cwd, before, p);
        if ((final.commit as { error?: string }).error) status = "failed"; // unpushed work is not done
      }
      final.provider = p;
      break;
    }
  }
  const result = {
    id: t.id,
    role: t.role,
    host: HOST,
    status,
    attempts,
    ...final,
    results: out,
  };
  if (
    chain.length === 0 &&
    !TEXT_ROLES.has(t.role) &&
    !named.some((p) => CLIS.has(p.split(":")[0]))
  )
    (result as Record<string, unknown>).reason = "no_cli_provider"; // ai-os must name a coding CLI
  writeFileSync(join(out, "result.json"), JSON.stringify(result, null, 2));
  t.attempts = attempts;
  const maxA = t.max_attempts ?? 3;
  if (status === "failed" && OWNED)
    restore(
      cwd,
      [...dirty(cwd)].filter((f) => !before.has(f)),
    );
  const retryLater =
    status === "failed" &&
    named.length > 0 &&
    attempts.every((a) => a.reason === "provider_unavailable") &&
    attempts.length < maxA * 5;
  if (retryLater)
    t.not_before = new Date(Date.now() + COOLDOWN_MS).toISOString();
  writeTask(status === "done" ? Q.done : retryLater ? Q.new : Q.failed, t);
  try {
    unlinkSync(claimedPath);
  } catch {}
  log(status === "done" ? "done" : retryLater ? "requeue" : "failed", {
    id: t.id,
    provider: final.provider,
    commit: (final.commit as any)?.sha,
    publish: (final.publish as any)?.dir,
  });
}

async function work(role: string) {
  // Agents never run as root (Claude Code guardrail): prd uses the dedicated user `agent`.
  if (!WIN && process.getuid?.() === 0)
    throw new Error(
      "runner: refuse to run as root, use the `agent` user (install.sh)",
    );
  if (!FLEET.roles[role]) throw new Error(`unknown role ${role}`);
  ensureDirs();
  const hb = join(STATE, `heartbeat-${role}`);
  const beat = () => writeFileSync(hb, `${process.pid} ${now()}`);
  beat();
  setInterval(beat, 30_000);
  log("worker_start", { role, pid: process.pid, src: SRC });
  for (;;) {
    const c = claim(role);
    if (c) await runTask(c.t, c.path);
    else await Bun.sleep(POLL_MS);
  }
}

// ---------- tmux (tmux on Linux, psmux on Windows: same CLI) ----------
function tmux(args: string[]) {
  return sh(argv0("tmux", args));
}
function workerCmd(role: string): string {
  const bun = process.execPath.replace(/\\/g, "/");
  const runner = join(HERE, "runner.ts").replace(/\\/g, "/");
  // Restart the worker in-place if it ever exits. psmux (Windows) mangles double quotes: paths
  // there are quoted only when they contain spaces.
  const q = (p: string) => (WIN && !/\s/.test(p) ? p : `"${p}"`);
  return `while :; do ${q(bun)} --no-env-file ${q(runner)} work ${role}; sleep 5; done`;
}
function up() {
  ensureDirs();
  // One repair at a time (service start and health timer can race).
  const lock = join(STATE, "up.lock");
  try {
    mkdirSync(lock);
  } catch {
    if (Date.now() - statSync(lock).mtimeMs < 60_000) return;
  }
  try {
    upLocked();
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}
function upLocked() {
  const roles = FLEET.hosts[HOST]?.roles ?? [];
  if (tmux(["has-session", "-t", SESSION]).exit !== 0) {
    const r = tmux([
      "new-session",
      "-d",
      "-s",
      SESSION,
      "-n",
      "health",
      "-c",
      SRC,
    ]);
    log("tmux_session", { created: r.exit === 0, err: r.err.slice(0, 300) });
  }
  const have = new Set<string>();
  for (const line of tmux([
    "list-windows",
    "-t",
    SESSION,
    "-F",
    "#{window_index} #{window_name}",
  ])
    .out.split(/\r?\n/)
    .filter(Boolean)) {
    const [idx, name] = line.split(" ");
    if (have.has(name)) {
      tmux(["kill-window", "-t", `${SESSION}:${idx}`]); // duplicate role window
      log("tmux_window", { role: name, action: "kill_duplicate", idx });
    } else have.add(name);
  }
  for (const role of roles) {
    const hb = join(STATE, `heartbeat-${role}`);
    const stale =
      !existsSync(hb) || Date.now() - statSync(hb).mtimeMs > 300_000;
    if (!have.has(role)) {
      tmux([
        "new-window",
        "-d",
        "-t",
        SESSION,
        "-n",
        role,
        "-c",
        SRC,
        workerCmd(role),
      ]);
      log("tmux_window", { role, action: "create" });
    } else if (stale) {
      tmux([
        "respawn-window",
        "-k",
        "-t",
        `${SESSION}:${role}`,
        workerCmd(role),
      ]);
      log("tmux_window", { role, action: "respawn" });
    }
  }
}

// Claimed tasks whose worker died on this host go back to new/.
function requeueOrphans() {
  for (const f of readdirSync(Q.claimed)) {
    const m = f.match(/^(.*)@([^.]+)\.(\d+)\.json$/);
    if (!m || m[2] !== HOST) continue;
    let alive = true;
    try {
      process.kill(Number(m[3]), 0);
    } catch {
      alive = false;
    }
    if (!alive) {
      renameSync(join(Q.claimed, f), join(Q.new, `${m[1]}.json`));
      log("orphan_requeue", { id: m[1] });
    }
  }
}

function probe(): Record<string, string> {
  const res: Record<string, string> = {};
  for (const p of ["claude", "codex", "opencode", "pi", "agy", "tmux"]) {
    if (!Bun.which(p)) {
      res[p] = "missing";
      continue;
    }
    const r = sh(argv0(p, [p === "tmux" ? "-V" : "--version"]), {
      timeoutMs: 20_000,
    });
    res[p] =
      r.exit === 0
        ? (r.out || r.err).trim().split(/\r?\n/)[0]
        : `error ${r.exit}`;
    if (cooling(p)) res[p] += " (cooldown)";
  }
  return res;
}

// ssh to a fleet host: try its targets in order (PC aliases, WireGuard mesh, public IP).
function sshRun(host: string, remote: string, stdin: string) {
  let r = { exit: 1, out: "", err: `no ssh target for ${host}` };
  for (const target of FLEET.hosts[host]?.ssh ?? [host]) {
    r = sh(
      ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", target, remote],
      { stdin, timeoutMs: 60_000 },
    );
    if (r.exit === 0) return r;
  }
  return r;
}

// Ship new log lines to the ship host (offset kept in state/ship-offset).
function ship() {
  if (!existsSync(LOG)) return;
  const offF = join(STATE, "ship-offset");
  const off = existsSync(offF) ? Number(readFileSync(offF, "utf8")) || 0 : 0;
  const buf = readFileSync(LOG);
  if (buf.length <= off) return;
  const chunk = buf.subarray(off);
  const target = `${FLEET.ship.dir}/${HOST}.jsonl`;
  const remote = `mkdir -p '${FLEET.ship.dir}' && cat >> '${target}'`;
  const r =
    HOST === FLEET.ship.host
      ? sh(["sh", "-c", remote], { stdin: chunk.toString() })
      : sshRun(FLEET.ship.host, remote, chunk.toString());
  if (r.exit === 0) writeFileSync(offF, String(buf.length));
}

// Self-fix loop (ship host only): red `judge`/`ci` on main -> one sre task per failing commit, at
// most one open at a time. Attributable failures are also reverted by .github/workflows/ci-revert.yml;
// the task checks that first.
function ciWatch() {
  if (HOST !== FLEET.ship.host || !Bun.which("gh")) return;
  const open = [Q.new, Q.claimed].some((d) =>
    readdirSync(d).some((f) => f.startsWith("ci-fix-")),
  );
  if (open) return;
  for (const wf of ["judge", "ci"]) {
    const r = sh(
      argv0("gh", [
        "run",
        "list",
        "-R",
        "aphrody-dev/src",
        "-w",
        wf,
        "-b",
        "main",
        "-L",
        "1",
        "--json",
        "conclusion,headSha,url,databaseId",
      ]),
      { timeoutMs: 60_000 },
    );
    if (r.exit) continue;
    const [run] = JSON.parse(r.out || "[]");
    if (!run || run.conclusion !== "failure") continue;
    const id = `ci-fix-${run.headSha.slice(0, 12)}`;
    if (
      [Q.done, Q.failed].some((d) =>
        readdirSync(d).some((f) => f.startsWith(id)),
      )
    )
      continue;
    writeTask(Q.new, {
      v: 1,
      id,
      role: "sre",
      host: HOST,
      created_by: "ci-watch",
      created_at: now(),
      prompt: `Workflow \`${wf}\` is red on main at ${run.headSha} (${run.url}). Run \`git pull --ff-only origin main\` first. If HEAD already contains a revert of ${run.headSha.slice(0, 12)} or a newer ${wf} run on main is green, stop without changes. Otherwise read the failing log with \`gh run view --log-failed -R aphrody-dev/src ${run.databaseId}\`, fix the root cause with the smallest change, run the matching \`just\` recipe locally, and stop. Do not commit: the runner commits.`,
      commit: {
        paths: [""],
        message: `fix: ${wf} rouge sur main à ${run.headSha.slice(0, 12)}`,
      },
    });
    log("ci_watch", { id, workflow: wf, sha: run.headSha });
    return;
  }
}

function health() {
  ensureDirs();
  up();
  requeueOrphans();
  ciWatch();
  schedule();
  const h = { ts: now(), host: HOST, src: SRC, clis: probe(), queue: counts() };
  writeFileSync(join(STATE, "health.json"), JSON.stringify(h, null, 2));
  log("health", { clis: h.clis, queue: h.queue });
  ship();
}
function counts() {
  return Object.fromEntries(
    ["new", "claimed", "done", "failed"].map((k) => [
      k,
      readdirSync((Q as any)[k]).filter((f: string) => f.endsWith(".json"))
        .length,
    ]),
  );
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
// Task templates: infra/agents/tasks/<name>.json (partial Task); CLI flags override template fields.
function template(name: string): Partial<Task> {
  return JSON.parse(readFileSync(join(HERE, "tasks", `${name}.json`), "utf8"));
}
function buildTask(
  base: Partial<Task>,
  o: Record<string, string | undefined>,
): Task {
  const role = o.role ?? base.role;
  const prompt = o.prompt ?? base.prompt;
  if (!role || !prompt || !FLEET.roles[role])
    throw new Error(
      "enqueue: --role <known role> and --prompt (or --template) are required",
    );
  const host = o.host ?? base.host ?? (role === "chromium" ? "fr1" : "any");
  if ((role === "chromium") !== (host === "fr1"))
    throw new Error(
      "enqueue: fr1 only takes role chromium (Chromium/LLVM builds), and chromium only runs on fr1",
    );
  return {
    ...base,
    v: 1,
    id: o.id ?? newId(role),
    role,
    host,
    prompt,
    providers: o.providers?.split(",") ?? base.providers,
    cwd: o.cwd ?? base.cwd,
    check: o.check ?? base.check,
    commit: o.paths
      ? {
          paths: o.paths.split(","),
          message: o.message ?? `agents: ${role} task`,
        }
      : base.commit,
    approval:
      (o.approval as Task["approval"]) ??
      base.approval ??
      (role === "growth" ? "owner" : "none"),
    created_by:
      process.env.AGENT_CREATED_BY ?? base.created_by ?? `cli@${HOST}`,
    created_at: now(),
  };
}
function submit(t: Task) {
  if (t.host === HOST || t.host === "any") {
    writeTask(Q.new, t);
  } else {
    const h = FLEET.hosts[t.host];
    if (!h) throw new Error(`unknown host ${t.host}`);
    const qd = `${h.src}/var/agents/queue`;
    const r = sshRun(
      t.host,
      `mkdir -p '${qd}/tmp' '${qd}/new' && cat > '${qd}/tmp/${t.id}.json' && mv '${qd}/tmp/${t.id}.json' '${qd}/new/${t.id}.json'`,
      JSON.stringify(t, null, 2),
    );
    if (r.exit) throw new Error(`enqueue on ${t.host} failed: ${r.err}`);
  }
}
function enqueue() {
  ensureDirs();
  const o = Object.fromEntries(
    [
      "role",
      "prompt",
      "host",
      "providers",
      "cwd",
      "check",
      "paths",
      "message",
      "approval",
      "id",
    ].map((k) => [k, arg(k)]),
  );
  const name = arg("template");
  const t = buildTask(name ? template(name) : {}, o);
  submit(t);
  console.log(JSON.stringify({ id: t.id, host: t.host, role: t.role }));
}
// Recurring templates (fleet.toml [schedule]: name = every_h), enqueued by the ship host's health run.
function schedule() {
  if (HOST !== FLEET.ship.host) return;
  for (const [name, everyH] of Object.entries(FLEET.schedule ?? {})) {
    const f = join(STATE, `schedule-${name}`);
    if (existsSync(f) && Date.now() - statSync(f).mtimeMs < everyH * 3_600_000)
      continue;
    try {
      const t = buildTask(template(name), {
        id: `${name}-${now().slice(0, 10)}`,
      });
      t.created_by = "schedule";
      submit(t);
      writeFileSync(f, now());
      log("schedule", { name, id: t.id, host: t.host });
    } catch (e) {
      log("schedule_error", { name, err: String(e).slice(0, 300) });
    }
  }
}
function status() {
  ensureDirs();
  const tail = existsSync(LOG)
    ? readFileSync(LOG, "utf8")
        .trim()
        .split("\n")
        .slice(-15)
        .map((l) => JSON.parse(l))
    : [];
  console.log(
    JSON.stringify(
      { host: HOST, src: SRC, home: HOME, queue: counts(), tail },
      null,
      2,
    ),
  );
}

const [cmd, a1] = process.argv.slice(2);
switch (cmd) {
  case "up":
    up();
    break;
  case "work":
    await work(a1);
    break;
  case "health":
    health();
    break;
  case "enqueue":
    enqueue();
    break;
  case "status":
    status();
    break;
  default:
    console.error("usage: runner.ts up|work <role>|health|enqueue|status");
    process.exit(2);
}
