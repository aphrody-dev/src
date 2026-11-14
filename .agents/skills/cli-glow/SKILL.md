---
name: cli-glow
description: Use `glow` (glow 3.0.0): Render markdown on the CLI, with pizzazz!
---

# glow 3.0.0

Binary: `glow`. Declared in `tools.toml`; install or update with `ay up glow`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `completion`, `config`. Details: `glow <subcommand> --help`.

## `glow --help`

```text
  Render markdown on the CLI, with pizzazz!

Usage:
  glow [SOURCE|DIR] [flags]
  glow [command]

Available Commands:
  completion  Generate the autocompletion script for the specified shell
  config      Edit the glow config file
  help        Help about any command

Flags:
  -a, --all                  show system files and directories (TUI-mode only)
      --config string        config file (default C:\Users\aphro\AppData\Local\glow\Config\glow.yml)
  -h, --help                 help for glow
  -l, --line-numbers         show line numbers (TUI-mode only)
  -p, --pager                display with pager
  -n, --preserve-new-lines   preserve newlines in the output
  -s, --style string         style name or JSON path (default "auto")
  -t, --tui                  display with tui
  -v, --version              version for glow
  -w, --width uint           word-wrap at width (set to 0 to disable)

Use "glow [command] --help" for more information about a command.
```
