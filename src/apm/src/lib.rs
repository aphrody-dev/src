//! Rust port of Microsoft APM (Agent Package Manager), upstream commit `1a6c1df`.
//!
//! Covers the `apm.yml` manifest, `apm.lock.yaml` (byte-compatible with the
//! Python writer), dependency resolution (local paths, git), and
//! `install` / `compile` for the Claude Code and Copilot targets.

pub mod compile;
pub mod deploy;
pub mod frontmatter;
pub mod hash;
pub mod install;
pub mod lockfile;
pub mod manifest;
pub mod reference;
pub mod resolve;
pub mod targets;
pub mod yaml;
