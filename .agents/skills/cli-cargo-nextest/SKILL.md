---
name: cli-cargo-nextest
description: Use `cargo-nextest` (cargo-nextest 0.9.151): Next-generation test runner for Rust.
---

# cargo-nextest 0.9.151

Binary: `cargo-nextest`. Declared in `tools.toml`; install or update with `ay up cargo-nextest`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `list`, `run`, `bench`, `archive`, `show-config`, `self`. Details: `cargo-nextest <subcommand> --help`.

## `cargo-nextest --help`

```text
A next-generation test runner for Rust. https://nexte.st

Usage: cargo nextest [OPTIONS] <COMMAND>

Commands:
  list         List tests in workspace
  run          Build and run tests [alias: r]
  bench        Build and run benchmarks (experimental) [alias: b]
  archive      Build and archive tests
  show-config  Show information about nextest's configuration in this workspace
  self         Manage the nextest installation
  help         Show help for a command or topic

Options:
      --color <WHEN>
          Produce color output: auto, always, never

          [env: CARGO_TERM_COLOR=]
          [default: auto]

      --no-pager
          Do not pipe output through a pager

  -v, --verbose
          Verbose output

          [env: NEXTEST_VERBOSE=]

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

Manifest options:
      --manifest-path <PATH>
          Path to Cargo.toml

Config options:
      --config-file <PATH>
          Config file [default: workspace-root/.config/nextest.toml]

      --user-config-file <PATH>
          User config file [default: ~/.config/nextest/config.toml or platform equivalent].

          User configuration stores per-user preferences like UI settings. Use "none" to skip
          loading user config entirely.

          [env: NEXTEST_USER_CONFIG_FILE=]

      --tool-config-file <TOOL:ABS_PATH>
          Tool-specific config files.

          Some tools on top of nextest may want to set up their own default configuration but
          prioritize user configuration on top. Use this argument to insert configuration that's
          lower than --config-file in priority but above the default config shipped with nextest.

          Arguments are specified in the format "tool:abs_path", for example
          "my-tool:/path/to/nextest.toml" (or "my-tool:C:\path\to\nextest.toml" on Windows). Paths
          must be absolute. Each tool name may have at most one config file associated with it.

          This argument may be specified multiple times. Files that come later are lower priority
          than those that come earlier.

      --override-version-check
          Override checks for the minimum version defined in nextest's config.

          Repository and tool-specific configuration files can specify minimum required and
          recommended versions of nextest. This option overrides those checks.

```
