# Machine setup, toolchain pins, intelligent-terminal fork (imported by the root justfile).

# Regenerate the pinned toolchain manifest (versions + upstream checksums)
[group('machine')]
toolchains-lock:
    bun "{{root}}/packages/machine/src/toolchains-lock.ts"

# Central terminal stack (docs/terminal/ARCHITECTURE.md): Linux validation of the forks on prd at the src.lock.json pins (cpp | rust | all)
[group('machine')]
terminal-prd step="all" jobs="4":
    bun -e "if (!/^(cpp|rust|all)$/.test(process.argv[1]) || !/^[1-8]$/.test(process.argv[2])) process.exit(2)" "{{step}}" "{{jobs}}"
    ay ssh cp "{{root}}/infra/fleet/bin/terminal-prd-build.sh" prd:terminal-prd-build.sh
    ay ssh exec prd -- "JOBS={{jobs}} PINS='$(bun -e "const l = await Bun.file(process.argv[1]).json(); console.log(process.argv.slice(2).map((n) => n + '=' + l.repositories['third_party/' + n].commit).join(' '))" "{{root}}/src.lock.json" fmt GSL jsoncpp CLI11 cmark ratatui crossterm tui-markdown acp-rust-sdk terminal-control)' sh terminal-prd-build.sh {{step}}"

# Windows build of intelligent-terminal (WindowsTerminal.exe, wta.exe, installer, C++ and Rust tests): PR CI of the fork, workflow_dispatch on main
[group('machine')]
terminal-ci:
    gh workflow run "PR CI" -R aphrody-labs/intelligent-terminal --ref main

# Last fork CI runs of intelligent-terminal (a dispatched run appears a few seconds after terminal-ci)
[group('machine')]
terminal-ci-status:
    gh run list -R aphrody-labs/intelligent-terminal -w "PR CI" -L 3

# Advance the intelligent-terminal fork to upstream main, refresh every third_party fork (forks.ts), then re-pin src.lock.json
[group('machine')]
terminal-sync:
    gh repo sync aphrody-labs/intelligent-terminal --branch main
    bun "{{root}}/packages/machine/src/forks.ts"
    ay lock --lock-only

[group('machine')]
js-deps *flags:
    bun "{{root}}/packages/machine/src/js-deps-check.ts" --root "{{root}}" {{flags}}

# Install Gemini Desktop silently from the Google-signed installer (default var/GeminiSetup.exe; usage: just gemini-setup [path] [--check])
[group('machine')]
gemini-setup *args:
    bun "{{root}}/packages/machine/src/gemini-setup.ts" {{args}}
