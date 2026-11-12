fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let (json, url) = match args.as_slice() {
        [c, u] if c == "probe" => (false, u.clone()),
        [c, f, u] if c == "probe" && f == "--json" => (true, u.clone()),
        _ => {
            eprintln!("usage: net probe [--json] <https-url>");
            std::process::exit(2)
        }
    };
    match aphrody_net::probe_blocking(&url) {
        Ok(t) if json => println!("{}", serde_json::to_string_pretty(&t).unwrap()),
        Ok(t) => {
            println!("{} -> {} (addrs {})", t.url, t.peer, t.addrs.join(","));
            println!("dns     {:>9.3} ms", t.dns_ms);
            println!("connect {:>9.3} ms", t.connect_ms);
            println!("tls     {:>9.3} ms", t.tls_ms);
            println!("ttfb    {:>9.3} ms", t.ttfb_ms);
            println!("total   {:>9.3} ms", t.total_ms);
            println!("alpn {:?} tls {:?} cipher {:?} chain {}", t.alpn, t.tls_version, t.cipher, t.cert_chain_len);
            println!("status {:?} server {:?} alt-svc {:?}", t.status, t.server, t.alt_svc);
        }
        Err(e) => {
            eprintln!("net probe: {e}");
            std::process::exit(1)
        }
    }
}
