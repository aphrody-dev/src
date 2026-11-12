#![forbid(unsafe_op_in_unsafe_fn)]
//! Zero-dependency Rust 2024 loader for `C:\src\.env` with automatic secret redaction.

use std::collections::BTreeMap;
use std::env;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// Default monorepo root `.env` location on Windows and POSIX.
pub const DEFAULT_MONOREPO_ENV_PATH: &str = if cfg!(windows) {
    r"C:\src\.env"
} else {
    "/src/.env"
};

/// Wrapper around sensitive credential strings whose `Debug` and `Display`
/// implementations always emit `[REDACTED]`, preventing accidental logging leaks.
#[derive(Clone, PartialEq, Eq, Hash, Default)]
pub struct SecretString {
    inner: String,
}

impl SecretString {
    #[must_use]
    pub fn new(value: impl Into<String>) -> Self {
        Self {
            inner: value.into(),
        }
    }

    /// Deliberate, explicit accessor required to read the underlying secret bytes.
    #[must_use]
    pub fn expose_secret(&self) -> &str {
        &self.inner
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.inner.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }
}

impl fmt::Debug for SecretString {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("[REDACTED]")
    }
}

impl fmt::Display for SecretString {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("[REDACTED]")
    }
}

impl From<String> for SecretString {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

impl From<&str> for SecretString {
    fn from(value: &str) -> Self {
        Self::new(value)
    }
}

/// Options controlling `.env` discovery, `std::env` mutation, and required-key validation.
#[derive(Debug, Clone, Default)]
pub struct LoadOptions<'a> {
    pub env_path: Option<&'a Path>,
    pub start_dir: Option<&'a Path>,
    pub service: Option<&'a str>,
    pub required: &'a [&'a str],
    pub override_existing: bool,
    pub inject_process_env: bool,
}

#[derive(Debug)]
pub enum EnvError {
    Io(io::Error),
    MissingRequired {
        service: String,
        missing: Vec<String>,
        env_path: PathBuf,
    },
}

impl fmt::Display for EnvError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(err) => write!(f, "I/O error reading .env: {err}"),
            Self::MissingRequired {
                service,
                missing,
                env_path,
            } => write!(
                f,
                "[service={service}] missing required environment keys ({}) after checking {}",
                missing.join(", "),
                env_path.display()
            ),
        }
    }
}

impl std::error::Error for EnvError {}

impl From<io::Error> for EnvError {
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

/// Loaded monorepo environment map storing values inside `SecretString`s so debug dumps are safe.
#[derive(Clone, Default)]
pub struct SovereignEnv {
    env_path: PathBuf,
    entries: BTreeMap<String, SecretString>,
}

impl fmt::Debug for SovereignEnv {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut map = f.debug_map();
        for (k, v) in &self.entries {
            if v.is_empty() {
                map.entry(k, &"UNSET");
            } else if is_secret_key(k, v.expose_secret()) {
                map.entry(k, &format!("SET [len={}]", v.len()));
            } else {
                map.entry(k, &v.expose_secret());
            }
        }
        map.finish()
    }
}

impl SovereignEnv {
    #[must_use]
    pub fn env_path(&self) -> &Path {
        &self.env_path
    }

    #[must_use]
    pub fn get_secret(&self, key: &str) -> Option<&SecretString> {
        self.entries.get(key)
    }

    #[must_use]
    pub fn get_exposed(&self, key: &str) -> Option<&str> {
        self.entries
            .get(key)
            .map(SecretString::expose_secret)
            .filter(|s| !s.is_empty())
    }

    #[must_use]
    pub fn masked_summary(&self) -> BTreeMap<String, String> {
        let mut out = BTreeMap::new();
        for (k, v) in &self.entries {
            let masked = if v.is_empty() {
                "UNSET".to_owned()
            } else if is_secret_key(k, v.expose_secret()) {
                format!("SET [len={}]", v.len())
            } else {
                v.expose_secret().to_owned()
            };
            out.insert(k.clone(), masked);
        }
        out
    }
}

/// Checks whether a variable key or value prefix represents a credential.
#[must_use]
pub fn is_secret_key(key: &str, value: &str) -> bool {
    let upper = key.to_ascii_uppercase();
    let has_secret_prefix = ["sk-", "AIza", "figd_", "ghp_", "gho_", "github_pat_", "npm_", "pypi-", "ctx7sk-"]
        .iter()
        .any(|p| value.starts_with(p));

    if (upper.ends_with("_DIR") || upper.ends_with("_PATH") || upper.ends_with("_HOME"))
        && !has_secret_prefix
    {
        return false;
    }
    if upper.ends_with("_URL") && !upper.contains("DATABASE_URL") && !has_secret_prefix {
        return false;
    }

    has_secret_prefix
        || [
            "TOKEN",
            "SECRET",
            "PASSWORD",
            "API_KEY",
            "PRIVATE_KEY",
            "AUTH",
            "CREDENTIAL",
            "DATABASE_URL",
        ]
        .iter()
        .any(|needle| upper.contains(needle))
}

/// Walks upward from `start_dir` looking for `.env`, falling back to `C:\src\.env`.
#[must_use]
pub fn resolve_monorepo_env_path(start_dir: Option<&Path>) -> PathBuf {
    let base = start_dir
        .map(Path::to_path_buf)
        .or_else(|| env::current_dir().ok());

    if let Some(mut dir) = base {
        loop {
            let candidate = dir.join(".env");
            if candidate.is_file() {
                return candidate;
            }
            if !dir.pop() {
                break;
            }
        }
    }

    PathBuf::from(DEFAULT_MONOREPO_ENV_PATH)
}

fn is_valid_env_ident(key: &str) -> bool {
    let mut chars = key.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !(first.is_ascii_alphabetic() || first == '_') {
        return false;
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

/// Parses `.env` text supporting `#` comments, `export `, single/double quotes, and `\n`, `\r`, `\t`, `\"`, `\\` escapes.
#[must_use]
pub fn parse_dotenv(content: &str) -> BTreeMap<String, SecretString> {
    let mut map = BTreeMap::new();

    for raw_line in content.lines() {
        let trimmed = raw_line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let normalized = trimmed
            .strip_prefix("export ")
            .map(str::trim)
            .unwrap_or(trimmed);

        let Some((raw_key, raw_val_part)) = normalized.split_once('=') else {
            continue;
        };

        let key = raw_key.trim();
        if !is_valid_env_ident(key) {
            continue;
        }

        let raw_val = raw_val_part.trim();
        let parsed_val = if let Some(after_quote) = raw_val.strip_prefix('"') {
            let mut out = String::with_capacity(after_quote.len());
            let mut escaped = false;
            for ch in after_quote.chars() {
                if escaped {
                    match ch {
                        'n' => out.push('\n'),
                        'r' => out.push('\r'),
                        't' => out.push('\t'),
                        other => out.push(other),
                    }
                    escaped = false;
                } else if ch == '\\' {
                    escaped = true;
                } else if ch == '"' {
                    break;
                } else {
                    out.push(ch);
                }
            }
            out
        } else if let Some(after_single) = raw_val.strip_prefix('\'') {
            match after_single.find('\'') {
                Some(idx) => after_single[..idx].to_owned(),
                None => after_single.to_owned(),
            }
        } else {
            let without_comment = strip_inline_comment(raw_val);
            without_comment.trim().to_owned()
        };

        map.insert(key.to_owned(), SecretString::new(parsed_val));
    }

    map
}

fn strip_inline_comment(val: &str) -> &str {
    let bytes = val.as_bytes();
    for i in 0..bytes.len() {
        if bytes[i] == b'#' && i > 0 && bytes[i - 1].is_ascii_whitespace() {
            return &val[..i];
        }
    }
    val
}

/// Loads `.env` entries without overriding existing process env vars unless requested.
///
/// Note: In Rust 2024, mutating process-global environment variables via `std::env::set_var`
/// is `unsafe` if other threads read the environment concurrently. Callers that only want
/// in-memory access can keep `inject_process_env: false`, or invoke `load_monorepo_env`
/// at process startup on the main thread.
pub fn load_monorepo_env(options: LoadOptions<'_>) -> Result<SovereignEnv, EnvError> {
    let env_path = options
        .env_path
        .map(Path::to_path_buf)
        .unwrap_or_else(|| resolve_monorepo_env_path(options.start_dir));

    let mut parsed = if env_path.is_file() {
        let text = fs::read_to_string(&env_path)?;
        parse_dotenv(&text)
    } else {
        BTreeMap::new()
    };

    for (key, secret) in &mut parsed {
        let existing_non_empty = env::var(key).ok().filter(|v| !v.is_empty());
        if let Some(proc_val) = existing_non_empty {
            if !options.override_existing {
                *secret = SecretString::new(proc_val);
                continue;
            }
        }
        if options.inject_process_env && !secret.is_empty() {
            // SAFETY: Intended to be called at early single-threaded startup when `inject_process_env` is enabled.
            unsafe {
                env::set_var(key, secret.expose_secret());
            }
        }
    }

    if !options.required.is_empty() {
        let mut missing = Vec::new();
        for &req in options.required {
            let present = env::var(req)
                .ok()
                .filter(|v| !v.is_empty())
                .is_some()
                || parsed
                    .get(req)
                    .map(|s| !s.is_empty())
                    .unwrap_or(false);
            if !present {
                missing.push(req.to_owned());
            }
        }
        if !missing.is_empty() {
            return Err(EnvError::MissingRequired {
                service: options.service.unwrap_or("default").to_owned(),
                missing,
                env_path,
            });
        }
    }

    Ok(SovereignEnv {
        env_path,
        entries: parsed,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_quotes_comments_and_escapes() {
        let sample = r#"
            # Top comment
            SIMPLE_KEY=hello_world # trailing comment
            export QUOTED_MULTI="line1\nline2\t\"quoted\""
            SINGLE_QUOTED='literal \n no escape # keep hash'
            EMPTY_SLOT=
        "#;

        let map = parse_dotenv(sample);
        assert_eq!(map["SIMPLE_KEY"].expose_secret(), "hello_world");
        assert_eq!(
            map["QUOTED_MULTI"].expose_secret(),
            "line1\nline2\t\"quoted\""
        );
        assert_eq!(
            map["SINGLE_QUOTED"].expose_secret(),
            r"literal \n no escape # keep hash"
        );
        assert!(map["EMPTY_SLOT"].is_empty());
    }

    #[test]
    fn redacts_secret_string_in_debug_and_display() {
        let tok = SecretString::new("test_placeholder_value_12345");
        assert_eq!(format!("{tok}"), "[REDACTED]");
        assert_eq!(format!("{tok:?}"), "[REDACTED]");
        assert_eq!(tok.expose_secret(), "test_placeholder_value_12345");
    }

    #[test]
    fn sovereign_env_debug_never_leaks_secrets() {
        let sample = "GITHUB_TOKEN=ghp_1234567890abcdef\nGOOGLE_CLOUD_PROJECT=aphrody\n";
        let entries = parse_dotenv(sample);
        let env = SovereignEnv {
            env_path: PathBuf::from("C:/src/.env"),
            entries,
        };
        let dbg = format!("{env:?}");
        assert!(!dbg.contains("ghp_1234567890abcdef"));
        assert!(dbg.contains("SET [len=20]"));
        assert!(dbg.contains("aphrody"));
    }
}
