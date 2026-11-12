//! gclient in Rust.
//!
//! - [`eval`]: safe evaluation of DEPS / `.gclient` (port of `gclient_eval.py`) on Ruff's parser.
//! - [`condition`]: `EvaluateCondition`.
//! - [`deps`]: `Parse` (standardized deps, `deps_os`, `hooks_os`).
//! - [`tree`]: the dependency tree, variable scoping, `revinfo`, hooks.
//! - [`edit`]: `getdep` / `setdep` as in-place edits of the DEPS text.
//! - [`sync`]: sync planner and gix executor.
//! - [`cli`]: `ay gclient` and `ay fetch`.

pub mod cli;
pub mod condition;
pub mod deps;
pub mod edit;
pub mod eval;
pub mod fetch;
pub mod sync;
pub mod tree;
pub mod value;

pub use tree::{Client, Options};
pub use value::{Dict, Value};

/// An evaluation or I/O error, with the file and line when known.
#[derive(Debug, Clone, PartialEq)]
pub struct Error {
    msg: String,
    missing_key: Option<String>,
}

impl Error {
    pub fn new(msg: impl Into<String>) -> Self {
        Self {
            msg: msg.into(),
            missing_key: None,
        }
    }

    /// A `{name}` placeholder or `Var(name)` without a declared variable.
    pub fn key(name: &str) -> Self {
        Self {
            msg: format!("KeyError: '{name}'"),
            missing_key: Some(name.to_string()),
        }
    }

    pub fn missing_key(&self) -> Option<&str> {
        self.missing_key.as_deref()
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.msg)
    }
}

impl std::error::Error for Error {}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Error::new(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
