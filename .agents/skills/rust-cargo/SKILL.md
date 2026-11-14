---
name: rust-cargo
description: Cargo 2026 reference grounded in upstream rust-lang/cargo and aphrody-labs/cargo: Edition 2024, resolver v3, workspace inheritance, sparse registry, credential providers, and cargo-deny.
---

# Rust Cargo (2026)

Fork: `aphrody-labs/cargo` (parent: `rust-lang/cargo`, default branch: `master`, registered in `third_party/forks.txt`).
Upstream docs: `https://doc.rust-lang.org/cargo/reference/`.

## Edition 2024 and Resolver v3

Virtual workspaces have `[workspace]` without `[package]`, so `resolver` must be set explicitly in `[workspace]` (cannot be inferred from `package.edition`):

```toml
[workspace]
resolver = "3"
members = ["crates/*"]

[workspace.package]
edition = "2024"
rust-version = "1.85"
```

- `resolver = "3"` (default for `edition = "2024"`, requires Rust 1.84+): changes `resolver.incompatible-rust-versions` default from `allow` to `fallback`.
- In `C:\src\Cargo.toml`, `resolver = "3"` and `edition = "2024"` are set at workspace root, with `cargo-features = ["codegen-backend", "panic-immediate-abort"]`.

## Workspace Dependency Inheritance

Members inherit from `[workspace.dependencies]` via `workspace = true`. Edition 2024 supports `features`, `default-features`, and `optional` alongside `workspace = true` (overriding `version` is disallowed):

```toml
[dependencies]
serde = { workspace = true, default-features = false }
regex = { workspace = true, features = ["unicode"] }

[build-dependencies]
cc.workspace = true
```

## Sparse Registry and Credential Providers

Cargo uses the sparse HTTP protocol (`sparse+https://index.crates.io/`) by default for crates.io. Custom registries can be configured in `.cargo/config.toml`:

```toml
[registries.my-registry]
index = "sparse+https://example.com/path/to/index"

[registry]
global-credential-providers = [
  "cargo:token",
  "cargo:libsecret",
  "cargo:macos-keychain",
  "cargo:wincred",
]
```

Later entries in `global-credential-providers` take higher precedence; `cargo:wincred` stores tokens in Windows Credential Manager instead of plaintext `credentials.toml`.

## Dependency Auditing with cargo-deny

`cargo-deny` (`0.20.2` on crates.io) checks advisories, licenses, banned crates, and allowed sources:

```bash
cargo deny check advisories bans sources
cargo deny check licenses
```

## Monorepo Execution Rules

- Do not run heavy Rust builds on the workstation; compile in CI or on `fr1` via `just` or `ay`.
- Single workspace `Cargo.lock` and target directory at `C:\src`.
