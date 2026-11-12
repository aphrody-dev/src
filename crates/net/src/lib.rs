//! `net probe`: one connection to a URL, timed phase by phase
//! (dns, connect, tls, ttfb, total), with the DNS path (system | doh), the
//! negotiated ALPN (h2 | http/1.1 | h3), TLS version, cipher suite and
//! certificate chain size. `net ws` times a WebSocket upgrade the same way.
//! Bridged to bun via the C ABI below (`aphrody_net_probe_json` / `aphrody_net_free`).

use std::ffi::{CStr, CString, c_char};
use std::net::{IpAddr, SocketAddr, ToSocketAddrs};
use std::sync::Arc;
use std::time::Instant;

use rustls::ClientConfig;
use rustls::crypto::CryptoProvider;
use rustls::pki_types::ServerName;
use rustls_platform_verifier::BuilderVerifierExt;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;

#[derive(Debug, Clone, Serialize, Default)]
pub struct Trace {
    pub url: String,
    pub host: String,
    pub port: u16,
    pub dns_path: String,
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

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Dns {
    #[default]
    System,
    /// DNS over HTTPS to dns.google (Google Public DNS), as Chromium's secure DNS does for a Google resolver.
    Doh,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Proto {
    /// TCP + TLS with ALPN h2,http/1.1 (Chromium's first connection).
    #[default]
    Tcp,
    /// QUIC + HTTP/3 (what Chromium uses once Alt-Svc advertised h3).
    H3,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct Opts {
    #[serde(default)]
    pub dns: Dns,
    #[serde(default)]
    pub proto: Proto,
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

/// Parse `scheme://host[:port][/path]` for `https` and `wss`.
pub fn parse_url(url: &str) -> Result<(String, u16, String), ProbeError> {
    let rest = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("wss://"))
        .ok_or_else(|| ProbeError("only https:// and wss:// URLs are supported".into()))?;
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

/// ALPN offer over TCP, same order as Chromium (h2, http/1.1).
pub const ALPN: [&[u8]; 2] = [b"h2", b"http/1.1"];

/// ring provider with the cipher-suite order Chromium/BoringSSL sends on
/// x86-64 with AES-NI: TLS 1.3 AES-128-GCM, AES-256-GCM, ChaCha20, then the
/// TLS 1.2 ECDHE AEAD suites. Measured against Chrome in docs/net/NETWORK-STACK.md.
pub fn chromium_provider() -> CryptoProvider {
    use rustls::crypto::ring::{cipher_suite as cs, default_provider};
    CryptoProvider {
        cipher_suites: vec![
            cs::TLS13_AES_128_GCM_SHA256,
            cs::TLS13_AES_256_GCM_SHA384,
            cs::TLS13_CHACHA20_POLY1305_SHA256,
            cs::TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
            cs::TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
            cs::TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            cs::TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            cs::TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
            cs::TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
        ],
        ..default_provider()
    }
}

fn tls_config(alpn: &[&[u8]]) -> Result<ClientConfig, ProbeError> {
    let mut cfg = ClientConfig::builder_with_provider(Arc::new(chromium_provider()))
        .with_safe_default_protocol_versions()
        .map_err(err("tls config"))?
        .with_platform_verifier()
        .map_err(err("platform verifier"))?
        .with_no_client_auth();
    cfg.alpn_protocols = alpn.iter().map(|p| p.to_vec()).collect();
    Ok(cfg)
}

/// Resolve `host`, filling dns_path, dns_ms and addrs.
pub async fn resolve(host: &str, port: u16, dns: Dns, t: &mut Trace) -> Result<Vec<SocketAddr>, ProbeError> {
    let p = Instant::now();
    let addrs: Vec<SocketAddr> = if let Ok(ip) = host.parse::<IpAddr>() {
        vec![SocketAddr::new(ip, port)]
    } else {
        match dns {
            Dns::System => {
                let h = host.to_string();
                tokio::task::spawn_blocking(move || (h.as_str(), port).to_socket_addrs())
                    .await
                    .map_err(err("dns task"))?
                    .map_err(err("dns"))?
                    .collect()
            }
            Dns::Doh => {
                use hickory_resolver::Resolver;
                use hickory_resolver::config::{GOOGLE, ResolverConfig};
                use hickory_resolver::net::runtime::TokioRuntimeProvider;
                let r = Resolver::builder_with_config(ResolverConfig::https(&GOOGLE), TokioRuntimeProvider::default())
                    .build()
                    .map_err(err("doh resolver"))?;
                let fqdn = format!("{}.", host.trim_end_matches('.'));
                r.lookup_ip(fqdn.as_str())
                    .await
                    .map_err(err("doh"))?
                    .iter()
                    .map(|ip| SocketAddr::new(ip, port))
                    .collect()
            }
        }
    };
    t.dns_ms = ms(p);
    t.dns_path = match dns {
        Dns::System => "system".into(),
        Dns::Doh => "doh:dns.google".into(),
    };
    t.addrs = addrs.iter().map(|a| a.ip().to_string()).collect();
    if addrs.is_empty() {
        return Err(ProbeError("dns: no address".into()));
    }
    Ok(addrs)
}

fn header_fields(t: &mut Trace, headers: &http::HeaderMap) {
    let hv = |k: &str| headers.get(k).and_then(|v| v.to_str().ok()).map(str::to_string);
    t.alt_svc = hv("alt-svc");
    t.server = hv("server");
}

pub async fn probe(url: &str) -> Result<Trace, ProbeError> {
    probe_with(url, Opts::default()).await
}

pub async fn probe_with(url: &str, opts: Opts) -> Result<Trace, ProbeError> {
    let (host, port, path) = parse_url(url)?;
    let mut t = Trace { url: url.into(), host: host.clone(), port, ..Default::default() };
    let start = Instant::now();
    let addrs = resolve(&host, port, opts.dns, &mut t).await?;
    match opts.proto {
        Proto::Tcp => tcp_probe(&mut t, &addrs, &host, &path).await?,
        Proto::H3 => h3_probe(&mut t, &addrs, &host, &path).await?,
    }
    t.total_ms = ms(start);
    Ok(t)
}

async fn tls_connect(
    t: &mut Trace,
    addrs: &[SocketAddr],
    host: &str,
    alpn: &[&[u8]],
) -> Result<tokio_rustls::client::TlsStream<TcpStream>, ProbeError> {
    let first = addrs[0];
    let p = Instant::now();
    let tcp = TcpStream::connect(first).await.map_err(err("connect"))?;
    tcp.set_nodelay(true).ok();
    t.connect_ms = ms(p);
    t.peer = first.to_string();

    let name = ServerName::try_from(host.to_string()).map_err(err("server name"))?;
    let p = Instant::now();
    let tls = TlsConnector::from(Arc::new(tls_config(alpn)?))
        .connect(name, tcp)
        .await
        .map_err(err("tls"))?;
    t.tls_ms = ms(p);
    let (_, c) = tls.get_ref();
    t.alpn = c.alpn_protocol().map(|a| String::from_utf8_lossy(a).into_owned());
    t.tls_version = c.protocol_version().map(|v| format!("{v:?}"));
    t.cipher = c.negotiated_cipher_suite().map(|s| format!("{:?}", s.suite()));
    t.cert_chain_len = c.peer_certificates().map_or(0, |c| c.len());
    Ok(tls)
}

async fn tcp_probe(t: &mut Trace, addrs: &[SocketAddr], host: &str, path: &str) -> Result<(), ProbeError> {
    let tls = tls_connect(t, addrs, host, &ALPN).await?;
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
        header_fields(t, resp.headers());
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
    Ok(())
}

async fn h3_probe(t: &mut Trace, addrs: &[SocketAddr], host: &str, path: &str) -> Result<(), ProbeError> {
    let peer = addrs[0];
    let mut tls = tls_config(&[b"h3"])?;
    tls.enable_early_data = false;
    let qcfg = quinn::crypto::rustls::QuicClientConfig::try_from(tls).map_err(err("quic tls"))?;
    let bind: SocketAddr = if peer.is_ipv6() { "[::]:0".parse().unwrap() } else { "0.0.0.0:0".parse().unwrap() };
    let mut ep = quinn::Endpoint::client(bind).map_err(err("udp bind"))?;
    ep.set_default_client_config(quinn::ClientConfig::new(Arc::new(qcfg)));

    // QUIC folds the transport and TLS handshakes into one: reported as tls_ms, connect_ms = 0.
    let p = Instant::now();
    let conn = ep
        .connect(peer, host)
        .map_err(err("quic connect"))?
        .await
        .map_err(err("quic handshake"))?;
    t.tls_ms = ms(p);
    t.peer = peer.to_string();
    t.tls_version = Some("TLSv1_3".into());
    if let Some(hd) = conn
        .handshake_data()
        .and_then(|d| d.downcast::<quinn::crypto::rustls::HandshakeData>().ok())
    {
        t.alpn = hd.protocol.map(|a| String::from_utf8_lossy(&a).into_owned());
    }
    if let Some(certs) = conn
        .peer_identity()
        .and_then(|i| i.downcast::<Vec<rustls::pki_types::CertificateDer<'static>>>().ok())
    {
        t.cert_chain_len = certs.len();
    }

    let p = Instant::now();
    let (mut driver, mut send) = h3::client::new(h3_quinn::Connection::new(conn.clone()))
        .await
        .map_err(err("h3"))?;
    let drive = tokio::spawn(async move { driver.wait_idle().await });
    let req = http::Request::get(format!("https://{host}{path}"))
        .header("user-agent", "aphrody-net/0.2")
        .body(())
        .map_err(err("request"))?;
    let mut stream = send.send_request(req).await.map_err(err("h3 send"))?;
    stream.finish().await.map_err(err("h3 finish"))?;
    let resp = stream.recv_response().await.map_err(err("h3 response"))?;
    t.ttfb_ms = ms(p);
    t.status = Some(resp.status().as_u16());
    header_fields(t, resp.headers());
    drop(stream);
    drop(send);
    conn.close(0u32.into(), b"done");
    drive.abort();
    ep.wait_idle().await;
    Ok(())
}

/// Time a WebSocket upgrade (`wss://`): dns, connect, tls, then the HTTP/1.1
/// Upgrade round trip reported as ttfb_ms; status is 101 on success.
pub async fn ws_probe(url: &str, dns: Dns) -> Result<Trace, ProbeError> {
    let (host, port, _) = parse_url(url)?;
    let mut t = Trace { url: url.into(), host: host.clone(), port, ..Default::default() };
    let start = Instant::now();
    let addrs = resolve(&host, port, dns, &mut t).await?;
    let tls = tls_connect(&mut t, &addrs, &host, &[b"http/1.1"]).await?;
    let p = Instant::now();
    let (mut ws, resp) = tokio_tungstenite::client_async(url, tls).await.map_err(err("ws upgrade"))?;
    t.ttfb_ms = ms(p);
    t.status = Some(resp.status().as_u16());
    header_fields(&mut t, resp.headers());
    let _ = ws.close(None).await;
    t.total_ms = ms(start);
    Ok(t)
}

fn runtime() -> Result<tokio::runtime::Runtime, ProbeError> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(err("runtime"))
}

pub fn probe_blocking(url: &str) -> Result<Trace, ProbeError> {
    probe_with_blocking(url, Opts::default())
}

pub fn probe_with_blocking(url: &str, opts: Opts) -> Result<Trace, ProbeError> {
    runtime()?.block_on(probe_with(url, opts))
}

pub fn ws_probe_blocking(url: &str, dns: Dns) -> Result<Trace, ProbeError> {
    runtime()?.block_on(ws_probe(url, dns))
}

/// C ABI for bun:ffi. `opts` is NULL or JSON `{"dns":"system|doh","proto":"tcp|h3"}`.
/// Returns a heap JSON string, free it with `aphrody_net_free`.
///
/// # Safety
/// `url` must be a valid NUL-terminated string; `opts` NULL or NUL-terminated.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_net_probe_json(url: *const c_char, opts: *const c_char) -> *mut c_char {
    let url = unsafe { CStr::from_ptr(url) }.to_string_lossy();
    let opts: Result<Opts, String> = if opts.is_null() {
        Ok(Opts::default())
    } else {
        serde_json::from_str(&unsafe { CStr::from_ptr(opts) }.to_string_lossy()).map_err(|e| e.to_string())
    };
    let v = match opts.map_err(ProbeError).and_then(|o| {
        if url.starts_with("wss://") { ws_probe_blocking(&url, o.dns) } else { probe_with_blocking(&url, o) }
    }) {
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
        assert_eq!(parse_url("wss://[::1]:9/s").unwrap(), ("::1".into(), 9, "/s".into()));
        assert!(parse_url("http://google.com").is_err());
    }

    #[test]
    fn chromium_cipher_order() {
        let p = chromium_provider();
        let names: Vec<String> = p.cipher_suites.iter().map(|s| format!("{:?}", s.suite())).collect();
        assert_eq!(names[0], "TLS13_AES_128_GCM_SHA256");
        assert_eq!(names[2], "TLS13_CHACHA20_POLY1305_SHA256");
        assert_eq!(names.len(), 9);
    }

    #[test]
    fn opts_json() {
        let o: Opts = serde_json::from_str(r#"{"dns":"doh","proto":"h3"}"#).unwrap();
        assert_eq!((o.dns, o.proto), (Dns::Doh, Proto::H3));
        let d: Opts = serde_json::from_str("{}").unwrap();
        assert_eq!((d.dns, d.proto), (Dns::System, Proto::Tcp));
    }
}
