---
name: cli-ast-grep
description: Use `ast-grep` (ast-grep 0.51.2): Search and Rewrite code at large scale using AST pattern.
---

# ast-grep 0.51.2

Binary: `ast-grep`, `sg`. Declared in `tools.toml`; install or update with `ay up ast-grep`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `run`, `scan`, `test`, `new`, `lsp`, `outline`, `completions`. Details: `ast-grep <subcommand> --help`.

## `ast-grep --help`

```text
Search and Rewrite code at large scale using AST pattern.
                    __
        ____ ______/ /_      ____ _________  ____
       / __ `/ ___/ __/_____/ __ `/ ___/ _ \/ __ \
      / /_/ (__  ) /_/_____/ /_/ / /  /  __/ /_/ /
      \__,_/____/\__/      \__, /_/   \___/ .___/
                          /____/         /_/

Usage: ast-grep.exe [OPTIONS] <COMMAND>

Commands:
  run          Run one time search or rewrite in command line. (default command)
  scan         Scan and rewrite code by configuration
  test         Test ast-grep rules
  new          Create new ast-grep project or items like rules/tests
  lsp          Start language server
  outline      Explore code structure for symbols, imports, exports, and members
  completions  Generate shell completion script
  help         Print this message or the help of the given subcommand(s)

Options:
  -c, --config <CONFIG_FILE>
          Path to ast-grep root config, default is sgconfig.yml

      --custom-languages <CUSTOM_LANGUAGES>
          Control how sgconfig.yml handles native custom language libraries (default: ignore)

          Possible values:
          - allow:  Load native custom language libraries for this invocation
          - ignore: Skip native custom language libraries without reporting an error
          - trust:  Load native custom language libraries and remember this project
          - revoke: Forget this project and ignore its native custom language libraries

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
```
