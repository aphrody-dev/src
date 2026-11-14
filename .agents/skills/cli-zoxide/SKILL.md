---
name: cli-zoxide
description: Use `zoxide` (zoxide 0.10.0): A smarter cd command for your terminal
---

# zoxide 0.10.0

Binary: `zoxide`. Declared in `tools.toml`; install or update with `ay up zoxide`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `add`, `edit`, `import`, `init`, `query`, `remove`. Details: `zoxide <subcommand> --help`.

## `zoxide --help`

```text
zoxide 0.10.0
https://github.com/ajeetdsouza/zoxide

A smarter cd command for your terminal

Usage:
  zoxide.exe <COMMAND>

Commands:
  add     Add a new directory or increment its rank
  edit    Edit the database
  import  Import entries from another application
  init    Generate shell configuration
  query   Search for a directory in the database
  remove  Remove a directory from the database

Options:
  -h, --help     Print help
  -V, --version  Print version

Environment variables:
  _ZO_DATA_DIR          Path for zoxide data files
  _ZO_ECHO              Print the matched directory before navigating to it when set to 1
  _ZO_EXCLUDE_DIRS      List of directory globs to be excluded
  _ZO_FZF_OPTS          Custom flags to pass to fzf
  _ZO_MAXAGE            Maximum total age after which entries start getting deleted
  _ZO_RESOLVE_SYMLINKS  Resolve symlinks when storing paths
```
