---
name: cli-zig
description: Use `zig` (zig 0.17.1): Zig compiler, build system and C/C++ cross toolchain.
---

# zig 0.17.1

Binary: `zig`. Declared in `tools.toml`; install or update with `ay up zig`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `zig --help`

```text
Usage: zig [command] [options]

Commands:

  build            Build project from build.zig
  fetch            Copy a package into global cache and print its hash
  init             Initialize a Zig package in the current directory

  build-exe        Create executable from source or object files
  build-lib        Create library from source or object files
  build-obj        Create object from source or object files
  test             Perform unit testing
  test-obj         Create object for unit testing
  run              Create executable and run immediately

  ast-check        Look for simple compile errors in any set of files
  fmt              Reformat Zig source into canonical form
  reduce           Minimize a bug report
  translate-c      Convert C code to Zig code

  ar               Combine object files into static archive
  cc               Use Zig as a drop-in C compiler
  c++              Use Zig as a drop-in C++ compiler
  dlltool          Use Zig as a drop-in dlltool.exe
  lib              Use Zig as a drop-in lib.exe
  objcopy          Manipulate executables and relocatables
  objdump          Print information about executables and relocatables
  ranlib           Use Zig as a drop-in ranlib
  rc               Use Zig as a drop-in rc.exe

  env              Print lib path, std path, cache directory, and version
  help             Print this help and exit
  cache-cat        Print a zig-cache manifest file as zon
  std              View standard library documentation in a browser
  libc             Display native libc paths file or validate one
  targets          List available compilation targets
  version          Print version number and exit
  zen              Print Zen of Zig and exit

General Options:

  -h, --help       Print command-specific usage
```
