// Génère gnu-packages.json + tables PACKAGES.md / DISTROS.md à partir des sources brutes (2026-11-12).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { curated, catBySection } from "./curated.ts";

const RAW = process.argv[2];
const OUT = process.argv[3];
const rd = (f: string) => readFileSync(join(RAW, f), "utf8");

// 1. Liste officielle (allgnupkgs.html)
const all = [
  ...new Set(
    [...rd("allgnupkgs.html").matchAll(/href="([a-z0-9+._-]+)\/"/g)].map(
      (m) => m[1],
    ),
  ),
];

// 2. Manuels : description, section FSF, URL manuel
const man: Record<string, { desc: string; section: string; manual: string }> =
  {};
{
  let section = "";
  for (const line of rd("manual.html").split("\n")) {
    const h = line.match(/<h3 id="([^"]+)"/);
    if (h) section = h[1];
  }
  const html = rd("manual.html");
  const re =
    /<h3 id="([^"]+)"|<dt id="([^"]+)"><a href="([^"]+)">[^<]*<\/a><\/dt>\s*<dd>([\s\S]*?)\[<a/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[1]) {
      section = m[1];
      continue;
    }
    const url = m[3].startsWith("/")
      ? "https://www.gnu.org" + m[3]
      : m[3].startsWith("//")
        ? "https:" + m[3]
        : m[3];
    man[m[2]] = {
      desc: m[4]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      section,
      manual: url,
    };
  }
}

// 3. Décommissionnés (software.html)
const sw = rd("software.html");
const decoStart = sw.indexOf('id="decommissioned"');
const decom = [
  ...sw
    .slice(
      sw.indexOf("maintainers@gnu.org", decoStart),
      sw.indexOf("</div>", decoStart),
    )
    .matchAll(/href="([a-z0-9+._-]+)\/"/g),
]
  .map((m) => m[1])
  .filter((n) => !["italiano", "polski"].includes(n));

// 4. ftp.gnu.org : dernière archive (ls-lrRt trié par date croissante)
const ftpDirDate: Record<string, string> = {};
for (const m of rd("ftp.html").matchAll(
  /href="([^"/]+)\/">[^<]*<\/a><\/td><td align="right">(\d{4}-\d\d-\d\d)/g,
))
  ftpDirDate[m[1]] = m[2];
const mon: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};
const latest: Record<string, { version: string; date: string; file: string }> =
  {};
{
  let dir = "";
  for (const line of rd("ls-lrRt.txt").split("\n")) {
    const d = line.match(/^\/home\/ftp\/gnu\/(.+):$/);
    if (d) {
      dir = d[1];
      continue;
    }
    if (!dir) continue;
    const f = line.match(
      /^[-d]\S+\s+\d+\s+\S+\s+\S+\s+\d+\s+(\w{3})\s+(\d+)\s+(\d{4}|\d\d:\d\d)\s+(.+)$/,
    );
    if (!f) continue;
    const top = dir.split("/")[0];
    const name = f[4];
    const v = name.match(
      /^(.+?)-(\d[\w.+~-]*?)\.(tar\.(?:gz|xz|bz2|lz|zst)|tgz|zip)$/,
    );
    if (!v) continue;
    const year = f[3].includes(":")
      ? Number(mon[f[1]]) > 11
        ? "2025"
        : "2026"
      : f[3];
    const date = `${year}-${mon[f[1]]}-${f[2].padStart(2, "0")}`;
    for (const key of [v[1], "dir:" + top]) {
      const cur = latest[key];
      const cmp = cur
        ? v[2].localeCompare(cur.version, undefined, { numeric: true })
        : 1;
      if (
        /^\d+(\.\d+)*[a-z]?$/.test(v[2]) &&
        (cmp > 0 || (cmp === 0 && date > cur!.date))
      )
        latest[key] = { version: v[2], date, file: `${dir}/${name}` };
    }
  }
}

// 5. Savannah cgit : dépôts + dernière activité
const cgit: Record<string, string> = {};
for (const m of rd("cgit.html").matchAll(
  /href='\/cgit\/([^']+?)\.git\/'>[^<]*<\/a><\/td>.*?title='(\d{4}-\d\d-\d\d)/g,
))
  cgit[m[1]] = m[2];

// 6. Ubuntu 26.10 « stonking » : Packages + Sources
type Bin = {
  pkg: string;
  ver: string;
  src: string;
  prio: string;
  ess: boolean;
  suite: string;
};
const bins: Bin[] = [];
const srcVer: Record<string, string> = {};
for (const suite of ["stonking", "stonking-updates", "stonking-security"])
  for (const comp of ["main", "universe"]) {
    for (const st of rd(`P_${suite}_${comp}`).split("\n\n")) {
      const g = (k: string) =>
        st.match(new RegExp(`^${k}: (.+)$`, "m"))?.[1] ?? "";
      const pkg = g("Package");
      if (!pkg) continue;
      bins.push({
        pkg,
        ver: g("Version"),
        src: (g("Source") || pkg).split(" ")[0],
        prio: g("Priority"),
        ess: g("Essential") === "yes",
        suite: `${suite}/${comp}`,
      });
    }
    for (const st of rd(`S_${suite}_${comp}`).split("\n\n")) {
      const p = st.match(/^Package: (.+)$/m)?.[1];
      const v = st.match(/^Version: (.+)$/m)?.[1];
      if (p && v) srcVer[p] = v; // updates/security écrasent release
    }
  }
const binBySrc: Record<string, Bin[]> = {};
for (const b of bins) (binBySrc[b.src] ??= []).push(b);
const binByName: Record<string, Bin> = {};
for (const b of bins) binByName[b.pkg] = b;

// 7. Arch core+extra
type Arch = {
  desc?: string;
  name: string;
  base: string;
  ver: string;
  repo: string;
  lic: string[];
  deps: string[];
};
const arch: Record<string, Arch> = {};
const archByBase: Record<string, Arch[]> = {};
for (const repo of ["core", "extra"])
  for (const d of readdirSync(join(RAW, "arch", repo))) {
    const desc = readFileSync(join(RAW, "arch", repo, d, "desc"), "utf8");
    const sec = (k: string) =>
      desc
        .match(new RegExp(`%${k}%\\n([\\s\\S]*?)(?:\\n\\n|$)`))?.[1]
        .split("\n")
        .filter(Boolean) ?? [];
    const a: Arch = {
      desc: sec("DESC")[0],
      name: sec("NAME")[0],
      base: sec("BASE")[0],
      ver: sec("VERSION")[0],
      repo,
      lic: sec("LICENSE"),
      deps: sec("DEPENDS"),
    };
    arch[a.name] = a;
    (archByBase[a.base] ??= []).push(a);
  }
const archBase = new Set(arch["base"].deps.map((x) => x.split(/[<>=]/)[0]));
const archBaseDevel = new Set(
  arch["base-devel"].deps.map((x) => x.split(/[<>=]/)[0]),
);

function ubuntuFor(n: string, alias?: string[]) {
  const cands = [...(alias ?? []), n, `gnu-${n}`, n.toLowerCase()];
  for (const c of cands) {
    if (srcVer[c]) return { src: c, ver: srcVer[c] };
  }
  // suffixes versionnés (gcc-16, guile-3.0, automake-1.18…)
  const vs = Object.keys(srcVer)
    .filter((s) =>
      new RegExp(`^${n.replace(/[+.]/g, "\\$&")}-?\\d+(\\.\\d+)?$`).test(s),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (vs.length) return { src: vs.at(-1)!, ver: srcVer[vs.at(-1)!] };
  for (const c of cands)
    if (binByName[c]) return { src: binByName[c].src, ver: binByName[c].ver };
  return null;
}
function archFor(n: string, alias?: string[]) {
  for (const c of [...(alias ?? []), n, `gnu-${n}`, n.toLowerCase()]) {
    if (archByBase[c])
      return archByBase[c][0].base === c
        ? (arch[c] ?? archByBase[c][0])
        : archByBase[c][0];
    if (arch[c]) return arch[c];
  }
  return null;
}

const rows: any[] = [];
const names = [
  ...all.map((n) => ({ n, decom: false })),
  ...decom.filter((d) => !all.includes(d)).map((n) => ({ n, decom: true })),
];
for (const { n, decom: isDecom } of names) {
  const c = curated[n] ?? {};
  const mm = man[n];
  const category = isDecom
    ? "decommissioned"
    : (c.cat ?? catBySection[mm?.section ?? ""] ?? "applications");
  const u =
    (isDecom && !c.ubuntu) || (c as any).noUbuntu
      ? null
      : ubuntuFor(n, c.ubuntu);
  const ub = u ? (binBySrc[u.src] ?? []) : [];
  const ubBase = ub.filter(
    (b) => b.ess || b.prio === "required" || b.prio === "important",
  );
  const a =
    (isDecom && !c.arch) || (c as any).noArch ? null : archFor(n, c.arch);
  const archBins = a ? (archByBase[a.base] ?? [a]).map((x) => x.name) : [];
  const ftpKey = c.ftp ?? n;
  const rel = latest[ftpKey] ?? latest["dir:" + ftpKey];
  const repoKey = c.repoKey ?? n;
  rows.push({
    name: n,
    category,
    fsf_section: mm?.section ?? null,
    purpose: c.purpose ?? (mm?.desc || a?.desc || null),
    languages: c.lang ?? null,
    license: c.license ?? (a?.lic.length ? a.lic.join(" AND ") : null),
    license_source: c.license
      ? "curated"
      : a?.lic.length
        ? `archlinux ${a.repo}/${a.name} %LICENSE%`
        : null,
    status: isDecom ? "decommissioned" : (c.status ?? "active"),
    latest_release:
      c.release ??
      (rel
        ? {
            version: rel.version,
            date: rel.date,
            path: `https://ftp.gnu.org/gnu/${rel.file}`,
          }
        : null),
    ftp_dir_mtime: ftpDirDate[ftpKey] ?? null,
    repo:
      c.repo ??
      (cgit[repoKey]
        ? `https://git.savannah.gnu.org/cgit/${repoKey}.git`
        : null),
    last_commit: c.repo ? (c.lastCommit ?? null) : (cgit[repoKey] ?? null),
    manual: mm?.manual ?? `https://www.gnu.org/software/${n}/manual/`,
    manual_verified: !!mm,
    homepage: `https://www.gnu.org/software/${n}/`,
    ubuntu: u
      ? {
          source: u.src,
          version: u.ver,
          base: ubBase.length > 0,
          base_binaries: ubBase.map(
            (b) => `${b.pkg}${b.ess ? "(essential)" : ""}:${b.prio}`,
          ),
          replaced_by: c.ubuntuReplaced ?? null,
        }
      : null,
    arch: a
      ? {
          pkgbase: a.base,
          pkgname: a.name,
          version: a.ver,
          repo: a.repo,
          base: archBins.some((b) => archBase.has(b)),
          base_devel: archBins.some((b) => archBaseDevel.has(b)),
          base_binaries: archBins.filter(
            (b) => archBase.has(b) || archBaseDevel.has(b),
          ),
          replaced_by: c.archReplaced ?? null,
        }
      : null,
    modern: c.modern ?? [],
    verdict:
      c.verdict ??
      (isDecom
        ? "drop (décommissionné)"
        : category === "games" ||
            category === "applications" ||
            category === "multimedia" ||
            category === "science/math" ||
            category === "desktop/GNOME-related"
          ? "drop (hors périmètre)"
          : "keep upstream (hors base, à la demande)"),
    priority: c.prio ?? null,
  });
}

writeFileSync(
  join(OUT, "gnu-packages.json"),
  JSON.stringify(
    {
      generated: "2026-11-12",
      sources: {
        list: "https://www.gnu.org/software/allgnupkgs.html (fetched 2026-11-12)",
        decommissioned:
          "https://www.gnu.org/software/software.html#decommissioned ($Date 2024/07/31)",
        manuals: "https://www.gnu.org/manual/manual.html (fetched 2026-11-12)",
        releases:
          "https://ftp.gnu.org/ls-lrRt.txt.gz + https://ftp.gnu.org/gnu/ (fetched 2026-11-12)",
        repos: "https://git.savannah.gnu.org/cgit/ (index, fetched 2026-11-12)",
        ubuntu:
          "archive.ubuntu.com dists/stonking{,-updates,-security} main+universe amd64 Packages.xz/Sources.xz (Release Version 26.10, Codename stonking, Date 2026-10-15)",
        arch: "geo.mirror.pkgbuild.com core.db + extra.db (fetched 2026-11-12); base/base-devel = metapackages",
        gnupackages_txt:
          "unavailable: womb.git clone vide, viewvc 401 (2026-11-12)",
      },
      counts: rows.reduce(
        (acc: any, r) => ((acc[r.category] = (acc[r.category] ?? 0) + 1), acc),
        {},
      ),
      packages: rows,
    },
    null,
    1,
  ),
);

// ---- Markdown ----
const cats = [...new Set(rows.map((r) => r.category))].sort();
const esc = (s: any) => String(s ?? "").replace(/\|/g, "\\|");
let md = `# Paquets GNU : table classée (${rows.length} entrées, 2026-11-12)\n\nSource de vérité : [gnu-packages.json](gnu-packages.json), généré à partir des sources listées dans [INDEX.md](INDEX.md). Colonnes : version et date = dernière archive dans ftp.gnu.org/gnu/<nom>/ (ls-lrRt.txt, trié par date) ; « commit » = âge du dernier commit dans l'index cgit Savannah (vide si le dépôt est ailleurs ou absent) ; licence = curée, sinon \`%LICENSE%\` du paquet Arch ; « — » = inconnu, [NV].\n\n`;
for (const cat of cats) {
  const rs = rows.filter((r) => r.category === cat);
  md += `## ${cat} (${rs.length})\n\n| Paquet | Rôle | Lang. | Licence | Statut | Dernière version (ftp) | Dépôt / commit | Verdict |\n|---|---|---|---|---|---|---|---|\n`;
  for (const r of rs) {
    const rel = r.latest_release
      ? `${r.latest_release.version} (${r.latest_release.date})`
      : "—";
    const repo = r.repo
      ? `[${r.repo.includes("savannah") ? "savannah" : new URL(r.repo).host}](${r.repo})${r.last_commit ? " " + r.last_commit : ""}`
      : "—";
    md += `| [${r.name}](${r.manual}) | ${esc(r.purpose)} | ${esc(r.languages ?? "—")} | ${esc(r.license ?? "—")} | ${r.status} | ${rel} | ${repo} | ${esc(r.verdict)} |\n`;
  }
  md += "\n";
}
writeFileSync(join(OUT, "PACKAGES.md"), md);

const inU = rows.filter((r) => r.ubuntu),
  inA = rows.filter((r) => r.arch);
let dm = `# GNU dans Ubuntu 26.10 et Arch Linux (2026-11-12)\n\nTables générées (voir [gnu-packages.json](gnu-packages.json)) ; analyse et remplacements dans la section finale.\n\n## Couverture\n\n- Paquets GNU (hors décommissionnés) : ${rows.filter((r) => r.status !== "decommissioned").length}\n- Présents dans Ubuntu 26.10 stonking (main+universe) : ${inU.length} ; dont dans le socle (binaire Essential ou Priority required/important) : ${inU.filter((r) => r.ubuntu.base).length}\n- Présents dans Arch core+extra : ${inA.length} ; dont dans \`base\` : ${inA.filter((r) => r.arch.base).length}, dans \`base-devel\` : ${inA.filter((r) => r.arch.base_devel).length}\n\nCorrespondance par nom (nom exact, \`gnu-<nom>\`, suffixe versionné, alias curés) : un paquet absent peut exister sous un autre nom [NV].\n\n`;
dm += `## Socle : paquets GNU dans les ensembles de base\n\n| Paquet | Ubuntu source | Version Ubuntu | Socle Ubuntu (binaires) | Arch pkg | Version Arch | base | base-devel | Remplacé par la distro |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows.filter(
  (r) => r.ubuntu?.base || r.arch?.base || r.arch?.base_devel,
)) {
  const repl = [
    r.ubuntu?.replaced_by && `Ubuntu : ${r.ubuntu.replaced_by}`,
    r.arch?.replaced_by && `Arch : ${r.arch.replaced_by}`,
  ]
    .filter(Boolean)
    .join(" ; ");
  dm += `| ${r.name} | ${r.ubuntu?.source ?? "—"} | ${r.ubuntu?.version ?? "—"} | ${esc(r.ubuntu?.base_binaries.join(", ") || "—")} | ${r.arch ? r.arch.pkgbase + (r.arch.base_binaries.length ? " (" + r.arch.base_binaries.join(", ") + ")" : "") : "—"} | ${r.arch?.version ?? "—"} | ${r.arch?.base ? "oui" : ""} | ${r.arch?.base_devel ? "oui" : ""} | ${esc(repl || "—")} |\n`;
}
dm += `\n## Tous les paquets GNU présents dans au moins une distro\n\n| Paquet | Catégorie | Ubuntu source | Ubuntu | Arch | Arch repo |\n|---|---|---|---|---|---|\n`;
for (const r of rows.filter((r) => r.ubuntu || r.arch))
  dm += `| ${r.name} | ${r.category} | ${r.ubuntu?.source ?? "—"} | ${r.ubuntu?.version ?? "—"} | ${r.arch ? r.arch.pkgname + " " + r.arch.version : "—"} | ${r.arch?.repo ?? "—"} |\n`;
dm += `\n## Absents des deux distros\n\n${rows
  .filter((r) => !r.ubuntu && !r.arch && r.status !== "decommissioned")
  .map((r) => r.name)
  .join(", ")}\n`;
writeFileSync(
  join(OUT, "DISTROS.md"),
  readFileSync(new URL("./DISTROS-head.md", import.meta.url), "utf8") +
    dm.split("\n").slice(2).join("\n"),
);
console.log(
  JSON.stringify({
    total: rows.length,
    counts: rows.reduce(
      (a: any, r) => ((a[r.category] = (a[r.category] ?? 0) + 1), a),
      {},
    ),
    ubuntu: inU.length,
    ubuntuBase: inU.filter((r) => r.ubuntu.base).length,
    arch: inA.length,
    archBase: inA.filter((r) => r.arch.base).length,
    archBD: inA.filter((r) => r.arch.base_devel).length,
    noManual: rows.filter(
      (r) => !r.manual_verified && r.status !== "decommissioned",
    ).length,
    noRel: rows
      .filter((r) => !r.latest_release && r.status !== "decommissioned")
      .map((r) => r.name)
      .join(" "),
  }),
);
