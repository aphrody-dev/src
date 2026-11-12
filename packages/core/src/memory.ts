// Persistent memory (semantics of Hermes memory_tool/memory_manager, MIT, Nous Research): bun:sqlite + FTS5.
import { Database } from "bun:sqlite";

export class Memory {
  readonly db: Database;
  constructor(path: string) {
    this.db = new Database(path, { create: true });
    this.db.run("PRAGMA journal_mode=WAL");
    this.db.run(
      "CREATE TABLE IF NOT EXISTS memory(id INTEGER PRIMARY KEY, scope TEXT NOT NULL, content TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')))",
    );
    this.db.run("CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(content, content='memory', content_rowid='id')");
    this.db.run(
      "CREATE TRIGGER IF NOT EXISTS memory_ai AFTER INSERT ON memory BEGIN INSERT INTO memory_fts(rowid, content) VALUES (new.id, new.content); END",
    );
    this.db.run(
      "CREATE TABLE IF NOT EXISTS runs(id INTEGER PRIMARY KEY, task TEXT, result TEXT, steps INTEGER, at TEXT DEFAULT (datetime('now')))",
    );
  }

  add(content: string, scope = "user"): number {
    return Number(this.db.query("INSERT INTO memory(scope, content) VALUES (?, ?)").run(scope, content).lastInsertRowid);
  }

  search(q: string, limit = 8): string[] {
    const terms = q
      .match(/\w+/g)
      ?.map((t) => `"${t}"`)
      .join(" OR ");
    if (!terms) return [];
    return this.db
      .query<{ content: string }, [string, number]>(
        "SELECT m.content FROM memory_fts f JOIN memory m ON m.id = f.rowid WHERE memory_fts MATCH ? ORDER BY rank LIMIT ?",
      )
      .all(terms, limit)
      .map((r) => r.content);
  }

  recent(limit = 8): string[] {
    return this.db
      .query<{ content: string }, [number]>("SELECT content FROM memory ORDER BY id DESC LIMIT ?")
      .all(limit)
      .map((r) => r.content);
  }

  logRun(task: string, result: string, steps: number) {
    this.db.query("INSERT INTO runs(task, result, steps) VALUES (?, ?, ?)").run(task, result, steps);
  }

  close() {
    this.db.close();
  }
}
