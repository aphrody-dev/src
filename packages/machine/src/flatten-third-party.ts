// Met third_party/ à plat (modèle Chromium : third_party/<nom>, un dossier par dépôt amont) et déduplique.
// Source de vérité : src.lock.json (champ upstream_url si fork, sinon url). third_party/ n'est pas suivi par git :
// les dossiers sont matérialisés depuis src.lock.json, régénéré ensuite par `ay lock --lock-only`.
// Usage (racine du dépôt) : bun packages/machine/src/flatten-third-party.ts           -> simulation, plan dans var/
//                           bun packages/machine/src/flatten-third-party.ts --apply   -> applique
// Sûreté : refuse si un doublon à supprimer a des modifications ou des commits non poussés ; déplacement en deux
// temps (transit third_party/.flatten) pour libérer les dossiers de catégorie qui portent le nom d'un dépôt.
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { mkdir, rename, rm, rmdir } from "node:fs/promises";
import { join } from "node:path";

const repo = join(import.meta.dir, "..", "..", "..");
const apply = process.argv.includes("--apply");
const lock = await Bun.file(join(repo, "src.lock.json")).json();
const norm = (u: string | undefined) =>
  (u ?? "")
    .toLowerCase()
    .replace(/\.git$/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\/$/, "");

// Noms imposés quand le nom amont est générique ou déjà pris ; justification à côté.
const RENAME: Record<string, string> = {
  "https://github.com/cloudflare/ai": "cloudflare-ai", // « ai » seul est trop générique
  "https://github.com/vercel/ai": "vercel-ai", // idem (AI SDK de Vercel)
  "https://android.googlesource.com/kernel/build": "kleaf", // nom officiel du projet (Kleaf), nom du dossier actuel
  "https://android.googlesource.com/platform/manifest": "aosp-manifest", // « manifest » seul est trop générique
};

// Identité d'un dépôt = projet racine du réseau de forks GitHub (API live, cache var/flatten-third-party.github.json) :
// nos forks (aphrody-labs, aphrody-dev) et les forks tiers sans commit d'avance rejoignent leur racine ;
// un fork tiers qui porte des commits reste un dépôt distinct.
const OURS = new Set(["aphrody-labs", "aphrody-dev"]);
type Gh = { fork: boolean; source: string; ahead: number };
const cacheFile = join(repo, "var", "flatten-third-party.github.json");
const cache: Record<string, Gh> = existsSync(cacheFile)
  ? await Bun.file(cacheFile).json()
  : {};
const ghApi = async (...a: string[]) => {
  const p = Bun.spawn(["gh", "api", ...a], {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });
  const out = (await new Response(p.stdout).text()).trim();
  if ((await p.exited) !== 0)
    throw new Error(
      `gh api ${a[0]} : ${(await new Response(p.stderr).text()).trim()}`,
    );
  return out;
};
const resolve = async (name: string): Promise<Gh> => {
  if (cache[name]) return cache[name];
  const [fork, source, srcBranch, branch] = (
    await ghApi(
      `repos/${name}`,
      "-q",
      '[.fork, (.source.full_name // ""), (.source.default_branch // ""), .default_branch] | @tsv',
    )
  ).split("\t");
  const r: Gh = {
    fork: fork === "true",
    source: (fork === "true" ? source! : name).toLowerCase(),
    ahead: 0,
  };
  // ahead = -1 : historique sans ancêtre commun avec la racine (réécrit) -> dépôt distinct.
  if (r.fork)
    r.ahead = await ghApi(
      `repos/${source}/compare/${srcBranch}...${name.split("/")[0]}:${branch}`,
      "-q",
      ".ahead_by",
    ).then(Number, () => -1);
  return (cache[name] = r);
};

type Entry = { path: string; url: string; up: string; ahead: number };
const raw = Object.entries<Record<string, string>>(lock.repositories)
  .filter(([p]) => p.startsWith("third_party/"))
  .map(([p, v]) => ({
    path: p,
    url: norm(v.url),
    declared: norm(v.upstream_url || v.url),
  }));
const all: Entry[] = [];
for (let i = 0; i < raw.length; i += 12)
  all.push(
    ...(await Promise.all(
      raw.slice(i, i + 12).map(async (e) => {
        const name = e.url.match(
          /^https:\/\/github\.com\/([^/]+\/[^/]+)$/,
        )?.[1];
        if (!name)
          return { path: e.path, url: e.url, up: e.declared, ahead: 0 };
        const g = await resolve(name);
        if (!g.fork)
          return { path: e.path, url: e.url, up: e.declared, ahead: 0 };
        const joins =
          g.fork && (OURS.has(name.split("/")[0]!) || g.ahead === 0);
        return {
          path: e.path,
          url: e.url,
          up: joins ? `https://github.com/${g.source}` : e.url,
          ahead: g.ahead,
        };
      }),
    )),
  );
await mkdir(join(repo, "var"), { recursive: true });
await Bun.write(cacheFile, JSON.stringify(cache, null, 1));

// Racines gérées par un outil de synchronisation (gclient, repo) : unité indivisible, jamais éclatée.
const top = (p: string) => p.split("/").slice(0, 2).join("/");
const unitRoots = new Set(
  all
    .map((e) => top(e.path))
    .filter(
      (t) =>
        existsSync(join(repo, t, ".gclient")) ||
        existsSync(join(repo, t, ".repo")),
    ),
);
const entries = all.filter((e) => !unitRoots.has(top(e.path)));

const groups = new Map<string, Entry[]>();
for (const e of entries) groups.set(e.up, [...(groups.get(e.up) ?? []), e]);

const leaf = (u: string) => u.split("/").pop() ?? u;
const owner = (u: string) => u.split("/").slice(-2, -1)[0] ?? "x";
const flat = (p: string) => p.split("/").length === 2;
// Nom = dernier segment du chemin actuel (choix humain : kleaf, pkg-linux, nom du fork), préfixe « owner_ » retiré ;
// un nom générique garde son propriétaire (lightpanda-io-browser, modelcontextprotocol-rust-sdk).
const GENERIC = new Set([
  "ai",
  "spec",
  "cts",
  "content",
  "desktop",
  "agents",
  "skills",
  "servers",
  "server",
  "browser",
  "build",
  "manifest",
  "packages",
  "core",
  "cli",
  "docs",
  "sdk",
  "llm",
  "toml",
  "web",
  "app",
  "api",
  "tools",
  "utils",
  "lib",
  "src",
]);
const generic = (n: string) =>
  GENERIC.has(n.toLowerCase()) ||
  /^(rust|typescript|ts|python|js|go|java|csharp|dotnet|swift|kotlin|ruby|php)-sdk$/i.test(
    n,
  );
const pick = (path: string, up: string) => {
  const base = path.split("/").pop()!;
  const own = owner(up);
  const stripped = base.toLowerCase().startsWith(`${own}_`)
    ? base.slice(own.length + 1)
    : base;
  return generic(stripped) ? `${own}-${stripped}` : stripped;
};
const taken = new Map<string, string>(); // nom (minuscule) -> upstream
for (const e of entries)
  if (flat(e.path)) taken.set(e.path.split("/")[1]!.toLowerCase(), e.up);
for (const u of unitRoots) taken.set(u.split("/")[1]!.toLowerCase(), u);

type Step = { up: string; from: string; to: string; drop: string[] };
const steps: Step[] = [];
for (const [up, rs] of groups) {
  const keep =
    rs.find((r) => flat(r.path)) ??
    rs.find((r) => r.path.includes("/aphrody-labs/")) ??
    rs[0]!;
  let name = flat(keep.path)
    ? keep.path.split("/")[1]!
    : (RENAME[up] ?? pick(keep.path, up));
  const owned = taken.get(name.toLowerCase());
  if (!flat(keep.path) && owned && owned !== up)
    name = `${owner(up)}-${keep.path
      .split("/")
      .pop()!
      .replace(/^[^_]+_/, "")}`;
  if (
    !flat(keep.path) &&
    taken.has(name.toLowerCase()) &&
    taken.get(name.toLowerCase()) !== up
  )
    throw new Error(`nom ambigu pour ${up} : ${name}`);
  taken.set(name.toLowerCase(), up);
  steps.push({
    up,
    from: keep.path,
    to: `third_party/${name}`,
    drop: rs.filter((r) => r !== keep).map((r) => r.path),
  });
}

const moves = steps.filter((s) => s.from !== s.to);
// Un doublon qui porte des commits absents de la racine ne peut pas être supprimé sans perte : refus.
const byPath = new Map(entries.map((e) => [e.path, e]));
const divergent = steps.flatMap((s) =>
  s.drop
    .filter((d) => (byPath.get(d)?.ahead ?? 0) !== 0)
    .map((d) => `${d} (+${byPath.get(d)!.ahead} commits) vs ${s.to}`),
);
const drops = steps.flatMap((s) => s.drop.map((d) => ({ d, keep: s.to })));
const mapping = [
  ...moves.map((m) => [m.from, m.to] as const),
  ...drops.map((x) => [x.d, x.keep] as const),
].sort((a, b) => b[0].length - a[0].length);

// Dossiers de catégorie : contenu restant après départ des dépôts (fichiers isolés -> var/, conservés).
const sources = new Set([
  ...moves.map((m) => m.from),
  ...drops.map((x) => x.d),
]);
const cats = [...new Set([...sources].filter((s) => !flat(s)).map(top))];
const loose: string[] = []; // fichiers non suivis -> var/third_party-loose/
const links: string[] = []; // jonctions/liens (interdits) : retirés, la cible n'est pas touchée
const empties: string[] = []; // dossiers vides non verrouillés
const blocked: string[] = []; // dossiers réels non verrouillés : refus
const scan = (dir: string) => {
  for (const n of readdirSync(join(repo, dir))) {
    const p = `${dir}/${n}`;
    if (sources.has(p)) continue;
    if ([...sources].some((s) => s.startsWith(`${p}/`))) scan(p);
    else {
      const st = lstatSync(join(repo, p));
      if (st.isSymbolicLink()) links.push(p);
      else if (st.isFile()) loose.push(p);
      else if (readdirSync(join(repo, p)).length === 0) empties.push(p);
      else blocked.push(p);
    }
  }
};
for (const c of cats) if (existsSync(join(repo, c))) scan(c);

// Collisions réelles : cible occupée par autre chose qu'une source déplacée ou une catégorie vidée.
const emptied = new Set(
  cats.filter((c) => !blocked.some((b) => b.startsWith(`${c}/`))),
);
const collisions = moves.filter(
  (m) =>
    existsSync(join(repo, m.to)) && !sources.has(m.to) && !emptied.has(m.to),
);

// Doublons : aucun travail local ne doit être perdu.
const git = (cwd: string, ...a: string[]) =>
  Bun.spawnSync(["git", ...a], { cwd })
    .stdout.toString()
    .trim();
const dirty = drops
  .map((x) => join(repo, x.d))
  .filter(
    (p) =>
      existsSync(join(p, ".git")) &&
      (git(p, "status", "--porcelain") ||
        git(p, "log", "--branches", "--not", "--remotes", "--oneline")),
  );

const grep = Bun.spawnSync(
  [
    "git",
    "grep",
    "--recurse-submodules",
    "-l",
    "-F",
    ...mapping.flatMap(([o]) => ["-e", `${o}/`]),
    "--",
    ".",
    ":!third_party",
    ":!src.lock.json",
  ],
  { cwd: repo },
);
const files = grep.stdout.toString().split("\n").filter(Boolean);

const plan = {
  date: new Date().toISOString(),
  unitRoots: [...unitRoots],
  moves,
  drops,
  loose,
  links,
  empties,
  blocked,
  collisions,
  dirty,
  divergent,
  files,
};
await mkdir(join(repo, "var"), { recursive: true });
await Bun.write(
  join(repo, "var", "flatten-third-party.plan.json"),
  JSON.stringify(plan, null, 1),
);
console.log(
  `dépôts: ${all.length} (unités indivisibles: ${[...unitRoots].join(", ") || "aucune"}) | amonts: ${steps.length} | déplacements: ${moves.length} | doublons: ${drops.length} | fichiers isolés -> var/: ${loose.length} | jonctions retirées: ${links.length} | dossiers vides: ${empties.length} | références à réécrire: ${files.length}`,
);
for (const x of drops) console.log(`  doublon ${x.d} -> garde ${x.keep}`);
for (const l of links)
  console.log(`  jonction ${l} (retirée, cible conservée)`);
for (const e of empties) console.log(`  dossier vide ${e}`);
for (const f of loose) console.log(`  fichier ${f} -> var/third_party-loose/`);
for (const c of collisions) console.log(`  COLLISION ${c.from} -> ${c.to}`);
for (const b of blocked)
  console.log(`  BLOQUÉ ${b} (dossier non verrouillé dans src.lock.json)`);
for (const d of dirty) console.log(`  TRAVAIL LOCAL dans le doublon ${d}`);
for (const d of divergent) console.log(`  FORK DIVERGENT ${d}`);
if (collisions.length || blocked.length || dirty.length || divergent.length)
  throw new Error(
    "plan refusé : rien n'est appliqué (détail dans var/flatten-third-party.plan.json)",
  );
if (!apply) {
  console.log(
    "  plan complet : var/flatten-third-party.plan.json — relancer avec --apply",
  );
  process.exit(0);
}

// 1. fichiers isolés -> var/third_party-loose/<chemin>
for (const f of loose) {
  const dst = join(
    repo,
    "var",
    "third_party-loose",
    f.slice("third_party/".length),
  );
  await mkdir(join(dst, ".."), { recursive: true });
  await rename(join(repo, f), dst);
}
// 1b. jonctions et dossiers vides : rmdir ne supprime que le lien (jamais la cible) et échoue si non vide
for (const d of [...links, ...empties]) await rmdir(join(repo, d));
// 2. doublons supprimés (vérifiés propres et poussés)
for (const x of drops)
  await rm(join(repo, x.d), { recursive: true, force: true });
// 3. transit
const stage = join(repo, "third_party", ".flatten");
await mkdir(stage, { recursive: true });
for (const m of moves)
  await rename(
    join(repo, m.from),
    join(stage, m.to.slice("third_party/".length)),
  );
// 4. dossiers de catégorie vides (du plus profond au moins profond)
// Ancêtres des sources sous third_party/<catégorie>[/…] ; rmdir échoue si un dossier n'est pas vide (garde-fou).
const ancestors = (p: string) => {
  const s = p.split("/");
  return s.slice(1, -1).map((_, i) => s.slice(0, 2 + i).join("/"));
};
const emptyDirs = [
  ...new Set([...sources].filter((s) => !flat(s)).flatMap(ancestors)),
];
for (const d of emptyDirs.sort((a, b) => b.length - a.length))
  if (existsSync(join(repo, d))) await rmdir(join(repo, d));
// 5. destination finale
for (const m of moves)
  await rename(
    join(stage, m.to.slice("third_party/".length)),
    join(repo, m.to),
  );
await rmdir(stage);
// 6. références
let rewritten = 0;
for (const f of files) {
  const abs = join(repo, f);
  const before = await Bun.file(abs).text();
  let text = before;
  for (const [o, n] of mapping) text = text.split(`${o}/`).join(`${n}/`);
  if (text !== before) {
    await Bun.write(abs, text);
    rewritten++;
  }
}
await Bun.write(
  join(repo, "var", "flatten-third-party.json"),
  JSON.stringify(
    { ...plan, applied: new Date().toISOString(), rewritten },
    null,
    1,
  ),
);
console.log(
  `appliqué : ${moves.length} déplacements, ${drops.length} doublons, ${loose.length} fichiers -> var/, ${rewritten} références. Ensuite : ay lock --lock-only`,
);
