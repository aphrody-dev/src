// `ai-os brain <absorb|sync|restore>`: one brain for Claude Code and Antigravity (agy).
// absorb: memories, prompt history, session transcripts (~/.claude) and agy conversation summaries are indexed
//   into the ai-os Context store (~/.agent/memory.sqlite); transcripts and caches older than --days are zstd
//   compressed into ~/.agent/brain.sqlite and removed from disk (git-style: the blob store is the history).
// sync: the same directives (global CLAUDE.md + MEMORY.md index) are written into agy's ~/.gemini/GEMINI.md
//   managed block, and both CLIs get the same no-human-in-the-loop settings.
// restore <path>: writes a compressed file back to its original path.
import { Database } from "bun:sqlite";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { Context } from "../core/context";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    home: { type: "string" },
    days: { type: "string", default: "7" },
    "dry-run": { type: "boolean", default: false },
  },
  allowPositionals: true,
});
const H = homedir();
const CLAUDE = join(H, ".claude");
const GEMINI = join(H, ".gemini");
const home = values.home ?? Bun.env.AGENT_HOME ?? join(H, ".agent");
const dry = values["dry-run"];
const cutoff = Date.now() - Number(values.days) * 86_400_000;

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

function lines(text: string): any[] {
  const out: any[] = [];
  for (const l of text.split("\n")) {
    if (!l) continue;
    try {
      out.push(JSON.parse(l));
    } catch {}
  }
  return out;
}

const textOf = (c: unknown): string =>
  typeof c === "string"
    ? c
    : Array.isArray(c)
      ? c.map((p: any) => (p?.type === "text" ? p.text : "")).join("\n")
      : "";

// One entry per Claude session: summaries + user prompts, capped (the raw transcript stays in the blob store).
function sessionDigest(rows: any[]): { title: string; text: string } {
  const sums = rows.filter((r) => r.type === "summary").map((r) => r.summary);
  const asks = rows
    .filter((r) => r.type === "user" && r.message?.role === "user")
    .map((r) => textOf(r.message.content).trim())
    .filter((t) => t && !t.startsWith("<") && t.length < 4000);
  const title = sums[0] ?? asks[0]?.slice(0, 120) ?? "session";
  return {
    title,
    text: [...sums, ...asks.map((a) => `- ${a}`)].join("\n").slice(0, 12_000),
  };
}

async function absorb() {
  const ctx = new Context(join(home, "memory.sqlite"), undefined);
  const blobs = new Database(join(home, "brain.sqlite"));
  blobs.run(
    "CREATE TABLE IF NOT EXISTS blobs(path TEXT PRIMARY KEY, mtime INTEGER, size INTEGER, data BLOB)",
  );
  const put = blobs.query(
    "INSERT INTO blobs(path, mtime, size, data) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET mtime=excluded.mtime, size=excluded.size, data=excluded.data",
  );
  const n = { memory: 0, history: 0, session: 0, agy: 0, packed: 0, bytes: 0 };
  const entries: Parameters<Context["ingest"]>[0] & any[] = [];

  // Memories: every project's memory/*.md, one fact per file.
  for (const p of walk(join(CLAUDE, "projects"))) {
    if (!/[\\/]memory[\\/][^\\/]+\.md$/.test(p) || p.endsWith("MEMORY.md"))
      continue;
    entries.push({
      id: `claude-memory:${relative(CLAUDE, p)}`,
      source: "memory",
      scope: "claude",
      text: await Bun.file(p).text(),
    });
    n.memory++;
  }

  // Prompt history, grouped per project.
  const hist = join(CLAUDE, "history.jsonl");
  if (existsSync(hist)) {
    const by = new Map<string, string[]>();
    for (const r of lines(await Bun.file(hist).text())) {
      const k = r.project ?? "global";
      by.set(k, [...(by.get(k) ?? []), r.display ?? ""]);
    }
    for (const [k, v] of by) {
      entries.push({
        id: `claude-history:${k}`,
        source: "history",
        scope: "claude",
        title: k,
        text: v.join("\n").slice(-20_000),
      });
      n.history++;
    }
  }

  // Session transcripts: digest into Context, pack old ones.
  for (const p of walk(join(CLAUDE, "projects"))) {
    if (!p.endsWith(".jsonl")) continue;
    const st = statSync(p);
    const raw = await Bun.file(p).text();
    const d = sessionDigest(lines(raw));
    entries.push({
      id: `claude-session:${relative(CLAUDE, p)}`,
      source: "session",
      scope: "claude",
      title: d.title,
      text: d.text,
    });
    n.session++;
  }

  // Antigravity conversation summaries + full-text chunks.
  for (const agyDb of ["antigravity", "antigravity-cli"].map((d) =>
    join(GEMINI, d, "conversation_summaries.db"),
  )) {
    if (!existsSync(agyDb)) continue;
    const a = new Database(agyDb, { readonly: true });
    const rows = a
      .query(
        "SELECT s.conversation_id id, s.title, s.preview, s.workspace_uris ws, group_concat(f.user_body, char(10)) body FROM conversation_summaries s LEFT JOIN conversations_fts f ON f.conversation_id = s.conversation_id GROUP BY s.conversation_id",
      )
      .all() as any[];
    for (const r of rows) {
      entries.push({
        id: `agy-session:${r.id}`,
        source: "session",
        scope: "agy",
        title: r.title || r.ws,
        text: [r.title, r.preview, r.body]
          .filter(Boolean)
          .join("\n")
          .slice(0, 12_000),
      });
      n.agy++;
    }
    a.close();
  }

  if (!dry) await ctx.ingest(entries);

  // Compress cold files: transcripts, file-history, paste-cache, backups, shell snapshots.
  const cold = [
    "projects",
    "file-history",
    "paste-cache",
    "backups",
    "shell-snapshots",
  ];
  const roots = [
    ...cold.map((d) => join(CLAUDE, d)),
    join(GEMINI, "antigravity-cli", "brain"),
    join(GEMINI, "antigravity-cli", "conversations"),
  ];
  for (const root of roots)
    for (const p of walk(root)) {
      if (/[\\/]memory[\\/]/.test(p)) continue;
      const st = statSync(p);
      if (st.mtimeMs > cutoff) continue;
      n.packed++;
      n.bytes += st.size;
      if (dry) continue;
      const data = Bun.zstdCompressSync(await Bun.file(p).bytes(), {
        level: 19,
      });
      put.run(relative(H, p), Math.round(st.mtimeMs), st.size, data);
      rmSync(p);
    }
  if (!dry) blobs.run("VACUUM");
  blobs.close();
  ctx.close();
  console.log(
    `${dry ? "dry-run " : ""}absorbed memory=${n.memory} history=${n.history} sessions=${n.session} agy=${n.agy}; packed ${n.packed} files (${(n.bytes / 1e6).toFixed(1)} MB) older than ${values.days} d into ${join(home, "brain.sqlite")}`,
  );
}

const BEGIN = "<!-- ai-os brain sync: begin -->";
const END = "<!-- ai-os brain sync: end -->";

async function readJson(p: string): Promise<any> {
  const f = Bun.file(p);
  return (await f.exists()) ? f.json() : {};
}

async function sync() {
  const global = await Bun.file(join(CLAUDE, "CLAUDE.md")).text();
  const idx = join(CLAUDE, "projects", "C--src", "memory", "MEMORY.md");
  const mem = existsSync(idx) ? await Bun.file(idx).text() : "";
  const block = `${BEGIN}\n# Shared directives (from ~/.claude/CLAUDE.md, synced by ai-os brain)\n\n${global.trim()}\n\n## Memory index (~/.claude/projects/C--src/memory)\n\n${mem.trim()}\n${END}`;
  const gp = join(GEMINI, "GEMINI.md");
  const cur = existsSync(gp) ? await Bun.file(gp).text() : "";
  const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
  const next = re.test(cur)
    ? cur.replace(re, block)
    : `${cur.trimEnd()}\n\n${block}\n`;

  // Same NHITL posture on both sides: Claude bypassPermissions, agy auto-approve.
  const cs = join(CLAUDE, "settings.json");
  const c = await readJson(cs);
  c.permissions = { ...c.permissions, defaultMode: "bypassPermissions" };
  c.skipDangerousModePermissionPrompt = true;
  // agy reads ~/.gemini/antigravity-cli/settings.json: toolPermission is its approval switch.
  const gs = join(GEMINI, "antigravity-cli", "settings.json");
  const g = await readJson(gs);
  g.toolPermission = "always-proceed";
  g.artifactReviewPolicy = "always-proceed";
  g.allowNonWorkspaceAccess = true;
  g.trustedWorkspaces = [
    ...new Set([...(g.trustedWorkspaces ?? []), "C:\\src"]),
  ].filter((w: string) => w.length > 3 && existsSync(w));

  if (dry) return console.log(`dry-run: would write ${gp}, ${cs}, ${gs}`);
  await Bun.write(gp, next);
  await Bun.write(cs, `${JSON.stringify(c, null, 2)}\n`);
  await Bun.write(gs, `${JSON.stringify(g, null, 2)}\n`);
  console.log(`synced ${gp}, ${cs}, ${gs}`);
}

async function restore(path: string) {
  const db = new Database(join(home, "brain.sqlite"), { readonly: true });
  const rows = db
    .query("SELECT path, data FROM blobs WHERE path LIKE ?")
    .all(`%${path.replaceAll("/", "\\")}%`) as {
    path: string;
    data: Uint8Array;
  }[];
  for (const r of rows) {
    await Bun.write(join(H, r.path), Bun.zstdDecompressSync(r.data));
    console.log(`restored ${r.path}`);
  }
  if (!rows.length) process.exitCode = 1;
}

const cmd = positionals[0];
if (cmd === "absorb") await absorb();
else if (cmd === "sync") await sync();
else if (cmd === "restore" && positionals[1]) await restore(positionals[1]);
else {
  console.error(
    "usage: ai-os brain <absorb|sync|restore <path>> [--days 7] [--dry-run] [--home ~/.agent]",
  );
  process.exitCode = 2;
}
