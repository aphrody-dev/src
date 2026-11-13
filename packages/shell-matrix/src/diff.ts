// Differential run of the unixwin diffcorpus: niu 1.5.0 vs GNU bash (oracle), Bun.spawn with concurrency and timeout.
import corpus from "../data/diffcorpus.json";
const NIU =
  process.env.NIU ?? `${process.env.LOCALAPPDATA}\\Programs\\Niubash\\niu.exe`;
const ORACLE =
  process.env.ORACLE_BASH ?? "C:\\Program Files\\Git\\bin\\bash.exe";

export interface DiffResult {
  id: string;
  domain: string;
  same: boolean;
}

async function run(exe: string, script: string): Promise<string> {
  const p = Bun.spawn([exe, "-c", script], {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
    timeout: 15000,
  });
  const [o, code] = await Promise.all([
    new Response(p.stdout).text(),
    p.exited,
  ]);
  return o.replace(/\r\n/g, "\n").replace(/\d{3,}/g, "N") + `\nrc=${code}`;
}

export async function runDiff(
  limit = Infinity,
  conc = 8,
): Promise<DiffResult[]> {
  const items = (
    corpus as { id: string; domain: string; script: string }[]
  ).slice(0, limit);
  const out: DiffResult[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: conc }, async () => {
      while (next < items.length) {
        const i = next++;
        const c = items[i]!;
        const [a, b] = await Promise.all([
          run(NIU, c.script),
          run(ORACLE, c.script),
        ]);
        out[i] = { id: c.id, domain: c.domain, same: a === b };
      }
    }),
  );
  return out;
}

async function main(): Promise<void> {
  const rs = await runDiff();
  const by: Record<string, [number, number]> = {};
  for (const r of rs) {
    const e = (by[r.domain] ??= [0, 0]);
    e[1]++;
    if (r.same) e[0]++;
  }
  for (const [d, [s, t]] of Object.entries(by))
    console.log(`${d.padEnd(10)} ${s}/${t}`);
  const s = rs.filter((r) => r.same).length;
  console.log(`diffcorpus ${s}/${rs.length} identical`);
  console.log(
    "diverging: " +
      rs
        .filter((r) => !r.same)
        .map((r) => r.id)
        .join(" "),
  );
}
if (import.meta.main) main();
