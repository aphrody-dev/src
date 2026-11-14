// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Rust-in-Linux style flat error representation without `Box<dyn Error>` heap bloat.

#![forbid(unsafe_code)]

use core::fmt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u16)]
pub enum ErrorKind {
    Io = 1,
    InvalidPath = 2,
    ParseFailure = 3,
    BinaryFormat = 4,
    SubprocessFailed = 5,
    VendorReadOnlyViolation = 6,
    UnsupportedArchitecture = 7,
    InvalidConfig = 8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N2bError {
    pub kind: ErrorKind,
    pub context: String,
}

impl N2bError {
    #[inline]
    pub fn new(kind: ErrorKind, context: impl Into<String>) -> Self {
        Self {
            kind,
            context: context.into(),
        }
    }

    #[inline]
    pub fn io(err: &std::io::Error, path: &str) -> Self {
        Self {
            kind: ErrorKind::Io,
            context: format!("{path}: {err}"),
        }
    }
}

impl fmt::Display for N2bError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{:?}] {}", self.kind, self.context)
    }
}

impl std::error::Error for N2bError {}

impl From<std::io::Error> for N2bError {
    fn from(err: std::io::Error) -> Self {
        Self::new(ErrorKind::Io, err.to_string())
    }
}

impl From<serde_json::Error> for N2bError {
    fn from(err: serde_json::Error) -> Self {
        Self::new(ErrorKind::ParseFailure, err.to_string())
    }
}

pub type N2bResult<T> = Result<T, N2bError>;
