---
name: cli-bun
description: Use `bun` (bun 1.4.5): JavaScript and TypeScript runtime, package manager, bundler and test runner.
---

# bun 1.4.5

Binary: `bun`. Declared in `tools.toml`; install or update with `ay up bun`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `run`, `dev`, `test`, `check`, `lint`, `fmt`, `x`, `repl`, `exec`. Details: `bun <subcommand> --help`.

## `bun --help`

```text
Bun is a fast JavaScript runtime, package manager, bundler, and test runner. (1.4.5-canary.1+9098897a1)

Usage: bun <command> [...flags] [...args]

Commands:
  run  Execute a file with Bun
            dev                  Run a package.json script
  test                           Run unit tests with Bun
  check                          Type check a TypeScript project
  lint                           Lint JavaScript and TypeScript, like ESLint
  fmt                            Format JavaScript and TypeScript, like Prettier
  x  Execute a package binary (CLI), installing if needed (bunx)
  repl                           Start a REPL session with Bun
  exec                           Run a shell script directly with Bun

  install                        Install dependencies for a package.json (bun i)
  add  Add a dependency to package.json (bun a)
  remove  Remove a dependency from package.json (bun rm)
  update  Update outdated dependencies
  audit                          Check installed packages for vulnerabilities
  dedupe                         Remove duplicate versions from the lockfile
  prune                          Remove packages that are not in the lockfile from node_modules
  outdated                       Display latest versions of outdated dependencies
  link  Register or link a local npm package
  unlink                         Unregister a local npm package
  publish                        Publish a package to the npm registry
  patch  Prepare a package for patching
  pm  Additional package management utilities
  info  Display package metadata from the registry
  why  Explain why a package is installed

  build     ./a.ts ./b.jsx       Bundle TypeScript & JavaScript into a single file
  compile  Compile TypeScript & JavaScript into a standalone executable

  init                           Start an empty Bun project from a built-in template
  create  Create a new project from a template (bun c)
  upgrade                        Upgrade to latest version of Bun.

  <command> --help               Print help text for command.

Flags:
      --silent                        Don't print the script command
      --elide-lines=<val>             Number of lines of script output shown when using --filter (default: ...
  -v, --version                       Print version and exit
      --revision                      Print version with revision and exit
  -F, --filter=<val>                  Run a script in all workspace packages matching the pattern
  -b, --bun                           Force a script or package to use Bun's runtime instead of Node.js (vi...
      --no-orphans                    Exit when the parent process dies, and on exit kill every descendant.
      --shell=<val>                   Control the shell used for package.json scripts. Supports either 'bun...
      --workspaces                    Run a script in all workspace packages (from the "workspaces" field i...
      --parallel                      Run multiple scripts concurrently with Foreman-style output
      --sequential                    Run multiple scripts sequentially with Foreman-style output
      --no-exit-on-error              Continue running other scripts when one fails (with --parallel/--sequ...
      --watch                         Automatically restart the process on file change
      --watch-kill-signal=<val>       Signal whose handlers run when --watch restarts the process (default:...
      --hot                           Enable auto reload in the Bun runtime, test runner, or bundler
      --no-clear-screen               Disable clearing the terminal screen on reload when --hot or --watch ...
      --check                         Type check before running. Nothing runs if there are type errors. Alo...
      --aot                           Check the program like bun compile does, then run it with built-in ob...
      --aot-allow-code-from-disk      With --aot: let import() and require() load code from disk that wasn'...
      --smol                          Use less memory, but run garbage collection more often
      --interactive                   Start a Node.js-compatible REPL, like node --interactive
  -r, --preload=<val>                 Import a module before other modules are loaded
      --require=<val>                 Alias of --preload, for Node.js compatibility
      --import=<val>                  Alias of --preload, for Node.js compatibility
      --inspect=<val>                 Activate Bun's debugger
      --inspect-wait=<val>            Activate Bun's debugger, wait for a connection before executing
      --inspect-brk=<val>             Activate Bun's debugger, set breakpoint on first line of code and wait
      --cpu-prof                      Start CPU profiler and write profile to disk on exit
      --cpu-prof-name=<val>           Specify the name of the CPU profile file
```
