---
name: cli-cargo-binstall
description: Use `cargo-binstall` (cargo-binstall 1.26.2): Install a Rust binary... from binaries!
---

# cargo-binstall 1.26.2

Binary: `cargo-binstall`. Declared in `tools.toml`; install or update with `ay up cargo-binstall`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `cargo-binstall --help`

```text
Install a Rust binary... from binaries!

Usage: cargo-binstall.exe [OPTIONS] [crate[@version]]...

Options:
  -h, --help
          Print help (see a summary with '-h')

Package selection:
      --version <VERSION>
          Package version to install.

          Takes either an exact semver version or a semver version requirement expression, which
          will be resolved to the highest matching version available.

          Cannot be used when multiple packages are installed at once, use the attached version
          syntax in that case.

      --targets <TRIPLE>
          Override binary target set.

          Binstall is able to look for binaries for several targets, installing the first one it
          finds in the order the targets were given. For example, on a 64-bit glibc Linux
          distribution, the default is to look first for a `x86_64-unknown-linux-gnu` binary, then
          for a `x86_64-unknown-linux-musl` binary. However, on a musl system, the gnu version will
          not be considered.

          This option takes a comma-separated list of target triples, which will be tried in order.
          They override the default list, which is detected automatically from the current platform.

          If falling back to installing from source, the first target will be used.

          [env: CARGO_BUILD_TARGET=]

      --bin <BINARY>...
          Install only the specified binaries.

          This mirrors the equivalent argument in `cargo install --bin`.

          If omitted, all binaries are installed.

      --list
          List installed crates and their installation methods (binstall, cargo install, local path,
          drifted)

      --prune
          Prune stale or drifted binstall records for uninstalled or recompiled packages

  [crate[@version]]...
          Packages to install.

          Syntax: `crate[@version]`

          Each value is either a crate name alone, or a crate name followed by @ and the version to
          install. The version syntax is as with the --version option.

          When multiple names are provided, the --version option and override option
          `--manifest-path` and `--git` are unavailable due to ambiguity.

          If duplicate names are provided, the last one (and its version requirement) is kept.

Overrides:
      --manifest-path <PATH>
          Override Cargo.toml package manifest path.

          This skips searching crates.io for a manifest and uses the specified path directly, useful
          for debugging and when adding Binstall support. This may be either the path to the folder
          containing a Cargo.toml file, or the Cargo.toml file itself.

          This option cannot be used with `--git`.
```
