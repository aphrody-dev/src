---
name: cli-cargo-deny
description: Use `cargo-deny` (cargo-deny 0.20.2): Cargo plugin to help you manage large dependency graphs
---

# cargo-deny 0.20.2

Binary: `cargo-deny`. Declared in `tools.toml`; install or update with `ay up cargo-deny`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `check`, `fetch`, `init`, `list`. Details: `cargo-deny <subcommand> --help`.

## `cargo-deny --help`

```text
Cargo plugin to help you manage large dependency graphs

Usage: cargo-deny.exe [OPTIONS] <COMMAND>

Commands:
  check  Checks a project's crate graph
  fetch  Fetches remote data
  init   Creates a cargo-deny config from a template
  list   Outputs a listing of all licenses and the crates that use them
  help   Print this message or the help of the given subcommand(s)

Options:
  -L, --log-level <LOG_LEVEL>
          The log level for messages.

          Only messages at or above the level will be emitted

          [default: warn]
          [possible values: off, error, warn, info, debug, trace]

  -f, --format <FORMAT>
          The output format.

          [default: human]
          [possible values: human, json, sarif]

  -c, --color <COLOR>
          Controls output coloring.

          [env: CARGO_TERM_COLOR=]
          [default: auto]
          [possible values: auto, always, never]

      --manifest-path <MANIFEST_PATH>
          The path of a Cargo.toml to use as the context for the operation.

          By default, the Cargo.toml in the current working directory is used.

      --metadata-path <METADATA_PATH>
          Path to cargo metadata json.

          By default we use `cargo metadata` to generate the metadata json, but you can override that behav...

      --config <CONFIG_PATH>
          Path to the config to use.

          Defaults to <cwd>/deny.toml if not specified.

      --workspace
          If passed, all workspace packages are used as roots for the crate graph.

          Automatically assumed if the manifest path points to a virtual manifest.

          Normally, if you specify a manifest path that is a member of a workspace, that crate will be the ...

      --exclude <CRATE>
          One or more crates to exclude from the crate graph.

          NOTE: Unlike cargo, this does not have to be used with the `--workspace` flag.

  -t, --target <CFG>
          One or more platforms to filter crates by.

          If a dependency is target specific, it will be ignored if it does not match 1 or more of the spec...

      --all-features
          Activate all available features.

      --no-default-features
          Do not activate the `default` feature.
```
