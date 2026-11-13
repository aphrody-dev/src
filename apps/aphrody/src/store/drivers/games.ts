/** Steam and Epic: the game index (packages/assets/data/games.sqlite, FTS5), else apps/aphrody/src/data/games.json. */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { LIMIT, SourceError, type DriverContext } from "../http";
import type { StorePackage } from "../types";

interface GameRow {
  store: string;
  ext_id: string;
  name: string;
  url: string;
  cover: string | null;
  genres: string[] | string;
  free: boolean | number;
  developer: string | null;
  desc: Record<string, string> | string;
}

const HERE = import.meta.dir;
export const GAMES_DB = join(
  HERE,
  "..",
  "..",
  "..",
  "..",
  "..",
  "packages",
  "assets",
  "data",
  "games.sqlite",
);
export const GAMES_JSON = join(HERE, "..", "..", "data", "games.json");

export function toPackage(g: GameRow): StorePackage {
  const desc = typeof g.desc === "string" ? JSON.parse(g.desc || "{}") : g.desc;
  const genres = Array.isArray(g.genres)
    ? g.genres
    : String(g.genres)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return {
    id: `${g.store}-${g.ext_id}`,
    name: g.name,
    ecosystem: g.store as "steam" | "epic",
    description: desc.en ?? Object.values(desc)[0] ?? "",
    author: g.developer ?? undefined,
    url: g.url,
    image: g.cover ?? undefined,
    installCmd: "",
    tags: [...genres, ...(g.free ? ["free"] : [])],
  };
}

const tokens = (q: string) => q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

export function searchGamesSqlite(
  db: Database,
  query: string,
  store?: "steam" | "epic",
): StorePackage[] {
  const t = tokens(query);
  if (!t.length) return [];
  const match = t.map((x) => `"${x}"*`).join(" ");
  const rows = db
    .query(
      `SELECT g.* FROM games g JOIN games_fts f ON f.rowid = g.rowid
       WHERE games_fts MATCH $m ${store ? "AND g.store = $s" : ""}
       ORDER BY rank LIMIT ${LIMIT}`,
    )
    .all(store ? { $m: match, $s: store } : { $m: match }) as GameRow[];
  return rows.map(toPackage);
}

export function searchGamesJson(
  rows: GameRow[],
  query: string,
  store?: "steam" | "epic",
): StorePackage[] {
  const t = tokens(query);
  if (!t.length) return [];
  return rows
    .filter((g) => !store || g.store === store)
    .filter((g) => {
      const hay =
        `${g.name} ${Array.isArray(g.genres) ? g.genres.join(" ") : g.genres}`.toLowerCase();
      return t.every((x) => hay.includes(x));
    })
    .slice(0, LIMIT)
    .map(toPackage);
}

export async function searchGames(
  query: string,
  store: "steam" | "epic" | undefined,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const dbPath = ctx.env.GAMES_DB || GAMES_DB;
  if (existsSync(dbPath)) {
    const db = new Database(dbPath, { readonly: true });
    try {
      return searchGamesSqlite(db, query, store);
    } finally {
      db.close();
    }
  }
  if (existsSync(GAMES_JSON))
    return searchGamesJson(
      JSON.parse(readFileSync(GAMES_JSON, "utf8")),
      query,
      store,
    );
  throw new SourceError(
    "source_missing",
    "neither games.sqlite nor games.json is present",
  );
}
