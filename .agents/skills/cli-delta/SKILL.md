---
name: cli-delta
description: Use `delta` (delta 0.20.1): A viewer for git and diff output
---

# delta 0.20.1

Binary: `delta`. Declared in `tools.toml`; install or update with `ay up delta`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `delta --help`

```text
A viewer for git and diff output

Usage: delta [OPTIONS] [MINUS_FILE] [PLUS_FILE]

Arguments:
  [MINUS_FILE]
          First file to be compared when delta is being used to diff two
          files.

          `delta file1 file2` is equivalent to `diff -u file1 file2 | delta`.

  [PLUS_FILE]
          Second file to be compared when delta is being used to diff two
          files

Options:
      --blame-code-style <STYLE>
          Style string for the code section of a git blame line.

          By default the code will be syntax-highlighted with the same
          background color as the blame format section of the line (the
          background color is determined by blame-palette). E.g. setting this
          option to 'syntax' will syntax-highlight the code with no
          background color.

      --blame-format <FMT>
          Format string for git blame commit metadata.

          Available placeholders are "{timestamp}", "{author}", and
          "{commit}".

          [default: "{timestamp:<15} {author:<15.14} {commit:<8}"]

      --blame-palette <COLORS>
          Background colors used for git blame lines (space-separated
          string).

          Lines added by the same commit are painted with the same color;
          colors are recycled as needed.

      --blame-separator-format <FMT>
          Separator between the blame format and the code section of a git
          blame line.

          Contains the line number by default. Possible values are "none" to
          disable line numbers or a format string. This may contain one
          "{n:}" placeholder and will display the line number on every line.
          A type may be added after all other format specifiers and can be
          separated by '_': If type is set to 'block' (e.g. "{n:^4_block}")
          the line number will only be shown when a new blame block starts;
          or if it is set to 'every-N' the line will be show with every block
          and every N-th (modulo) line.

          [default: {n:^4}]

      --blame-separator-style <STYLE>
          Style string for the blame-separator-format

      --blame-timestamp-format <FMT>
          Format of `git blame` timestamp in raw git output received by delta

          [default: "%Y-%m-%d %H:%M:%S %z"]

      --blame-timestamp-output-format <FMT>
          Format string for git blame timestamp output.

          This string is used for formatting the timestamps in git blame
          output. It must follow the `strftime` format syntax specification.
          If it is not present, the timestamps will be formatted in a
          human-friendly but possibly less accurate form.
```
