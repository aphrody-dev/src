---
name: cli-watchexec
description: Use `watchexec` (watchexec 2.7.0): Execute commands when watched files change.
---

# watchexec 2.7.0

Binary: `watchexec`. Declared in `tools.toml`; install or update with `ay up watchexec`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `watchexec --help`

```text
Execute commands when watched files change.

Recursively monitors the current directory for changes, executing the command when a filesystem
change is detected (among other event sources). By default, watchexec uses efficient kernel-level
mechanisms to watch for changes.

At startup, the specified command is run once, and watchexec begins monitoring for changes.

Events are debounced and checked using a variety of mechanisms, which you can control using the
flags in the **Filtering** section. The order of execution is: internal prioritisation (signals come
before everything else, and SIGINT/SIGTERM are processed even more urgently), then file event kind
(`--fs-events`), then files explicitly watched with `-w`, then ignores (`--ignore` and co), then
filters (which includes `--exts`), then filter programs.

Examples:

Rebuild a project when source files change:

$ watchexec make

Watch all HTML, CSS, and JavaScript files for changes:

$ watchexec -e html,css,js make

Run tests when source files change, clearing the screen each time:

$ watchexec -c make test

Launch and restart a node.js server:

$ watchexec -r node app.js

Watch lib and src directories for changes, rebuilding each time:

$ watchexec -w lib -w src make

Usage: watchexec [OPTIONS] [COMMAND]...

Arguments:
  [COMMAND]...
          Command (program and arguments) to run on changes

          It's run when events pass filters and the debounce period (and once at startup unless
          '--postpone' is given). If you pass flags to the command, you should separate it with --
          though that is not strictly required.

          Examples:

          $ watchexec -w src npm run build

          $ watchexec -w src -- rsync -a src dest

          Take care when using globs or other shell expansions in the command. Your shell may expand
          them before ever passing them to Watchexec, and the results may not be what you expect.
          Compare:

          $ watchexec echo src/*.rs

          $ watchexec echo 'src/*.rs'

          $ watchexec --shell=none echo 'src/*.rs'

          Behaviour depends on the value of '--shell': for all except 'none', every part of the
          command is joined together into one string with a single ascii space character, and given
          to the shell as described in the help for '--shell'. For 'none', each distinct element the
          command is passed as per the execvp(3) convention: first argument is the program, as a
          path or searched for in the 'PATH' environment variable, rest are arguments.

Options:
      --completions <SHELL>
```
