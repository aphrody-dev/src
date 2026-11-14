// Niubash 1.5.0 end-to-end suite: Bun.spawn, Bun.$, and native Bun APIs, one self-contained module.
import { $ } from "bun";
import { Database } from "bun:sqlite";

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
}
const NIU =
  process.env.NIU ?? `${process.env.LOCALAPPDATA}\\Programs\\Niubash\\niu.exe`;

export async function niu(
  script: string,
): Promise<{ out: string; err: string; code: number }> {
  const p = Bun.spawn([NIU, "-c", script], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { out: out.replace(/\r\n/g, "\n"), err, code };
}

const cases: [string, string, (o: string) => boolean][] = [
  ["version", "niu --version | head -1", (o) => o.startsWith("Niubash 1.5.0")],
  ["echo", "echo hi", (o) => o === "hi\n"],
  ["pipeline", "printf 'b\\na\\n' | sort | tr '\\n' ,", (o) => o === "a,b,"],
  ["arith", "echo $((6*7))", (o) => o === "42\n"],
  ["array", "a=(x y z); echo ${#a[@]} ${a[1]}", (o) => o === "3 y\n"],
  ["assoc", "declare -A m=([k]=v); echo ${m[k]}", (o) => o === "v\n"],
  ["heredoc", "cat <<E\nline\nE", (o) => o === "line\n"],
  ["subshell", "(exit 3); echo $?", (o) => o === "3\n"],
  ["procsub", "diff <(echo a) <(echo a) && echo same", (o) => o === "same\n"],
  ["trap", "trap 'echo bye' EXIT; true", (o) => o === "bye\n"],
  ["git", "git --version", (o) => o.startsWith("git version")],
  ["paths", "cd /tmp && pwd -P | grep -c .", (o) => o === "1\n"],
];

export async function runAll(): Promise<Check[]> {
  const res: Check[] = [];
  for (const [name, s, pred] of cases) {
    const r = await niu(s);
    res.push({
      name: `niu:${name}`,
      ok: r.code === 0 && pred(r.out),
      detail: r.out.trim().slice(0, 60),
    });
  }
  // Bun shell parity: same pipeline through Bun.$ must agree with niu.
  const bs = (await $`echo hi`.text()).trim();
  res.push({ name: "bun$:echo", ok: bs === "hi", detail: bs });
  // Native APIs: hasher, sqlite, glob, semver, gzip, file IO.
  const h = new Bun.CryptoHasher("blake2b256").update("niubash").digest("hex");
  res.push({ name: "bun:hasher", ok: h.length === 64, detail: h.slice(0, 16) });
  const db = new Database(":memory:");
  db.run("create table t(v)");
  for (const c of cases) db.run("insert into t values(?)", [c[0]]);
  const n = (db.query("select count(*) n from t").get() as { n: number }).n;
  res.push({ name: "bun:sqlite", ok: n === cases.length, detail: String(n) });
  res.push({
    name: "bun:semver",
    ok: Bun.semver.satisfies("1.5.0", ">=1.4.0"),
    detail: "1.5.0",
  });
  const gz = Bun.gunzipSync(Bun.gzipSync("niu"));
  res.push({
    name: "bun:gzip",
    ok: new TextDecoder().decode(gz) === "niu",
    detail: "roundtrip",
  });
  const g = [...new Bun.Glob("*.json").scanSync(import.meta.dir + "/..")];
  res.push({
    name: "bun:glob",
    ok: g.includes("shells.json"),
    detail: g.join(","),
  });
  return res;
}

async function main(): Promise<void> {
  const rs = await runAll();
  for (const r of rs)
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name} ${r.detail}`);
  const bad = rs.filter((r) => !r.ok).length;
  console.log(`${rs.length - bad}/${rs.length} passed`);
  process.exit(bad ? 1 : 0);
}
if (import.meta.main) main();
