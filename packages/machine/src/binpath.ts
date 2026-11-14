// Cross-platform binary & PATH manager for Windows (HKCU\Environment\Path + ~/.local/bin shims)
// and Unix (~/.profile / ~/.bashrc / ~/.zshrc managed block + symlinks).
// Usage: bun packages/machine/src/binpath.ts <status|doctor|purge|add|prepend|rm|which|link|unlink> [args] [--apply] [--json]
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join, resolve } from "node:path";

const HOME = process.env.USERPROFILE ?? process.env.HOME ?? "";
const LOCAL_BIN = join(HOME, ".local", "bin");
const CARGO_BIN = join(HOME, ".cargo", "bin");
const BUN_BIN = join(HOME, ".bun", "bin");

const BLOCK_START = "# >>> aphrody-path >>>";
const BLOCK_END = "# <<< aphrody-path <<<";

export interface BinIssue {
  kind: "stale" | "zero-byte" | "broken-cmd" | "broken-symlink";
  path: string;
  detail: string;
}

export interface PathAudit {
  platform: string;
  userEntries: string[];
  machineEntries: string[];
  missing: string[];
  selfDuplicates: string[];
  machineDuplicates: string[];
  binIssues: BinIssue[];
}

const norm = (p: string): string => {
  const trimmed = p.trim().replace(/[\\/]+$/, "");
  return process.platform === "win32" ? trimmed.toLowerCase() : trimmed;
};

function readWinRegPath(hiveKey: string): string[] {
  const r = Bun.spawnSync(["reg", "query", hiveKey, "/v", "Path"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode !== 0) return [];
  const line = r.stdout
    .toString()
    .split(/\r?\n/)
    .find((l) => /\bPath\b/i.test(l));
  if (!line) return [];
  const raw = line.replace(/^\s*Path\s+REG_(?:EXPAND_)?SZ\s+/i, "").trim();
  return raw.split(";").filter(Boolean);
}

function writeWinRegPath(entries: string[]): void {
  const val = entries.join(";");
  const r = Bun.spawnSync(
    [
      "reg",
      "add",
      "HKCU\\Environment",
      "/v",
      "Path",
      "/t",
      "REG_EXPAND_SZ",
      "/d",
      val,
      "/f",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (r.exitCode !== 0) {
    throw new Error(`reg add failed: ${r.stderr.toString().trim()}`);
  }
  Bun.spawnSync(
    [
      "pwsh",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition '[DllImport("user32.dll",SetLastError=true,CharSet=CharSet.Auto)]public static extern IntPtr SendMessageTimeout(IntPtr hWnd,uint Msg,UIntPtr wParam,string lParam,uint fuFlags,uint uTimeout,out UIntPtr lpdwResult);'; $r=[UIntPtr]::Zero; [Win32.NativeMethods]::SendMessageTimeout([IntPtr]0xffff,0x1a,[UIntPtr]::Zero,'Environment',2,1000,[ref]$r) | Out-Null`,
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
}

function unixProfileFiles(): string[] {
  return [".profile", ".bashrc", ".zshrc"]
    .map((f) => join(HOME, f))
    .filter((p) => existsSync(p) || p.endsWith(".profile"));
}

export function extractManagedBlock(content: string): string[] {
  const s = content.indexOf(BLOCK_START);
  const e = content.indexOf(BLOCK_END);
  if (s === -1 || e === -1 || e < s) return [];
  const body = content.slice(s + BLOCK_START.length, e);
  const dirs: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/export PATH="([^":]+):\$PATH"/);
    if (m) dirs.push(m[1]!);
  }
  return dirs;
}

export function applyManagedBlock(content: string, dirs: string[]): string {
  const block =
    dirs.length === 0
      ? ""
      : `${BLOCK_START}\n${dirs.map((d) => `export PATH="${d}:$PATH"`).join("\n")}\n${BLOCK_END}\n`;
  const s = content.indexOf(BLOCK_START);
  const e = content.indexOf(BLOCK_END);
  if (s !== -1 && e !== -1 && e > s) {
    const after = e + BLOCK_END.length;
    const prefix = content.slice(0, s).replace(/\n+$/, "");
    const suffix = content.slice(after).replace(/^\n+/, "");
    return (
      [prefix, block.trimEnd(), suffix].filter(Boolean).join("\n\n") + "\n"
    );
  }
  if (!block) return content;
  return `${content.replace(/\n+$/, "")}\n\n${block}`;
}

export function scanCmdBrokenTargets(
  content: string,
  baseDir: string,
): string[] {
  const missing: string[] = [];
  const re = /(?:%~dp0|[A-Za-z]:\\)[^"\r\n]+\.(?:exe|ts|js|jar|bat|cmd|ps1)/gi;
  for (const m of content.matchAll(re)) {
    const raw = m[0]!.replace(/^%~dp0/i, `${baseDir}\\`);
    if (!existsSync(raw)) missing.push(raw);
  }
  return missing;
}

export function scanBinDir(dir: string): BinIssue[] {
  if (!existsSync(dir)) return [];
  const issues: BinIssue[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (/\.(?:old|bak|tmp)(?:\.\d+)*$/i.test(entry.name)) {
      issues.push({ kind: "stale", path: full, detail: "stale backup file" });
      continue;
    }
    let st;
    try {
      st = lstatSync(full);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) {
      let target = "";
      try {
        target = readlinkSync(full);
      } catch {}
      if (!existsSync(full)) {
        issues.push({
          kind: "broken-symlink",
          path: full,
          detail: target ? `missing target ${target}` : "dangling symlink",
        });
      }
      continue;
    }
    if (st.isFile() && st.size === 0) {
      issues.push({
        kind: "zero-byte",
        path: full,
        detail: "0-byte broken file",
      });
      continue;
    }
    if (
      process.platform === "win32" &&
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".cmd")
    ) {
      try {
        const text = readFileSync(full, "utf8");
        const missing = scanCmdBrokenTargets(text, dir);
        if (missing.length > 0) {
          issues.push({
            kind: "broken-cmd",
            path: full,
            detail: `missing ${missing.join(", ")}`,
          });
        }
      } catch {}
    }
  }
  return issues;
}

export function getUserEntries(): string[] {
  if (process.platform === "win32") {
    return readWinRegPath("HKCU\\Environment");
  }
  const profile = join(HOME, ".profile");
  if (existsSync(profile)) {
    const managed = extractManagedBlock(readFileSync(profile, "utf8"));
    if (managed.length > 0) return managed;
  }
  return (process.env.PATH ?? "").split(delimiter).filter(Boolean);
}

export function getMachineEntries(): string[] {
  if (process.platform === "win32") {
    return readWinRegPath(
      "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment",
    );
  }
  return [];
}

export function audit(binDirs = [LOCAL_BIN, CARGO_BIN, BUN_BIN]): PathAudit {
  const userEntries = getUserEntries();
  const machineEntries = getMachineEntries();
  const seenUser = new Set<string>();
  const selfDuplicates: string[] = [];
  for (const e of userEntries) {
    const k = norm(e);
    if (seenUser.has(k)) selfDuplicates.push(e);
    seenUser.add(k);
  }
  const machineSet = new Set(machineEntries.map(norm));
  const machineDuplicates = userEntries.filter((e) => machineSet.has(norm(e)));
  const all = [...userEntries, ...machineEntries];
  const missing = [...new Set(all)].filter((e) => !existsSync(e));
  const binIssues = binDirs.flatMap(scanBinDir);
  return {
    platform: process.platform,
    userEntries,
    machineEntries,
    missing,
    selfDuplicates,
    machineDuplicates,
    binIssues,
  };
}

export function whichAll(name: string): string[] {
  const pathEnv = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const exts =
    process.platform === "win32" ? ["", ".exe", ".cmd", ".bat", ".ps1"] : [""];
  const hits: string[] = [];
  const seen = new Set<string>();
  for (const dir of pathEnv) {
    for (const ext of exts) {
      const candidate = join(dir, `${name}${ext}`);
      if (existsSync(candidate)) {
        const key = norm(candidate);
        if (!seen.has(key)) {
          seen.add(key);
          hits.push(candidate);
        }
      }
    }
  }
  return hits;
}

export function setUserPath(next: string[]): void {
  if (process.platform === "win32") {
    writeWinRegPath(next);
    return;
  }
  for (const file of unixProfileFiles()) {
    const prev = existsSync(file) ? readFileSync(file, "utf8") : "";
    writeFileSync(file, applyManagedBlock(prev, next));
  }
}

export function addPathDir(dir: string, prepend = false): string[] {
  const target = resolve(dir);
  const cur = getUserEntries();
  const filtered = cur.filter((e) => norm(e) !== norm(target));
  const next = prepend ? [target, ...filtered] : [...filtered, target];
  setUserPath(next);
  return next;
}

export function rmPathDir(dir: string): string[] {
  const target = norm(resolve(dir));
  const cur = getUserEntries();
  const next = cur.filter((e) => norm(e) !== target && norm(e) !== norm(dir));
  setUserPath(next);
  return next;
}

export function linkBinary(name: string, target: string): string {
  mkdirSync(LOCAL_BIN, { recursive: true });
  const abs = resolve(target);
  if (!existsSync(abs)) throw new Error(`target does not exist: ${abs}`);
  if (process.platform === "win32") {
    const shim = join(LOCAL_BIN, `${name}.cmd`);
    const body =
      abs.endsWith(".ts") || abs.endsWith(".js")
        ? `@echo off\r\nbun run "${abs}" %*\r\n`
        : `@echo off\r\n"${abs}" %*\r\n`;
    writeFileSync(shim, body);
    return shim;
  }
  const dest = join(LOCAL_BIN, name);
  if (existsSync(dest)) unlinkSync(dest);
  if (abs.endsWith(".ts") || abs.endsWith(".js")) {
    writeFileSync(dest, `#!/usr/bin/env sh\nexec bun run "${abs}" "$@"\n`);
    chmodSync(dest, 0o755);
  } else {
    symlinkSync(abs, dest);
  }
  return dest;
}

export function unlinkBinary(name: string): boolean {
  const candidates =
    process.platform === "win32"
      ? [join(LOCAL_BIN, `${name}.cmd`), join(LOCAL_BIN, name)]
      : [join(LOCAL_BIN, name)];
  let removed = false;
  for (const c of candidates) {
    if (existsSync(c)) {
      unlinkSync(c);
      removed = true;
    }
  }
  return removed;
}

export function purge(apply = false): {
  removedPathEntries: string[];
  removedFiles: string[];
  skippedFiles: string[];
} {
  const report = audit();
  const machineSet = new Set(report.machineEntries.map(norm));
  const seen = new Set<string>();
  const kept: string[] = [];
  const removedPathEntries: string[] = [];
  for (const e of report.userEntries) {
    const k = norm(e);
    if (!existsSync(e) || seen.has(k) || machineSet.has(k)) {
      removedPathEntries.push(e);
      continue;
    }
    seen.add(k);
    kept.push(e);
  }
  const removedFiles: string[] = [];
  const skippedFiles: string[] = [];
  if (apply) {
    if (removedPathEntries.length > 0 && process.platform === "win32") {
      setUserPath(kept);
    }
    for (const issue of report.binIssues) {
      try {
        rmSync(issue.path, { force: true });
        removedFiles.push(issue.path);
      } catch {
        skippedFiles.push(issue.path);
      }
    }
  } else {
    for (const issue of report.binIssues) removedFiles.push(issue.path);
  }
  return { removedPathEntries, removedFiles, skippedFiles };
}

function help(): void {
  console.log(`binpath — cross-platform binary & PATH manager (Windows + Unix)

Usage:
  binpath status [--json]            Audit PATH duplicates/missing dirs and bin dir issues
  binpath purge [--apply] [--json]   Remove stale/broken shims, 0-byte files, and duplicate/missing PATH entries
  binpath which <name>               Show all matching executables in PATH order
  binpath add <dir> [--prepend]      Add directory to User PATH (HKCU or ~/.profile+rc)
  binpath rm <dir>                   Remove directory from User PATH
  binpath link <name> <target>       Create a shim/symlink in ~/.local/bin
  binpath unlink <name>              Remove a shim/symlink from ~/.local/bin`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const apply = args.includes("--apply");
  const prepend = args.includes("--prepend");
  const pos = args.filter((a) => !a.startsWith("-"));
  const cmd = pos[0] ?? "status";

  if (cmd === "help" || args.includes("--help") || args.includes("-h")) {
    help();
  } else if (cmd === "status" || cmd === "audit") {
    const rep = audit();
    if (json) console.log(JSON.stringify(rep, null, 2));
    else {
      console.log(
        `PATH (${rep.platform}): ${rep.userEntries.length} user, ${rep.machineEntries.length} machine`,
      );
      console.log(
        `Missing: ${rep.missing.length}, Self-dups: ${rep.selfDuplicates.length}, Machine-dups: ${rep.machineDuplicates.length}`,
      );
      console.log(`Bin issues: ${rep.binIssues.length}`);
      for (const d of rep.machineDuplicates)
        console.log(`  dup(machine): ${d}`);
      for (const m of rep.missing) console.log(`  missing: ${m}`);
      for (const i of rep.binIssues)
        console.log(`  [${i.kind}] ${i.path} (${i.detail})`);
    }
  } else if (cmd === "purge" || cmd === "doctor") {
    const res = purge(apply);
    if (json) console.log(JSON.stringify({ apply, ...res }, null, 2));
    else {
      console.log(
        `${apply ? "Applied" : "Dry-run"}: ${res.removedPathEntries.length} PATH entries, ${res.removedFiles.length} bin files (${res.skippedFiles.length} locked/skipped)`,
      );
      for (const p of res.removedPathEntries) console.log(`  path: -${p}`);
      for (const f of res.removedFiles) console.log(`  file: -${f}`);
      for (const s of res.skippedFiles) console.log(`  skip: ${s}`);
    }
  } else if (cmd === "which") {
    const name = pos[1];
    if (!name) throw new Error("usage: binpath which <name>");
    const hits = whichAll(name);
    if (json) console.log(JSON.stringify(hits, null, 2));
    else for (const h of hits) console.log(h);
  } else if (cmd === "add" || cmd === "prepend") {
    const dir = pos[1];
    if (!dir) throw new Error("usage: binpath add <dir> [--prepend]");
    const next = addPathDir(dir, cmd === "prepend" || prepend);
    console.log(`User PATH updated (${next.length} entries)`);
  } else if (cmd === "rm" || cmd === "remove") {
    const dir = pos[1];
    if (!dir) throw new Error("usage: binpath rm <dir>");
    const next = rmPathDir(dir);
    console.log(`User PATH updated (${next.length} entries)`);
  } else if (cmd === "link") {
    const [name, target] = [pos[1], pos[2]];
    if (!name || !target)
      throw new Error("usage: binpath link <name> <target>");
    console.log(`linked: ${linkBinary(name, target)}`);
  } else if (cmd === "unlink") {
    const name = pos[1];
    if (!name) throw new Error("usage: binpath unlink <name>");
    console.log(
      unlinkBinary(name) ? `unlinked: ${name}` : `not found: ${name}`,
    );
  } else {
    help();
    process.exitCode = 1;
  }
}
