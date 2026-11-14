//! Downloads over rustls (ureq) and sha256 verification.
//!
//! GitHub release assets are fetched from the public download URL first. A 404 with a
//! token available (`GH_TOKEN` / `GITHUB_TOKEN`, from the environment or the repo `.env`)
//! retries through the REST API, which also serves private releases.

use sha2::{Digest, Sha256};

const USER_AGENT: &str = concat!("ay-up/", env!("CARGO_PKG_VERSION"));
/// Largest download accepted (the gcloud SDK archive is about 150 MB).
// Ollama ships CUDA and ROCm libraries in its archives (over 1 GiB on Windows).
const MAX_BODY: u64 = 4 << 30;

/// ureq 3 agent. Its default `redirect_auth_headers = Never` drops `Authorization` when
/// following a redirect, so API tokens never reach the signed storage hosts.
fn agent() -> ureq::Agent {
    ureq::Agent::config_builder()
        .user_agent(USER_AGENT)
        .timeout_connect(Some(std::time::Duration::from_secs(20)))
        .build()
        .into()
}

/// GET `url`; `Err((status, message))`, status 0 for transport errors.
pub fn get(url: &str, headers: &[(&str, &str)]) -> Result<Vec<u8>, (u16, String)> {
    let mut req = agent().get(url);
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    match req.call() {
        Ok(mut resp) => resp
            .body_mut()
            .with_config()
            .limit(MAX_BODY)
            .read_to_vec()
            .map_err(|e| (0, format!("{}: {e}", redact(url)))),
        Err(ureq::Error::StatusCode(code)) => {
            Err((code, format!("HTTP {code} for {}", redact(url))))
        }
        Err(e) => Err((0, format!("{}: {e}", redact(url)))),
    }
}

/// A response whatever its status (304 and 4xx included), with the headers a poller needs.
#[derive(Debug, Clone, Default)]
pub struct Reply {
    pub status: u16,
    pub etag: Option<String>,
    /// `Link` header (GitHub pagination).
    pub link: Option<String>,
    pub body: Vec<u8>,
}

/// GET `url` without turning HTTP statuses into errors, so callers can send `If-None-Match`
/// and read a 304. `Err` only for transport failures.
pub fn request(url: &str, headers: &[(&str, &str)]) -> Result<Reply, String> {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .user_agent(USER_AGENT)
        .timeout_connect(Some(std::time::Duration::from_secs(20)))
        .timeout_global(Some(std::time::Duration::from_secs(120)))
        .http_status_as_error(false)
        .build()
        .into();
    let mut req = agent.get(url);
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    let mut resp = req.call().map_err(|e| format!("{}: {e}", redact(url)))?;
    let header = |name: &str| {
        resp.headers()
            .get(name)
            .and_then(|v| v.to_str().ok())
            .map(str::to_string)
    };
    let (status, etag, link) = (resp.status().as_u16(), header("etag"), header("link"));
    let body = resp
        .body_mut()
        .with_config()
        .limit(MAX_BODY)
        .read_to_vec()
        .map_err(|e| format!("{}: {e}", redact(url)))?;
    Ok(Reply { status, etag, link, body })
}

/// Drop query strings from URLs in messages (signed URLs carry credentials there).
fn redact(url: &str) -> &str {
    url.split('?').next().unwrap_or(url)
}

/// Download a release asset of `repo` at `tag`, retrying through the API with `token`.
pub fn github_asset(
    repo: &str,
    tag: &str,
    asset: &str,
    token: Option<&str>,
) -> Result<Vec<u8>, String> {
    let public = format!("https://github.com/{repo}/releases/download/{tag}/{asset}");
    match get(&public, &[]) {
        Ok(body) => Ok(body),
        Err((404, msg)) => match token {
            Some(token) => github_api_asset(repo, tag, asset, token),
            None => Err(format!("{msg} (private release? set GH_TOKEN)")),
        },
        Err((_, msg)) => Err(msg),
    }
}

fn github_api_asset(repo: &str, tag: &str, asset: &str, token: &str) -> Result<Vec<u8>, String> {
    let auth = format!("Bearer {token}");
    let release_url = format!("https://api.github.com/repos/{repo}/releases/tags/{tag}");
    let body = get(
        &release_url,
        &[
            ("Authorization", &auth),
            ("Accept", "application/vnd.github+json"),
        ],
    )
    .map_err(|(_, m)| m)?;
    let release: serde_json::Value =
        serde_json::from_slice(&body).map_err(|e| format!("release JSON: {e}"))?;
    let id = release
        .get("assets")
        .and_then(|a| a.as_array())
        .and_then(|assets| {
            assets
                .iter()
                .find(|a| a.get("name").and_then(|n| n.as_str()) == Some(asset))
        })
        .and_then(|a| a.get("id"))
        .and_then(|id| id.as_u64())
        .ok_or_else(|| format!("{repo} {tag}: no asset {asset}"))?;
    // The API redirects to signed storage; the agent drops the token on that hop.
    let asset_url = format!("https://api.github.com/repos/{repo}/releases/assets/{id}");
    get(
        &asset_url,
        &[
            ("Authorization", &auth),
            ("Accept", "application/octet-stream"),
        ],
    )
    .map_err(|(_, m)| m)
}

pub fn sha256_hex(data: &[u8]) -> String {
    let digest = Sha256::digest(data);
    digest.iter().map(|b| format!("{b:02x}")).collect()
}

/// Find the hash for `asset` in a checksum file: `sha256sum` lines (`<hex>  [*][./]name`),
/// or a file holding a single hash.
pub fn checksum_for(text: &str, asset: &str) -> Option<String> {
    let is_hex = |s: &str| s.len() == 64 && s.bytes().all(|b| b.is_ascii_hexdigit());
    let entries: Vec<(&str, Option<&str>)> = text
        .lines()
        .filter_map(|line| {
            let mut it = line.split_whitespace();
            let hash = it.next().filter(|h| is_hex(h))?;
            Some((
                hash,
                it.next()
                    .map(|n| n.trim_start_matches('*').trim_start_matches("./")),
            ))
        })
        .collect();
    if let Some((hash, _)) = entries.iter().find(|(_, name)| *name == Some(asset)) {
        return Some(hash.to_ascii_lowercase());
    }
    match entries.as_slice() {
        [(hash, _)] => Some(hash.to_ascii_lowercase()),
        _ => None,
    }
}

/// Compare `data` with `expected` (lowercase hex).
pub fn verify(data: &[u8], expected: &str, what: &str) -> Result<(), String> {
    let actual = sha256_hex(data);
    if actual.eq_ignore_ascii_case(expected) {
        Ok(())
    } else {
        Err(format!(
            "{what}: sha256 mismatch (expected {expected}, got {actual})"
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_of_known_input() {
        assert_eq!(
            sha256_hex(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
        assert!(
            verify(
                b"abc",
                "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD",
                "abc"
            )
            .is_ok()
        );
        assert!(
            verify(
                b"abd",
                "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                "abd"
            )
            .is_err()
        );
    }

    #[test]
    fn checksum_file_formats() {
        let a = "a".repeat(64);
        let b = "b".repeat(64);
        let sums = format!("{a}  just-1.0-x86_64.tar.gz\n{b}  just-1.0-aarch64.tar.gz\n");
        assert_eq!(
            checksum_for(&sums, "just-1.0-aarch64.tar.gz"),
            Some(b.clone())
        );
        assert_eq!(
            checksum_for(&sums, "other.zip"),
            None,
            "several entries, none matching"
        );
        assert_eq!(
            checksum_for(&format!("{a} *./rustup-init\n"), "rustup-init"),
            Some(a.clone())
        );
        assert_eq!(
            checksum_for(&format!("{b}\n"), "anything.zip"),
            Some(b.clone()),
            "bare hash file"
        );
        assert_eq!(
            checksum_for(&format!("{}  x.zip", "A".repeat(64)), "x.zip"),
            Some(a)
        );
        assert_eq!(checksum_for("not a checksum", "x"), None);
    }

    #[test]
    fn redacts_query_strings() {
        assert_eq!(
            redact("https://h/x.zip?X-Amz-Signature=secret"),
            "https://h/x.zip"
        );
    }
}
