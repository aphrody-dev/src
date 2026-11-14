---
name: cli-fd
description: Use `fd` (fd 10.5.2): A program to find entries in your filesystem with regex and glob based matching.
---

# fd 10.5.2

Binary: `fd`. Declared in `tools.toml`; install or update with `ay up fd`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `fd --help`

```text
A program to find entries in your filesystem with regex and glob based matching.

By default, fd respects gitignore rules, ignores hidden directories, and uses smart case (only
case sensitive if the pattern contains an uppercase character).

You can use '' or . as the search pattern to match all files.

Options may be given anywhere on the command line.

Usage: fd.exe [OPTIONS] [pattern] [path]...

Arguments:
  [pattern]
          the search pattern which is either a regular expression (default) or a glob pattern (if
          --glob is used). If no pattern has been specified, every entry is considered a match. If
          your pattern starts with a dash (-), make sure to pass '--' first, or it will be
          considered as a flag (fd -- '-foo').

  [path]...
          The directory where the filesystem search is rooted (optional). If omitted, search the
          current working directory. If supplied, the pattern must come first.

Options:
  -H, --hidden
          Include hidden directories and files in the search results (default: hidden files and
          directories are skipped). Files and directories are considered to be hidden if their
          name starts with a `.` sign (dot). Any files or directories that are ignored due to the
          rules described by --no-ignore are still ignored unless otherwise specified. The flag
          can be overridden with --no-hidden.

  -I, --no-ignore
          Show search results from files and directories that would otherwise be ignored by
          '.gitignore', '.ignore', '.fdignore', or the global ignore file. The flag can be
          overridden with --ignore.

      --no-ignore-vcs
          Show search results from files and directories that would otherwise be ignored by
          '.gitignore' files. The flag can be overridden with --ignore-vcs.

      --no-require-git
          Do not require a git repository to respect gitignores. By default, fd will only respect
          global gitignore rules, .gitignore rules, and local exclude rules if fd detects that you
          are searching inside a git repository. This flag allows you to relax this restriction
          such that fd will respect all git related ignore rules regardless of whether you're
          searching in a git repository or not.

          This flag can be disabled with --require-git.

      --no-ignore-parent
          Show search results from files and directories that would otherwise be ignored by
          '.gitignore', '.ignore', or '.fdignore' files in parent directories. The flag can be
          overridden with --ignore-parent.

  -u, --unrestricted
          Perform an unrestricted search, including ignored and hidden files. This is an alias for
          '--no-ignore --hidden'.

  -s, --case-sensitive
          Perform a case-sensitive search. By default, fd uses case-insensitive searches, unless
          the pattern contains an uppercase character (smart case).

  -i, --ignore-case
          Perform a case-insensitive search. By default, fd uses case-insensitive searches, unless
          the pattern contains an uppercase character (smart case).

  -g, --glob
          Perform a glob-based search instead of a regular expression search.

      --regex
          Perform a regular-expression based search (default). This can be used to override
```
