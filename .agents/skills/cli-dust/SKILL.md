---
name: cli-dust
description: Use `dust` (dust 1.2.7): Like du but more intuitive
---

# dust 1.2.7

Binary: `dust`. Declared in `tools.toml`; install or update with `ay up dust`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `dust --help`

```text
Like du but more intuitive

Usage: dust.exe [OPTIONS] [PATH]...

Arguments:
  [PATH]...
          Input files or directories

Options:
  -d, --depth <DEPTH>
          Depth to show

  -T, --threads <THREADS>
          Number of threads to use

      --config <FILE>
          Specify a config file to use

  -n, --number-of-lines <NUMBER>
          Display the 'n' largest entries. (Default is terminal_height)

  -p, --full-paths
          Subdirectories will not have their path shortened

  -X, --ignore-directory <PATH>
          Exclude any file or directory with this path

  -I, --ignore-all-in-file <FILE>
          Exclude any file or directory with a regex matching that listed in this file, the file entries wi...

  -L, --dereference-links
          dereference sym links - Treat sym links as directories and go into them

  -x, --limit-filesystem
          Only count the files and directories on the same filesystem as the supplied directory

  -s, --apparent-size
          Use file length instead of blocks

  -r, --reverse
          Print tree upside down (biggest highest)

  -c, --no-colors
          No colors will be printed (Useful for commands like: watch)

  -C, --force-colors
          Force colors print

      --dim
          Dim the percent bars (grey) to reduce brightness on dark terminals

  -b, --no-percent-bars
          No percent bars or percentages will be displayed

  -B, --bars-on-right
          percent bars moved to right side of screen

  -z, --min-size <MIN_SIZE>
          Minimum size file to include in output

  -R, --screen-reader
          For screen readers. Removes bars. Adds new column: depth level (May want to use -p too for full p...

      --skip-total
          No total row will be displayed

  -f, --filecount
          Directory 'size' is number of child files instead of disk size

  -i, --ignore-hidden
```
