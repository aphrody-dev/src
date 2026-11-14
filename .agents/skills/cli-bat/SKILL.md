---
name: cli-bat
description: Use `bat` (bat 0.26.1): A cat(1) clone with syntax highlighting and Git integration.
---

# bat 0.26.1

Binary: `bat`. Declared in `tools.toml`; install or update with `ay up bat`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `bat --help`

```text
A cat(1) clone with syntax highlighting and Git integration.

Usage: bat [OPTIONS] [FILE]...
       bat <COMMAND>

Arguments:
  [FILE]...
          File(s) to print / concatenate. Use a dash ('-') or no argument at all to read from
          standard input.

Options:
  -A, --show-all
          Show non-printable characters like space, tab or newline. This option can also be used to
          print binary files. Use '--tabs' to control the width of the tab-placeholders.

      --nonprintable-notation <notation>
          Set notation for non-printable characters.

          Possible values:
            * unicode (, , , ..)
            * caret   (^G, ^J, ^@, ..)

      --binary <behavior>
          How to treat binary content. (default: no-printing)

          Possible values:
            * no-printing: do not print any binary content
            * as-text: treat binary content as normal text

  -p, --plain...
          Only show plain style, no decorations. This is an alias for '--style=plain'. When '-p' is
          used twice ('-pp'), it also disables automatic paging (alias for '--style=plain
          --paging=never').

  -l, --language <language>
          Explicitly set the language for syntax highlighting. The language can be specified as a
          name (like 'C++' or 'LaTeX') or possible file extension (like 'cpp', 'hpp' or 'md'). Use
          '--list-languages' to show all supported language names and file extensions.

  -H, --highlight-line <N:M>
          Highlight the specified line ranges with a different background color For example:
            '--highlight-line 40' highlights line 40
            '--highlight-line 30:40' highlights lines 30 to 40
            '--highlight-line :40' highlights lines 1 to 40
            '--highlight-line 40:' highlights lines 40 to the end of the file
            '--highlight-line 30:+10' highlights lines 30 to 40

      --file-name <name>
          Specify the name to display for a file. Useful when piping data to bat from STDIN when bat
          does not otherwise know the filename. Note that the provided file name is also used for
          syntax detection.

  -d, --diff
          Only show lines that have been added/removed/modified with respect to the Git index. Use
          --diff-context=N to control how much context you want to see.

      --diff-context <N>
          Include N lines of context around added/removed/modified lines when using '--diff'.

      --tabs <T>
          Set the tab width to T spaces. Use a width of 0 to pass tabs through directly

      --wrap <mode>
          Specify the text-wrapping mode (*auto*, never, character). The '--terminal-width' option
          can be used in addition to control the output width.

  -S, --chop-long-lines
          Truncate all lines longer than screen width. Alias for '--wrap=never'.

      --terminal-width <width>
```
