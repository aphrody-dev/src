//! Minimal HTTP/1.1 server on std only: static files with COOP/COEP, SSE relay
//! for sequenced ops, `/mcp` JSON-RPC and `/.well-known/webmcp.json`.

use aphrody_core::fluid::{Op, SequencedOp};
use aphrody_core::state::{AppState, builtin_registry};
use aphrody_core::webmcp::ToolRegistry;
use serde_json::json;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{Receiver, Sender, channel};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub const MAX_BODY: usize = 1 << 20;
const MAX_HEAD: usize = 16 * 1024;

pub struct Request {
    pub method: String,
    pub path: String,
    pub query: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

pub struct Shared {
    pub state: Mutex<AppState>,
    pub registry: ToolRegistry<AppState>,
    pub subs: Mutex<Vec<Sender<Arc<String>>>>,
    pub sent: Mutex<u64>,
    pub dist: PathBuf,
    pub started: Instant,
}

impl Shared {
    pub fn new(state: AppState, dist: PathBuf) -> Shared {
        Shared {
            state: Mutex::new(state),
            registry: builtin_registry(),
            subs: Mutex::new(Vec::new()),
            sent: Mutex::new(0),
            dist,
            started: Instant::now(),
        }
    }

    /// Broadcast every sequenced op not yet sent to subscribers.
    pub fn pump(&self, st: &AppState) {
        let mut sent = self.sent.lock().unwrap();
        let mut subs = self.subs.lock().unwrap();
        for sop in st.sequencer.since(*sent) {
            let msg = Arc::new(sse_frame(sop));
            subs.retain(|s| s.send(msg.clone()).is_ok());
            *sent = sop.seq;
        }
    }
}

fn sse_frame(sop: &SequencedOp) -> String {
    format!("id: {}\ndata: {}\n\n", sop.seq, serde_json::to_string(sop).unwrap_or_default())
}

pub fn content_type(path: &str) -> &'static str {
    match path.rsplit('.').next().unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "wasm" => "application/wasm",
        "wgsl" => "text/plain; charset=utf-8",
        "json" => "application/json",
        "webmanifest" => "application/manifest+json",
        "txt" => "text/plain; charset=utf-8",
        "xml" => "application/xml",
        "svg" => "image/svg+xml",
        "css" => "text/css; charset=utf-8",
        "deb" => "application/vnd.debian.binary-package",
        "apk" => "application/vnd.android.package-archive",
        "exe" => "application/vnd.microsoft.portable-executable",
        _ => "application/octet-stream",
    }
}

pub fn security_headers() -> Vec<(&'static str, String)> {
    vec![
        ("Cross-Origin-Opener-Policy", "same-origin".into()),
        ("Cross-Origin-Embedder-Policy", "require-corp".into()),
        ("Cross-Origin-Resource-Policy", "same-origin".into()),
        ("X-Content-Type-Options", "nosniff".into()),
        ("Referrer-Policy", "strict-origin-when-cross-origin".into()),
    ]
}

pub fn parse_request(buf: &[u8]) -> Option<(Request, usize)> {
    let end = buf.windows(4).position(|w| w == b"\r\n\r\n")? + 4;
    let head = std::str::from_utf8(&buf[..end]).ok()?;
    let mut lines = head.split("\r\n");
    let mut first = lines.next()?.split(' ');
    let method = first.next()?.to_string();
    let target = first.next()?;
    let (path, query) = target.split_once('?').unwrap_or((target, ""));
    let mut headers = HashMap::new();
    for l in lines {
        if let Some((k, v)) = l.split_once(':') {
            headers.insert(k.trim().to_ascii_lowercase(), v.trim().to_string());
        }
    }
    Some((Request { method, path: path.to_string(), query: query.to_string(), headers, body: Vec::new() }, end))
}

fn read_request(stream: &mut TcpStream) -> std::io::Result<Option<Request>> {
    let mut buf = Vec::new();
    let mut tmp = [0u8; 4096];
    loop {
        if let Some((mut req, head_len)) = parse_request(&buf) {
            let len: usize = req.headers.get("content-length").and_then(|v| v.parse().ok()).unwrap_or(0);
            if len > MAX_BODY {
                return Ok(None);
            }
            while buf.len() < head_len + len {
                let n = stream.read(&mut tmp)?;
                if n == 0 {
                    return Ok(None);
                }
                buf.extend_from_slice(&tmp[..n]);
            }
            req.body = buf[head_len..head_len + len].to_vec();
            return Ok(Some(req));
        }
        if buf.len() > MAX_HEAD {
            return Ok(None);
        }
        let n = stream.read(&mut tmp)?;
        if n == 0 {
            return Ok(None);
        }
        buf.extend_from_slice(&tmp[..n]);
    }
}

fn status_text(code: u16) -> &'static str {
    match code {
        200 => "OK",
        204 => "No Content",
        400 => "Bad Request",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        413 => "Payload Too Large",
        _ => "Internal Server Error",
    }
}

fn respond(stream: &mut TcpStream, code: u16, extra: &[(&str, String)], body: &[u8], head_only: bool) {
    let mut h = format!("HTTP/1.1 {code} {}\r\nContent-Length: {}\r\nConnection: close\r\n", status_text(code), body.len());
    for (k, v) in security_headers().iter().map(|(k, v)| (*k, v.clone())).chain(extra.iter().cloned()) {
        h.push_str(&format!("{k}: {v}\r\n"));
    }
    h.push_str("\r\n");
    let _ = stream.write_all(h.as_bytes());
    if !head_only {
        let _ = stream.write_all(body);
    }
}

fn json_resp(stream: &mut TcpStream, code: u16, v: serde_json::Value, cors: bool) {
    let mut h = vec![("Content-Type", "application/json".to_string()), ("Cache-Control", "no-store".to_string())];
    if cors {
        h.push(("Access-Control-Allow-Origin", "*".into()));
    }
    respond(stream, code, &h, v.to_string().as_bytes(), false);
}

pub fn safe_rel(path: &str) -> Option<PathBuf> {
    let rel = path.trim_start_matches('/');
    if rel.contains(['\\', ':', '\0']) || rel.split('/').any(|s| s == ".." || s == ".") && !rel.is_empty() {
        return None;
    }
    let mut p = PathBuf::new();
    for s in rel.split('/').filter(|s| !s.is_empty()) {
        p.push(s);
    }
    Some(p)
}

fn serve_static(stream: &mut TcpStream, dist: &Path, path: &str, head_only: bool) {
    let Some(mut rel) = safe_rel(path) else { return respond(stream, 400, &[], b"bad path", head_only) };
    if rel.as_os_str().is_empty() {
        rel.push("index.html");
    }
    let mut full = dist.join(&rel);
    if full.is_dir() {
        full = full.join("index.html");
    }
    match std::fs::read(&full) {
        Ok(bytes) => {
            let name = full.to_string_lossy().to_string();
            let cache = if name.ends_with(".html") { "no-cache" } else { "public, max-age=3600" };
            respond(stream, 200, &[("Content-Type", content_type(&name).into()), ("Cache-Control", cache.into())], &bytes, head_only)
        }
        Err(_) => respond(stream, 404, &[("Content-Type", "text/plain".into())], b"not found", head_only),
    }
}

fn handle_events(mut stream: TcpStream, shared: &Shared, req: &Request) {
    let from: u64 = req
        .headers
        .get("last-event-id")
        .and_then(|v| v.parse().ok())
        .or_else(|| req.query.split('&').find_map(|kv| kv.strip_prefix("from=").and_then(|v| v.parse().ok())))
        .unwrap_or(0);
    let head = "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-store\r\nConnection: keep-alive\r\nX-Accel-Buffering: no\r\n";
    let mut h = head.to_string();
    for (k, v) in security_headers() {
        h.push_str(&format!("{k}: {v}\r\n"));
    }
    h.push_str("\r\n: aphrody relay\n\n");
    if stream.write_all(h.as_bytes()).is_err() {
        return;
    }
    let (tx, rx): (Sender<Arc<String>>, Receiver<Arc<String>>) = channel();
    {
        // Backlog and registration happen under the same locks as pump(), so no gaps or duplicates.
        let st = shared.state.lock().unwrap();
        let sent = shared.sent.lock().unwrap();
        let mut subs = shared.subs.lock().unwrap();
        for sop in st.sequencer.since(from) {
            if sop.seq > *sent {
                break;
            }
            if stream.write_all(sse_frame(sop).as_bytes()).is_err() {
                return;
            }
        }
        subs.push(tx);
        drop(sent);
    }
    loop {
        match rx.recv_timeout(Duration::from_secs(15)) {
            Ok(m) => {
                if stream.write_all(m.as_bytes()).is_err() {
                    return;
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                if stream.write_all(b": ping\n\n").is_err() {
                    return;
                }
            }
            Err(_) => return,
        }
    }
}

fn handle_conn(mut stream: TcpStream, shared: Arc<Shared>) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(10)));
    let req = match read_request(&mut stream) {
        Ok(Some(r)) => r,
        _ => return respond(&mut stream, 400, &[], b"bad request", false),
    };
    let head_only = req.method == "HEAD";
    match (req.method.as_str(), req.path.as_str()) {
        ("OPTIONS", _) => respond(
            &mut stream,
            204,
            &[
                ("Access-Control-Allow-Origin", "*".into()),
                ("Access-Control-Allow-Methods", "GET, POST, OPTIONS".into()),
                ("Access-Control-Allow-Headers", "content-type".into()),
            ],
            b"",
            false,
        ),
        ("GET", "/healthz") => json_resp(
            &mut stream,
            200,
            json!({"status": "ok", "version": aphrody_core::VERSION, "uptime_s": shared.started.elapsed().as_secs()}),
            false,
        ),
        ("GET", "/api/snapshot") => {
            let mut st = shared.state.lock().unwrap();
            let v = json!({"wm": st.windows_json(), "doc": st.replica.snapshot(), "last_seq": st.sequencer.last_seq()});
            json_resp(&mut stream, 200, v, false)
        }
        ("GET", "/.well-known/webmcp.json") => {
            let v = shared.registry.well_known("aphrody-app", "Window manager, VFS and shared document tools for Aphrody", "/mcp");
            json_resp(&mut stream, 200, v, true)
        }
        ("POST", "/mcp") => {
            let body = String::from_utf8_lossy(&req.body).to_string();
            let reply = {
                let mut st = shared.state.lock().unwrap();
                let r = shared.registry.handle_jsonrpc(&mut st, &body, "aphrody-app", aphrody_core::VERSION);
                shared.pump(&st);
                r
            };
            match reply {
                Some(r) => respond(
                    &mut stream,
                    200,
                    &[("Content-Type", "application/json".into()), ("Access-Control-Allow-Origin", "*".into()), ("Cache-Control", "no-store".into())],
                    r.as_bytes(),
                    false,
                ),
                None => respond(&mut stream, 204, &[("Access-Control-Allow-Origin", "*".into())], b"", false),
            }
        }
        ("POST", "/ops") => match serde_json::from_slice::<Op>(&req.body) {
            Err(e) => json_resp(&mut stream, 400, json!({"error": e.to_string()}), false),
            Ok(op) => {
                let mut st = shared.state.lock().unwrap();
                match st.sequencer.submit(op) {
                    Ok(sop) => {
                        let _ = st.replica.process(&sop);
                        shared.pump(&st);
                        json_resp(&mut stream, 200, json!({"seq": sop.seq}), false)
                    }
                    Err(e) => json_resp(&mut stream, 409, json!({"error": e.to_string()}), false),
                }
            }
        },
        ("GET", "/events") => handle_events(stream, &shared, &req),
        ("GET" | "HEAD", p) => serve_static(&mut stream, &shared.dist, p, head_only),
        _ => respond(&mut stream, 405, &[("Allow", "GET, HEAD, POST, OPTIONS".into())], b"method not allowed", false),
    }
}

/// Bind and serve forever. Returns the bound address through `on_ready`.
pub fn serve(addr: &str, shared: Arc<Shared>, on_ready: impl FnOnce(std::net::SocketAddr)) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr)?;
    on_ready(listener.local_addr()?);
    for conn in listener.incoming() {
        let Ok(stream) = conn else { continue };
        let sh = shared.clone();
        let _ = std::thread::Builder::new().stack_size(512 * 1024).spawn(move || handle_conn(stream, sh));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use aphrody_core::layout::Rect;
    use std::io::{BufRead, BufReader};
    use std::sync::mpsc;

    #[test]
    fn parses_requests_and_rejects_traversal() {
        let (r, n) = parse_request(b"GET /a/b?x=1 HTTP/1.1\r\nHost: h\r\nContent-Length: 3\r\n\r\nabc").unwrap();
        assert_eq!((r.method.as_str(), r.path.as_str(), r.query.as_str(), n), ("GET", "/a/b", "x=1", 53));
        assert_eq!(r.headers["content-length"], "3");
        assert!(parse_request(b"GET / HTTP/1.1\r\nHost").is_none());
        assert!(safe_rel("/../secret").is_none());
        assert!(safe_rel("/a/..%2f").is_some());
        assert!(safe_rel("/a\\b").is_none());
        assert_eq!(safe_rel("/x/y.js").unwrap(), PathBuf::from("x").join("y.js"));
        assert_eq!(content_type("a.wasm"), "application/wasm");
    }

    fn start() -> (std::net::SocketAddr, Arc<Shared>) {
        let dir = std::env::temp_dir().join(format!("aphrody-http-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("index.html"), "<h1>hi</h1>").unwrap();
        std::fs::write(dir.join("m.wasm"), [0, 0x61, 0x73, 0x6d]).unwrap();
        let shared = Arc::new(Shared::new(AppState::in_memory(Rect::new(0.0, 0.0, 800.0, 600.0)), dir));
        let (tx, rx) = mpsc::channel();
        let sh = shared.clone();
        std::thread::spawn(move || {
            let _ = serve("127.0.0.1:0", sh, |a| tx.send(a).unwrap());
        });
        (rx.recv().unwrap(), shared)
    }

    fn http(addr: std::net::SocketAddr, req: &str) -> String {
        let mut s = TcpStream::connect(addr).unwrap();
        s.write_all(req.as_bytes()).unwrap();
        let mut out = String::new();
        let _ = s.read_to_string(&mut out);
        out
    }

    #[test]
    fn serves_static_with_isolation_headers() {
        let (addr, _) = start();
        let r = http(addr, "GET /m.wasm HTTP/1.1\r\nHost: x\r\n\r\n");
        assert!(r.starts_with("HTTP/1.1 200"), "{r}");
        let l = r.to_ascii_lowercase();
        assert!(l.contains("content-type: application/wasm"));
        assert!(l.contains("cross-origin-opener-policy: same-origin"));
        assert!(l.contains("cross-origin-embedder-policy: require-corp"));
        assert!(http(addr, "GET / HTTP/1.1\r\n\r\n").contains("<h1>hi</h1>"));
        assert!(http(addr, "GET /nope HTTP/1.1\r\n\r\n").starts_with("HTTP/1.1 404"));
        assert!(http(addr, "GET /../x HTTP/1.1\r\n\r\n").starts_with("HTTP/1.1 400"));
    }

    #[test]
    fn mcp_and_ops_relay_end_to_end() {
        let (addr, _) = start();
        let body = r#"{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"aphrody_counter_add","arguments":{"delta":5}}}"#;
        let r = http(addr, &format!("POST /mcp HTTP/1.1\r\nContent-Length: {}\r\n\r\n{body}", body.len()));
        assert!(r.contains("\"value\":5"), "{r}");
        let wk = http(addr, "GET /.well-known/webmcp.json HTTP/1.1\r\n\r\n");
        assert!(wk.contains("aphrody_windows_list") && wk.contains("navigator.modelContext"));
        // SSE subscriber sees the backlog (the MCP op) and then a live op.
        let mut s = TcpStream::connect(addr).unwrap();
        s.set_read_timeout(Some(Duration::from_secs(3))).unwrap();
        s.write_all(b"GET /events?from=0 HTTP/1.1\r\n\r\n").unwrap();
        let mut rd = BufReader::new(s);
        // Wait until SSE response header + backlog frame arrive before posting live op
        let mut seen = String::new();
        for _ in 0..24 {
            let mut line = String::new();
            if rd.read_line(&mut line).unwrap_or(0) == 0 {
                break;
            }
            seen.push_str(&line);
            if seen.matches("data: ").count() >= 1 {
                break;
            }
        }
        let op = r#"{"client":9,"client_seq":1,"ref_seq":1,"channel":"clicks","body":{"type":"counter_add","delta":2}}"#;
        let p = http(addr, &format!("POST /ops HTTP/1.1\r\nContent-Length: {}\r\n\r\n{op}", op.len()));
        assert!(p.contains("\"seq\":2"), "{p}");
        for _ in 0..16 {
            let mut line = String::new();
            if rd.read_line(&mut line).unwrap_or(0) == 0 {
                break;
            }
            seen.push_str(&line);
            if seen.matches("data: ").count() == 2 {
                break;
            }
        }
        assert_eq!(seen.matches("data: ").count(), 2, "{seen}");
        assert!(seen.contains("\"seq\":2"));
        let dup = http(addr, &format!("POST /ops HTTP/1.1\r\nContent-Length: {}\r\n\r\n{op}", op.len()));
        assert!(dup.starts_with("HTTP/1.1 409"), "{dup}");
    }
}
