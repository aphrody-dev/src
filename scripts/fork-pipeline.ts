#!/usr/bin/env bun
// Fork pipeline: keeps every aphrody-labs fork at the freshest upstream commit and bumps the consumers' pins.
// Runs on fr1 under aphrody-heavy every 15 min (infra/fleet/systemd/fork-pipeline.{service,timer}); no token is stored or printed:
// the gh login of the host is read with `gh auth token` into memory only.
// Manifest: [sync.<name>] tables of third_party/ECOSYSTEM.toml (repo, upstream, branch, kind = mirror|patched, verify, consumers);
// every other upstream/repo line of third_party/forks.txt is an implicit mirror (fork = aphrody-labs/<repo>).
//   mirror : `gh repo sync` fast-forward. Fork with own commits (ahead > 0): reported "diverged", never forced.
//   patched: upstream commits not yet in the fork (`git cherry`, patch-id) are replayed on top of the fork branch in a work clone,
//            verified (verify commands), pushed as sync/<upstream-sha7>, PR + auto-merge (--rebase, linear history). A history
//            rewrite cannot be rebase-merged by a PR (duplicates patches), so the vehicle is cherry-pick of the upstream delta; the
//            manual rebase + force-with-lease of docs/nextjs/FORK.md stays available. Conflict / failing CI: issue
//            (label upstream-sync, deduped by title) with the log tail and an ai-os triage, then stop for that fork.
//   consumers: every file of the consumer repo (Cargo.toml git rev, package.json #sha, src.lock.json, ECOSYSTEM.toml) that pins the
//            fork is bumped to the fork head, the consumer gate runs, then `deps: <fork> -> <sha7>` on its default branch
//            (push --no-verify); gate failure: issue in the consumer repo, nothing committed.
// Output: ~/.local/share/ay/fork-pipeline/state.json and docs/forks/STATUS.md (committed to aphrody-labs/src when it changes).
// Usage: bun scripts/fork-pipeline.ts [--only name,name] [--dry] [--manifest <dir>]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Consumer = { repo: string; gate?: string; browser?: string };
export type Fork = {
  name: string;
  repo: string;
  upstream: string;
  branch?: string;
  kind: "mirror" | "patched";
  verify: string[];
  consumers: Consumer[];
  explicit: boolean;
};
export type Action = "noop" | "ff" | "sync" | "wait" | "diverged";

/** [sync.*] tables of ECOSYSTEM.toml + implicit mirrors of forks.txt (owner != aphrody-labs). */
export function parseManifest(eco: string, forksTxt: string): Fork[] {
  const toml = (Bun.TOML.parse(eco) as { sync?: Record<string, Record<string, unknown>> }).sync ?? {};
  const out: Fork[] = [];
  const seen = new Set<string>();
  for (const [name, t] of Object.entries(toml)) {
    const repo = String(t.repo ?? "");
    const upstream = String(t.upstream ?? "");
    const kind = t.kind === "patched" ? "patched" : "mirror";
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w.-]+\/[\w.-]+$/.test(upstream)) throw new Error(`sync.${name}: bad repo/upstream`);
    out.push({
      name,
      repo,
      upstream,
      branch: t.branch ? String(t.branch) : undefined,
      kind,
      verify: ((t.verify as string[]) ?? []).map(String),
      consumers: ((t.consumers as Consumer[]) ?? []).map((c) => ({ repo: c.repo, gate: c.gate, browser: c.browser })),
      explicit: true,
    });
    seen.add(repo);
  }
  for (const line of forksTxt.split("\n")) {
    const m = /^([\w.-]+)\/([\w.-]+)(\s|$)/.exec(line);
    if (!m || line.startsWith("#") || m[1] === "aphrody-labs") continue;
    const repo = `aphrody-labs/${m[2]}`;
    if (seen.has(repo)) continue;
    seen.add(repo);
    out.push({ name: m[2], repo, upstream: `${m[1]}/${m[2]}`, kind: "mirror", verify: [], consumers: [], explicit: false });
  }
  return out;
}

/** Decision table. behind = upstream commits missing from the fork, ahead = fork-only commits, handled = last upstream sha replayed. */
export function decide(i: { kind: Fork["kind"]; upSha: string; behind: number; ahead: number; handled?: string; openPr: boolean }): Action {
  if (i.behind === 0 || i.upSha === i.handled) return "noop";
  if (i.kind === "mirror") return i.ahead > 0 ? "diverged" : "ff";
  return i.openPr ? "wait" : "sync";
}

/** Stable shard of a repo among n workers (FNV-1a). */
export const shardOf = (repo: string, n: number) => [...repo].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) % n;

const hex = "[0-9a-f]{7,40}";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bump every pin of github.com/aphrody-labs/<repo> in one file. Pure: returns the new text (same text when nothing pins it). */
export function bumpPins(file: string, text: string, repo: string, sha: string): string {
  const r = esc(repo);
  const base = file.split("/").pop() ?? file;
  if (base === "Cargo.toml") {
    return text
      .split("\n")
      .map((l) => (new RegExp(`github\\.com/aphrody-labs/${r}(\\.git)?"`).test(l) ? l.replace(new RegExp(`(rev\\s*=\\s*")${hex}(")`), `$1${sha}$2`) : l))
      .join("\n");
  }
  if (base === "package.json") return text.replace(new RegExp(`(aphrody-labs/${r}(?:\\.git)?#)${hex}`, "g"), `$1${sha}`);
  const key = base === "src.lock.json" ? "commit" : base === "ECOSYSTEM.toml" ? "sha" : "";
  if (!key) return text;
  const m = new RegExp(`github\\.com/aphrody-labs/${r}\\.git"`).exec(text);
  if (!m) return text;
  const start = m.index;
  const rest = text.slice(start);
  const end = rest.search(/\n\s*\},?\n|\n\[/);
  const slice = end < 0 ? rest : rest.slice(0, end);
  const bumped = slice.replace(new RegExp(`(["]?${key}["]?\\s*[:=]\\s*")${hex}(")`), `$1${sha}$2`);
  return text.slice(0, start) + bumped + rest.slice(slice.length);
}

// ---------------------------------------------------------------- runtime (only below this line touches the network or disk)
type ForkState = {
  branch?: string;
  upSha?: string;
  upEtag?: string;
  forkSha?: string;
  forkEtag?: string;
  ahead?: number;
  behind?: number;
  handled?: string;
  action?: string;
  note?: string;
  lastPr?: string;
  issues?: number;
  checkedAt?: string;
};
type State = { forks: Record<string, ForkState>; runAt?: string };

const ROOT = join(process.env.FORK_PIPELINE_HOME ?? join(homedir(), ".local/share/ay/fork-pipeline"));
const WORK = join(ROOT, "work");
const AI_OS = [process.env.AI_OS_CLI, "/srv/src/packages/ai-os/src/cli.ts"].find((p) => p && existsSync(p));
let TOKEN = "";
const log = (s: string) => console.log(`fork-pipeline: ${s}`);

async function sh(cmd: string, cwd?: string, timeoutMs = 3_600_000): Promise<{ ok: boolean; out: string }> {
  const p = Bun.spawn(["bash", "-c", cmd], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: `${homedir()}/.local/bin:${homedir()}/.bun/bin:${process.env.PATH}`, GIT_TERMINAL_PROMPT: "0", CI: "1" },
    timeout: timeoutMs,
  });
  const [o, e] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  return { ok: (await p.exited) === 0, out: (o + e).trim() };
}
const tail = (s: string, n = 60) => s.split("\n").slice(-n).join("\n");

async function gh(path: string, headers: Record<string, string> = {}) {
  return fetch(`https://api.github.com/${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "aphrody-fork-pipeline", ...headers },
  });
}
/** HEAD sha of repo@branch, ETag-cached (a 304 costs no rate limit). */
async function headSha(repo: string, branch: string, etag?: string, prev?: string) {
  const r = await gh(`repos/${repo}/commits/${branch}`, { Accept: "application/vnd.github.sha", ...(etag && prev ? { "If-None-Match": etag } : {}) });
  if (r.status === 304 && prev) return { sha: prev, etag };
  if (!r.ok) throw new Error(`${repo}@${branch}: HTTP ${r.status}`);
  return { sha: (await r.text()).trim(), etag: r.headers.get("etag") ?? undefined };
}

/** Issue title policy: one open issue per (repo, fork, failure kind). */
export const issueTitle = (fork: string, kind: string) => `[sync] ${fork}: ${kind}`;

/** Create the issue, or comment on the open one (recurrence) and refresh its body. */
async function ensureIssue(repo: string, title: string, body: string, label = "upstream-sync"): Promise<string> {
  await sh(`gh label create ${label} --repo ${repo} --color BFD4F2 --description "fork-pipeline" --force`);
  const l = await sh(`gh issue list --repo ${repo} --label ${label} --state open --search ${JSON.stringify(title + " in:title")} --json number,title`);
  const hit = (JSON.parse(l.out || "[]") as { number: number; title: string }[]).find((i) => i.title === title);
  const f = join(ROOT, "issue-body.md");
  writeFileSync(f, body);
  if (hit) {
    await sh(`gh issue edit ${hit.number} --repo ${repo} --body-file ${f}`);
    await sh(`gh issue comment ${hit.number} --repo ${repo} --body-file ${f}`);
    return `${repo}#${hit.number}`;
  }
  const c = await sh(`gh issue create --repo ${repo} --label ${label} --title ${JSON.stringify(title)} --body-file ${f}`);
  return c.out.split("\n").pop() ?? "";
}

/** Close every open pipeline issue of a fork (all kinds) once a run succeeds. */
async function closeResolved(repo: string, fork: string, label: string, why: string) {
  const l = await sh(`gh issue list --repo ${repo} --label ${label} --state open --search ${JSON.stringify(`[sync] ${fork}: in:title`)} --json number,title`);
  for (const i of JSON.parse(l.out || "[]") as { number: number; title: string }[])
    if (i.title.startsWith(`[sync] ${fork}: `)) await sh(`gh issue close ${i.number} --repo ${repo} --comment ${JSON.stringify(why)}`);
}

/** Open PR settings the policy needs: auto-merge and head-branch deletion. */
const prSettings = (repo: string) => sh(`gh api -X PATCH repos/${repo} -F allow_auto_merge=true -F delete_branch_on_merge=true --silent`);

/** Merge green bot PRs (head prefix), close the ones superseded by a newer sha, report failing CI. Returns the merged URL. */
async function reconcile(repo: string, prefix: string, current: string, onFail: (url: string, logs: string) => Promise<void>): Promise<string | undefined> {
  const l = await sh(`gh pr list --repo ${repo} --state open --search "head:${prefix}" --json number,url,headRefName,statusCheckRollup`);
  type C = { conclusion?: string; status?: string };
  let merged: string | undefined;
  for (const p of JSON.parse(l.out || "[]") as { url: string; headRefName: string; statusCheckRollup: C[] }[]) {
    if (!p.headRefName.startsWith(prefix)) continue;
    if (p.headRefName !== current) {
      await sh(`gh pr close ${p.url} --delete-branch --comment "Superseded by ${current}."`);
      continue;
    }
    const cs = p.statusCheckRollup ?? [];
    if (cs.some((c) => ["FAILURE", "TIMED_OUT", "CANCELLED", "STARTUP_FAILURE"].includes(c.conclusion ?? ""))) await onFail(p.url, (await sh(`gh pr checks ${p.url} 2>&1 | tail -40`)).out);
    else if (cs.every((c) => c.status === "COMPLETED") && (await sh(`gh pr merge ${p.url} --rebase --delete-branch`)).ok) merged = p.url;
  }
  return merged;
}

async function triage(logText: string): Promise<string> {
  if (!AI_OS) return "";
  const prompt = `Triage this fork upstream-sync failure in 5 lines: cause, first file to fix, next step.\n\n${tail(logText, 40)}`;
  const r = await sh(`bun ${AI_OS} run ${JSON.stringify(prompt)}`, undefined, 120_000);
  return r.ok && r.out ? `\n\n### Triage (ai-os)\n\n${tail(r.out, 20)}` : "";
}

async function fail(f: Fork, st: ForkState, kind: string, what: string, logText: string) {
  const body = `Fork \`${f.repo}\` could not follow \`${f.upstream}\`: ${what}\n\n\`\`\`\n${tail(logText)}\n\`\`\`${await triage(logText)}\n\nStops until fixed (fork-pipeline, scripts/fork-pipeline.ts).`;
  st.note = what;
  st.action = "blocked";
  const ref = await ensureIssue(f.repo, issueTitle(f.name, kind), body);
  log(`${f.name}: ${what} -> ${ref}`);
}

async function clone(repo: string, extra = "") {
  const d = join(WORK, repo.split("/")[1]);
  if (!existsSync(join(d, ".git"))) {
    mkdirSync(WORK, { recursive: true });
    const c = await sh(`git clone -q --filter=blob:none ${extra} https://github.com/${repo}.git ${d}`);
    if (!c.ok) throw new Error(`clone ${repo}: ${tail(c.out, 5)}`);
  }
  return d;
}

async function syncPatched(f: Fork, st: ForkState): Promise<void> {
  const br = st.branch!;
  const d = await clone(f.repo);
  await sh(`git remote add upstream https://github.com/${f.upstream}.git 2>/dev/null; git remote set-url upstream https://github.com/${f.upstream}.git`, d);
  const fe = await sh(`git fetch -q origin ${br} && git fetch -q upstream ${br} && git checkout -q -f -B work origin/${br} && git clean -fdq`, d);
  if (!fe.ok) return fail(f, st, "fetch", "fetch failed", fe.out);
  const pending = (await sh(`git cherry origin/${br} upstream/${br} | grep '^+' | cut -c3-`, d)).out.split("\n").filter(Boolean);
  if (!pending.length) {
    st.handled = st.upSha;
    st.action = "noop";
    return;
  }
  const branch = `sync/${st.upSha!.slice(0, 12)}`;
  const ex = await sh(`git ls-remote --heads origin ${branch}`, d);
  await sh(`git checkout -q -B ${branch} origin/${br}`, d);
  for (const c of pending) {
    if ((await sh(`git rev-list --parents -n1 ${c}`, d)).out.split(" ").length > 2) continue; // merge commit: its parents are replayed
    const p = await sh(`git -c user.name=aphrody-dev -c user.email=aphrody-dev@users.noreply.github.com cherry-pick --allow-empty --keep-redundant-commits ${c}`, d);
    if (!p.ok) {
      await sh("git cherry-pick --abort", d);
      return fail(f, st, "conflict", `conflict replaying upstream ${c.slice(0, 12)} on ${br} (${pending.length} commits pending)`, p.out);
    }
  }
  for (const v of f.verify) {
    const r = await sh(v, d);
    if (!r.ok) return fail(f, st, "verify", `verify failed: ${v}`, r.out);
    log(`${f.name}: ok ${v}`);
  }
  if (ex.out) await sh(`git push -q --force origin ${branch}`, d);
  else {
    const ps = await sh(`git push -q origin ${branch}`, d);
    if (!ps.ok) return fail(f, st, "push", "push of the sync branch failed", ps.out);
  }
  const prs = await sh(`gh pr list --repo ${f.repo} --head ${branch} --state open --json url --jq '.[0].url'`);
  let url = prs.out;
  if (!url) {
    const body = `Replays ${pending.length} upstream commit(s) of ${f.upstream}@${st.upSha!.slice(0, 12)} on ${br}.\nVerified on fr1: ${f.verify.join("; ") || "none"}.\nAuto-merge (--rebase) once the fork CI is green; the branch is deleted after merge.`;
    const bf = join(ROOT, "pr-body.md");
    writeFileSync(bf, body);
    const pc = await sh(`gh pr create --repo ${f.repo} --base ${br} --head ${branch} --title "sync: upstream ${st.upSha!.slice(0, 12)}" --body-file ${bf}`);
    if (!pc.ok) return fail(f, st, "pr", "gh pr create failed", pc.out);
    url = pc.out.split("\n").pop()!;
  }
  await prSettings(f.repo);
  const am = await sh(`gh pr merge ${url} --auto --rebase --delete-branch`);
  st.lastPr = url;
  st.action = "pr";
  st.note = am.ok ? "auto-merge enabled" : `auto-merge pending (${tail(am.out, 1)}); reconciled on next run`;
  st.handled = st.upSha;
  log(`${f.name}: ${url} ${st.note}`);
}

const IDENT = "-c user.name=aphrody-dev -c user.email=aphrody-dev@users.noreply.github.com";
/** Consumer bump through a PR deps/<fork>-<sha7> (a broken bump never lands on the default branch). */
async function integrate(f: Fork, st: ForkState, dry: boolean) {
  const short = st.forkSha!.slice(0, 7);
  const branch = `deps/${f.name}-${short}`;
  for (const c of f.consumers) {
    const d = await clone(c.repo);
    const title = issueTitle(f.name, "bump");
    const merged = dry
      ? undefined
      : await reconcile(c.repo, `deps/${f.name}-`, branch, async (url, logs) => void (await ensureIssue(c.repo, issueTitle(f.name, "ci"), `CI failed on ${url}\n\n\`\`\`\n${tail(logs)}\n\`\`\`${await triage(logs)}`, "deps-bump")));
    if (merged) {
      await closeResolved(c.repo, f.name, "deps-bump", `Resolved by ${merged}`);
      log(`${f.name}: merged ${merged}`);
    }
    const def = (await sh(`git remote show origin | sed -n 's/.*HEAD branch: //p'`, d)).out || "main";
    await sh(`git fetch -q origin ${def} && git checkout -q -f -B ${def} origin/${def} && git clean -fdq`, d);
    let changed = 0;
    for (const file of (await sh("git ls-files", d)).out.split("\n")) {
      if (!/(^|\/)(Cargo\.toml|package\.json|src\.lock\.json|ECOSYSTEM\.toml)$/.test(file) || /node_modules/.test(file)) continue;
      const t = readFileSync(join(d, file), "utf8");
      const n = bumpPins(file, t, f.repo.split("/")[1], st.forkSha!);
      if (n !== t) {
        writeFileSync(join(d, file), n);
        changed++;
      }
    }
    if (!changed) continue;
    log(`${f.name}: ${c.repo} ${changed} file(s) to bump`);
    if (dry || (await sh(`gh pr list --repo ${c.repo} --head ${branch} --state open --json url --jq '.[0].url'`)).out) {
      await sh("git checkout -q -f .", d);
      continue;
    }
    const g = c.gate ? await sh(c.gate, d) : { ok: true, out: "" };
    if (!g.ok) {
      await sh("git checkout -q -f .", d);
      const ref = await ensureIssue(c.repo, title, `Bump of ${f.repo}@${st.forkSha} fails the gate \`${c.gate}\`.\n\n\`\`\`\n${tail(g.out)}\n\`\`\`${await triage(g.out)}`, "deps-bump");
      log(`${f.name}: gate failed in ${c.repo} -> ${ref}`);
      continue;
    }
    const msg = `deps: ${f.name} -> ${short}`;
    await sh(`git checkout -q -B ${branch} && git ${IDENT} commit -qam ${JSON.stringify(msg)}`, d);
    const p = await sh(`git push -q --no-verify --force origin ${branch}`, d);
    if (!p.ok) {
      await ensureIssue(c.repo, issueTitle(f.name, "push"), `Push of \`${branch}\` failed.\n\n\`\`\`\n${tail(p.out, 20)}\n\`\`\``, "deps-bump");
      continue;
    }
    await prSettings(c.repo);
    const bf = join(ROOT, "pr-body.md");
    writeFileSync(bf, `Pins ${f.repo} at ${st.forkSha}. Gate: ${c.gate ?? "none"} (passed on fr1). Auto-merge (--rebase) on green CI.`);
    const pc = await sh(`gh pr create --repo ${c.repo} --base ${def} --head ${branch} --title ${JSON.stringify(msg)} --body-file ${bf}`);
    if (!pc.ok) {
      await ensureIssue(c.repo, issueTitle(f.name, "pr"), `gh pr create failed.\n\n\`\`\`\n${tail(pc.out, 20)}\n\`\`\``, "deps-bump");
      continue;
    }
    await sh(`gh pr merge ${pc.out.split("\n").pop()} --auto --rebase --delete-branch`, d);
    log(`${f.name}: ${msg} -> ${pc.out.split("\n").pop()}`);
    if (c.browser) {
      const b = await sh(`command -v agent-browser >/dev/null && agent-browser open ${JSON.stringify(c.browser)} && agent-browser snapshot | head -5`);
      if (!b.ok && b.out) await ensureIssue(c.repo, issueTitle(f.name, "browser"), `agent-browser ${c.browser} after ${msg}\n\n\`\`\`\n${tail(b.out, 20)}\n\`\`\``, "deps-bump");
    }
  }
}

export function renderStatus(forks: Fork[], state: State, uses: string[]): string {
  const rows = forks.map((f) => {
    const s = state.forks[f.name] ?? {};
    const sha = (x?: string) => (x ? x.slice(0, 12) : "-");
    return `| ${f.repo} | ${f.kind} | ${sha(s.upSha)} | ${sha(s.forkSha)} | ${s.behind ?? "?"}/${s.ahead ?? "?"} | ${s.action ?? "-"}${s.note ? `: ${s.note}` : ""} | ${s.lastPr ?? "-"} | ${s.issues ?? 0} |`;
  });
  return [
    "# Fork status",
    "",
    "Genere par `scripts/fork-pipeline.ts` (fr1, toutes les 15 min). Ne pas editer. Politique : [POLICY.md](POLICY.md).",
    "",
    `Briques utilisees : ${uses.join("; ")}.`,
    "Non utilisees : `packages/deploy` (deploie des sites, pas des forks), `vercel-labs/wterm` ; `third_party/vercel-ai` n est atteint que via `packages/ai-os`.",
    "",
    "| fork | kind | upstream sha | fork sha | behind/ahead | last action | last PR | open issues |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

async function main() {
  const { values } = (await import("node:util")).parseArgs({ options: { only: { type: "string" }, dry: { type: "boolean" }, manifest: { type: "string" }, shard: { type: "string" } } });
  mkdirSync(ROOT, { recursive: true });
  TOKEN = (await sh("gh auth token")).out;
  if (!TOKEN) throw new Error("gh is not logged in");
  const srcDir = values.manifest ?? (await clone("aphrody-labs/src", "--depth 1"));
  if (!values.manifest) await sh("git fetch -q --depth 1 origin && git checkout -q -f -B main origin/HEAD 2>/dev/null || git reset -q --hard origin/HEAD", srcDir);
  const forks = parseManifest(readFileSync(join(srcDir, "third_party/ECOSYSTEM.toml"), "utf8"), readFileSync(join(srcDir, "third_party/forks.txt"), "utf8"));
  const sf = join(ROOT, "state.json");
  const state: State = existsSync(sf) ? JSON.parse(readFileSync(sf, "utf8")) : { forks: {} };
  const only = values.only?.split(",");
  const shard = values.shard ? values.shard.split("/").map(Number) : undefined; // "i/n": forks whose hash(repo) mod n == i
  let n = 0;
  for (const f of forks) {
    if (only && !only.includes(f.name)) continue;
    if (shard && shardOf(f.repo, shard[1]) !== shard[0]) continue;
    const st = (state.forks[f.name] ??= {});
    try {
      st.branch ??= f.branch ?? JSON.parse(await (await gh(`repos/${f.repo}`)).text()).default_branch;
      const up = await headSha(f.upstream, st.branch!, st.upEtag, st.upSha);
      const fk = await headSha(f.repo, st.branch!, st.forkEtag, st.forkSha);
      const changed = up.sha !== st.upSha || fk.sha !== st.forkSha || st.behind === undefined;
      Object.assign(st, { upSha: up.sha, upEtag: up.etag, forkSha: fk.sha, forkEtag: fk.etag, checkedAt: new Date().toISOString() });
      if (changed) {
        const c = await gh(`repos/${f.repo}/compare/${st.branch}...${f.upstream.split("/")[0]}:${st.branch}`);
        const j = (await c.json()) as { ahead_by?: number; behind_by?: number };
        st.behind = j.ahead_by ?? 0; // upstream commits missing from the fork
        st.ahead = j.behind_by ?? 0; // fork-only commits
      }
      if (f.kind === "patched" && st.handled === undefined && st.behind === 0) st.handled = up.sha;
      const open = f.kind === "patched" && !!(await sh(`gh pr list --repo ${f.repo} --head sync/${up.sha.slice(0, 12)} --state open --json url --jq '.[0].url'`)).out;
      const act = decide({ kind: f.kind, upSha: up.sha, behind: st.behind ?? 0, ahead: st.ahead ?? 0, handled: st.handled, openPr: open });
      st.action = act;
      st.note = undefined;
      if (values.dry) log(`${f.name}: ${act} behind=${st.behind} ahead=${st.ahead}`);
      else if (act === "ff") {
        const r = await sh(`gh repo sync ${f.repo} --source ${f.upstream} -b ${st.branch}`);
        st.action = r.ok ? "fast-forwarded" : "blocked";
        if (!r.ok) st.note = tail(r.out, 1);
        else st.forkSha = (await headSha(f.repo, st.branch!)).sha;
      } else if (act === "diverged") st.note = `fork has ${st.ahead} own commit(s); declare kind = "patched" to rebase`;
      else if (act === "sync") await syncPatched(f, st);
      if (!values.dry && f.kind === "patched") {
        const m = await reconcile(f.repo, "sync/", `sync/${up.sha.slice(0, 12)}`, async (url, logs) => void (await fail(f, st, "ci", `CI failed on ${url}`, logs)));
        if (m) {
          st.action = "merged";
          st.note = `merged ${m}`;
          await closeResolved(f.repo, f.name, "upstream-sync", `Resolved by ${m}`);
        }
      }
      if (!values.dry && f.explicit && (st.action === "fast-forwarded" || st.action === "pr" || st.action === "noop")) await closeResolved(f.repo, f.name, "upstream-sync", "Next run succeeded.");
      if (f.explicit) {
        const is = await sh(`gh issue list --repo ${f.repo} --label upstream-sync --state open --json number --jq length`);
        st.issues = Number(is.out) || 0;
      }
      if (!values.dry && f.consumers.length) {
        const fresh = (await headSha(f.repo, st.branch!)).sha;
        st.forkSha = fresh;
        await integrate(f, st, false);
      }
    } catch (e) {
      st.action = "error";
      st.note = String((e as Error).message).slice(0, 200);
      log(`${f.name}: ${st.note}`);
    }
    n++;
  }
  state.runAt = new Date().toISOString();
  writeFileSync(sf, JSON.stringify(state, null, 1));
  const uses = [
    "gh API with ETag cache and `gh repo sync`",
    "`aphrody-heavy` on fr1",
    ...(AI_OS ? ["failure triage through `packages/ai-os`"] : []),
    ...(forks.some((f) => f.verify.some((v) => /turbo/.test(v))) ? ["turborepo task graph in verify commands"] : []),
    ...(forks.some((f) => f.consumers.some((c) => c.browser)) ? ["`vercel-labs/agent-browser` consumer checks when installed"] : []),
  ];
  if (!values.dry && !values.manifest) {
    const md = renderStatus(forks, state, uses);
    const out = join(srcDir, "docs/forks/STATUS.md");
    const old = existsSync(out) ? readFileSync(out, "utf8") : "";
    if (old !== md) {
      mkdirSync(join(srcDir, "docs/forks"), { recursive: true });
      writeFileSync(out, md);
      await sh(`git add docs/forks/STATUS.md && git ${IDENT} commit -qm "forks: status" && (git push -q --no-verify origin HEAD:main || (git ${IDENT} pull -q --rebase origin main && git push -q --no-verify origin HEAD:main))`, srcDir);
    }
  }
  log(`${n} fork(s) checked`);
}
if (import.meta.main) await main();
