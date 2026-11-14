---
name: cli-bazelisk
description: Use `bazelisk` (bazelisk 1.30.0): Launcher that downloads and runs the Bazel version pinned by .bazelversion or USE_BAZEL_VERSION.
---

# bazelisk 1.30.0

Binary: `bazelisk`. Declared in `tools.toml`; install or update with `ay up bazelisk`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `bazelisk --help`

```text
bazelisk <bazel arguments>      every argument is forwarded to the resolved bazel
BAZELISK_HOME                   cache directory of downloaded bazel binaries
BAZELISK_SKIP_WRAPPER=1         skip tools/bazel wrapper scripts
USE_BAZEL_VERSION=<v|latest>    override .bazelversion
```
