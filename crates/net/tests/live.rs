//! Live network test (tag e2e:net). Skipped unless APHRODY_E2E_NET=1.
#[test]
fn probe_gemini_live() {
    if std::env::var("APHRODY_E2E_NET").as_deref() != Ok("1") {
        eprintln!("skip e2e:net (set APHRODY_E2E_NET=1)");
        return;
    }
    let t = aphrody_net::probe_blocking("https://gemini.google.com/").expect("probe");
    assert_eq!(t.alpn.as_deref(), Some("h2"));
    assert_eq!(t.tls_version.as_deref(), Some("TLSv1_3"));
    assert!(t.status.is_some() && t.cert_chain_len >= 2);
    assert!(t.alt_svc.unwrap_or_default().contains("h3"));
}
