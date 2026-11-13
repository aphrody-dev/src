// Scheduler + heartbeat. Semantics from OpenClaw heartbeat (periodic turn driven by HEARTBEAT.md, silent when the model
// answers HEARTBEAT_OK) and Hermes cron/ (persisted jobs with interval or one-shot time). MIT notices in NOTICE.
// Local loop on Windows/Linux; durable variants map to Vercel Workflow / Cloudflare Agents schedule (roadmap).
import { Database } from "bun:sqlite";
import type { LanguageModel } from "ai";
import { join } from "node:path";
import { run } from "./agent";

export type Job = { id: number; name: string; task: string; every_ms: number | null; next_at: number; enabled: number };

export const HEARTBEAT_OK = "HEARTBEAT_OK";

const UNITS: Record<string, number> = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
export function parseEvery(s: string): number {
  const m = s.match(/^(\d+)\s*([smhd])$/);
  if (!m) throw new Error(`bad interval '${s}' (use 30s, 15m, 1h, 1d)`);
  return Number(m[1]) * UNITS[m[2]!]!;
}

export class Scheduler {
  readonly db: Database;
  constructor(path: string) {
    this.db = new Database(path, { create: true });
    this.db.run("PRAGMA journal_mode=WAL");
    this.db.run(
      "CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY, name TEXT NOT NULL, task TEXT NOT NULL, every_ms INTEGER, next_at INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1)",
    );
    this.db.run(
      "CREATE TABLE IF NOT EXISTS job_runs(id INTEGER PRIMARY KEY, job_id INTEGER, at INTEGER, ok INTEGER, output TEXT)",
    );
  }
  add(name: string, task: string, opts: { everyMs?: number; at?: number }, now = Date.now()): number {
    const next = opts.at ?? now + (opts.everyMs ?? 0);
    return Number(
      this.db.query("INSERT INTO jobs(name, task, every_ms, next_at) VALUES (?, ?, ?, ?)").run(name, task, opts.everyMs ?? null, next)
        .lastInsertRowid,
    );
  }
  list(): Job[] {
    return this.db.query<Job, []>("SELECT * FROM jobs ORDER BY next_at").all();
  }
  remove(id: number) {
    this.db.query("DELETE FROM jobs WHERE id = ?").run(id);
  }
  due(now = Date.now()): Job[] {
    return this.db.query<Job, [number]>("SELECT * FROM jobs WHERE enabled = 1 AND next_at <= ? ORDER BY next_at").all(now);
  }
  complete(job: Job, ok: boolean, output: string, now = Date.now()) {
    this.db.query("INSERT INTO job_runs(job_id, at, ok, output) VALUES (?, ?, ?, ?)").run(job.id, now, ok ? 1 : 0, output.slice(0, 8000));
    if (job.every_ms) this.db.query("UPDATE jobs SET next_at = ? WHERE id = ?").run(now + job.every_ms, job.id);
    else this.db.query("UPDATE jobs SET enabled = 0 WHERE id = ?").run(job.id);
  }
  close() {
    this.db.close();
  }
}

export type HeartbeatOptions = {
  home: string;
  cwd: string;
  model: LanguageModel;
  intervalMs?: number;
  once?: boolean;
  signal?: AbortSignal;
  onEvent?: (e: { kind: "job" | "heartbeat"; name: string; ok: boolean; text: string }) => void;
};

/** One tick: run due jobs, then the HEARTBEAT.md checklist if present. */
export async function tick(o: HeartbeatOptions, now = Date.now()) {
  const sched = new Scheduler(join(o.home, "scheduler.sqlite"));
  try {
    for (const job of sched.due(now)) {
      try {
        const r = await run({ task: job.task, model: o.model, home: o.home, cwd: o.cwd });
        sched.complete(job, true, r.text, now);
        o.onEvent?.({ kind: "job", name: job.name, ok: true, text: r.text });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        sched.complete(job, false, msg, now);
        o.onEvent?.({ kind: "job", name: job.name, ok: false, text: msg });
      }
    }
  } finally {
    sched.close();
  }
  const hb = Bun.file(join(o.home, "HEARTBEAT.md"));
  if (await hb.exists()) {
    const checklist = (await hb.text()).trim();
    if (checklist) {
      const r = await run({
        task: `Heartbeat. Go through this checklist and act on anything that needs it. If nothing needs attention, reply exactly ${HEARTBEAT_OK}.\n\n${checklist}`,
        model: o.model,
        home: o.home,
        cwd: o.cwd,
      });
      if (r.text.trim() !== HEARTBEAT_OK) o.onEvent?.({ kind: "heartbeat", name: "HEARTBEAT.md", ok: true, text: r.text });
    }
  }
}

export async function heartbeat(o: HeartbeatOptions) {
  const interval = o.intervalMs ?? 30 * 60_000;
  do {
    await tick(o);
    if (o.once) break;
    await Bun.sleep(interval);
  } while (!o.signal?.aborted);
}
