---
name: cli-niubash
description: Use `niu` (niubash 1.5.0): niu [GNU long option] [option] script-file ...
---

# niubash 1.5.0

Binary: `niu`. Declared in `tools.toml`; install or update with `ay up niubash`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `niu --help`

```text
Niubash 1.5.0  a bash-compatible shell that feels at home on Windows.

Usage:  niu [GNU long option] [option] ...
        niu [GNU long option] [option] script-file ...
        niu -c <cmd>         Run a command then exit
        niu -C <cmd>         Run one REPL-style command then exit
        niu setup           Re-run prompt/plugin setup
        niu font            Nerd Font detection & install recommendations
        niu doctor          Health-check the installation
        niu <script> [args]  Run a script file

GNU long options:
    --debug
    --debugger
    --dump-po-strings
    --dump-strings
    --help
    --init-file <file>
    --login
    --noediting
    --noprofile
    --norc
    --posix
    --pretty-print
    --rcfile <file>
    --restricted
    --verbose
    --version

Shell options:
    -ilrsD or -c command or -O shopt_option    (invocation only)
    -abefhkmnptuvxBCEHPT or -o option

    -c <command> runs the command string (the word after it becomes $0);
    -s reads commands from standard input; --init-file and --rcfile each
    take <file>, replacing the default startup file (profile chain / rc).

Script debugging:
  niu --debug <script> [args]  Debug a script in the interactive CLI
                               (commands come from the controlling terminal)
  niu --dap <script> [args]    Serve the Debug Adapter Protocol on stdio
  niu --debug --dap <script>   The spelled-out editor launch form
  niu --debugger <script>      Source the GNU bashdb starter (GNU parity)
  --dap with no script runs a pure DAP server; the client's `launch`
  request names the program. `--debug` with -c, -s, or -i keeps the
  legacy extdebug-arming behavior (no debugger frontend).

Type `niu -c "help set"` for more information about shell options.
Type `niu -c help` for more information about shell builtin commands.
Report bugs at <https://github.com/unixwin/niubash/issues>.
Niubash home page: <https://github.com/unixwin/niubash>.

Options:
  -h, --help                Show this help
  -V, --version             Version and component info
  -c <command>              Execute a command ad-hoc
  -C, --repl-command <cmd>  Execute one non-interactive REPL command
  Verbatim handoff (execute a base64-encoded command, no quoting):
      --encoded-command <b64>  canonical spelling
      -EncodedCommand <b64>    PowerShell spelling, matched case-insensitively
      --ec <b64>               short alias for --encoded-command
                               optional `v1:` prefix guards against MSYS path rewrite
      --cwd-state <file>       Restore the recorded directory at startup and
                               record the final directory back on exit

Bash-compatible invocation options (GNU semantics, parsed by the engine):
  -c <command>              Execute the next non-option argument as a command
  -i                        Force the interactive shell
  -l, --login               Act as a login shell
  -r, --restricted          Restricted shell (restricts cd and PATH/ENV changes)
```
