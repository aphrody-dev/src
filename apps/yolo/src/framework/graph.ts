// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo AST Module Dependency Graph Engine
 * Uses Bun.Glob + Bun.Transpiler + Bun.CryptoHasher("blake2b256") + bun:sqlite WAL
 * to maintain a deterministic, reproducible module graph of any Bun fullstack app.
 */
import { Database } from "bun:sqlite";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export interface ModuleNodeRecord {
  relPath: string;
  kind: "ts" | "css" | "html" | "json";
  bytes: number;
  lines: number;
  blake3Hash: string;
  exports: string[];
  imports: Array<{ specifier: string; kind: string }>;
  scannedAt: number;
}

export interface ModuleGraphSummary {
  rootDir: string;
  totalModules: number;
  totalBytes: number;
  totalLines: number;
  totalEdges: number;
  scanDurationMs: number;
  modules: ModuleNodeRecord[];
}

export class YoloModuleGraph {
  readonly rootDir: string;
  readonly db: Database;
  private readonly tsTranspiler = new Bun.Transpiler({ loader: "ts" });

  constructor(rootDir: string, dbPath = ":memory:") {
    this.rootDir = rootDir;
    if (dbPath !== ":memory:") {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        rel_path TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        lines INTEGER NOT NULL,
        blake3_hash TEXT NOT NULL,
        exports_json TEXT NOT NULL,
        imports_json TEXT NOT NULL,
        scanned_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS edges (
        from_path TEXT NOT NULL,
        specifier TEXT NOT NULL,
        import_kind TEXT NOT NULL,
        PRIMARY KEY (from_path, specifier)
      );
    `);
  }

  scanProject(): ModuleGraphSummary {
    const t0 = performance.now();
    const glob = new Bun.Glob("**/*.{ts,css,html,json}");
    const discovered: ModuleNodeRecord[] = [];

    for (const rawRel of glob.scanSync({
      cwd: this.rootDir,
      onlyFiles: true,
    })) {
      const relPath = rawRel.replace(/\\/g, "/");
      if (
        relPath.startsWith("dist/") ||
        relPath.startsWith("node_modules/") ||
        relPath.startsWith(".yolo/") ||
        relPath.startsWith(".git/")
      ) {
        continue;
      }

      const absPath = join(this.rootDir, relPath);
      const st = statSync(absPath);
      const source = readFileSync(absPath, "utf8");
      const lines = source.length === 0 ? 0 : source.split(/\r?\n/).length;

      const hasher = new Bun.CryptoHasher("blake2b256");
      hasher.update(source);
      const blake3Hash = hasher.digest("hex");

      const ext = relPath.split(".").pop()?.toLowerCase() ?? "ts";
      const kind = (
        ext === "css" || ext === "html" || ext === "json" ? ext : "ts"
      ) as ModuleNodeRecord["kind"];

      let exportsList: string[] = [];
      let importsList: Array<{ specifier: string; kind: string }> = [];

      if (kind === "ts") {
        try {
          const scanned = this.tsTranspiler.scan(source);
          exportsList = [...scanned.exports];
          importsList = scanned.imports.map((imp) => ({
            specifier: imp.path,
            kind: imp.kind,
          }));
        } catch {
          exportsList = [];
          importsList = [];
        }
      } else if (kind === "html") {
        for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
          if (match[1])
            importsList.push({ specifier: match[1], kind: "asset-ref" });
        }
      }

      discovered.push({
        relPath,
        kind,
        bytes: st.size,
        lines,
        blake3Hash,
        exports: exportsList,
        imports: importsList,
        scannedAt: Date.now(),
      });
    }

    const tx = this.db.transaction((records: ModuleNodeRecord[]) => {
      this.db.exec("DELETE FROM edges;");
      this.db.exec("DELETE FROM modules;");

      const insertMod = this.db.query(
        `INSERT INTO modules (rel_path, kind, bytes, lines, blake3_hash, exports_json, imports_json, scanned_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      );
      const insertEdge = this.db.query(
        `INSERT OR REPLACE INTO edges (from_path, specifier, import_kind) VALUES (?1, ?2, ?3)`,
      );

      for (const rec of records) {
        insertMod.run(
          rec.relPath,
          rec.kind,
          rec.bytes,
          rec.lines,
          rec.blake3Hash,
          JSON.stringify(rec.exports),
          JSON.stringify(rec.imports),
          rec.scannedAt,
        );
        for (const imp of rec.imports) {
          insertEdge.run(rec.relPath, imp.specifier, imp.kind);
        }
      }
    });
    tx(discovered);

    const scanDurationMs = Math.round((performance.now() - t0) * 100) / 100;
    return this.getSummary(scanDurationMs);
  }

  getSummary(scanDurationMs = 0): ModuleGraphSummary {
    const rows = this.db
      .query<
        {
          rel_path: string;
          kind: ModuleNodeRecord["kind"];
          bytes: number;
          lines: number;
          blake3_hash: string;
          exports_json: string;
          imports_json: string;
          scanned_at: number;
        },
        []
      >("SELECT * FROM modules ORDER BY rel_path ASC")
      .all();

    const edgeCountRow = this.db
      .query<{ c: number }, []>("SELECT COUNT(*) AS c FROM edges")
      .get();

    let totalBytes = 0;
    let totalLines = 0;
    const modules: ModuleNodeRecord[] = rows.map((r) => {
      totalBytes += r.bytes;
      totalLines += r.lines;
      return {
        relPath: r.rel_path,
        kind: r.kind,
        bytes: r.bytes,
        lines: r.lines,
        blake3Hash: r.blake3_hash,
        exports: JSON.parse(r.exports_json) as string[],
        imports: JSON.parse(r.imports_json) as Array<{
          specifier: string;
          kind: string;
        }>,
        scannedAt: r.scanned_at,
      };
    });

    return {
      rootDir:
        relative("C:/src", this.rootDir).replace(/\\/g, "/") || this.rootDir,
      totalModules: modules.length,
      totalBytes,
      totalLines,
      totalEdges: edgeCountRow?.c ?? 0,
      scanDurationMs,
      modules,
    };
  }

  close(): void {
    this.db.close();
  }
}
