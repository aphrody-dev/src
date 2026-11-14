---
name: archguard
description: Architecture gate (ARCH-001..017) of the monorepo: domain purity, boundaries, hygiene, dependency graph. Use before pushing structural changes or when `ay arch` / `just arch-check` fails.
---

# archguard

Rust library and CLI in `src/archguard` (rules in `src/archguard/src/rules/`, ids in `src/archguard/src/lib.rs`, baseline `src/archguard/baseline.json`). It is routed through the `ay` multicall binary as `ay arch`; there is no standalone `archguard` binary.

## Commands

```sh
ay arch check --strict            # exit 1 on violation or warning
ay arch check --json              # deterministic JSON report
ay arch check --rule ARCH-017     # one rule or category
ay arch rules                     # current list with severities (source of truth, do not copy it here)
ay arch graph --format mermaid    # also: dot, json; -o <file> to write
just arch-check                   # same gate through the justfile (see `just --summary`)
```

Root resolution: `--root`, else `$SRC_ROOT`, else the nearest ancestor holding `src.lock.json`, else `C:\src` or `/src`.

## Remediation

- Dependency layers (ARCH-017): move the shared type to a lower layer instead of adding an upward or cyclic edge. Layer boundaries are also enforced by `scripts/checkdeps.ts` and the `DEPS.rules` files.
- Chromium `DEPS` (ARCH-014): pins must be 40-character commit SHAs; `src.lock.json` is the repo pin file.
- `MAINTAINERS` (ARCH-015): every `F:` pattern must match a path on disk; update it when a directory moves.
- Atlas links (ARCH-012): fix or remove the broken `file:///` link.
- Emoji (ARCH-009), secrets (ARCH-008): remove from source and docs.
