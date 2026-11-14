//! Live network tests (tag e2e:net). Skipped unless APHRODY_E2E_NET=1.
use aphrody_net::{Dns, Opts, Proto, probe_with_blocking};

fn live() -> bool {
    let on = std::env::var("APHRODY_E2E_NET").as_deref() == Ok("1");
    if !on {
        eprintln!("skip e2e:net (set APHRODY_E2E_NET=1)");
    }
    on
}

#[test]
fn gemini_h2_system_dns() {
    if !live() {
        return;
    }
    let t = probe_with_blocking("https://gemini.google.com/", Opts::default()).expect("probe");
    assert_eq!(t.dns_path, "system");
    assert_eq!(t.alpn.as_deref(), Some("h2"));
    assert_eq!(t.tls_version.as_deref(), Some("TLSv1_3"));
    assert_eq!(t.cipher.as_deref(), Some("TLS13_AES_128_GCM_SHA256"));
    assert!(t.status.is_some() && t.cert_chain_len >= 2);
    assert!(t.alt_svc.unwrap_or_default().contains("h3"));
}

#[test]
fn gemini_doh() {
    if !live() {
        return;
    }
    let t = probe_with_blocking("https://gemini.google.com/", Opts { dns: Dns::Doh, proto: Proto::Tcp }).expect("probe");
    assert_eq!(t.dns_path, "doh:dns.google");
    assert!(!t.addrs.is_empty());
    assert_eq!(t.alpn.as_deref(), Some("h2"));
}

#[test]
fn gemini_h3() {
    if !live() {
        return;
    }
    let t = probe_with_blocking("https://gemini.google.com/", Opts { dns: Dns::Doh, proto: Proto::H3 }).expect("probe");
    assert_eq!(t.alpn.as_deref(), Some("h3"));
    assert!(t.status.is_some() && t.cert_chain_len >= 2);
}
