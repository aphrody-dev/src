#!/usr/bin/env bun
// The one LLVM toolchain of src: Chromium 157's clang/lld and the rustc Chromium builds on the same
// LLVM (third_party/toolchain-157.toml, docs/native/llvm/CHROMIUM-157-TOOLCHAIN.md). Downloads the host's
// packages from Chromium's public bucket (source_url), checks source_sha256, unpacks them under
// $AY_TOOLCHAIN_DIR (default ~/.local/share/aphrody/toolchain/157) and links the rust package as
// the rustup toolchain `chromium-157` that rust-toolchain.toml names.
//   bun scripts/toolchain.ts install   idempotent: skips packages already unpacked
//   bun scripts/toolchain.ts status    paths, clang and rustc versions, LLVM of each
//   bun scripts/toolchain.ts env       CC/CXX/AR/linker lines for a shell (eval "$(...)")
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const root = join(import.meta.dir, "..");
const manifest = Bun.TOML.parse(
  await Bun.file(join(root, "third_party/toolchain-157.toml")).text(),
) as {
  toolchain: { llvm_version: string; rustc_version: string };
  file: {
    platform: string;
    package: string;
    source_url: string;
    source_sha256: string;
  }[];
};
const platform =
  process.platform === "win32"
    ? "windows-x64"
    : process.platform === "linux" && process.arch === "x64"
      ? "linux-x64"
      : "";
const dir =
  process.env.AY_TOOLCHAIN_DIR ||
  join(homedir(), ".local/share/aphrody/toolchain/157");
const RUSTUP_NAME = "chromium-157";
const exe = process.platform === "win32" ? ".exe" : "";
const kind = (pkg: string) =>
  pkg.startsWith("rust-toolchain") ? "rust" : "clang";

async function install(): Promise<number> {
  if (!platform) {
    console.error(
      `toolchain: no Chromium 157 package for ${process.platform}-${process.arch}`,
    );
    return 2;
  }
  for (const f of manifest.file.filter((x) => x.platform === platform)) {
    const dest = join(dir, kind(f.package));
    const stamp = join(dest, `.${f.package}`);
    if (existsSync(stamp)) continue;
    const res = await fetch(f.source_url);
    if (!res.ok) throw new Error(`${f.source_url}: HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const sha = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
    if (sha !== f.source_sha256)
      throw new Error(`${f.package}: sha256 ${sha} != ${f.source_sha256}`);
    const tmp = join(tmpdir(), `${f.package}.tar.xz`);
    await Bun.write(tmp, bytes);
    mkdirSync(dest, { recursive: true });
    // Archive on stdin, cwd = dest: no drive-letter path for tar (GNU tar of Git for Windows reads `C:...`
    // as host:path, "Cannot connect to C: resolve failed", hal run 43368917150).
    await $`tar -xJf - < ${tmp}`.cwd(dest);
    rmSync(tmp, { force: true });
    writeFileSync(stamp, `${f.source_sha256}\n`);
    console.log(`installed ${f.package} -> ${dest}`);
  }
  await $`rustup toolchain link ${RUSTUP_NAME} ${join(dir, "rust")}`;
  console.log(`rustup toolchain ${RUSTUP_NAME} -> ${join(dir, "rust")}`);
  return status();
}

async function status(): Promise<number> {
  // Chromium's Windows package ships clang-cl and lld-link only (no clang driver).
  const clang = join(
    dir,
    "clang/bin",
    process.platform === "win32" ? "clang-cl.exe" : "clang",
  );
  const rustc = join(dir, "rust/bin", `rustc${exe}`);
  console.log(
    `dir ${dir}  expected LLVM ${manifest.toolchain.llvm_version}, ${manifest.toolchain.rustc_version}`,
  );
  let ok = true;
  for (const [name, bin, args] of [
    ["clang", clang, ["--version"]],
    ["rustc", rustc, ["-vV"]],
  ] as const) {
    if (!existsSync(bin)) {
      console.log(`${name}: missing (bun scripts/toolchain.ts install)`);
      ok = false;
      continue;
    }
    const out = (await $`${bin} ${args}`.text()).split("\n");
    const line =
      name === "clang"
        ? out[0]
        : out.filter((l) => /^(release|LLVM version):/.test(l)).join(", ");
    console.log(`${name}: ${line}`);
  }
  return ok ? 0 : 1;
}

function env(): number {
  const bin = join(dir, "clang/bin");
  if (process.platform === "win32") {
    // MSVC ABI: clang-cl compiles, lld-link links (LTO objects need an LLVM-aware linker, not link.exe).
    console.log(
      [
        `export CC=${join(bin, "clang-cl.exe")} CXX=${join(bin, "clang-cl.exe")}`,
        `export RUSTFLAGS="-Clinker-plugin-lto -Clinker=${join(bin, "lld-link.exe")}"`,
      ].join("\n"),
    );
    return 0;
  }
  console.log(
    [
      `export CC=${join(bin, "clang")} CXX=${join(bin, "clang++")} AR=${join(bin, "llvm-ar")}`,
      `export RUSTFLAGS="-Clinker-plugin-lto -Clinker=${join(bin, "clang")} -Clink-arg=-fuse-ld=lld"`,
    ].join("\n"),
  );
  return 0;
}

const cmd = process.argv[2] ?? "status";
process.exit(
  cmd === "install" ? await install() : cmd === "env" ? env() : await status(),
);
