// Runs the cases of extract.ts with one Bun binary and says, for each documented result, what the
// binary gave. One process per case, in a temporary directory of its own.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Case, Expectation } from "./extract.ts";

export type Outcome = { i: number; ok: boolean; actual: string };
export type CaseResult = {
  id: string;
  url: string;
  status: "pass" | "fail" | "error";
  failures: { expectation: Expectation; actual: string }[];
  checked: number;
  stderr?: string;
};

const MARK = "__LLMS_RESULTS__";

/** Prepended to every case: `__expect(i, () => value)` compares `value` with expectation `i`. */
function prelude(expectations: Expectation[]): string {
  return `
const __exp = ${JSON.stringify(expectations.map((e) => ({ mode: e.mode, expected: e.expected, printed: !!e.printed })))};
const __res = [];
const __fmt = v => { try { return Bun.inspect(v); } catch { return String(v); } };
const __shown = v => (typeof v === "string" ? v : __fmt(v)); // what console.log writes
const __check = (i, value) => {
  const e = __exp[i];
  const want = e.expected.trim().replace(/;$/, "");
  let ok = false;
  if (e.mode === "literal") {
    const lit = (0, eval)("(" + want + ")");
    ok = Bun.deepEquals(value, lit) || (typeof value === "bigint" && typeof lit === "number" && value === BigInt(lit));
    // What console.log prints: a string without its quotes, an object as Bun.inspect writes it.
    if (!ok && e.printed) ok = __shown(value) === want || __shown(value) === lit;
  } else if (e.mode === "type") {
    const m = want.match(/^([A-Za-z0-9]+)(?:\\((\\d+)\\))?$/);
    const name = m[1];
    if (/^(string|number|boolean|bigint|object|undefined)$/.test(name)) ok = typeof value === name;
    else {
      ok = value != null && (value.constructor?.name === name || Object.prototype.toString.call(value) === "[object " + name + "]");
      if (ok && m[2] !== undefined) ok = (value.byteLength ?? value.length) === Number(m[2]);
    }
  } else {
    const s = __shown(value);
    ok = s === want || s.trim() === want || s.replace(/\s+/g, " ") === want.replace(/\s+/g, " ");
  }
  __res.push({ i, ok, actual: __fmt(value).slice(0, 300) });
};
globalThis.__expect = (i, fn) => {
  let v;
  const msg = err => String(err && err.message ? err.name + ": " + err.message : err).slice(0, 300);
  try { v = fn(); } catch (err) { __res.push({ i, ok: false, actual: "throws " + msg(err) }); return; }
  const safe = x => { try { __check(i, x); } catch (err) { __res.push({ i, ok: false, actual: "check failed: " + msg(err) }); } };
  if (v instanceof Promise) return v.then(safe, err => { __res.push({ i, ok: false, actual: "rejects " + msg(err) }); });
  safe(v);
};
const __mark = "__LLMS_" + "RESULTS__";
process.on("exit", () => { process.stdout.write("\\n" + __mark + JSON.stringify(__res) + "\\n"); });
`;
}

function extension(lang: string): string {
  return lang === "tsx" || lang === "jsx"
    ? ".tsx"
    : lang === "js" || lang === "javascript" || lang === "mjs"
      ? ".mjs"
      : ".ts";
}

export async function runCase(
  bin: string,
  c: Case,
  timeoutMs = 15_000,
): Promise<CaseResult> {
  const dir = mkdtempSync(join(tmpdir(), "llms-case-"));
  const file = join(dir, `case${extension(c.lang)}`);
  writeFileSync(file, prelude(c.expectations) + "\n" + c.code + "\n");
  const checked = c.expectations.filter(
    (e) => e.mode !== "unverifiable",
  ).length;
  try {
    const proc = Bun.spawn({
      cmd: [bin, file],
      cwd: dir,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
      timeout: timeoutMs,
    });
    const [stdout, stderr] = await Promise.all([
      proc.stdout.text(),
      proc.stderr.text(),
      proc.exited,
    ]);
    const at = stdout.lastIndexOf(MARK);
    if (at < 0) {
      return {
        id: c.id,
        url: c.url,
        status: "error",
        failures: [],
        checked,
        stderr: stderr.slice(0, 600),
      };
    }
    let outcomes: Outcome[];
    try {
      outcomes = JSON.parse(
        stdout
          .slice(at + MARK.length)
          .split("\n")[0]!
          .trim(),
      );
    } catch {
      return {
        id: c.id,
        url: c.url,
        status: "error",
        failures: [],
        checked,
        stderr: `unreadable results: ${stdout.slice(at, at + 200)}`,
      };
    }
    const failures: CaseResult["failures"] = [];
    const seen = new Set(outcomes.map((o) => o.i));
    for (const o of outcomes)
      if (!o.ok)
        failures.push({ expectation: c.expectations[o.i]!, actual: o.actual });
    c.expectations.forEach((e, i) => {
      if (e.mode !== "unverifiable" && !seen.has(i))
        failures.push({ expectation: e, actual: "not reached" });
    });
    return {
      id: c.id,
      url: c.url,
      status: failures.length ? "fail" : "pass",
      failures,
      checked,
      stderr: failures.length ? stderr.slice(0, 600) : undefined,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function runAll(
  bin: string,
  cases: Case[],
  concurrency = 8,
): Promise<CaseResult[]> {
  const results: CaseResult[] = new Array(cases.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < cases.length) {
        const i = next++;
        results[i] = await runCase(bin, cases[i]!);
      }
    }),
  );
  return results;
}
