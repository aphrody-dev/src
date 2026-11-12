/**
 * Aphrody Store SQLite Declarative State Engine
 * Package index used by the catalog search
 * Built on pure bun:sqlite with zero external npm dependencies
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { StorePackage } from "./types";

export class StoreDatabase {
  private db: Database;

  constructor(dbPath?: string) {
    if (dbPath && dbPath !== ":memory:") {
      const dir = join(dbPath, "..");
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      this.db = new Database(dbPath);
    } else {
      this.db = new Database(":memory:");
    }
    this.initSchema();
  }

  private initSchema(): void {
    this.db.run("PRAGMA synchronous = NORMAL;");
    this.db.run("PRAGMA journal_mode = WAL;");

    // 1. Packages Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ecosystem TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        author TEXT,
        repo_url TEXT,
        category TEXT,
        stars INTEGER DEFAULT 0,
        install_cmd TEXT,
        run_cmd TEXT,
        sandboxed INTEGER DEFAULT 0,
        tags TEXT,
        created_at TEXT
      );
    `);

    // 2. Fast lookup indices
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_pkg_name ON packages(name);`);
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_pkg_eco ON packages(ecosystem);`,
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_pkg_cat ON packages(category);`,
    );
  }

  public upsertPackage(pkg: StorePackage): void {
    const stmt = this.db.prepare(`
      INSERT INTO packages (
        id, name, ecosystem, version, description, author,
        repo_url, category, stars, install_cmd, run_cmd, sandboxed, tags, created_at
      ) VALUES (
        $id, $name, $ecosystem, $version, $description, $author,
        $repo_url, $category, $stars, $install_cmd, $run_cmd, $sandboxed, $tags, $created_at
      )
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        description = excluded.description,
        stars = excluded.stars,
        install_cmd = excluded.install_cmd,
        run_cmd = excluded.run_cmd,
        sandboxed = excluded.sandboxed,
        tags = excluded.tags;
    `);

    stmt.run({
      $id: pkg.id,
      $name: pkg.name,
      $ecosystem: pkg.ecosystem,
      $version: pkg.version || "1.0.0",
      $description: pkg.description || "",
      $author: pkg.author || "",
      $repo_url: pkg.repoUrl || "",
      $category: pkg.category || "General",
      $stars: pkg.stars || 0,
      $install_cmd: pkg.installCmd || "",
      $run_cmd: pkg.runCmd || "",
      $sandboxed: pkg.sandboxed ? 1 : 0,
      $tags: JSON.stringify(pkg.tags || []),
      $created_at: new Date().toISOString(),
    });
  }

  public upsertBatch(packages: StorePackage[]): void {
    const insertTransaction = this.db.transaction((pkgs: StorePackage[]) => {
      for (const p of pkgs) {
        this.upsertPackage(p);
      }
    });
    insertTransaction(packages);
  }

  public searchPackages(
    query: string,
    ecosystem?: string,
    limit = 50,
  ): StorePackage[] {
    let sql = "SELECT * FROM packages WHERE 1=1";
    const params: Record<string, any> = { $limit: limit };

    if (ecosystem && ecosystem !== "all") {
      sql += " AND ecosystem = $ecosystem";
      params.$ecosystem = ecosystem;
    }

    if (query && query.trim() !== "") {
      sql += " AND (name LIKE $q OR description LIKE $q OR category LIKE $q)";
      params.$q = `%${query.trim()}%`;
    }

    sql += " ORDER BY stars DESC, name ASC LIMIT $limit";

    const rows = this.db.query(sql).all(params) as any[];
    return rows.map((r) => this.rowToPackage(r));
  }

  private rowToPackage(r: any): StorePackage {
    return {
      id: r.id,
      name: r.name,
      ecosystem: r.ecosystem,
      version: r.version,
      description: r.description,
      author: r.author,
      repoUrl: r.repo_url,
      category: r.category,
      stars: r.stars,
      installCmd: r.install_cmd,
      runCmd: r.run_cmd,
      sandboxed: Boolean(r.sandboxed),
      tags: r.tags ? JSON.parse(r.tags) : [],
    };
  }

  public close(): void {
    this.db.close();
  }
}
