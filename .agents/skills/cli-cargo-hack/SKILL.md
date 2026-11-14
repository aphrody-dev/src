---
name: cli-cargo-hack
description: Use `cargo-hack` (cargo-hack 0.6.46): Cargo subcommand to provide various options useful for testing and continuous integration.
---

# cargo-hack 0.6.46

Binary: `cargo-hack`. Declared in `tools.toml`; install or update with `ay up cargo-hack`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `cargo-hack --help`

```text
cargo-hack
Cargo subcommand to provide various options useful for testing and continuous integration.

USAGE:
    cargo hack [OPTIONS] [SUBCOMMAND]

Use -h for short descriptions and --help for more details.

OPTIONS:
    -p, --package <SPEC>...
            Package(s) to check.

        --all
            Alias for --workspace.

        --workspace
            Perform command for all packages in the workspace.

        --exclude <SPEC>...
            Exclude packages from the check.

        --manifest-path <PATH>
            Path to Cargo.toml.

        --locked
            Require Cargo.lock is up to date.

    -F, --features <FEATURES>...
            Space or comma separated list of features to activate.

        --each-feature
            Perform for each feature of the package.

            This also includes runs with just --no-default-features flag, and default features.

            When this flag is not used together with --exclude-features (--skip) and
            --include-features and there are multiple features, this also includes runs with just
            --all-features flag.

        --feature-powerset
            Perform for the feature powerset of the package.

            This also includes runs with just --no-default-features flag, and default features.

            When this flag is used together with --depth or namespaced features (-Z
            namespaced-features) and not used together with --exclude-features (--skip) and
            --include-features and there are multiple features, this also includes runs with just
            --all-features flag.

        --optional-deps [DEPS]...
            Use optional dependencies as features.

            If DEPS are not specified, all optional dependencies are considered as features.

            This flag can only be used together with either --each-feature flag or
            --feature-powerset flag.

        --skip <FEATURES>...
            Alias for --exclude-features.

        --exclude-features <FEATURES>...
            Space or comma separated list of features to exclude.

            To exclude run of default feature, using value `--exclude-features default`.

            To exclude run of just --no-default-features flag, using --exclude-no-default-features
            flag.

            To exclude run of just --all-features flag, using --exclude-all-features flag.

```
