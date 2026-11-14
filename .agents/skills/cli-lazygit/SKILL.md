---
name: cli-lazygit
description: Use `lazygit` (lazygit 0.66.3): Terminal UI for git.
---

# lazygit 0.66.3

Binary: `lazygit`. Declared in `tools.toml`; install or update with `ay up lazygit`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `completion`. Details: `lazygit <subcommand> --help`.

## `lazygit --help`

```text
C:\Users\aphro\.local\bin\lazygit.exe

  Usage:
    C:\Users\aphro\.local\bin\lazygit.exe [git-arg]

  Positional Variables:
    git-arg   Panel to focus upon opening lazygit. Accepted values (based on git terminology): status, bran...

  Subcommands:
    completion   Generate shell completion script for bash or zsh.

  Flags:
    -h    --help               Displays help with available flag, subcommand, and positional value parameters.
    -p    --path               Path of git repo. (equivalent to --work-tree=<path> --git-dir=<path>/.git/)
    -f    --filter             Path to filter on in `git log -- <path>`. When in filter mode, the commits, ...
    -v    --version            Print the current version
    -d    --debug              Run in debug mode with logging (see --logs flag below). Use the LOG_LEVEL en...
    -l    --logs               Tail lazygit logs (intended to be used when `lazygit --debug` is called in a...
          --profile            Start the profiler and serve it on http port 6060. See CONTRIBUTING.md for m...
    -c    --config             Print the default config
    -cd   --print-config-dir   Print the config directory
    -ucd  --use-config-dir     override default config directory with provided directory
    -w    --work-tree          equivalent of the --work-tree git argument
    -g    --git-dir            equivalent of the --git-dir git argument
    -ucf  --use-config-file    Comma separated list to custom config file(s)
    -sm   --screen-mode        The initial screen-mode, which determines the size of the focused panel. Val...
```
