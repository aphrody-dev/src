use aphrody_net::{Dns, Opts, Proto, Trace};

const USAGE: &str = "usage: net probe [--json] [--doh] [--h3] <https-url>\n       net ws [--json] [--doh] <wss-url>";

fn main() {
    let mut args = std::env::args().skip(1);
    let cmd = args.next().unwrap_or_default();
    let (mut json, mut opts, mut url) = (false, Opts::default(), None);
    for a in args {
        match a.as_str() {
            "--json" => json = true,
            "--doh" => opts.dns = Dns::Doh,
            "--h3" => opts.proto = Proto::H3,
            _ if url.is_none() => url = Some(a),
            _ => fail(USAGE, 2),
        }
    }
    let Some(url) = url else { fail(USAGE, 2) };
    let r = match cmd.as_str() {
        "probe" => aphrody_net::probe_with_blocking(&url, opts),
        "ws" => aphrody_net::ws_probe_blocking(&url, opts.dns),
        _ => fail(USAGE, 2),
    };
    match r {
        Ok(t) if json => println!("{}", serde_json::to_string_pretty(&t).unwrap()),
        Ok(t) => print(&t),
        Err(e) => fail(&format!("net {cmd}: {e}"), 1),
    }
}

fn print(t: &Trace) {
    println!("{} -> {} (dns {}, addrs {})", t.url, t.peer, t.dns_path, t.addrs.join(","));
    println!("dns     {:>9.3} ms", t.dns_ms);
    println!("connect {:>9.3} ms", t.connect_ms);
    println!("tls     {:>9.3} ms", t.tls_ms);
    println!("ttfb    {:>9.3} ms", t.ttfb_ms);
    println!("total   {:>9.3} ms", t.total_ms);
    println!("alpn {:?} tls {:?} cipher {:?} chain {}", t.alpn, t.tls_version, t.cipher, t.cert_chain_len);
    println!("status {:?} server {:?} alt-svc {:?}", t.status, t.server, t.alt_svc);
}

fn fail(msg: &str, code: i32) -> ! {
    eprintln!("{msg}");
    std::process::exit(code)
}
