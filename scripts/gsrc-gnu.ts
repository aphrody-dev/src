// Extract GNU packages from a GSRC checkout (bzr https://bzr.savannah.gnu.org/r/gsrc/trunk):
// version, distfile sha256, build/lib deps per pkg/gnu/<name>/Makefile.
// Usage: bun scripts/gsrc-gnu.ts <gsrc-root> [revno] > docs/research/gsrc-gnu-<date>.json
import { Glob } from "bun";
const [root, revno] = process.argv.slice(2);
const vars = (mk: string) => {
  const out: Record<string, string> = {};
  for (const m of mk.replace(/\\\n/g, " ").matchAll(/^([A-Z_]+)\s*[?:]?=[ \t]*(.*)$/gm)) out[m[1]] ??= m[2].trim();
  return out;
};
const list = (s?: string) => (s ?? "").split(/\s+/).filter(Boolean);
const packages: Record<string, unknown> = {};
for await (const rel of new Glob("pkg/gnu/*/Makefile").scan(root)) {
  const dir = rel.slice(0, -"/Makefile".length);
  const v = vars(await Bun.file(`${root}/${rel}`).text());
  const name = dir.split("/").pop()!; // directory = canonical id (gcc16, glibc); NAME is a display label
  const sums = await Bun.file(`${root}/${dir}/sha256sums`).text().catch(() => "");
  const sha = Object.fromEntries(
    [...sums.matchAll(/^([0-9a-f]{64})\s+download\/(\S+)$/gm)].filter(([, , f]) => !f.endsWith(".sig")).map(([, h, f]) => [f, h]),
  );
  packages[name] = {
    label: v.NAME ?? null,
    tarball: v.GARNAME ?? null,
    version: v.GARVERSION ?? null,
    description: v.DESCRIPTION ?? null,
    home: v.HOME_URL ?? null,
    subdir: v.MASTER_SUBDIR ?? null,
    sha256: sha,
    builddeps: list(v.BUILDDEPS),
    libdeps: list(v.LIBDEPS),
  };
}
const sorted = Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b)));
console.log(JSON.stringify({ source: `bzr https://bzr.savannah.gnu.org/r/gsrc/trunk revno ${revno ?? "?"}`, count: Object.keys(sorted).length, packages: sorted }, null, 1));
