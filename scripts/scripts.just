# Gates driven by scripts/ (checkdeps, identity, vcs) (imported by the root justfile).

# NHITL VCS & GitHub Forge CLI via GitHub App aphrody-labs (auth|submodules|worktree|issue|pr|fork)
[group('gates')]
vcs *args:
    bun run "{{root}}/scripts/vcs.ts" {{args}}

# identity.toml gate / rewrite / lookup (check | apply | get <key>)
[group('gates')]
identity cmd="check" *args:
    bun "{{root}}/scripts/identity.ts" {{cmd}} {{args}} --root "{{root}}"

# Layered dependency gate (Chromium checkdeps analogue): DEPS.rules per directory, see docs/ARCHITECTURE.md
[group('gates')]
checkdeps *flags:
    bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" {{flags}}

# Units changed since ref plus transitive dependents (task graph filter, turbo `--filter=...[ref]` analogue)
[group('gates')]
affected ref="origin/main":
    bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" --affected "{{ref}}"

# Test only affected units: cargo -p for crates, bun test for packages. Cargo cache: local sccache (R2 remote cache: TICKET taskgraph-001)
[group('gates')]
test-affected ref="origin/main":
    #!/usr/bin/env sh
    set -eu
    out=$(bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" --affected "{{ref}}")
    pkgs=$(printf '%s\n' "$out" | awk -F'\t' '$1=="cargo" && $3 ~ /^crates\// {printf "-p %s ", $2}')
    bunp=$(printf '%s\n' "$out" | awk -F'\t' '$1=="bun" && $3 ~ /^packages\// {printf "%s/%s ", "{{root}}", $3}')
    [ -z "$pkgs" ] || cargo test $pkgs
    [ -z "$bunp" ] || bun test $bunp
    pyp=$(printf '%s\n' "$out" | awk -F'\t' '$1=="uv" {printf "%s/%s ", "{{root}}", $3}')
    [ -z "$pyp" ] || uv run pytest $pyp
