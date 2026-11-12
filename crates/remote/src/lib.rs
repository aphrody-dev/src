//! `aphrody-remote`: pure-Rust SSH client behind `ay ssh` (russh + russh-sftp), replacing
//! OpenSSH client invocations. Reads `~/.ssh/config` aliases, verifies host keys against
//! known_hosts, authenticates with ssh-agent then identity files, and maps deploy.toml nodes
//! (`usa`, `fr1`, `fr2`) to their ssh aliases.

pub mod cli;
pub mod config;
pub mod fleet;
pub mod known_hosts;
pub mod session;

pub use cli::run;
pub use config::{HostConfig, SshConfig};
pub use fleet::{Node, Target, resolve_targets};
pub use session::{ConnectOptions, Output, Session};
