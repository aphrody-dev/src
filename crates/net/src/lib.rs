//! `net probe`: one connection to a URL, timed phase by phase
//! (dns, connect, tls, ttfb, total), with the negotiated ALPN, TLS version,
//! cipher suite and certificate chain size. Bridged to bun via the C ABI
//! below (`aphrody_net_probe_json` / `aphrody_net_free`).

use std::ffi::{CStr, CString, c_char};
use std::net::{SocketAddr, ToSocketAddrs};
use std::sync::Arc;
use std::time::Instant;

use rustls::ClientConfig;
use rustls::pki_types::ServerName;
use rustls_platform_verifier::BuilderVerifierExt;
use serde::Serialize;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;

#[derive(Debug, Clone, Serialize, Default)]
pub struct Trace {
    pub url: String,
    pub host: String,
    pub port: u16,
    pub addrs: Vec<String>,
    pub peer: String,
    pub dns_ms: f64,
    pub connect_ms: f64,
    pub tls_ms: f64,
    pub ttfb_ms: f64,
    pub total_ms: f64,
    pub alpn: Option<String>,
    pub tls_version: Option<String>,
    pub cipher: Option<String>,
    pub cert_chain_len: usize,
    pub status: Option<u16>,
    pub alt_svc: Option<String>,
    pub server: Option<String>,
}

#[derive(Debug)]
pub struct ProbeError(pub String);
impl std::fmt::Display for ProbeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}
impl std::error::Error for ProbeError {}
fn err<E: std::fmt::Display>(ctx: &'static str) -> impl FnOnce(E) -> ProbeError {
    move |e| ProbeError(format!("{ctx}: {e}"))
}

/// Parse `https://host[:port][/path]`. Only https is probed.
pub fn parse_url(url: &str) -> Result<(String, u16, String), ProbeError> {
    let rest = url
        .strip_prefix("https://")
        .ok_or_else(|| ProbeError("only https:// URLs are supported".into()))?;
    let (authority, path) = match rest.find('/') {
        Some(i) => (&rest[..i], &rest[i..]),
        None => (rest, "/"),
    };
    let (host, port) = if let Some(v6) = authority.strip_prefix('[') {
        let (h, tail) = v6.split_once(']').ok_or_else(|| ProbeError("bad ipv6".into()))?;
        let port = match tail.strip_prefix(':') {
            Some(p) => p.parse().map_err(err("port"))?,
            None => 443,
        };
        (h, port)
    } else if let Some((h, p)) = authority.rsplit_once(':') {
        (h, p.parse().map_err(err("port"))?)
    } else {
        (authority, 443)
    };
    if host.is_empty() {
        return Err(ProbeError("empty host".into()));
    }
    Ok((host.to_string(), port, path.to_string()))
}

fn ms(t: Instant) -> f64 {
    (t.elapsed().as_secs_f64() * 1e6).round() / 1e3
}

/// ALPN offer, same order as Chromium over TCP (h2, http/1.1). h3 is
/// advertised by the server through Alt-Svc and reported, not dialed yet.
pub const ALPN: [&[u8]; 2] = [b"h2", b"http/1.1"];

pub async fn probe(url: &str) -> Result<Trace, ProbeError> {
    let (host, port, path) = parse_url(url)?;
    let mut t = Trace { url: url.into(), host: host.clone(), port, ..Default::default() };
    let start = Instant::now();

    let p = Instant::now();
    let h = host.clone();
    let addrs: Vec<SocketAddr> =
        tokio::task::spawn_blocking(move || (h.as_str(), port).to_socket_addrs())
            .await
            .map_err(err("dns task"))?
            .map_err(err("dns"))?
            .collect();
    t.dns_ms = ms(p);
    t.addrs = addrs.iter().map(|a| a.ip().to_string()).collect();
    let first = *addrs.first().ok_or_else(|| ProbeError("dns: no address".into()))?;

    let p = Instant::now();
    let tcp = TcpStream::connect(first).await.map_err(err("connect"))?;
    tcp.set_nodelay(true).ok();
    t.connect_ms = ms(p);
    t.peer = first.to_string();

    let provider = Arc::new(rustls::crypto::ring::default_provider());
    let mut cfg = ClientConfig::builder_with_provider(provider)
        .with_safe_default_protocol_versions()
        .map_err(err("tls config"))?
        .with_platform_verifier()
        .map_err(err("platform verifier"))?
        .with_no_client_auth();
    cfg.alpn_protocols = ALPN.iter().map(|p| p.to_vec()).collect();
    let name = ServerName::try_from(host.clone()).map_err(err("server name"))?;

    let p = Instant::now();
    let tls = TlsConnector::from(Arc::new(cfg))
        .connect(name, tcp)
        .await
        .map_err(err("tls"))?;
    t.tls_ms = ms(p);
    {
        let (_, c) = tls.get_ref();
        t.alpn = c.alpn_protocol().map(|a| String::from_utf8_lossy(a).into_owned());
        t.tls_version = c.protocol_version().map(|v| format!("{v:?}"));
        t.cipher = c.negotiated_cipher_suite().map(|s| format!("{:?}", s.suite()));
        t.cert_chain_len = c.peer_certificates().map_or(0, |c| c.len());
    }

    let p = Instant::now();
    if t.alpn.as_deref() == Some("h2") {
        let (client, conn) = h2::client::handshake(tls).await.map_err(err("h2"))?;
        tokio::spawn(async move {
            let _ = conn.await;
        });
        let mut client = client.ready().await.map_err(err("h2 ready"))?;
        let req = http::Request::get(format!("https://{host}{path}"))
            .header("user-agent", "aphrody-net/0.2")
            .body(())
            .map_err(err("request"))?;
        let (resp, _) = client.send_request(req, true).map_err(err("h2 send"))?;
        let resp = resp.await.map_err(err("h2 response"))?;
        t.ttfb_ms = ms(p);
        t.status = Some(resp.status().as_u16());
        let hv = |k: &str| resp.headers().get(k).and_then(|v| v.to_str().ok()).map(str::to_string);
        t.alt_svc = hv("alt-svc");
        t.server = hv("server");
    } else {
        let mut tls = tls;
        let req = format!(
            "GET {path} HTTP/1.1\r\nHost: {host}\r\nUser-Agent: aphrody-net/0.2\r\nConnection: close\r\n\r\n"
        );
        tls.write_all(req.as_bytes()).await.map_err(err("write"))?;
        let mut buf = vec![0u8; 16384];
        let n = tls.read(&mut buf).await.map_err(err("read"))?;
        t.ttfb_ms = ms(p);
        let head = String::from_utf8_lossy(&buf[..n]);
        t.status = head.split_whitespace().nth(1).and_then(|s| s.parse().ok());
        for line in head.lines() {
            if let Some((k, v)) = line.split_once(':') {
                match k.to_ascii_lowercase().as_str() {
                    "alt-svc" => t.alt_svc = Some(v.trim().into()),
                    "server" => t.server = Some(v.trim().into()),
                    _ => {}
                }
            }
        }
    }
    t.total_ms = ms(start);
    Ok(t)
}

pub fn probe_blocking(url: &str) -> Result<Trace, ProbeError> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(err("runtime"))?
        .block_on(probe(url))
}

/// C ABI for bun:ffi. Returns a heap JSON string, free it with `aphrody_net_free`.
///
/// # Safety
/// `url` must be a valid NUL-terminated string.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_net_probe_json(url: *const c_char) -> *mut c_char {
    let url = unsafe { CStr::from_ptr(url) }.to_string_lossy();
    let v = match probe_blocking(&url) {
        Ok(t) => serde_json::json!({ "ok": true, "trace": t }),
        Err(e) => serde_json::json!({ "ok": false, "error": e.0 }),
    };
    CString::new(v.to_string()).unwrap_or_default().into_raw()
}

/// # Safety
/// `p` must come from `aphrody_net_probe_json`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_net_free(p: *mut c_char) {
    if !p.is_null() {
        drop(unsafe { CString::from_raw(p) });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_urls() {
        assert_eq!(
            parse_url("https://gemini.google.com").unwrap(),
            ("gemini.google.com".into(), 443, "/".into())
        );
        assert_eq!(
            parse_url("https://google.com:8443/a?b").unwrap(),
            ("google.com".into(), 8443, "/a?b".into())
        );
        assert_eq!(parse_url("https://[::1]:9/").unwrap(), ("::1".into(), 9, "/".into()));
        assert!(parse_url("http://google.com").is_err());
    }
}
