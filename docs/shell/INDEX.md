# Index docs/shell (2026-11-12)

## Fichiers

| Fichier | Contenu |
|---|---|
| posix-family.md | 15 shells POSIX/bourne, cas Windows |
| modern-shells.md | 18 shells modernes (nushell, fish, elvish…) |
| rust-bash-reimpl.md | brush et réimplémentations, issues ouvertes |
| windows-native.md | Claude Code sous Windows, ConPTY, fork Cygwin, signaux, chemins |
| userland.md | uutils, rg/fd/jaq, awk, archives, terminaux, install |
| MATRIX.md | matrice comparative + 2 classements |
| vectors.json | vecteurs de traits par shell (0-1) |
| ROADMAP.md | jalons et critères de sortie |
| PLAN.md | écarts, snapshot, install, tests, upstream |

## Shells

brush, busybox-w32 ash, GNU bash, dash, ksh93u+m, zsh, yash, oksh, mksh, toybox sh, Oils OSH/YSH, nushell, fish 4, xonsh, elvish, murex, ion, Amber, NGS, Marcel, Rash, ABS, es, rc, Hush, closh, Oh, PowerShell (réf.). Non couverts : bosh, Thompson sh, Bourne sh, Koi (introuvable), rusty_bash [NV].

## Sources

| Source | Usage |
|---|---|
| https://github.com/reubeno/brush (@f550117d8e, 2026-11-12) | brush, README, issues |
| https://github.com/reubeno/brush/issues/1359 · /1317 · /1295 · /1251 · /1086 · /1397 · /1580 · /1581 · /1540 · /1268 · /1662 · /1294 | écarts |
| https://github.com/rmyorston/busybox-w32 · https://frippery.org/busybox/ | busybox-w32 |
| https://github.com/oils-for-unix/oils · https://oils.pub | Oils |
| https://github.com/microsoft/coreutils (release v2026.9.3, 2026-09-03 ; « Installer & Packaging ») | userland MS |
| https://github.com/uutils/coreutils (0.12.0, 2026-09-17) · /findutils · /sed · /diffutils | userland Rust |
| git.savannah.gnu.org/bash · git.kernel.org dash | tags bash/dash |
| https://github.com/ksh93/ksh · zsh-users/zsh · magicant/yash · ibara/oksh · MirBSD/mksh · landley/toybox | POSIX |
| https://github.com/nushell/nushell · fish-shell/fish-shell · xonsh/xonsh · elves/elvish · lmorg/murex · redox-os/ion · amber-lang/amber · ngs-lang/ngs · geophile/marcel · rash-sh/rash · abs-lang/abs · wryun/es-shell · rakitzis/rc · hush-shell/hush · dundalek/closh · michaelmacinnis/oh · PowerShell/PowerShell | modernes |
| https://code.claude.com/docs (setup, tools-reference, env-vars) | Claude Code |
| https://learn.microsoft.com/windows/console/creating-a-pseudoconsole-session | ConPTY |
| https://cygwin.com/cygwin-ug-net/highlights.html | fork Cygwin |
| BurntSushi/ripgrep · sharkdp/fd · chmln/sd · 01mf02/jaq · ducaale/xh · jqlang/jq · benhoyt/goawk · libarchive · facebook/zstd · tukaani-project/xz · microsoft/terminal · alacritty · wezterm · starship · atuinsh/atuin · carapace-sh/carapace-bin | userland/UX |
- [ecosystem-links.md](ecosystem-links.md) : fx, wterm, skills, vcpkg, LLVM, GNU
- [CLAUDE-NT.md](CLAUDE-NT.md) : couches Claude Code→NT, latences, MCP UIA natif
