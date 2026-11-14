---
name: cli-ouch
description: Use `ouch` (ouch 0.8.3): A command-line utility for easily compressing and decompressing files and directories.
---

# ouch 0.8.3

Binary: `ouch`. Declared in `tools.toml`; install or update with `ay up ouch`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `compress`, `decompress`, `list`. Details: `ouch <subcommand> --help`.

## `ouch --help`

```text
A command-line utility for easily compressing and decompressing files and directories.

Supported formats: tar, zip, gz, 7z, xz, lzma, lzip, bz/bz2, bz3, lz4, sz (Snappy), zst, rar and br.

Repository: https://github.com/ouch-org/ouch

Usage: ouch.exe [OPTIONS] <COMMAND>

Commands:
  compress    Compress one or more files into one output file [aliases: c]
  decompress  Decompresses one or more files, optionally into another folder [aliases: d]
  list        List contents of an archive [aliases: l, ls]
  help        Print this message or the help of the given subcommand(s)

Options:
  -y, --yes
          Skip [Y/n] questions, default to yes

  -n, --no
          Skip [Y/n] questions, default to no

  -A, --accessible
          Activate accessibility mode, reducing visual noise

          [env: ACCESSIBLE=]

  -H, --hidden
          Ignore hidden files

  -q, --quiet
          Silence output

  -g, --gitignore
          Ignore files matched by git's ignore files

  -f, --format <FORMAT>
          Specify the format of the archive

  -p, --password <PASSWORD>
          Decompress or list with password

          [env: OUCH_PASSWORD=]

  -c, --threads <THREADS>
          Concurrent working threads

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
```
