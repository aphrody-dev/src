//! Types communs, sans dépendance à un backend (FFmpeg, crates Rust, matériel).

mod error;
mod media;
mod rational;

pub use error::{Error, Result};
pub use media::{Definition, MediaInfo, MediaKind, StreamInfo};
pub use rational::{Rational, Timestamp};
