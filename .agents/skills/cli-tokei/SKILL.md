---
name: cli-tokei
description: Use `tokei` (tokei 12.1.2): Count your code, quickly.
---

# tokei 12.1.2

Binary: `tokei`. Declared in `tools.toml`; install or update with `ay up tokei`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `tokei --help`

```text
tokei 12.1.2 compiled with serialization support: json, cbor, yaml
Count your code, quickly.
Support this project on GitHub Sponsors: https://github.com/sponsors/XAMPPRocky

USAGE:
    tokei.exe [FLAGS] [OPTIONS] [--] [input]...

FLAGS:
    -C, --compact             Do not print statistics about embedded languages.
    -f, --files               Will print out statistics on individual files.
    -h, --help                Prints help information
        --hidden              Count hidden files.
    -l, --languages           Prints out supported languages and their extensions.
        --no-ignore           Don't respect ignore files (.gitignore, .ignore, etc.). This implies --no-ign...
                              --no-ignore-dot, and --no-ignore-vcs.
        --no-ignore-dot       Don't respect .ignore and .tokeignore files, including those in parent direct...
        --no-ignore-parent    Don't respect ignore files (.gitignore, .ignore, etc.) in parent directories.
        --no-ignore-vcs       Don't respect VCS ignore files (.gitignore, .hgignore, etc.), including those...
                              directories.
    -V, --version             Prints version information
    -v, --verbose             Set log output level:
                                          1: to show unknown file extensions,
                                          2: reserved for future debugging,
                                          3: enable file level trace. Not recommended on multiple files

OPTIONS:
    -c, --columns <columns>                Sets a strict column width of the output, only available for ter...
    -e, --exclude <exclude>...             Ignore all files & directories matching the pattern.
    -i, --input <file_input>               Gives statistics from a previous tokei run. Can be given a file ...
                                           "stdin" to read from stdin.
    -n, --num-format <num_format_style>    Format of printed numbers, i.e. plain (1234, default), commas (1...
                                           (1.234), or underscores (1_234). Cannot be used with --output. [...
                                           values: commas, dots, plain, underscores]
    -o, --output <output>                  Outputs Tokei in a specific format. Compile with additional feat...
                                           format support. [possible values: cbor, json, yaml]
    -s, --sort <sort>                      Sort languages based on column [possible values: files, lines, b...
                                           comments]
    -t, --type <types>                     Filters output by language type, seperated by a comma. i.e. -t=R...

ARGS:
    <input>...    The path(s) to the file or directory to be counted.
```
