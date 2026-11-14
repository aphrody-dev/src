// Forks aphrody-labs intégrés à third_party/ : origin = fork aphrody-labs, upstream = projet amont, remotes
// supplémentaires pour les forks tiers d'un même réseau (un projet = un clone, voir docs/core/ARCHITECTURE-ROOT.md).
// Idempotent. Le dossier existant est retrouvé dans src.lock.json par son URL (origin ou upstream), sinon le clone
// est créé à plat : third_party/<nom> (blobless + Scalar via `ay git clone`).
// Usage (racine du dépôt) : bun packages/machine/src/forks.ts [--check] [nom...]   puis : ay lock --lock-only
import { existsSync } from "node:fs";
import { join } from "node:path";

type Fork = {
  name: string;
  upstream: string;
  remotes?: Record<string, string>;
  sparse?: string[];
  fork?: string; // nom du fork aphrody-labs quand il diffère (collision, nom générique)
  dir?: string; // chemin relatif hors third_party/ (apps/<x>/upstream/<nom> : site, GUI)
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
  // Shell et outils (remplacement de Git Bash, MSYS2, pwsh, WSL)
  {
    name: "coreutils",
    upstream: gh("microsoft/coreutils"),
    remotes: { uutils: gh("uutils/coreutils") },
  },
  {
    name: "intelligent-terminal",
    upstream: gh("microsoft/intelligent-terminal"),
    remotes: { terminal: gh("microsoft/terminal") },
  },
  ...[
    "microsoft/git",
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
    "longbridge/nsh",
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
    "DioxusLabs/dioxus",
    "DioxusLabs/dioxus-components",
    "DioxusLabs/accessibility-cli",
    "DioxusLabs/blitz-chrome-devtools-frontend",
  ].map((r) => ({ name: r.split("/")[1]!, upstream: gh(r) })),
  {
    name: "wayland-c",
    upstream: "https://gitlab.freedesktop.org/wayland/wayland.git",
  },
  // Pile terminal centrale (2026-11-13) : intelligent-terminal et ses dépendances (tools/wta/Cargo.toml,
  // vcpkg.json, dep/nuget/packages.config), dépôts Rust/Zig/terminal/UI des orgs anomalyco, vercel-labs et
  // de la liste Microsoft du propriétaire. Voir docs/terminal/ARCHITECTURE.md.
  ...[
    "agentclientprotocol/agent-client-protocol",
    "ratatui/ratatui",
    "crossterm-rs/crossterm",
    "joshka/tui-markdown",
    "fmtlib/fmt",
    "microsoft/GSL",
    "open-source-parsers/jsoncpp",
    "CLIUtils/CLI11",
    "commonmark/cmark",
    "microsoft/wil",
    "microsoft/cppwinrt",
    "microsoft/inshellisense",
    "anomalyco/terminal-control",
    "anomalyco/ghostty-web",
    "anomalyco/rune",
    "anomalyco/strobe",
    "anomalyco/rift",
    "anomalyco/opentunnel",
    "anomalyco/hokum",
    "anomalyco/hex",
    "anomalyco/isocast",
    "anomalyco/deadbolt",
    "anomalyco/flicks",
    "anomalyco/clip",
    "vercel-labs/native",
    "vercel-labs/just-bash",
    "vercel-labs/opensrc",
    "vercel-labs/bincode-fork",
    "vercel-labs/virtue-fork",
    "vercel-labs/mdxjs-rs-turbopack",
    "microsoft/oxidizer",
    "microsoft/amplifier-constellation-instance",
    "microsoft/DevSkim",
    "microsoft/fast",
  ].map((r) => ({ name: r.split("/")[1]!, upstream: gh(r) })),
  { name: "acp-rust-sdk", upstream: gh("agentclientprotocol/rust-sdk") }, // aphrody-labs/rust-sdk = MCP
  { name: "microsoft-skills", upstream: gh("microsoft/skills") }, // aphrody-labs/skills = vercel-labs
  {
    name: "mcp-for-beginners",
    upstream: gh("microsoft/mcp-for-beginners"),
    // 2,8 Go dont translations/ et translated_images/ : cours anglais seulement (cône, racine incluse).
    sparse: [
      "00-Introduction",
      "01-CoreConcepts",
      "02-Security",
      "03-GettingStarted",
      "04-PracticalImplementation",
      "05-AdvancedTopics",
      "06-CommunityContributions",
      "07-LessonsfromEarlyAdoption",
      "08-BestPractices",
      "09-CaseStudy",
      "10-StreamliningAIWorkflowsBuildingAnMCPServerWithAIToolkit",
      "11-MCPServerHandsOnLabs",
      "12-tooling",
    ],
  },
  // Node.js (V8) : binaires officiels par `ay rt` ; ici la source de lib/ et src/ seulement (dépôt de plusieurs Go).
  {
    name: "node",
    upstream: gh("nodejs/node"),
    sparse: ["lib", "src", "doc/api"],
  },
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
  // Écosystème unixwin (2026-11-13) : tous les dépôts de l'org, décisions dans docs/unixwin/DEDUP.md. Code et
  // données dans third_party/<nom> ; site et GUI dans apps/unixwin/upstream/<nom> ; build et installation par
  // scripts/unixwin (just unixwin-*). unixwin/codex n'est pas un clone : remote `unixwin` de third_party/codex.
  ...[
    "niubash",
    "rubash",
    "WinuxCmd",
    "niu-git",
    "ruline",
    "oh-my-niu",
    "shellbench",
    "diffcorpus",
    "wpm-source",
    "wpm-artifacts",
    "winuxcmd-i18n",
    "winuxsh-profiles",
  ].map((n) => ({ name: n, upstream: gh(`unixwin/${n}`) })),
  { name: "unixwin-github", upstream: gh("unixwin/.github") }, // profil de l'org ; « .github » réservé côté aphrody-labs
  // Archive APT signée : hors chaîne (docs/deps/POLICY.md : jamais apt) ; scripts et métadonnées, sans paquets.
  {
    name: "unixwin-apt",
    upstream: gh("unixwin/apt"),
    sparse: [".github", "conf", "meta"],
  },
  ...["unixwin.dev", "wpm-gui"].map((n) => ({
    name: n,
    upstream: gh(`unixwin/${n}`),
    dir: `apps/unixwin/upstream/${n}`,
  })),
];

const repo = join(import.meta.dir, "..", "..", "..");
const check = process.argv.includes("--check");
// Filtre optionnel : noms de forks en arguments (bun forks.ts --check niubash rubash).
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));
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
  if (only.size && !only.has(f.name)) continue;
  const origin = gh(`aphrody-labs/${f.fork ?? f.name}`);
  const want: Record<string, string> = {
    origin,
    upstream: f.upstream,
    ...f.remotes,
  };
  const urls = new Set(Object.values(want).map(norm));
  const found = Object.entries(lock.repositories).find(
    ([, v]) => urls.has(norm(v.url)) || urls.has(norm(v.upstream_url)),
  )?.[0];
  const rel = found ?? f.dir ?? `third_party/${f.name}`;
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
