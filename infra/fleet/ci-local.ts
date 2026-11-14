// `just ci-local`: the jobs of .github/workflows/ci.yml and judge.yml, run in parallel in this checkout.
// Same commands as the workflows (keep both in step). Cargo jobs go through aphrody-heavy when it exists (fr1),
// and are skipped on hosts that must not compile (the workstation): use `just ci-local-fr1` for the full set.
//   bun infra/fleet/ci-local.ts [--only gates,suites,rust,deny,arch,tokens] [--jobs N] [--list]
// Exit 1 when any job fails; each job logs to var/ci-local/<name>.log and its tail is printed on failure.
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

type Job = {
  name: string;
  group: string;
  cmd: string;
  cargo?: boolean;
  after?: string;
};
const heavy = Bun.which("aphrody-heavy") ? "aphrody-heavy " : "";
const J: Job[] = [
  { name: "checkdeps", group: "gates", cmd: "bun scripts/checkdeps.ts" },
  {
    name: "identity",
    group: "gates",
    cmd: "[ ! -f scripts/identity.ts ] || bun scripts/identity.ts check",
  },
  {
    name: "agents",
    group: "gates",
    cmd: "AGENTS_HOME=var/ci-local/agents bun --no-env-file infra/agents/runner.ts status && AGENTS_HOME=var/ci-local/agents bun --no-env-file test infra/agents",
  },
  { name: "js-deps", group: "gates", cmd: "bun packages/machine/src/js-deps-check.ts" },
  {
    name: "metadata",
    group: "gates",
    cmd: "cargo metadata --locked --no-deps --format-version 1 >/dev/null",
    cargo: true,
  },
  {
    name: "version-freeze",
    group: "gates",
    cmd: "bun packages/release/src/cli.ts freeze --check",
  },
  {
    name: "bun-env-kit",
    group: "suites",
    cmd: "bun --no-env-file test packages/env-kit",
  },
  {
    name: "bun-upstream",
    group: "suites",
    cmd: "bun --no-env-file test packages/upstream",
  },
  {
    name: "bun-ai-os",
    group: "suites",
    cmd: "cd packages/ai-os && bun --no-env-file test test",
  },
  {
    name: "bun-chromium-bun",
    group: "suites",
    cmd: "cd packages/chromium-bun && bun check && bun --no-env-file test test/ssrf.test.ts test/engines.test.ts test/layers.test.ts test/purge-matrix.test.ts test/winner-picker.test.ts test/chromium-inspector.test.ts",
  },
  {
    name: "bun-design",
    group: "suites",
    cmd: "bun --no-env-file --cwd packages/design test && bun --no-env-file run --cwd packages/design lint",
  },
  {
    name: "rust",
    group: "rust",
    cargo: true,
    cmd: `${heavy}cargo build -p aphrody && ${heavy}cargo test -p aphrody -p depot-gclient -p depot-cas -p depot-cipd -p aphrody-up -p aphrody-rt -p archguard -p agent-context -p aphrody-ui`,
  },
  {
    name: "deny",
    group: "deny",
    cargo: true,
    cmd: "cargo deny --locked check",
  },
  {
    name: "arch",
    group: "arch",
    cargo: true,
    after: "rust",
    cmd: 'T=${CARGO_TARGET_DIR:-target}; "$T/debug/ay" arch check --strict --json > var/ci-local/arch.json || true; jaq -e --slurpfile b crates/archguard/baseline.json \'[.findings[] | select(.severity == "error") | .rule_id] | group_by(.) | map({k: .[0], n: length}) | map(select(.n > ($b[0][.k] // 0))) | length == 0\' var/ci-local/arch.json',
  },
  {
    name: "tokens",
    group: "tokens",
    cargo: true,
    cmd: `CARGO_MANIFEST_DIR="$PWD/apps/nt/sdk/rust/brand" ${heavy}rustc --edition 2024 --test -D warnings -o var/ci-local/nt-brand-test apps/nt/sdk/rust/brand/src/lib.rs && var/ci-local/nt-brand-test && ${heavy}zig test packages/design/tokens/tokens_test.zig`,
  },
];

const args = Bun.argv.slice(2);
const opt = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("--only")?.split(",");
const maxJobs =
  Number(opt("--jobs")) || (navigator.hardwareConcurrency / 2) | 0 || 4;
const canCompile = process.platform !== "win32";
const picked = J.filter(
  (j) => !only || only.includes(j.group) || only.includes(j.name),
);
if (args.includes("--list")) {
  for (const j of picked) console.log(`${j.group}\t${j.name}`);
  process.exit(0);
}

mkdirSync("var/ci-local", { recursive: true });
type R = { job: Job; code: number | "skipped"; ms: number };
const done = new Map<string, R>();
const run = async (job: Job): Promise<R> => {
  if (job.cargo && !canCompile) return { job, code: "skipped", ms: 0 };
  if (job.after) {
    const dep = await pending.get(job.after);
    if (dep && dep.code !== 0) return { job, code: "skipped", ms: 0 };
  }
  const t = performance.now();
  const p = Bun.spawn(["sh", "-c", job.cmd], {
    stdout: Bun.file(join("var/ci-local", `${job.name}.log`)),
    stderr: Bun.file(join("var/ci-local", `${job.name}.log`)),
    env: { ...process.env, RUSTC_WRAPPER: "" },
  });
  const code = await p.exited;
  return { job, code, ms: performance.now() - t };
};
// Simple pool: at most maxJobs running, `after` dependencies resolved through the shared promise map.
const pending = new Map<string, Promise<R>>();
let running = 0;
const queue = [...picked];
const results: R[] = [];
await new Promise<void>((resolve) => {
  const pump = () => {
    while (running < maxJobs && queue.length) {
      const idx = queue.findIndex(
        (j) =>
          !j.after ||
          pending.has(j.after) ||
          !picked.some((x) => x.name === j.after),
      );
      if (idx < 0) break;
      const job = queue.splice(idx, 1)[0]!;
      running++;
      const pr = run(job).then((r) => {
        results.push(r);
        running--;
        pump();
        return r;
      });
      pending.set(job.name, pr);
    }
    if (!running && !queue.length) resolve();
  };
  pump();
});
let bad = 0;
for (const r of results.sort((a, b) => a.job.name.localeCompare(b.job.name))) {
  const s = r.code === "skipped" ? "skip" : r.code === 0 ? "ok  " : "FAIL";
  console.log(`${s} ${r.job.name.padEnd(18)} ${(r.ms / 1000).toFixed(1)}s`);
  if (r.code !== 0 && r.code !== "skipped") {
    bad++;
    const log = join("var/ci-local", `${r.job.name}.log`);
    if (existsSync(log))
      console.log(
        (await Bun.file(log).text()).split("\n").slice(-15).join("\n"),
      );
  }
}
console.log(bad ? `${bad} job(s) failed` : "all jobs passed");
process.exit(bad ? 1 : 0);
