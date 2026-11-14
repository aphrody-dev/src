#!/usr/bin/env bun
// Build caches of the PC and the fleet (docs/infra/CACHE.md, inventory infra/fleet/cache.toml).
//   bun infra/fleet/cache.ts status [--json] [host...]   sizes, free disk, file system, sccache hit rate
//   bun infra/fleet/cache.ts gc [--dry-run] [host...]    PC: caps of cache.toml ; VPS: fleet-tune.sh clean (tune.conf caps)
//   bun infra/fleet/cache.ts sync [--dry-run] [--r2]     fr1 download caches -> fr2 over WireGuard (or R2), tar.zst by BLAKE3
// Read-only except gc and sync. Nothing here compiles; the PC never builds (owner rule).
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { $ } from "bun";

type Cache = { name: string; path: string; cap_mb?: number; gc?: "bun" | "rm" };
type Host = { ssh: string; caches: Cache[] };
type Sync = {
  from: string;
  to: string;
  mesh: string;
  dest: string;
  r2: string;
  zstd_level: number;
  keep: number;
  sources: { name: string; path: string }[];
};
const root = join(import.meta.dir, "..", "..");
const conf = Bun.TOML.parse(
  await Bun.file(join(root, "infra/fleet/cache.toml")).text(),
) as { host: Record<string, Host>; sync: Sync };
const [cmd = "status", ...rest] = Bun.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const picked = rest.filter((a) => !a.startsWith("--"));
const hosts = Object.keys(conf.host).filter(
  (h) => !picked.length || picked.includes(h),
);
const dry = flags.has("--dry-run");

// One POSIX script per host on stdin of ssh: no argv quoting, no secret on the command line.
async function remote(
  ssh: string,
  script: string,
  timeoutMs = 600_000,
): Promise<string> {
  const p = Bun.spawn(
    ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=20", ssh, "sh", "-s"],
    {
      stdin: new Blob([script]),
      stdout: "pipe",
      stderr: "pipe",
      timeout: timeoutMs,
    },
  );
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  if ((await p.exited) !== 0 && !out)
    throw new Error(`${ssh}: ${err.trim().slice(0, 200)}`);
  return out;
}

const pcPath = (p: string) =>
  isAbsolute(p) || /^[A-Za-z]:/.test(p) ? p : join(homedir(), p);
async function duMb(p: string): Promise<number | null> {
  if (!existsSync(p)) return null;
  const r = Bun.spawnSync(["du", "-sm", p], {
    stdout: "pipe",
    stderr: "ignore",
    timeout: 300_000,
  });
  const n = Number.parseInt(r.stdout.toString(), 10);
  return Number.isFinite(n) ? n : null;
}

type Row = {
  host: string;
  name: string;
  path: string;
  mb: number | null;
  cap_mb?: number;
};
type HostStatus = {
  host: string;
  fs: string;
  free_mb: number | null;
  rows: Row[];
  sccache?: string;
};

async function statusOf(h: string): Promise<HostStatus> {
  const { ssh, caches } = conf.host[h]!;
  if (!ssh) {
    const rows = await Promise.all(
      caches.map(async (c) => ({
        host: h,
        name: c.name,
        path: c.path,
        mb: await duMb(pcPath(c.path)),
        cap_mb: c.cap_mb,
      })),
    );
    const free = Bun.spawnSync(["df", "-m", "--output=avail", "/c"], {
      stdout: "pipe",
    })
      .stdout.toString()
      .split("\n")[1]
      ?.trim();
    return {
      host: h,
      fs: "NTFS C:",
      free_mb: free ? Number(free) : null,
      rows,
    };
  }
  const script = [
    `findmnt -no FSTYPE,OPTIONS / | cut -c1-80; df -BM --output=avail / | tail -1 | tr -dc 0-9; echo`,
    ...caches.map(
      (c) =>
        `printf '%s\\t' ${JSON.stringify(c.name)}; if [ -e ${JSON.stringify(c.path)} ]; then sudo -n timeout 240 du -sm ${JSON.stringify(c.path)} 2>/dev/null | cut -f1 || echo; else echo -; fi`,
    ),
    `echo '--sccache'; command -v sccache >/dev/null && sccache --show-stats 2>/dev/null | grep -E '^(Compile requests|Cache hits|Cache misses|Cache hits rate|Cache size|Max cache size) ' | tr -s ' ' | paste -sd ';'`,
  ].join("\n");
  const out = (await remote(ssh, script)).split("\n");
  const [fs = "", free = ""] = out;
  const sc = out.indexOf("--sccache");
  const rows = caches.map((c, i) => {
    const v = (out[2 + i] ?? "").split("\t")[1]?.trim() ?? "";
    return {
      host: h,
      name: c.name,
      path: c.path,
      mb: v && v !== "-" ? Number(v) : null,
      cap_mb: c.cap_mb,
    };
  });
  return {
    host: h,
    fs: fs.trim(),
    free_mb: free ? Number(free) : null,
    rows,
    sccache: sc >= 0 ? out[sc + 1]?.trim() || undefined : undefined,
  };
}

async function status(): Promise<number> {
  const all = await Promise.all(
    hosts.map((h) =>
      statusOf(h).catch(
        (e) =>
          ({
            host: h,
            fs: `unreachable: ${(e as Error).message}`,
            free_mb: null,
            rows: [],
          }) as HostStatus,
      ),
    ),
  );
  if (flags.has("--json")) {
    console.log(JSON.stringify(all, null, 2));
    return 0;
  }
  for (const s of all) {
    const total = s.rows.reduce((a, r) => a + (r.mb ?? 0), 0);
    console.log(
      `${s.host}  ${s.fs}  free ${s.free_mb ?? "?"} MiB  caches ${total} MiB`,
    );
    for (const r of s.rows) {
      const over =
        r.cap_mb !== undefined && (r.mb ?? 0) > r.cap_mb
          ? `  OVER cap ${r.cap_mb}`
          : "";
      console.log(
        `  ${r.name.padEnd(18)} ${String(r.mb ?? "-").padStart(7)} MiB  ${r.path}${over}`,
      );
    }
    if (s.sccache) console.log(`  sccache: ${s.sccache}`);
  }
  return 0;
}

async function gc(): Promise<number> {
  for (const h of hosts) {
    const { ssh, caches } = conf.host[h]!;
    if (ssh) {
      // VPS caps and rules are fleet-tune.sh's (tune.conf); skipped while a heavy job holds the lock.
      const out = dry
        ? "dry-run: sudo fleet-tune.sh clean"
        : await remote(
            ssh,
            "sudo -n /usr/local/bin/fleet-tune.sh clean 2>&1 | tail -20",
            1_800_000,
          );
      console.log(`${h}: ${out.trim()}`);
      continue;
    }
    for (const c of caches.filter((x) => x.cap_mb !== undefined && x.gc)) {
      const p = pcPath(c.path);
      const mb = await duMb(p);
      if (mb === null || mb <= c.cap_mb!) continue;
      console.log(
        `${h}: ${c.name} ${mb} MiB > cap ${c.cap_mb} MiB -> ${c.gc}${dry ? " (dry-run)" : ""}`,
      );
      if (dry) continue;
      if (c.gc === "bun") await $`bun pm cache rm`.quiet();
      else if (
        c.gc === "rm" &&
        p.replaceAll("\\", "/").toLowerCase().startsWith("c:/src/")
      )
        rmSync(p, { recursive: true, force: true });
    }
  }
  return 0;
}

// Reproducible archive (sorted names, fixed mtime/owner) so equal content gives equal BLAKE3, then zstd --long.
// Uploaded only when the hash is new; older snapshots beyond `keep` are deleted. Runs at nice 19 / ionice idle on fr1.
async function sync(): Promise<number> {
  const s = conf.sync;
  const from = conf.host[s.from]!.ssh;
  const r2 = flags.has("--r2");
  const mesh = s.mesh; // fr1 -> fr2 over WireGuard (ssh from fr1, mesh address)
  for (const src of s.sources) {
    const tmp = `/var/tmp/cache-sync-${src.name}.tar.zst`;
    const pack = [
      `set -eu; [ -d ${JSON.stringify(src.path)} ] || { echo "skip ${src.name}: absent"; exit 0; }`,
      `cd ${JSON.stringify(src.path)}`,
      `nice -n 19 ionice -c3 tar --sort=name --mtime=@0 --owner=0 --group=0 --numeric-owner --mode=go-w -cf - . | nice -n 19 zstd -q -T2 --long=27 -${s.zstd_level} -o ${tmp} -f`,
      `h=$(b3sum --no-names ${tmp}); echo "hash $h $(du -m ${tmp} | cut -f1)"`,
    ].join("\n");
    const out = await remote(from, pack, 3_600_000);
    const m = /hash ([0-9a-f]{64}) (\d+)/.exec(out);
    if (!m) {
      console.log(`${src.name}: ${out.trim()}`);
      continue;
    }
    const [, hash, mb] = m;
    const name = `${src.name}-${hash!.slice(0, 16)}.tar.zst`;
    const push = r2
      ? [
          `set -eu; R=${s.r2}/${src.name}`,
          `if rclone lsf "$R/" 2>/dev/null | grep -qx ${name}; then echo "r2 ${name} present"; else rclone copyto ${tmp} "$R/${name}" --s3-no-check-bucket && echo "r2 ${name} uploaded"; fi`,
          `rclone lsf "$R/" --files-only 2>/dev/null | grep -v -x ${name} | sort | head -n -$(( ${s.keep} - 1 )) | while read -r o; do rclone deletefile "$R/$o"; echo "r2 deleted $o"; done`,
          `rm -f ${tmp}`,
        ].join("\n")
      : [
          `set -eu; D=${s.dest}/${src.name}`,
          `ssh -o BatchMode=yes ${mesh} "sudo mkdir -p $D && sudo chown \\$(id -u) $D"`,
          `nice -n 19 rsync -a --partial --inplace ${tmp} ${mesh}:$D/${name} && echo "${s.to} ${name} synced"`,
          `ssh -o BatchMode=yes ${mesh} "cd $D && ls -1t | grep -v -x ${name} | tail -n +${s.keep} | xargs -r rm -f"`,
          `rm -f ${tmp}`,
        ].join("\n");
    console.log(
      `${src.name}: ${mb} MiB zstd-${s.zstd_level} b3 ${hash!.slice(0, 16)}`,
    );
    if (dry) {
      console.log(
        `  dry-run: ${r2 ? s.r2 : `${s.to}:${s.dest}`}/${src.name}/${name}`,
      );
      await remote(from, `rm -f ${tmp}`);
      continue;
    }
    console.log(
      (await remote(from, push, 3_600_000)).trim().replace(/^/gm, "  "),
    );
  }
  return 0;
}

const run: Record<string, () => Promise<number>> = { status, gc, sync };
if (!run[cmd]) {
  console.error(
    "usage: bun infra/fleet/cache.ts status|gc|sync [--json] [--dry-run] [--r2] [host...]",
  );
  process.exit(2);
}
process.exit(await run[cmd]!());
