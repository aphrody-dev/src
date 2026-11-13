#!/usr/bin/env bun
// Generates packages/machine/toolchains.lock.toml: every toolchain src needs, pinned (version + source + checksum),
// with the hosts that install it. Checksums come from the upstream itself: GitHub release asset digests (gh api),
// published .sha256 files, go.dev and .NET release metadata, the npm registry and the crates.io index.
//   bun scripts/toolchains-lock.ts            regenerate the lock (needs gh auth)
//   bun scripts/toolchains-lock.ts --check    fail when a pinned entry no longer resolves
// Consumers: infra/fleet/bootstrap/*.sh (Linux hosts), infra/docker/Dockerfile (build args), packages/machine (PC).
const out = new URL("../packages/machine/toolchains.lock.toml", import.meta.url);

type Plat = "windows-x86_64" | "linux-x86_64" | "linux-aarch64";
type Host = "pc" | "prd" | "fr1" | "fr2" | "image";
type Spec = {
  name: string;
  version: string;
  hosts: Host[];
  why: string;
  // github: release assets (digest from the API); url: files with a published sha256 next to them;
  // go/dotnet: vendor release metadata; npm/crate: registry integrity; distro: system package manager (version floor).
  source: "github" | "url" | "go" | "dotnet" | "npm" | "crate" | "rustup-dist" | "distro" | "winget";
  repo?: string;
  tag?: string;
  assets?: Partial<Record<Plat, string>>;
  sumFile?: string; // url source: "{url}.sha256"
  pkg?: string; // npm / crate / distro / winget id
  extra?: Record<string, string | string[]>;
};

const v = (s: string, version: string) => s.replaceAll("{version}", version);

const specs: Spec[] = [
  { name: "rust", version: "nightly-2026-11-12", hosts: ["pc", "prd", "fr1", "image"], source: "rustup-dist", why: "rust-toolchain.toml; rustc 3ef0c22cd, LLVM 23.1.5 (= clang, cross-language LTO)",
    extra: { components: ["rustfmt", "clippy", "rust-src", "rust-analyzer", "llvm-tools"], targets: ["x86_64-unknown-linux-musl", "aarch64-unknown-linux-musl", "aarch64-unknown-linux-gnu", "wasm32-unknown-unknown", "wasm32-wasip2"] } },
  { name: "rustup", version: "1.29.2", hosts: ["pc", "prd", "fr1", "image"], source: "url", sumFile: "{url}.sha256", why: "toolchain manager",
    assets: { "windows-x86_64": "https://static.rust-lang.org/rustup/archive/{version}/x86_64-pc-windows-msvc/rustup-init.exe", "linux-x86_64": "https://static.rust-lang.org/rustup/archive/{version}/x86_64-unknown-linux-musl/rustup-init", "linux-aarch64": "https://static.rust-lang.org/rustup/archive/{version}/aarch64-unknown-linux-musl/rustup-init" } },
  { name: "llvm", version: "23.1.5", hosts: ["pc", "prd", "fr1"], source: "github", repo: "llvm/llvm-project", tag: "llvmorg-{version}", why: "clang/clang-cl/lld shared with Chromium and rustc (docs/llvm/UNIFIED-TOOLCHAIN.md); bindgen/clang-sys, aws-lc-sys",
    assets: { "windows-x86_64": "clang+llvm-{version}-x86_64-pc-windows-msvc.tar.xz", "linux-x86_64": "LLVM-{version}-Linux-X64.tar.xz", "linux-aarch64": "LLVM-{version}-Linux-ARM64.tar.xz" } },
  { name: "cmake", version: "4.4.5", hosts: ["pc", "prd", "fr1", "image"], source: "github", repo: "Kitware/CMake", tag: "v{version}", why: "aws-lc-sys, llama.cpp, C++ crates",
    assets: { "windows-x86_64": "cmake-{version}-windows-x86_64.zip", "linux-x86_64": "cmake-{version}-linux-x86_64.tar.gz", "linux-aarch64": "cmake-{version}-linux-aarch64.tar.gz" } },
  { name: "ninja", version: "1.13.2", hosts: ["pc", "prd", "fr1", "image"], source: "github", repo: "ninja-build/ninja", tag: "v{version}", why: "cmake generator, Chromium",
    assets: { "windows-x86_64": "ninja-win.zip", "linux-x86_64": "ninja-linux.zip", "linux-aarch64": "ninja-linux-aarch64.zip" } },
  { name: "protoc", version: "36.2", hosts: ["pc", "prd", "image"], source: "github", repo: "protocolbuffers/protobuf", tag: "v{version}", why: "prost-build/tonic-build (lore-proto, lore-server)",
    assets: { "windows-x86_64": "protoc-{version}-win64.zip", "linux-x86_64": "protoc-{version}-linux-x86_64.zip", "linux-aarch64": "protoc-{version}-linux-aarch_64.zip" } },
  { name: "bun", version: "1.4.4", hosts: ["pc", "prd", "fr1", "fr2", "image"], source: "github", repo: "oven-sh/bun", tag: "bun-v{version}", why: "every JS/TS workspace (bun.lock), ai-os, apps",
    assets: { "windows-x86_64": "bun-windows-x64.zip", "linux-x86_64": "bun-linux-x64.zip", "linux-aarch64": "bun-linux-aarch64.zip" } },
  { name: "just", version: "1.59.0", hosts: ["pc", "prd", "fr1", "image"], source: "github", repo: "casey/just", tag: "{version}", why: "justfile",
    assets: { "windows-x86_64": "just-{version}-x86_64-pc-windows-msvc.zip", "linux-x86_64": "just-{version}-x86_64-unknown-linux-musl.tar.gz", "linux-aarch64": "just-{version}-aarch64-unknown-linux-musl.tar.gz" } },
  { name: "sccache", version: "0.19.0", hosts: ["pc", "prd", "fr1"], source: "github", repo: "mozilla/sccache", tag: "v{version}", why: "rustc/clang cache",
    assets: { "windows-x86_64": "sccache-v{version}-x86_64-pc-windows-msvc.zip", "linux-x86_64": "sccache-v{version}-x86_64-unknown-linux-musl.tar.gz", "linux-aarch64": "sccache-v{version}-aarch64-unknown-linux-musl.tar.gz" } },
  { name: "uv", version: "0.13.7", hosts: ["pc", "prd", "fr1"], source: "github", repo: "astral-sh/uv", tag: "{version}", why: "apps/r2b, packages/ai-os/python, crates/agent-py (pyproject + uv.lock)",
    assets: { "windows-x86_64": "uv-x86_64-pc-windows-msvc.zip", "linux-x86_64": "uv-x86_64-unknown-linux-musl.tar.gz", "linux-aarch64": "uv-aarch64-unknown-linux-musl.tar.gz" } },
  { name: "python", version: "3.14", hosts: ["pc", "prd", "fr1"], source: "distro", pkg: "python", why: "uv-managed interpreters; Chromium gn/depot_tools (fr1)" },
  { name: "go", version: "1.27.4", hosts: ["pc", "prd", "fr1", "image"], source: "go", why: "infra/ (src-deploy, deploy engine, go test ./...)",
    assets: { "windows-x86_64": "go{version}.windows-amd64.zip", "linux-x86_64": "go{version}.linux-amd64.tar.gz", "linux-aarch64": "go{version}.linux-arm64.tar.gz" } },
  { name: "zig", version: "0.17.1", hosts: ["pc", "prd", "image"], source: "url", why: "cargo-zigbuild cross-linking (musl amd64/arm64 images), infra cshared",
    assets: { "windows-x86_64": "https://ziglang.org/download/{version}/zig-x86_64-windows-{version}.zip", "linux-x86_64": "https://ziglang.org/download/{version}/zig-x86_64-linux-{version}.tar.xz", "linux-aarch64": "https://ziglang.org/download/{version}/zig-aarch64-linux-{version}.tar.xz" } },
  { name: "cargo-zigbuild", version: "0.24.1", hosts: ["prd", "image"], source: "github", repo: "rust-cross/cargo-zigbuild", tag: "v{version}", why: "multi-arch Rust images without qemu",
    assets: { "linux-x86_64": "cargo-zigbuild-x86_64-unknown-linux-musl.tar.xz", "linux-aarch64": "cargo-zigbuild-aarch64-unknown-linux-gnu.tar.xz" } },
  { name: "cargo-chef", version: "0.1.77", hosts: ["image"], source: "crate", pkg: "cargo-chef", why: "Rust dependency layer caching in infra/docker/Dockerfile" },
  { name: "cbindgen", version: "0.29.4", hosts: ["pc", "prd"], source: "crate", pkg: "cbindgen", why: "just core-header (crates/core-capi)" },
  { name: "cargo-nextest", version: "0.9.151", hosts: ["pc", "prd", "fr1"], source: "github", repo: "nextest-rs/nextest", tag: "cargo-nextest-{version}", why: "cargo nt alias",
    assets: { "windows-x86_64": "cargo-nextest-{version}-x86_64-pc-windows-msvc.zip", "linux-x86_64": "cargo-nextest-{version}-x86_64-unknown-linux-musl.tar.gz", "linux-aarch64": "cargo-nextest-{version}-aarch64-unknown-linux-gnu.tar.gz" } },
  { name: "dotnet-sdk", version: "11.0.100", hosts: ["pc", "prd"], source: "dotnet", why: "apps/nt, packages/ai-os/native/relay-windows (NativeAOT); global.json",
    assets: { "windows-x86_64": "win-x64", "linux-x86_64": "linux-x64", "linux-aarch64": "linux-arm64" } },
  { name: "ffmpeg", version: "9.0.2", hosts: ["pc", "prd", "image"], source: "winget", pkg: "Gyan.FFmpeg.Shared", why: "crates/tv-ffmpeg (ffmpeg-next, dynamic): headers + import libs; Linux = distro ffmpeg/ffmpeg-dev",
    extra: { env: "FFMPEG_DIR", linux: "pacman ffmpeg | apk ffmpeg-dev | apt libavcodec-dev libavformat-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev" } },
  { name: "nasm", version: "3.02", hosts: ["pc"], source: "winget", pkg: "NASM.NASM", why: "aws-lc-sys assembly on Windows" },
  { name: "git-lfs", version: "3.8.0", hosts: ["pc", "prd", "fr1"], source: "github", repo: "git-lfs/git-lfs", tag: "v{version}", why: "LFS assets in apps/* submodules",
    assets: { "windows-x86_64": "git-lfs-windows-amd64-v{version}.zip", "linux-x86_64": "git-lfs-linux-amd64-v{version}.tar.gz", "linux-aarch64": "git-lfs-linux-arm64-v{version}.tar.gz" } },
  { name: "b3sum", version: "1.8.7", hosts: ["pc", "prd", "fr1"], source: "github", repo: "BLAKE3-team/BLAKE3", tag: "{version}", why: "depot-artifacts.toml verification",
    assets: { "windows-x86_64": "b3sum_windows_x64_bin.exe", "linux-x86_64": "b3sum_linux_x64_bin" } },
  { name: "gh", version: "2.103.3", hosts: ["pc", "prd", "fr1"], source: "github", repo: "cli/cli", tag: "v{version}", why: "GitHub API, releases, GHCR login",
    assets: { "windows-x86_64": "gh_{version}_windows_amd64.zip", "linux-x86_64": "gh_{version}_linux_amd64.tar.gz", "linux-aarch64": "gh_{version}_linux_arm64.tar.gz" } },
  { name: "cf", version: "1.0.0-beta.31", hosts: ["pc", "prd"], source: "npm", pkg: "cf", why: "Cloudflare CLI (projects without wrangler config)" },
  { name: "wrangler", version: "4.161.0", hosts: ["pc", "prd"], source: "npm", pkg: "wrangler", why: "apps/aphrody, apps/aphrody-app, apps/r2-site workers" },
  { name: "docker-engine", version: "29.9.2", hosts: ["prd", "fr1", "fr2"], source: "distro", pkg: "docker", why: "images (infra/docker), compose on prd/fr2; PC uses `docker context` prd over ssh (no WSL)",
    extra: { buildx: "0.38", compose: "v2" } },
  { name: "caddy", version: "2.11.9", hosts: ["pc"], source: "github", repo: "caddyserver/caddy", tag: "v{version}", why: "local HTTP/3 front (ay deploy caddyfile); fr2 edge stays nginx",
    assets: { "windows-x86_64": "caddy_{version}_windows_amd64.zip", "linux-x86_64": "caddy_{version}_linux_amd64.tar.gz", "linux-aarch64": "caddy_{version}_linux_arm64.tar.gz" } },
  { name: "nginx", version: "1.29", hosts: ["fr2", "prd"], source: "distro", pkg: "nginx", why: "fr2 vhosts/CDN edge, prd vhosts" },
  { name: "cloudflared", version: "2026.10.7", hosts: ["pc", "prd", "fr1", "fr2"], source: "github", repo: "cloudflare/cloudflared", tag: "{version}", why: "tunnels (prd mig-prd/prod), Access",
    assets: { "windows-x86_64": "cloudflared-windows-amd64.exe", "linux-x86_64": "cloudflared-linux-amd64", "linux-aarch64": "cloudflared-linux-arm64" } },
  { name: "llama.cpp", version: "b12317", hosts: ["pc", "image"], source: "github", repo: "ggml-org/llama.cpp", tag: "{version}", why: "ai-os local models (llama-server); image = upstream ghcr.io/ggml-org/llama.cpp:server-{version}",
    assets: { "windows-x86_64": "llama-{version}-bin-win-vulkan-x64.zip" } },
];

async function sh(cmd: string[]): Promise<string> {
  const p = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const [o, e, c] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  if (c !== 0) throw new Error(`${cmd.join(" ")}: ${e.trim()}`);
  return o;
}
const json = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json() as Promise<any>;
};
const text = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
};

type Art = { url: string; sha256?: string; sha512?: string };
async function resolve(s: Spec): Promise<{ arts: Partial<Record<Plat, Art>>; note?: string }> {
  const arts: Partial<Record<Plat, Art>> = {};
  const ver = s.version;
  switch (s.source) {
    case "github": {
      const tag = v(s.tag ?? "{version}", ver);
      const rel = JSON.parse(await sh(["gh", "api", `repos/${s.repo}/releases/tags/${tag}`]));
      for (const [plat, a] of Object.entries(s.assets ?? {}) as [Plat, string][]) {
        const name = v(a, ver);
        const asset = rel.assets.find((x: any) => x.name === name);
        if (!asset) throw new Error(`${s.repo}@${tag}: no asset ${name}`);
        arts[plat] = { url: asset.browser_download_url, sha256: asset.digest?.replace(/^sha256:/, "") };
      }
      return { arts };
    }
    case "url":
      for (const [plat, a] of Object.entries(s.assets ?? {}) as [Plat, string][]) {
        const url = v(a, ver);
        let sha256: string | undefined;
        if (s.sumFile) sha256 = (await text(s.sumFile.replace("{url}", url))).trim().split(/\s+/)[0];
        else if (s.name === "zig") {
          const idx = await json("https://ziglang.org/download/index.json");
          const key = { "windows-x86_64": "x86_64-windows", "linux-x86_64": "x86_64-linux", "linux-aarch64": "aarch64-linux" }[plat];
          sha256 = idx[ver]?.[key]?.shasum;
        }
        arts[plat] = { url, sha256 };
      }
      return { arts };
    case "go": {
      const all = await json("https://go.dev/dl/?mode=json&include=all");
      const rel = all.find((r: any) => r.version === `go${ver}`);
      if (!rel) throw new Error(`go${ver} not on go.dev`);
      for (const [plat, a] of Object.entries(s.assets ?? {}) as [Plat, string][]) {
        const f = rel.files.find((x: any) => x.filename === v(a, ver));
        arts[plat] = { url: `https://go.dev/dl/${f.filename}`, sha256: f.sha256 };
      }
      return { arts };
    }
    case "dotnet": {
      const meta = await json(`https://builds.dotnet.microsoft.com/dotnet/release-metadata/${ver.split(".").slice(0, 2).join(".")}/releases.json`);
      const rel = meta.releases.find((r: any) => r.sdk?.version === ver);
      for (const [plat, rid] of Object.entries(s.assets ?? {}) as [Plat, string][]) {
        const f = rel.sdk.files.find((x: any) => x.rid === rid && (x.name.endsWith(".tar.gz") || (rid.startsWith("win") && x.name.endsWith(".exe"))) && (rid.startsWith("win") ? x.name.endsWith(".exe") : true));
        arts[plat] = { url: f.url, sha512: f.hash };
      }
      return { arts, note: `runtime ${rel["release-version"]}, released ${rel["release-date"]}` };
    }
    case "npm": {
      const m = await json(`https://registry.npmjs.org/${s.pkg}/${ver}`);
      return { arts: {}, note: `npm ${s.pkg}@${ver} integrity ${m.dist.integrity}` };
    }
    case "crate": {
      const m = await json(`https://crates.io/api/v1/crates/${s.pkg}/${ver}`);
      return { arts: {}, note: `crates.io ${s.pkg}@${ver} cksum ${m.version.checksum}` };
    }
    case "rustup-dist": {
      const date = ver.replace(/^nightly-/, "");
      const sum = (await text(`https://static.rust-lang.org/dist/${date}/channel-rust-nightly.toml.sha256`)).trim().split(/\s+/)[0];
      return { arts: {}, note: `channel manifest https://static.rust-lang.org/dist/${date}/channel-rust-nightly.toml sha256 ${sum}` };
    }
    default:
      return { arts: {} };
  }
}

const q = (x: string) => JSON.stringify(x);
const lines = [
  "# GENERATED by scripts/toolchains-lock.ts — do not edit by hand; change the spec there and rerun.",
  "# Every toolchain src needs, pinned: version + upstream source + checksum (sha256, sha512 for .NET).",
  "# hosts: pc (Windows 11 workstation, install only), prd (USA, general builds + backends),",
  "#        fr1 (Chromium/LLVM builds only), fr2 (edge runtime only), image (infra/docker/Dockerfile).",
  "# Installers: infra/fleet/bootstrap/<role>.sh (Linux), packages/machine (PC), Dockerfile build args.",
  `generated = ${q(new Date().toISOString().slice(0, 10))}`,
  "",
];
let failed = 0;
for (const s of specs) {
  let r: Awaited<ReturnType<typeof resolve>>;
  try {
    r = await resolve(s);
  } catch (e) {
    failed++;
    console.error(`x ${s.name}: ${(e as Error).message}`);
    r = { arts: {}, note: `UNRESOLVED: ${(e as Error).message}` };
  }
  lines.push(`[toolchain.${q(s.name)}]`, `version = ${q(s.version)}`, `source = ${q(s.source)}`);
  if (s.repo) lines.push(`repo = ${q(s.repo)}`);
  if (s.pkg) lines.push(`package = ${q(s.pkg)}`);
  lines.push(`hosts = [${s.hosts.map(q).join(", ")}]`, `why = ${q(s.why)}`);
  for (const [k, val] of Object.entries(s.extra ?? {})) lines.push(`${k} = ${Array.isArray(val) ? `[${val.map(q).join(", ")}]` : q(val)}`);
  if (r.note) lines.push(`note = ${q(r.note)}`);
  for (const [plat, a] of Object.entries(r.arts)) {
    const sum = a.sha256 ? `sha256 = ${q(a.sha256)}` : a.sha512 ? `sha512 = ${q(a.sha512)}` : `sha256 = "" # upstream publishes none`;
    lines.push(`${plat} = { url = ${q(a.url)}, ${sum} }`);
  }
  lines.push("");
  console.log(`ok ${s.name} ${s.version}`);
}
if (!process.argv.includes("--check")) await Bun.write(out, lines.join("\n"));
if (failed) process.exit(1);
