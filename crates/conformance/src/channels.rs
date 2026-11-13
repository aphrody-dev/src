//! Chrome channel tracker (replaces scripts/chrome-channels.sh): Chromium version per channel from
//! chromiumdash, then the DEPS file, clang and Rust revisions of that release tag from gitiles.

use std::fmt::Write as _;
use std::sync::Arc;

use base64::Engine as _;

const UA: &str = "aphrody-labs-chrome-channels";
const CHANNELS: [&str; 4] = ["Stable", "Beta", "Dev", "Canary"];
const DEPS_KEYS: [&str; 11] = [
    "v8_revision",
    "skia_revision",
    "angle_revision",
    "dawn_revision",
    "pdfium_revision",
    "boringssl_revision",
    "devtools_frontend_revision",
    "harfbuzz_revision",
    "freetype_revision",
    "perfetto_revision",
    "catapult_revision",
];

#[derive(Debug, Default, Clone, PartialEq)]
pub struct Channel {
    pub name: String,
    pub chromium: String,
    pub v8: String,
    pub clang: Option<String>,
    pub rust: Option<String>,
    pub deps: Vec<(String, String)>,
}

fn client() -> Result<reqwest::Client, String> {
    let tls = rustls::ClientConfig::builder_with_provider(Arc::new(
        rustls::crypto::ring::default_provider(),
    ))
    .with_safe_default_protocol_versions()
    .map_err(|e| e.to_string())?
    .with_root_certificates(Arc::new(rustls::RootCertStore {
        roots: webpki_roots::TLS_SERVER_ROOTS.to_vec(),
    }))
    .with_no_client_auth();
    reqwest::Client::builder()
        .user_agent(UA)
        .tls_backend_preconfigured(tls)
        .build()
        .map_err(|e| e.to_string())
}

async fn text(c: &reqwest::Client, url: &str) -> Result<String, String> {
    let r = c.get(url).send().await.map_err(|e| format!("{url}: {e}"))?;
    if !r.status().is_success() {
        return Err(format!("{url}: HTTP {}", r.status()));
    }
    r.text().await.map_err(|e| format!("{url}: {e}"))
}

/// gitiles `?format=TEXT` returns base64.
async fn gitiles(c: &reqwest::Client, url: &str) -> Result<String, String> {
    let b64 = text(c, &format!("{url}?format=TEXT")).await?;
    let raw = base64::engine::general_purpose::STANDARD
        .decode(b64.trim())
        .map_err(|e| format!("{url}: {e}"))?;
    String::from_utf8(raw).map_err(|e| format!("{url}: {e}"))
}

/// Value of `'key': 'value'` in a DEPS file.
pub fn deps_var(deps: &str, key: &str) -> Option<String> {
    let needle = format!("'{key}':");
    let rest = &deps[deps.find(&needle)? + needle.len()..];
    let start = rest.find('\'')? + 1;
    let end = rest[start..].find('\'')? + start;
    Some(rest[start..end].to_owned())
}

/// `NAME = 'value'` at the start of a line (tools/clang/scripts/update.py, tools/rust/update_rust.py).
pub fn py_const(src: &str, name: &str) -> Option<String> {
    src.lines().find_map(|l| {
        let v = l.strip_prefix(name)?.trim_start().strip_prefix('=')?.trim();
        Some(v.trim_matches('\'').trim_matches('"').to_owned())
    })
}

/// `MAJOR.MINOR.BUILD.PATCH` from v8-version.h.
pub fn v8_version(header: &str) -> String {
    [
        "V8_MAJOR_VERSION",
        "V8_MINOR_VERSION",
        "V8_BUILD_NUMBER",
        "V8_PATCH_LEVEL",
    ]
    .iter()
    .filter_map(|k| {
        header.lines().find_map(|l| {
            l.strip_prefix("#define ")?
                .strip_prefix(k)?
                .split_whitespace()
                .next()
                .map(str::to_owned)
        })
    })
    .collect::<Vec<_>>()
    .join(".")
}

async fn channel(c: &reqwest::Client, name: &str, platform: &str) -> Result<Channel, String> {
    let rel = text(
        c,
        &format!("https://chromiumdash.appspot.com/fetch_releases?channel={name}&platform={platform}&num=1"),
    )
    .await?;
    let v: serde_json::Value = serde_json::from_str(&rel).map_err(|e| e.to_string())?;
    let chromium = v[0]["version"].as_str().ok_or("no version")?.to_owned();
    let base = format!("https://chromium.googlesource.com/chromium/src/+/refs/tags/{chromium}");
    let deps = gitiles(c, &format!("{base}/DEPS")).await?;
    let v8rev = deps_var(&deps, "v8_revision").unwrap_or_default();
    let v8 = if v8rev.is_empty() {
        String::new()
    } else {
        v8_version(
            &gitiles(
                c,
                &format!("https://chromium.googlesource.com/v8/v8/+/{v8rev}/include/v8-version.h"),
            )
            .await?,
        )
    };
    let clang = gitiles(c, &format!("{base}/tools/clang/scripts/update.py"))
        .await
        .ok()
        .and_then(|s| py_const(&s, "CLANG_REVISION"));
    let rust = gitiles(c, &format!("{base}/tools/rust/update_rust.py"))
        .await
        .ok()
        .and_then(|s| py_const(&s, "RUST_REVISION"));
    let deps = DEPS_KEYS
        .iter()
        .filter_map(|k| deps_var(&deps, k).map(|v| ((*k).to_owned(), v)))
        .collect();
    Ok(Channel {
        name: name.to_lowercase(),
        chromium,
        v8,
        clang,
        rust,
        deps,
    })
}

/// Fetch all channels concurrently and render chrome-channels.toml.
pub fn fetch_toml(platform: &str, generated: &str) -> Result<String, String> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(|e| e.to_string())?;
    rt.block_on(async {
        let c = client()?;
        let all =
            futures::future::join_all(CHANNELS.iter().map(|n| channel(&c, n, platform))).await;
        let mut out =
            format!("# Generated by `ay conformance channels` on {generated}. Platform: {platform}.\n");
        for ch in all {
            let ch = ch?;
            let _ = write!(
                out,
                "\n[channel.{}]\nchromium = \"{}\"\nv8 = \"{}\"\n",
                ch.name, ch.chromium, ch.v8
            );
            if let Some(v) = &ch.clang {
                let _ = writeln!(out, "clang = \"{v}\"");
            }
            if let Some(v) = &ch.rust {
                let _ = writeln!(out, "rust = \"{v}\"");
            }
            for (k, v) in &ch.deps {
                let _ = writeln!(out, "{k} = \"{v}\"");
            }
        }
        Ok(out)
    })
}

/// Parse a chrome-channels.toml rendered by [`fetch_toml`] back into channels (file order is not
/// kept; channels come back sorted by name).
pub fn parse_toml(src: &str) -> Result<Vec<Channel>, String> {
    let doc: toml::Table = src.parse().map_err(|e| format!("chrome-channels.toml: {e}"))?;
    let Some(toml::Value::Table(chans)) = doc.get("channel") else {
        return Err("chrome-channels.toml: no [channel.*] table".into());
    };
    let mut out = Vec::with_capacity(chans.len());
    for (name, v) in chans {
        let t = v.as_table().ok_or_else(|| format!("channel.{name}: not a table"))?;
        let s = |k: &str| t.get(k).and_then(toml::Value::as_str).map(str::to_owned);
        out.push(Channel {
            name: name.clone(),
            chromium: s("chromium").ok_or_else(|| format!("channel.{name}: no chromium"))?,
            v8: s("v8").unwrap_or_default(),
            clang: s("clang"),
            rust: s("rust"),
            deps: DEPS_KEYS.iter().filter_map(|k| Some(((*k).to_owned(), s(k)?))).collect(),
        });
    }
    Ok(out)
}

/// The channel named `name` (case-insensitive: `stable`, `Beta`...).
pub fn find(channels: &[Channel], name: &str) -> Option<Channel> {
    channels.iter().find(|c| c.name.eq_ignore_ascii_case(name)).cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_rendered_toml() {
        let src = "# x\n[channel.stable]\nchromium = \"157.0.8103.78\"\nv8 = \"15.7\"\nclang = \"llvmorg-24\"\nv8_revision = \"abc\"\n\n[channel.beta]\nchromium = \"158.0.1.2\"\nv8 = \"15.8\"\n";
        let c = parse_toml(src).unwrap();
        let s = find(&c, "Stable").unwrap();
        assert_eq!(s.chromium, "157.0.8103.78");
        assert_eq!(s.clang.as_deref(), Some("llvmorg-24"));
        assert_eq!(s.deps, vec![("v8_revision".to_owned(), "abc".to_owned())]);
        assert_eq!(find(&c, "beta").unwrap().rust, None);
        assert!(parse_toml("x = 1").is_err());
    }

    #[test]
    fn parses_deps_and_versions() {
        let deps = "vars = {\n  'v8_revision': 'abc123',\n  'skia_revision': 'def',\n}";
        assert_eq!(deps_var(deps, "v8_revision").as_deref(), Some("abc123"));
        assert_eq!(deps_var(deps, "nope"), None);
        let h = "#define V8_MAJOR_VERSION 15\n#define V8_MINOR_VERSION 7\n#define V8_BUILD_NUMBER 112\n#define V8_PATCH_LEVEL 43\n";
        assert_eq!(v8_version(h), "15.7.112.43");
        assert_eq!(
            py_const("X = 1\nCLANG_REVISION = 'llvmorg-24'\n", "CLANG_REVISION").as_deref(),
            Some("llvmorg-24")
        );
    }
}
