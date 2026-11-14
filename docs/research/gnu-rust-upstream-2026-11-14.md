# GNU -> Rust upstream releases (2026-11-14)

Source: `gh api repos/<repo>/releases/latest`, queried 2026-11-14. "none" = no GitHub release published.

| GNU package | Rust replacement | Latest release | Published |
| --- | --- | --- | --- |
| coreutils | uutils/coreutils | 0.12.0 | 2026-09-17 |
| findutils | uutils/findutils | 0.11.0 | 2026-11-02 |
| diffutils | uutils/diffutils | v0.6.0 | 2026-10-23 |
| sed | uutils/sed | 0.3.0 | 2026-10-18 |
| grep | uutils/grep | 0.2.0 | 2026-08-27 |
| procps, util-linux, tar, gzip, bc, awk | uutils/* | none | - |
| grep (alt) | BurntSushi/ripgrep | 15.2.0 | 2026-07-15 |
| findutils (alt) | sharkdp/fd | v10.5.2 | 2026-11-07 |
| sed (alt) | chmln/sd | v1.1.0 | 2026-02-25 |
| jq | 01mf02/jaq | v3.1.2 | 2026-10-21 |
| sudo | trifectatechfoundation/sudo-rs | v0.2.15 | 2026-08-31 |
| zlib | trifectatechfoundation/zlib-rs | v0.6.8 | 2026-09-15 |
| git | GitoxideLabs/gitoxide | v0.61.0 | 2026-10-22 |
| toolchain | rust-lang/rust | 1.100.0 | 2026-11-12 |

GNU reference pages (owner, 2026-11-14), mirrored on fr2 in `/srv/research/gnu/`:

- `gnu/gnu.html`: index of the GNU history and structure essays (Manifesto 1985, Overview of the GNU System 1996, The GNU Project 1998). It defines no packages; already summarized in `docs/native/gnu/PHILOSOPHY.md`. www.gnu.org timed out from fr2, so this one came from the Wayback Machine.
- `gnu/linux-and-gnu.fr.html`: GNU = the whole OS except the kernel, Linux = the kernel. Covered in PHILOSOPHY.md under "GNU/Linux".
- `manual/manual.html` (388 packages) and `manual/blurbs.html` (355 blurbs, extracted to `gnu-blurbs-2026-11-14.json`): every package is already in `docs/native/gnu/gnu-packages.json`.
- `ftp.gnu.org/gnu/` (336 dirs): 13 real packages are missing from the inventory (guile-debbugs, micron, sauce, speedx, cfengine, flex, git, aspell-dict-{csb,ga,hr,is,it,sk}).
- `software/recent-releases.html`: times out from fr1, fr2 and the PC, so releases come from the ftp listings instead.

Drift on this PC: fd 10.5.0 installed (upstream 10.5.2), sd 1.0.0 installed (upstream 1.1.0).
