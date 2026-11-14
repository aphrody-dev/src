---
name: cli-cargo-shear
description: Use `cargo-shear` (cargo-shear 1.14.1): Detects and removes unused dependencies in Cargo.toml files.
---

# cargo-shear 1.14.1

Binary: `cargo-shear`. Declared in `tools.toml`; install or update with `ay up cargo-shear`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `cargo-shear --help`

```text
Command-line options for cargo-shear.

Usage: cargo-shear.exe [--fix] [--expand] [--check-test-targets] [--deny-warnings] [--locked] [
--offline] [--frozen] [-p=SPEC]... [--exclude=ARG]... [--format=ARG] [--color=ARG] [PATH]

Available positional items:
    PATH                      Path to the project directory.

Available options:
        --fix                 Remove unused dependencies.
        --expand              Uses `cargo expand` to expand macros, which requires nightly and is
                              significantly slower.
        --check-test-targets  Detect mismatches between `test`/`doctest` target settings and source
                              content.
        --deny-warnings       Treat warnings as errors.
        --locked              Assert that `Cargo.lock` will remain unchanged.
        --offline             Run without accessing the network
        --frozen              Equivalent to specifying both --locked and --offline
    -p, --package=SPEC        Package(s) to check.
        --exclude=ARG         Exclude packages from the check.
        --format=ARG          Output format: auto, json, github
        --color=ARG           Color usage for output: auto, always, never
    -h, --help                Prints help information
    -V, --version             Prints version information
```
