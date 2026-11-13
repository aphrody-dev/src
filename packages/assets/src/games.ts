// Game index from public APIs: Steam Store (featured categories, top sellers, appdetails in 5 locales) and the
// Epic free-games feed. SQLite via bun:sqlite; cover art is hotlinked from the vendor CDN, never redistributed.
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export const gamesDb = (root: string) =>
  join(root, "packages", "assets", "data", "games.sqlite");
export const gamesJson = (root: string) =>
  join(root, "apps", "aphrody", "src", "data", "games.json");

const LANGS: [string, string][] = [
  ["en", "english"],
  ["fr", "french"],
  ["zh-CN", "schinese"],
  ["ja", "japanese"],
  ["es", "spanish"],
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const getJson = async (url: string): Promise<any> => {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 AphrodyAssets/1.0" },
      signal: AbortSignal.timeout(20000),
    }).catch(() => null);
    if (r?.ok) return r.json().catch(() => null);
    await sleep(3000 * (i + 1));
  }
  return null;
};

export function open(root: string): Database {
  mkdirSync(dirname(gamesDb(root)), { recursive: true });
  const db = new Database(gamesDb(root));
  db.run(`CREATE TABLE IF NOT EXISTS games(
    store TEXT NOT NULL, ext_id TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, cover TEXT,
    platforms TEXT NOT NULL DEFAULT '', genres TEXT NOT NULL DEFAULT '', free INTEGER NOT NULL DEFAULT 0,
    developer TEXT, release TEXT, desc TEXT NOT NULL DEFAULT '{}', synced TEXT NOT NULL,
    PRIMARY KEY(store, ext_id))`);
  db.run(
    `CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts5(name, genres, content='games', content_rowid='rowid')`,
  );
  return db;
}

async function steamIds(): Promise<number[]> {
  const ids = new Set<number>();
  const fc = await getJson(
    "https://store.steampowered.com/api/featuredcategories?cc=us&l=english",
  );
  for (const k of Object.keys(fc ?? {}))
    for (const it of fc[k]?.items ?? [])
      if (typeof it.id === "number") ids.add(it.id);
  const top = await getJson(
    "https://store.steampowered.com/search/results/?query&start=0&count=100&filter=topsellers&json=1&cc=us",
  );
  for (const it of top?.items ?? []) {
    const m = String(it.logo ?? "").match(/\/apps\/(\d+)\//);
    if (m) ids.add(Number(m[1]));
  }
  return [...ids];
}

export async function syncSteam(root: string, limit: number): Promise<number> {
  const db = open(root);
  const ids = (await steamIds()).slice(0, limit);
  const put =
    db.prepare(`INSERT OR REPLACE INTO games(store,ext_id,name,url,cover,platforms,genres,free,developer,release,desc,synced)
    VALUES('steam',?,?,?,?,?,?,?,?,?,?,?)`);
  let n = 0;
  for (const id of ids) {
    const desc: Record<string, string> = {};
    let base: any = null;
    for (const [loc, l] of LANGS) {
      const r = await getJson(
        `https://store.steampowered.com/api/appdetails?appids=${id}&cc=us&l=${l}`,
      );
      const d = r?.[id]?.success ? r[id].data : null;
      await sleep(1500);
      if (!d) continue;
      if (loc === "en") base = d;
      desc[loc] = String(d.short_description ?? "")
        .replace(/<[^>]+>/g, "")
        .slice(0, 300);
    }
    if (!base || base.type !== "game") continue;
    const pf = Object.entries(base.platforms ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");
    put.run(
      String(id),
      base.name,
      `https://store.steampowered.com/app/${id}`,
      base.header_image ??
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      pf,
      (base.genres ?? []).map((g: any) => g.description).join(","),
      base.is_free ? 1 : 0,
      (base.developers ?? [])[0] ?? null,
      base.release_date?.date ?? null,
      JSON.stringify(desc),
      new Date().toISOString(),
    );
    n++;
  }
  return n;
}

export async function syncEpic(root: string): Promise<number> {
  const db = open(root);
  const put =
    db.prepare(`INSERT OR REPLACE INTO games(store,ext_id,name,url,cover,platforms,genres,free,developer,release,desc,synced)
    VALUES('epic',?,?,?,?,?,?,?,?,?,?,?)`);
  const desc: Record<string, Record<string, string>> = {};
  const rows: Record<string, any> = {};
  for (const [loc] of LANGS) {
    const l = loc === "zh-CN" ? "zh-CN" : loc;
    const r = await getJson(
      `https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=${l}&country=US`,
    );
    for (const e of r?.data?.Catalog?.searchStore?.elements ?? []) {
      rows[e.id] ??= e;
      (desc[e.id] ??= {})[loc] = String(e.description ?? "").slice(0, 300);
    }
  }
  let n = 0;
  for (const [id, e] of Object.entries(rows)) {
    const slug =
      e.productSlug || e.urlSlug || e.catalogNs?.mappings?.[0]?.pageSlug;
    const img =
      (e.keyImages ?? []).find((k: any) => k.type === "OfferImageWide")?.url ??
      (e.keyImages ?? [])[0]?.url ??
      null;
    const free = e.price?.totalPrice?.discountPrice === 0 ? 1 : 0;
    put.run(
      id,
      e.title,
      slug
        ? `https://store.epicgames.com/p/${String(slug).replace(/\/home$/, "")}`
        : "https://store.epicgames.com/free-games",
      img,
      "windows",
      "",
      free,
      e.seller?.name ?? null,
      null,
      JSON.stringify(desc[id] ?? {}),
      new Date().toISOString(),
    );
    n++;
  }
  return n;
}

export async function exportJson(root: string): Promise<number> {
  const db = open(root);
  const rows = db
    .query(
      "SELECT store,ext_id,name,url,cover,platforms,genres,free,developer,release,desc FROM games ORDER BY store, name",
    )
    .all() as any[];
  const out = rows.map((r) => ({
    ...r,
    platforms: r.platforms ? r.platforms.split(",") : [],
    genres: r.genres ? r.genres.split(",") : [],
    free: !!r.free,
    desc: JSON.parse(r.desc),
  }));
  await Bun.write(gamesJson(root), JSON.stringify(out) + "\n");
  db.run("INSERT INTO games_fts(games_fts) VALUES('rebuild')");
  return out.length;
}

export function search(
  root: string,
  q: string,
  limit = 20,
): { store: string; name: string; url: string; genres: string }[] {
  const db = open(root);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  return db
    .query(
      "SELECT store,name,url,genres FROM games WHERE name LIKE ?1 OR genres LIKE ?1 ORDER BY name LIMIT ?2",
    )
    .all(like, limit) as any;
}
