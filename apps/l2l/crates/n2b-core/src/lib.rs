// SPDX-License-Identifier: Apache-2.0 OR MIT
//! `n2b-core`: Sovereign foundation crate following three strict upstream systems conventions:
//!
//! 1. **Rust-in-Linux (`C:\src\linux\rust`)**:
//!    - Compact `Errno`-style `ErrorKind` + `N2bResult<T>` without dynamic heap backtraces.
//!    - Every `unsafe` block carries an explicit `// SAFETY:` invariant proof (`undocumented_unsafe_blocks = "deny"`).
//!    - Flat POD records with `#[repr(C)]` and Google `zerocopy` framing.
//! 2. **Rust-in-Bun (`C:\src\bun\Cargo.toml`)**:
//!    - `panic = "abort"`, `codegen-units = 1`, `FxHashMap` / `parking_lot` fast primitives,
//!      byte-oriented scanning over UTF-8 re-allocations, and sub-millisecond monorepo traversal.
//! 3. **Rust-for-Chromium (`C:\src\chromium\src\build\rust`)**:
//!    - `#![forbid(unsafe_op_in_unsafe_fn)]` across the entire crate graph, with `unsafe` isolated
//!      strictly to documented OS/FFI/mmap boundaries and `#[forbid(unsafe_code)]` enforced on pure logic modules.

#![forbid(unsafe_op_in_unsafe_fn)]

pub mod error;
pub mod magika_lite;
pub mod search;
pub mod sys;
pub mod walker;

pub use error::{ErrorKind, N2bError, N2bResult};
pub use magika_lite::{ContentCategory, ContentSignature, detect_content};
pub use search::{RipgrepEngine, SearchHit, SearchStats};
pub use walker::{FileRecord, MonorepoScanReport, MonorepoWalker, ScanOptions};
