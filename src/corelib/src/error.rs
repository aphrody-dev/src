// SPDX-License-Identifier: Apache-2.0
//! Unified error handling across sovereign corelib surfaces

use thiserror::Error;

pub type Result<T> = std::result::Result<T, CorelibError>;

#[derive(Error, Debug)]
pub enum CorelibError {
    #[error("GPU error: {0}")]
    Gpu(String),

    #[error("Reverse engineering error: {0}")]
    Re(String),

    #[error("Emulation/simulation error: {0}")]
    Emulation(String),

    #[error("VFS error: {0}")]
    Vfs(String),

    #[error("WASM bridge error: {0}")]
    Wasm(String),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
}
