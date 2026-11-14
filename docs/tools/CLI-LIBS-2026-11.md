# Classement CLI et libs, novembre 2026

Date : 2026-11-14. Versions et dates lues via `gh api repos/<repo>/releases/latest` le jour meme. Mesures : `hyperfine 2.0.0 -N -w 2 -r 10`, PC i7-13700F, Windows 11.
Declaration : `C:\src\tools.toml` (`ay up --list`). Politique : bun remplace tout outil JS qu'il couvre ; rg, fd, jaq, b3sum prioritaires.

## Gagnants par categorie

| Categorie | Gagnant | Version (date) | Repo | Perdant ecarte | Mesure |
|---|---|---|---|---|---|
| Recherche | rg | 15.2.0 (2026-07-15) | [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep) | grep -r | 20.1 ms vs 554.1 ms sur docs/ (27x) |
| Fichiers | fd | v10.5.2 (2026-11-07) | [sharkdp/fd](https://github.com/sharkdp/fd) | find | 19.9 ms (find non mesurable sous hyperfine, sortie en erreur) |
| JSON | jaq | v3.1.2 (2026-10-21) | [01mf02/jaq](https://github.com/01mf02/jaq) | jq (absent), yq pour JSON | 8.8 ms vs 21.1 ms yq (2.4x) |
| YAML | yq | v4.54.3 (2026-11-09) | [mikefarah/yq](https://github.com/mikefarah/yq) | - | - |
| Hash | b3sum | 1.8.7 (2026-08-20) | [BLAKE3-team/BLAKE3](https://github.com/BLAKE3-team/BLAKE3) | sha256sum | 44.5 ms vs 137.2 ms sur 229 Mo (3.1x) |
| HTTP client | xh | v0.26.3 (2026-10-21) | [ducaale/xh](https://github.com/ducaale/xh) | curl interactif | - |
| HTTP charge | oha | v1.17.0 (2026-11-14) | [hatoo/oha](https://github.com/hatoo/oha) | - | - |
| Git UX | gix / jj / delta / lazygit | v0.61.0 / v0.47.1 / 0.20.1 / v0.66.3 | [gitoxide](https://github.com/GitoxideLabs/gitoxide), [jj](https://github.com/jj-vcs/jj), [delta](https://github.com/dandavison/delta), [lazygit](https://github.com/jesseduffield/lazygit) | gitui (derniere release 2026-03-24, v0.28.1) | - |
| Listing | eza | v0.23.5 (2026-07-09) | [eza-community/eza](https://github.com/eza-community/eza) | exa (abandonne) | exa 11.5 ms vs eza 13.4 ms : parite, eza maintenu |
| Disque | dust, dua | v1.2.7 (2026-11-01), v3.0.3 (2026-11-12) | [bootandy/dust](https://github.com/bootandy/dust), [Byron/dua-cli](https://github.com/Byron/dua-cli) | gdu (absent) | - |
| Processus | bottom | 0.15.0 (2026-11-01) | [ClementTsang/bottom](https://github.com/ClementTsang/bottom) | procs (derniere release 2026-06-25, non installe) | - |
| Benchmark | hyperfine | v2.0.0 (2026-10-07) | [sharkdp/hyperfine](https://github.com/sharkdp/hyperfine) | - | - |
| Utilitaires shell | zoxide, fzf, sd, uutils | v0.10.0, v0.75.0, v1.1.0, 0.12.0 | [zoxide](https://github.com/ajeetdsouza/zoxide), [fzf](https://github.com/junegunn/fzf), [sd](https://github.com/chmln/sd), [uutils](https://github.com/uutils/coreutils) | - | sd 7.6 ms vs sed 4.8 ms : sed plus rapide sur petit fichier, sd garde pour la syntaxe regex |
| Compression | zstd, ouch | v1.5.7 (2025-02-19), 0.8.3 (2026-09-13) | [facebook/zstd](https://github.com/facebook/zstd), [ouch-org/ouch](https://github.com/ouch-org/ouch) | pigz | - |
| Python | uv, ruff, ty | 0.13.8, 0.17.5, 0.0.104 (2026-11-12/13) | [uv](https://github.com/astral-sh/uv), [ruff](https://github.com/astral-sh/ruff), [ty](https://github.com/astral-sh/ty) | pip, black, mypy | - |
| Rust | cargo-nextest, cargo-binstall, sccache, cargo-llvm-cov | 0.9.152, v1.27.0, v0.19.0, v0.9.1 | [nextest](https://github.com/nextest-rs/nextest), [binstall](https://github.com/cargo-bins/cargo-binstall), [sccache](https://github.com/mozilla/sccache), [llvm-cov](https://github.com/taiki-e/cargo-llvm-cov) | cargo-benchcmp (obsolete, criterion) | - |
| Conteneurs | podman 6.2.0 (2026-11-10), nerdctl v2.4.2 | [containers/podman](https://github.com/containers/podman), [containerd/nerdctl](https://github.com/containerd/nerdctl) | - | non installes ici (purge Docker geree par un autre agent) | - |
| Kubernetes | kubectl v1.37.2 (2026-10-28), k9s v0.51.0 | [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes), [derailed/k9s](https://github.com/derailed/k9s) | - | absents du PC | - |
| LSP | clangd 23.1.0, rust-analyzer 2026-11-09, typescript 7.0.2 (tsgo) | [clangd](https://github.com/clangd/clangd), [rust-analyzer](https://github.com/rust-lang/rust-analyzer), [typescript-go](https://github.com/microsoft/typescript-go) | - | - | - |
| JS | bun v1.4.4 (release 2026-10-22, ay installe 1.4.5) | [oven-sh/bun](https://github.com/oven-sh/bun) | node, npm, npx, pnpm, tsc, prettier, esbuild, swc, ts-node | - | - |
| Lint/format | bun fmt/lint ; oxlint 1.93.0 et biome 2.6.7 seulement si bun ne couvre pas | [oxc](https://github.com/oxc-project/oxc), [biome](https://github.com/biomejs/biome) | - | - | - |
| Code structurel | ast-grep 0.51.2 (2026-11-11) | [ast-grep](https://github.com/ast-grep/ast-grep) | - | - | - |

Limite : le benchmark `fd` vs `find` a echoue (find.exe de coreutils retourne une erreur sous hyperfine), cette ligne n'est pas une mesure comparative. Les categories sans colonne "Mesure" sont classees sur activite du depot et usage, pas sur benchmark.

## Inventaire (2026-11-14)

| Emplacement | Contenu | Declare dans tools.toml |
|---|---|---|
| `~/.local/bin` | ay, wck, ske, n2b, ruff, ty, sccache, btm, lazygit, b3sum, wasm-*, binaires locaux | oui pour l'outillage tiers ; non pour les binaires maison (ay-*, ske, wck...) construits depuis le depot |
| `~/.cargo/bin` | ~69 apres purge : rustup, cargo-*, jaq, gix, rust-analyzer | partiel (cargo-nextest, cargo-binstall, gitoxide declares ; cargo-deny, audit, hack, machete, shear, sweep, outdated non declares) |
| `~/.bun/bin` | 50+ paquets globaux (`bun pm ls -g`) | wrangler, agent-browser declares ; le reste hors manifeste |
| WinGet Links | rg, fd, eza, dust, dua, delta, jj, yq, xh, zoxide, fzf, sd, uv, hyperfine, bat, tokei, watchexec | rg, fd, eza, dust, delta, jj, yq, xh, zoxide, sd, uv, hyperfine, bat, tokei, watchexec declares |
| uv tool | graphifyy, litellm | non |
| scoop, choco, pipx, npm global, `~/go/bin` | absents | - |
| `~/.local/share/ay/tools` | binaryen, bun, cmake, llama.cpp, ollama, rio, rustpython, wabt, wasi-sdk, wasm-bindgen, whisper.cpp | oui |

## Purge effectuee

| Element | Raison |
|---|---|
| `~/.local/bin/uutils.exe` | doublon octet pour octet de `coreutils.exe` |
| `~/.cargo/bin/coreutils.exe` | doublon ; `coreutils` est declare et installe par `ay up` dans `~/.local/bin` (reinstalle, sha256 ok) |
| `~/.cargo/bin/exa.exe` | exa abandonne, remplace par eza |
| `~/.cargo/bin/cargo-benchcmp.exe` | obsolete, remplace par criterion |
| `~/.local/bin/rg-core.exe` | copie de bun de 229 Mo (rg-core v1.4.4 Bun 1.4.5), doublon de bun, non reference |
| `~/bin/xh.exe`, `~/bin/xhs.exe` | doublons de xh WinGet |
| bun global : tsc-ts, size-limit, next-sitemap, @swc/cli | couverts par bun / typescript, non references dans le depot |

Non touches : PATH, profils shell, git config, WSL, Docker (autres agents), System32.

## Declares dans tools.toml ce jour

jaq 3.1.2, b3sum 1.8.7, oha 1.17.0, fzf 0.75.0, dua 3.0.3, ouch 0.8.3, ruff 0.17.5, ty 0.0.104, cargo-llvm-cov 0.9.1. Installes via `ay up` : oha, ouch, dua, cargo-llvm-cov, coreutils. Les pins existants plus anciens (fd 10.5.0, uv 0.13.7, nextest 0.9.151) sont a bumper avec leurs sha256.

## Remplacements dans les references

`.agents/skills` : sovereign-upstream (uutils.exe retire), cloudflare-platform (npx wrangler retire), replica-test et replica-deploy (npx/npm vers bunx/bun), vercel-optimize (jq vers jaq). Configs globales Claude (`~/.claude`) et agy (`~/.gemini/antigravity-cli`) : aucune reference aux outils retires, rien a modifier. Les skills importes d'amont (react-native, vercel-labs, reverse-engineer-anything) gardent npx : texte source non modifie.
