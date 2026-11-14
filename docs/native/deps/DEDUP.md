# Cargo deduplication: record (2026-11-13)

Measurements taken on `Cargo.lock`, all targets combined, with `ay doctor --deps --dups`. We count the crates resolved in several versions and the extra copies. The `cargo tree -d -e normal,build` measurement on the Linux host (prd) is given as a complement.

| State                                                                          | Packages | Duplicated crates | Extra copies | `cargo tree -d` (names, host) |
| ------------------------------------------------------------------------------ | -------- | ----------------- | ------------ | ----------------------------- |
| before (main 8c3c113)                                                          | 1352     | 114               | 127          | 67                            |
| after (`ay lock --deps --hoist --breaking --dedupe`)                           | 1352     | 110               | 123          | 65                            |
| smallvec 1.16 and dashmap 6.2 stable, aphrody-design-emit removed by its agent | 1347     | 105               | 118          | n. m.                         |

## What was done

- 166 inline member requirements moved to `{ workspace = true }`, with 69 new entries in `[workspace.dependencies]`.
- 106 `=` pins became caret requirements: exactness is still carried by `Cargo.lock`.
- Duplicates removed at the source:
  - `libc` 1.0.0-alpha.5: back to 0.2.191, the version of the rest of the graph;
  - `zerocopy` and `zerocopy-derive` 0.9.0-alpha.0: `bench` and `ring3-agent` move to the workspace's 0.8;
  - `sha2` 0.10: `next` moves to the workspace's 0.11;
  - `zip` 8: `steam-depot` moves to the workspace's 9.
- smallvec 2.0.0-beta.4 to 1.16 (35 `SmallVec<T, N>` types rewritten as `SmallVec<[T; N]>`, `from_slice_copy` replaced by `from_slice`) and dashmap 7.0.0-rc2 to 6.2: no prerelease left in lore. Verified on fr1 by `cargo check --workspace --all-targets`.
- `cargo update` bumps versions within the bounds. `--breaking` bumps `oxc_*` from 0.155 to 0.158: these were the only lagging majors among the direct dependencies.
- `--dedupe` brings `glam` down from 0.34.3 to 0.33.12 (bitcode aligns with bevy) and `libloading` from 0.9.0 to 0.8.9.

## Remaining duplicates and cause

| Family                                                                                                                                                             | Versions                  | Cause                                                                                                                           | Action                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| RustCrypto (`digest`, `sha1`, `sha2`, `hmac`, `cipher`, `aes`, `der`, `spki`, `pkcs8`, `rsa`, `p256`, `p384`, `ecdsa`, `ed25519-dalek`, `signature`, `rand_core`…) | 0.10/0.11, 2/3            | upstream transition: russh 0.65, aws-sdk and rust-stack on the new generation; jsonwebtoken, ssh-key and rsa 0.9 on the old one | follow the releases; nothing to fix locally             |
| `rand`, `rand_core`, `rand_chacha`, `getrandom`                                                                                                                    | 0.8/0.9/0.10, 0.2/0.3/0.4 | lore on `rand` 0.10, hickory on 0.9, older crates on 0.8                                                                        | same                                                    |
| `windows*`                                                                                                                                                         | 0.61/0.62                 | gpu-allocator, sysinfo, wgpu-hal on 0.62; other crates still on 0.61                                                            | align the `windows-rs` fork when the dependents publish |
| `syn`                                                                                                                                                              | 1/2/3                     | `lore-macro` and `lore-error-set-macro` on syn 3; the ecosystem still on 2; a few crates on 1                                   | none                                                    |
| `hashbrown`, `foldhash`                                                                                                                                            | 0.14 to 0.17, 0.1/0.2     | versions frozen by indexmap, dashmap and the gpu crates                                                                         | none                                                    |
| `parking_lot` 0.13, `quick-xml` 0.42, `tower-http` 0.7                                                                                                             | new majors                | members are up to date, external dependencies still on the old one                                                              | wait for upstream                                       |
| `thiserror`, `toml`, `winnow`, `itertools`, `phf`                                                                                                                  | 1/2, 0.9/1, …             | lagging external dependencies                                                                                                   | wait for upstream                                       |

The remaining duplicates all come from external dependencies. Each weekly `ay lock --deps --bump --dedupe` reduces them as upstream publishes.

Verified on prd on 2026-11-13, under `flock`, with `nice 19` and `-j 2`: `cargo check --all-targets` passes on aphrody-lore, lore-capi, steam-depot, next, react, stack-bench, ring3-agent, aphrody-up, depot-gclient, depot-cipd, rust-stack, aphrody-remote and aphrody, and the tests of xtk, aphrody-up, steam-depot, next, react and depot-gclient pass. The final `Cargo.lock` was resolved on fr1, then validated by `cargo metadata --locked`.
