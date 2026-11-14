---
name: cli-sccache
description: Use `sccache` (sccache 0.19.0): Compiler cache for rustc and C/C++ with local or remote storage.
---

# sccache 0.19.0

Binary: `sccache`. Declared in `tools.toml`; install or update with `ay up sccache`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `sccache --help`

```text
Usage: sccache.exe [OPTIONS] <--dist-auth|--debug-preprocessor-cache|--dist-status|--show-stats|--show-adv-...

Arguments:
  [CMD]...

Options:
  -s, --show-stats                     show cache statistics
      --show-adv-stats                 show advanced cache statistics
      --start-server                   start background server
      --debug-preprocessor-cache       show all preprocessor cache entries
      --stop-server                    stop background server
  -z, --zero-stats                     zero statistics counters
      --dist-auth                      authenticate for distributed compilation
      --dist-status                    show status of the distributed client
      --package-toolchain <EXE> <OUT>  package toolchain for distributed compilation
      --stats-format <FMT>             set output format of statistics [default: text] [possible
                                       values: text, json]
  -h, --help                           Print help
  -V, --version                        Print version

Enabled features:
    S3:        true
    Redis:     true
    Memcached: true
    GCS:       true
    GHA:       true
    Azure:     true
    WebDAV:    true
    OSS:       true
    COS:       true
```
