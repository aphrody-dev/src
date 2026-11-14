---
name: cli-ruff
description: Use `ruff` (ruff 0.17.5): Extremely fast Python linter and code formatter.
---

# ruff 0.17.5

Binary: `ruff`. Declared in `tools.toml`; install or update with `ay up ruff`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `check`, `rule`, `config`, `linter`, `clean`, `format`, `server`, `analyze`, `version`. Details: `ruff <subcommand> --help`.

## `ruff --help`

```text
Ruff: An extremely fast Python linter and code formatter.

Usage: ruff.exe [OPTIONS] <COMMAND>

Commands:
  check    Run Ruff on the given files or directories
  rule     Explain a rule (or all rules)
  config   List or describe the available configuration options
  linter   List all supported upstream linters
  clean    Clear any caches in the current directory and any subdirectories
  format   Run the Ruff formatter on the given files or directories
  server   Run the language server
  analyze  Run analysis over Python source code
  version  Display Ruff's version
  help     Print this message or the help of the given subcommand(s)

Options:
  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

Log levels:
  -v, --verbose
          Enable verbose logging

  -q, --quiet
          Print diagnostics, but nothing else

  -s, --silent
          Disable all logging (but still exit with status code "1" upon detecting diagnostics)

Global options:
      --config <CONFIG_OPTION>
          Either a path to a TOML configuration file (`pyproject.toml` or `ruff.toml`), or a TOML
          `<KEY> = <VALUE>` pair (such as you might find in a `ruff.toml` configuration file)
          overriding a specific configuration option (e.g., `--config "line-length = 100"` or
          `--config "format.quote-style = 'single'"`). Overrides of individual settings using this
          option always take precedence over all configuration files, including configuration files
          that were also specified using `--config`

      --isolated
          Ignore all configuration files

      --color <WHEN>
          Control when colored output is used

          Possible values:
          - auto:   Use color when writing to a terminal, unless overridden by the environment
          - always: Always display colors
          - never:  Never display colors

For help with a specific command, see: `ruff help <command>`.
```
