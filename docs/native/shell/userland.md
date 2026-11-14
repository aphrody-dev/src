# Userland natif Windows (sans MSYS/Cygwin/WSL)

Relevé 2026-11-12 via `gh api repos/<r>/releases/latest` (sauf mention). NV = non vérifié.

## Coreutils & co

| Outil            | Version (date)                                                        | Compat GNU publiée                                                                         | Install/MAJ                                                          | Source                                                 |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------ |
| uutils coreutils | 0.12.0 (2026-09-17)                                                   | GNU suite : 653 pass / 21 fail, 94.36 %                                                    | `cargo binstall coreutils` ou zip `x86_64-pc-windows-msvc`           | github.com/uutils/coreutils/releases/tag/0.12.0        |
| uutils findutils | 0.11.0 (2026-11-02)                                                   | GNU 437 (88.28 %), bfs 280                                                                 | `cargo binstall findutils` / zip release                             | github.com/uutils/findutils/releases/tag/0.11.0        |
| uutils diffutils | v0.6.0 (2026-10-23)                                                   | taux NV                                                                                    | `cargo binstall diffutils` / release                                 | github.com/uutils/diffutils/releases/tag/v0.6.0        |
| uutils sed       | 0.3.0 (2026-10-18)                                                    | taux NV                                                                                    | `cargo install sed` (binstall NV)                                    | github.com/uutils/sed/releases/tag/0.3.0               |
| busybox-w32      | dernier tag `TIG_1_23_0`, push 2026-11-12 ; binaires sur frippery.org | applets : sh(ash), awk, grep, sed, tar, xz, unzip, vi… (liste NV pour la version courante) | `busybox64u.exe` depuis frippery.org/busybox (pas de GitHub release) | github.com/rmyorston/busybox-w32, frippery.org/busybox |
| toybox           | pas de release GitHub, push 2026-10-06                                | Windows non supporté (cible Linux/Android/macOS) NV                                        | à exclure                                                            | github.com/landley/toybox                              |

Multicall vs hardlinks : `coreutils.exe` multicall dispatch sur `argv[0]` ; sous NTFS, créer des hardlinks (`mklink /H ls.exe coreutils.exe`) = 1 fichier, N noms, pas de `.cmd` shim ; à refaire après chaque MAJ (les hardlinks pointent l'ancien inode si le fichier est remplacé). Alternative : `coreutils ls` via fonctions shell (alourdit le snapshot, limite ~70927 o). Recommandation : hardlinks + script de relink dans le justfile.

## Recherche / texte / JSON / HTTP

| Outil   | Version (date)        | Rôle                                       | Install                  | Source              |
| ------- | --------------------- | ------------------------------------------ | ------------------------ | ------------------- |
| ripgrep | 15.2.0 (2026-07-15)   | remplace grep (pas compatible options GNU) | `cargo binstall ripgrep` | BurntSushi/ripgrep  |
| fd      | v10.5.2 (2026-11-07)  | find rapide (non POSIX)                    | `cargo binstall fd-find` | sharkdp/fd          |
| sd      | v1.1.0 (2026-02-25)   | sed simplifié                              | `cargo binstall sd`      | chmln/sd            |
| choose  | v1.3.7 (2025-08-26)   | cut/awk simple                             | `cargo binstall choose`  | theryangeary/choose |
| xh      | v0.26.3 (2026-10-21)  | curl/httpie                                | `cargo binstall xh`      | ducaale/xh          |
| jaq     | v3.1.2 (2026-10-21)   | jq en Rust                                 | `cargo binstall jaq`     | 01mf02/jaq          |
| jq      | jq-1.8.2 (2026-06-20) | référence, `jq-windows-amd64.exe`          | release asset            | jqlang/jq           |

grep : uutils n'a pas de grep (NV, pas de repo `uutils/grep` relevé). GNU grep natif = seulement via builds MSYS/mingw (exclu). Choix : `rg` pour l'usage, `busybox grep` si besoin de syntaxe POSIX dans des scripts.

## awk

| Impl              | État                                    | Windows natif                                      | Source                      |
| ----------------- | --------------------------------------- | -------------------------------------------------- | --------------------------- |
| goawk             | v1.32.0 (2026-09-15), POSIX + CSV       | oui, Go pur, binaires Windows publiés              | benhoyt/goawk               |
| frawk             | push 2025-09-26, pas de release         | build MSVC possible mais LLVM/Cranelift requis, NV | ezrosent/frawk              |
| onetrue awk (BWK) | repo `onetrue-awk/awk` 404 via gh api   | build MSVC NV                                      | NV                          |
| mawk              | snapshots ThomasDickey, push 2026-03-03 | nécessite configure/make (MinGW) → exclu NV        | ThomasDickey/mawk-snapshots |
| busybox awk       | inclus dans busybox-w32                 | oui                                                | frippery.org                |

Choix : goawk (`go install github.com/benhoyt/goawk@latest` ou zip release), fallback busybox awk.

## Archives

| Outil               | Version                                                                                       | Windows | Source                |
| ------------------- | --------------------------------------------------------------------------------------------- | ------- | --------------------- |
| bsdtar (libarchive) | `C:\Windows\System32\tar.exe` fourni par Windows (version NV) ; upstream v3.8.11 (2026-10-30) | natif   | libarchive/libarchive |
| zstd                | v1.5.7 (2025-02-19), zip win64 publié                                                         | natif   | facebook/zstd         |
| xz                  | v5.8.4 (2026-09-09), binaires Windows NV                                                      | natif   | tukaani-project/xz    |

## Terminaux

| Terminal         | Version (date)                                                                                                 | Windows                 | Source              |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Windows Terminal | v1.25.3131.0 (2026-11-11)                                                                                      | natif ConPTY, référence | microsoft/terminal  |
| WezTerm          | dernière stable 20240203 ; nightly mise à jour en continu                                                      | natif, ConPTY           | wezterm/wezterm     |
| Alacritty        | v0.17.0 (2026-04-06)                                                                                           | natif, ConPTY, msi/zip  | alacritty/alacritty |
| Ghostty          | pas de release GitHub ; Windows non supporté officiellement (NV, aucune issue Windows ouverte majeure trouvée) | non                     | ghostty-org/ghostty |

## Prompt / historique / complétion

| Outil    | Version (date)        | Install                                  | Note                                                                                        | Source                   |
| -------- | --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| starship | v1.27.0 (2026-10-17)  | `cargo binstall starship`                | init bash : `eval "$(starship init bash)"` ; compat brush NV                                | starship/starship        |
| atuin    | v18.24.6 (2026-11-10) | `cargo binstall atuin`                   | hooks via bash-preexec ; avec brush NV                                                      | atuinsh/atuin            |
| carapace | v1.8.2 (2026-11-01)   | zip release `carapace-bin_windows_amd64` | `source <(carapace _carapace bash)` ; gros volume de fonctions → risque troncature snapshot | carapace-sh/carapace-bin |

## Mise à jour

- `cargo binstall -y coreutils findutils diffutils ripgrep fd-find sd choose xh jaq starship atuin` (binstall prend les assets release, sinon compile).
- `cargo install-update -a` (cargo-update) pour l'ensemble NV.
- Hors cargo : jq, zstd, busybox-w32, goawk, carapace, Alacritty, WezTerm → `gh release download -R <repo> -p '*windows*'` dans un dossier temporaire, puis copie dans `~/.local/bin`.
- Après MAJ coreutils : relancer le relink hardlinks.
