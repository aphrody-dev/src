---
name: cli-cargo-audit
description: Use `cargo-audit` (cargo-audit 0.23.0): Audit Cargo.lock files for vulnerable crates
---

# cargo-audit 0.23.0

Binary: `cargo-audit`. Declared in `tools.toml`; install or update with `ay up cargo-audit`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `update-db`, `bin`. Details: `cargo-audit <subcommand> --help`.

## `cargo-audit --help`

```text
Audit Cargo.lock files for vulnerable crates

Usage: cargo audit [OPTIONS] [COMMAND]

Commands:
  update-db  update the advisory database
  bin        scan compiled binaries
  help       Print this message or the help of the given subcommand(s)

Options:
  -c, --color <COLOR>
          color configuration (default: auto)

          [possible values: always, auto, never]

  -d, --db <DB>
          advisory database git repo path (default: ~/.cargo/advisory-db)

  -D, --deny <DENY>
          exit with an error on: warnings (any), unmaintained, unsound, yanked

  -f, --file <FILE>
          Cargo lockfile to inspect (or `-` for STDIN, default: Cargo.lock)

      --ignore <ADVISORY_ID>
          Advisory id to ignore (can be specified multiple times)

      --no-yanked
          do not check for yanked crates

  -n, --no-fetch
          do not perform a git fetch on the advisory DB

      --stale
          allow stale database

      --target-arch <TARGET_ARCH>
          filter vulnerabilities by CPU (default: no filter). Can be specified multiple times

      --target-os <TARGET_OS>
          filter vulnerabilities by OS (default: no filter). Can be specified multiple times

  -u, --url <URL>
          URL for advisory database git repo

  -q, --quiet
          Avoid printing unnecessary information

      --format <FORMAT>
          Output format: terminal, json, or sarif

          Possible values:
          - json:     Display JSON
          - sarif:    Display SARIF (Static Analysis Results Interchange Format)
          - terminal: Display human-readable output to the terminal

      --json
          Output report in JSON format

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
```
