// Extract GNU packages (mirror://gnu/ or gnu.org/software home-page) from a Guix checkout.
// Usage: bun guix-gnu.ts <guix-root> > out.json
import { Glob } from "bun";
const root = process.argv[2];
const cmp = (a: string, b: string) => {
  const x = a.split(/[^0-9]+/).filter(Boolean).map(Number), y = b.split(/[^0-9]+/).filter(Boolean).map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};
const out: Record<string, { version: string; module: string; guix_name: string; sha256?: string }> = {};
for await (const rel of new Glob("gnu/packages/*.scm").scan(root)) {
  const src = await Bun.file(`${root}/${rel}`).text();
  for (const block of src.split(/\n\(define-public /).slice(1)) {
    const name = block.match(/\(name\s+"([^"]+)"\)/)?.[1];
    const version = block.match(/\(version\s+"([^"]+)"\)/)?.[1];
    const mirror = block.match(/mirror:\/\/gnu\/([a-z0-9._+-]+)\//)?.[1];
    const home = block.match(/home-page\s+"https?:\/\/(?:www\.)?gnu\.org\/software\/([a-z0-9._+-]+)/)?.[1];
    const gnu = mirror ?? home;
    if (!name || !version || !gnu) continue;
    const sha256 = block.match(/\(base32\s+"([0-9a-z]+)"\)/)?.[1];
    const prev = out[gnu];
    if (prev && cmp(prev.version, version) >= 0) continue;
    out[gnu] = { version, module: rel, guix_name: name, ...(sha256 ? { sha256 } : {}) };
  }
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
console.log(JSON.stringify(sorted));
