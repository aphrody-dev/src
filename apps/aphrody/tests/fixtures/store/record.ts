// Records the real upstream responses the store driver tests replay.
// Run: bun tests/fixtures/store/record.ts   (needs network; GITHUB_TOKEN optional, never written)
import { Database } from "bun:sqlite";
import { writeFileSync } from "fs";
import { join } from "path";
import { githubHeaders, USER_AGENT } from "../../../src/store/http";
import { GAMES_DB } from "../../../src/store/drivers/games";
import { unzipEntry } from "../../../src/store/drivers/winget";

const dir = import.meta.dir;
const H = { "user-agent": USER_AGENT };
const get = async (u: string, init: RequestInit = {}) => {
  const r = await fetch(u, {
    ...init,
    headers: { ...H, ...(init.headers as object) },
  });
  if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`);
  return r;
};
const save = (name: string, body: unknown) =>
  writeFileSync(
    join(dir, name),
    typeof body === "string" ? body : JSON.stringify(body, null, 1) + "\n",
  );

const npm = await (
  await get("https://registry.npmjs.org/-/v1/search?text=hono&size=3")
).json();
save("npm.json", npm);
const crates = (await (
  await get("https://crates.io/api/v1/crates?q=bevy&per_page=3")
).json()) as any;
save("crates.json", { crates: crates.crates });
const gh = (await (
  await get(
    "https://api.github.com/search/repositories?q=ripgrep&sort=stars&per_page=3",
    { headers: githubHeaders({ GITHUB_TOKEN: process.env.GITHUB_TOKEN }) },
  )
).json()) as any;
save("github.json", {
  total_count: gh.total_count,
  items: gh.items.map((i: any) => ({
    full_name: i.full_name,
    description: i.description,
    stargazers_count: i.stargazers_count,
    html_url: i.html_url,
    clone_url: i.clone_url,
    language: i.language,
    topics: i.topics,
    license: i.license && { spdx_id: i.license.spdx_id },
    owner: { login: i.owner.login },
  })),
});
const aur = (await (
  await get("https://aur.archlinux.org/rpc/v5/search/neovim?by=name-desc")
).json()) as any;
save("aur.json", { ...aur, results: aur.results.slice(0, 5) });
const nix = (await (
  await get("https://search.devbox.sh/v2/search?q=ripgrep")
).json()) as any;
save("nix-search.json", { ...nix, results: nix.results.slice(0, 3) });
const nixPkg = (await (
  await get("https://search.devbox.sh/v2/pkg?name=ripgrep")
).json()) as any;
save("nix-pkg.json", {
  name: nixPkg.name,
  summary: nixPkg.summary,
  homepage_url: nixPkg.homepage_url,
  license: nixPkg.license,
  releases: nixPkg.releases
    .slice(0, 1)
    .map((r: any) => ({ version: r.version })),
});
const fp = (await (
  await get("https://flathub.org/api/v2/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "firefox" }),
  })
).json()) as any;
save("flathub.json", {
  hits: fp.hits.slice(0, 3).map((h: any) => ({ ...h, description: undefined })),
});
save(
  "fdroid.html",
  await (await get("https://search.f-droid.org/?q=firefox&lang=en")).text(),
);
save(
  "chocolatey.xml",
  await (
    await get(
      `https://community.chocolatey.org/api/v2/Search()?searchTerm='git'&targetFramework=''&includePrerelease=false&$filter=IsLatestVersion&$top=2`,
    )
  ).text(),
);
const msix = new Uint8Array(
  await (
    await get("https://cdn.winget.microsoft.com/cache/source2.msix")
  ).arrayBuffer(),
);
const wdbBytes = await unzipEntry(msix, "Public/index.db");
const wdbPath = "winget-index.tmp.db";
await Bun.write(wdbPath, wdbBytes);
const wdb = new Database(wdbPath, { readonly: true });
save(
  "winget-rows.json",
  wdb
    .query(
      "SELECT id, name, moniker, latest_version FROM packages WHERE id LIKE '%ripgrep%' OR name LIKE '%ripgrep%'",
    )
    .all(),
);
const gdb = new Database(GAMES_DB, { readonly: true });
save(
  "games-rows.json",
  gdb
    .query(
      "SELECT store, ext_id, name, url, cover, genres, free, developer, desc FROM games WHERE name LIKE 'Alien%' OR name LIKE 'Portal%' LIMIT 6",
    )
    .all(),
);
console.log("recorded");
