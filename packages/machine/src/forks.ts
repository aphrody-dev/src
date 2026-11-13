// Forks aphrody-labs intégrés à third_party/ : origin = fork aphrody-labs, upstream = projet amont, remotes
// supplémentaires pour les forks tiers d'un même réseau (un projet = un clone, voir docs/ARCHITECTURE-ROOT.md).
// Idempotent. Le dossier existant est retrouvé dans src.lock.json par son URL (origin ou upstream), sinon le clone
// est créé à plat : third_party/<nom> (blobless + Scalar via `ay git clone`).
// Usage (racine du dépôt) : bun packages/machine/src/forks.ts [--check]   puis : ay lock --lock-only
import { existsSync } from "node:fs";
import { join } from "node:path";

type Fork = {
  name: string;
  upstream: string;
  remotes?: Record<string, string>;
  sparse?: string[];
};
const gh = (r: string) => `https://github.com/${r}.git`;
const FORKS: Fork[] = [
  // Compatibilité NT / Linux (demande du 2026-11-12)
  {
    name: "LiberNT",
    upstream: gh("LiberNT/LiberNT"),
    remotes: { reactos: gh("reactos/reactos") },
  },
  {
    name: "linux",
    upstream:
      "https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git",
  },
  { name: "wine", upstream: "https://gitlab.winehq.org/wine/wine.git" }, // fork GitHub du miroir wine-mirror/wine
  {
    name: "mingw-w64",
    upstream: "https://git.code.sf.net/p/mingw-w64/mingw-w64",
  }, // fork du miroir GitHub non officiel
  // Shell et outils (remplacement de Git Bash, MSYS2, pwsh, WSL)
  ...[
    "unixwin/niubash",
    "unixwin/rubash",
    "unixwin/WinuxCmd",
    "unixwin/niu-git",
    "microsoft/git",
    "microsoft/coreutils",
    "uutils/findutils",
    "uutils/diffutils",
    "uutils/sed",
    "microsoft/edit",
    "microsoft/sudo",
    "microsoft/nvx",
    "microsoft/openvmm",
    "microsoft/litebox",
    "hyperlight-dev/hyperlight",
    "microsoft/mxc",
    "microsoft/WSL",
    "microsoft/winget-cli",
    "PowerShell/DSC",
    "PowerShell/PowerShell",
    "microsoft/terminal",
    "microsoft/intelligent-terminal",
    "microsoft/microsoft-ui-xaml",
    "microsoft/WindowsAppSDK",
    "microsoft/react-native-windows",
    "microsoft/PowerToys",
    "microsoft/skill-recorder",
    "microsoft/Oryx",
    "microsoft/node-api-dotnet",
    "microsoft/tui-test",
    "microsoft/windows-rs",
    "microsoft/windows-drivers-rs",
    "microsoft/Windows-rust-driver-samples",
    "vercel-labs/fx",
    "vercel-labs/wterm",
    "vercel-labs/skills",
    "microsoft/vcpkg",
    // candidats sh/bash
    "reubeno/brush",
    "hex2f/gash",
    "magicant/yash-rs",
    "nuta/nsh",
    "nixpulvis/oursh",
    "km-clay/shed",
    "mpecan/rable",
    "mayflower/wasmsh",
    "MrPicklePinosaur/shrs",
    "nushell/nushell",
    "fish-shell/fish-shell",
    // binutils (objets ELF/PE/COFF, éditeur de liens)
    "wild-linker/wild",
    "gimli-rs/object",
    "gimli-rs/addr2line",
    "m4b/goblin",
    "rust-embedded/cargo-binutils",
    "lccc-project/lc-binutils",
    "m4b/bingrep",
  ].map((r) => ({ name: r.split("/")[1]!, upstream: gh(r) })),
  { name: "uutils-coreutils", upstream: gh("uutils/coreutils") },
  { name: "redox-binutils", upstream: gh("redox-os/binutils") },
  {
    name: "winget-pkgs",
    upstream: gh("microsoft/winget-pkgs"),
    sparse: [
      "/*",
      "!/*/",
      "/Tools/",
      "/doc/",
      "/manifests/u/Unixwin/",
      "/manifests/m/Microsoft/Coreutils/",
    ],
  },
  { name: "webui", upstream: gh("microsoft/webui") },
  // Navigateurs, automatisation et crawl (2026-11-13), façade packages/chromium-bun/src/engines. Les clones déjà
  // présents (playwright, puppeteer, crawlee, apify-sdk-js, obscura, lightpanda, servo, blitz, stylo, taffy) gardent
  // origin = amont et remote aphrody = fork ; seuls les nouveaux passent ici.
  ...[
    "microsoft/playwright-python",
    "apify/apify-sdk-python",
    "apify/apify-cli",
    "apify/apify-client-js",
    "apify/apify-client-python",
    "apify/crawlee-python",
    "ChromeDevTools/chrome-devtools-mcp",
    "GoogleChromeLabs/chrome-for-testing",
    "DioxusLabs/anyrender",
    "DioxusLabs/blitz-website",
    "DioxusLabs/accessibility-cli",
    "DioxusLabs/blitz-chrome-devtools-frontend",
  ].map((r) => ({ name: r.split("/")[1]!, upstream: gh(r) })),
  // JavaScriptCore de bun (fork oven-sh/WebKit, 13 Go) : moteur JS, WTF et bmalloc seulement.
  {
    name: "WebKit",
    upstream: gh("oven-sh/WebKit"),
    remotes: { webkit: gh("WebKit/WebKit") },
    // `ay git clone --sparse` applique `git sparse-checkout set` en mode cône : des dossiers, pas des motifs.
    sparse: [
      "Source/JavaScriptCore",
      "Source/WTF",
      "Source/bmalloc",
      "Source/cmake",
    ],
  },
];

const repo = join(import.meta.dir, "..", "..", "..");
const check = process.argv.includes("--check");
const norm = (u = "") =>
  u
    .toLowerCase()
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
const lock = (await Bun.file(join(repo, "src.lock.json")).json()) as {
  repositories: Record<string, { url?: string; upstream_url?: string }>;
};
const run = (cwd: string, ...a: string[]) => {
  const p = Bun.spawnSync(a, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    ok: p.exitCode === 0,
    out: p.stdout.toString().trim(),
    err: p.stderr.toString().trim(),
  };
};

let drift = 0;
for (const f of FORKS) {
  const origin = gh(`aphrody-labs/${f.name}`);
  const want: Record<string, string> = {
    origin,
    upstream: f.upstream,
    ...f.remotes,
  };
  const urls = new Set(Object.values(want).map(norm));
  const found = Object.entries(lock.repositories).find(
    ([, v]) => urls.has(norm(v.url)) || urls.has(norm(v.upstream_url)),
  )?.[0];
  const rel = found ?? `third_party/${f.name}`;
  const dir = join(repo, rel);
  if (!existsSync(join(dir, ".git"))) {
    drift++;
    console.log(`absent  ${rel}`);
    if (check) continue;
    const args = [
      "ay",
      "git",
      "clone",
      "-d",
      "1",
      ...(f.sparse ?? []).flatMap((s) => ["--sparse", s]),
      "--",
      origin,
      dir,
    ];
    const c = run(repo, ...args);
    if (!c.ok) {
      console.log(`  ERREUR clone : ${c.err.split("\n").pop()}`);
      continue;
    }
  }
  for (const [name, url] of Object.entries(want)) {
    const cur = run(dir, "git", "remote", "get-url", name);
    if (cur.ok && norm(cur.out) === norm(url)) continue;
    drift++;
    console.log(
      `remote  ${rel} ${name}: ${cur.ok ? cur.out : "(absent)"} -> ${url}`,
    );
    if (!check)
      run(dir, "git", "remote", cur.ok ? "set-url" : "add", name, url);
  }
}
console.log(
  `${FORKS.length} forks, ${drift} écart(s)${check ? "" : " corrigé(s)"}`,
);
process.exit(check && drift ? 1 : 0);
