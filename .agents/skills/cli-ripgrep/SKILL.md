---
name: cli-ripgrep
description: Use `rg` (ripgrep 15.2.0): Recursive regex search over files, honoring gitignore.
---

# ripgrep 15.2.0

Binary: `rg`. Declared in `tools.toml`; install or update with `ay up ripgrep`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `rg --help`

```text
ripgrep 15.2.0 (rev e89fff89ac)

ripgrep (rg) recursively searches the current directory for lines matching
a regex pattern. By default, ripgrep will respect gitignore rules and
automatically skip hidden files/directories and binary files.

Use -h for short descriptions and --help for more details.

Project home page: https://github.com/BurntSushi/ripgrep

USAGE:
    rg [OPTIONS] PATTERN [PATH ...]
    rg [OPTIONS] -e PATTERN ... [PATH ...]
    rg [OPTIONS] -f PATTERNFILE ... [PATH ...]
    rg [OPTIONS] --files [PATH ...]
    rg [OPTIONS] --type-list
    command | rg [OPTIONS] PATTERN
    rg [OPTIONS] --help
    rg [OPTIONS] --version

POSITIONAL ARGUMENTS:
    <PATTERN>
        A regular expression used for searching. To match a pattern beginning
        with a dash, use the -e/--regexp flag.

        For example, to search for the literal '-foo', you can use this flag:

            rg -e -foo

        You can also use the special '--' delimiter to indicate that no more
        flags will be provided. Namely, the following is equivalent to the
        above:

            rg -- -foo

    <PATH>...
        A file or directory to search. Directories are searched recursively.
        File paths specified on the command line override glob and ignore
        rules.

INPUT OPTIONS:
    -e PATTERN, --regexp=PATTERN
        A pattern to search for. This option can be provided multiple times,
        where all patterns given are searched, in addition to any patterns
        provided by -f/--file. Lines matching at least one of the provided
        patterns are printed. This flag can also be used when searching for
        patterns that start with a dash.

        For example, to search for the literal -foo:

            rg -e -foo

        You can also use the special -- delimiter to indicate that no more
        flags will be provided. Namely, the following is equivalent to the
        above:

            rg -- -foo

        When -f/--file or -e/--regexp is used, then ripgrep treats all
        positional arguments as files or directories to search.

    -f PATTERNFILE, --file=PATTERNFILE
        Search for patterns from the given file, with one pattern per line.
        When this flag is used multiple times or in combination with the
        -e/--regexp flag, then all patterns provided are searched. Empty
        pattern lines will match all input lines, and the newline is not
        counted as part of the pattern.

        A line is printed if and only if it matches at least one of the
        patterns.
```
