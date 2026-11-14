---
name: cli-dua
description: Use `dua` (dua 3.0.3): A tool to learn about disk usage, fast!
---

# dua 3.0.3

Binary: `dua`. Declared in `tools.toml`; install or update with `ay up dua`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `clean`, `interactive`, `diff`, `stacks`, `flamegraph`, `aggregate`, `completions`, `config`. Details: `dua <subcommand> --help`.

## `dua --help`

```text
A tool to learn about disk usage, fast!

Usage: dua [FLAGS] [OPTIONS] [SUBCOMMAND] [INPUT]...

Commands:
  clean        Find disposable directories and inspect them in the terminal user interface
  interactive  Launch the terminal user interface [aliases: i]
  diff         Compare two traversal snapshots
  stacks       Print folded stacks for flame-graph tools
  flamegraph   Render disk usage as an SVG flame graph
  aggregate    Aggregate the consumed space of one or more directories or files [aliases: a]
  completions  Generate shell completions
  config       Configuration related commands
  help         Print this message or the help of the given subcommand(s)

Arguments:
  [INPUT]...
          One or more input files or directories. If unset, we will use all entries in the current working ...

Options:
      --log-file <LOG_FILE>
          Write a log file with debug information, including panics

          [env: DUA_LOG_FILE=]

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

Traversal Options:
  -t, --threads <THREADS>
          The number of threads to use. Defaults to 8 on macOS and 0 elsewhere. Set to 0 to use the number ...

          [env: DUA_THREADS=]
          [default: 0]

  -A, --apparent-size
          Display apparent size instead of disk usage

          [env: DUA_APPARENT_SIZE=]

  -l, --count-hard-links
          Count hard-linked files each time they are seen

          [env: DUA_COUNT_HARD_LINKS=]

  -x, --stay-on-filesystem
          If set, we will not cross filesystems or traverse mount points

          [env: DUA_STAY_ON_FILESYSTEM=]

  -i, --ignore-dirs <IGNORE_DIRS>
          One or more absolute directories to ignore. Note that these are not ignored if they are passed as...

          Hence, they will only be ignored if they are eventually reached as part of the traversal.

          [env: DUA_IGNORE_DIRS=]

      --ignore-from <FILE>
          One or more files with gitignore-style patterns, whose matches are left out of the report.

          Patterns follow `.gitignore` syntax - `#` starts a comment, a trailing `/` matches directories on...

          Files given later take precedence over files given earlier. Excluded directories are not descende...

          [env: DUA_IGNORE_FROM=]

  -f, --format <FORMAT>
```
