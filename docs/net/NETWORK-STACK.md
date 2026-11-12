# Network stack of src (kernel to Chromium)

Status: 2026-11-12. "Measured" means observed in this session; "to verify" means not yet checked against a source and must not be treated as fact.

## Measured baseline (gemini.google.com)

| Phase | `net probe` (prd, rustls 0.23.46 ring, platform verifier) | Chrome 157 (PC, owner profile, Navigation Timing) |
|---|---|---|
| DNS | 2.0 ms (system resolver, 8 AAAA + 8 A) | 0 (connection reused) |
| Connect | 1.3 ms (IPv6 first) | 0 (reused) |
| TLS | 7.7 ms, TLSv1_3, TLS13_AES_256_GCM_SHA384, chain 3 | 0 (reused) |
| TTFB | 114 ms, HTTP 200, `server: ESF` | 245 ms |
| Protocol | ALPN h2; Alt-Svc advertises `h3=":443"` and `h3-29` | `nextHopProtocol` h3, 65 h3 resources |
| Auth | n/a (no cookies, by design) | avatar and prompt box present |

Gap 1: we stop at h2; Chrome is already on h3 (QUIC). Gap 2: our cipher choice comes from rustls defaults, not Chromium's order (Chromium/BoringSSL prefers AES-128-GCM when AES-NI is available; to verify in //net and BoringSSL sources).

## Layers: today, target, gaps

| Layer | Today in src (rg) | Target | Gaps |
|---|---|---|---|
| Kernel Windows 11 (AFD, WFP, TCPIP) | nothing explicit; std/tokio sockets | keep the defaults; expose TCP Fast Open and the `SIO_*` timestamps only where measured | Windows networking docs on MS Learn not checked yet (to verify) |
| Kernel Linux (prd, fr1, fr2) | nothing explicit | BBR, io_uring for servers, kTLS for nginx/static | prd kernel version, congestion control and kTLS support not checked (to verify: `sysctl net.ipv4.tcp_congestion_control`) |
| bun runtime | `fetch`, `Bun.serve`, `WebSocket` across packages/* | keep it for app code; use `@aphrody/net` for diagnostics | bun exposes no per-phase timings or ALPN; bridged through bun:ffi (`packages/net`) |
| Rust | rustls/tokio-rustls in apps/rosegriffon (aphrody-nie-net), apps/shenron, crates/up; no hickory and no quinn in the root lock | `crates/net`: hickory (DoH/DoT), rustls + platform verifier, hyper/h2, h3 + quinn, tokio-tungstenite | one TLS config per app today; no shared verifier and no ALPN or cipher policy |
| Chromium //net | upstream Chrome 157 on the PC | the fork's `//net` = the reference behaviour (QUIC, DoH, ECH) | no NetLog export captured yet; CDP `Network.responseReceived.timing` is used instead |
| Servers | Bun.serve, nginx on fr2 (CDN), Workers | h3 everywhere at the edge | h3 on fr2 nginx not checked (to verify) |
| Clients | fetch, chromium-bun CDP (`packages/chromium-bun/src/browser/cdp-client.ts`), agent-browser, CLI | every client reports the same `Trace` | |

## Unified design

- `crates/net` (lib `aphrody_net`, bin `net`, cdylib for bun:ffi). One `Trace` type: `dns_ms, connect_ms, tls_ms, ttfb_ms, total_ms, alpn, tls_version, cipher, cert_chain_len, status, alt_svc, server, addrs, peer`.
- Slice 1 (done): system DNS, TCP, rustls (ring provider) with `rustls-platform-verifier`, ALPN `h2,http/1.1` (Chromium's TCP order), h2 through the `h2` crate, HTTP/1.1 fallback, C ABI `aphrody_net_probe_json` / `aphrody_net_free`.
- Slice 2 (done): `--doh` = hickory-resolver 0.26.3 DoH to dns.google (`dns_path`). Measured on prd: 45.6 ms cold vs 2 ms system.
- Slice 3 (done): `--h3` = quinn 0.11.12 + h3 0.0.8; QUIC handshake reported as `tls_ms` (20.3 ms on prd), h3 200 from gemini. ECH: to verify in rustls docs.
- Slice 4 (done, not tested live): `net ws <wss-url>` = tokio-tungstenite 0.30 upgrade timing. Cipher order = AES-128-GCM, AES-256-GCM, ChaCha20 (TLS 1.3) then ECDHE AEAD (TLS 1.2); gemini now negotiates TLS13_AES_128_GCM_SHA256. Equivalence with BoringSSL is to verify.
- Parity tests: `packages/net/test/gemini.e2e-auth.test.ts` compares Chrome (CDP) and `net probe` on the same URL.

## Test targets

Central config: `[test_targets]` in `deploy.toml`, mirrored in `packages/net/targets.json`. Tests tagged `e2e:auth` need `APHRODY_CDP_URL` (a logged-in Chrome started with `--remote-debugging-port` and `--user-data-dir=$APHRODY_CHROME_PROFILE`) and skip otherwise. No cookie or token is read or stored.

Inventory (rg, excluding vendor/third_party/node_modules/target): `example.com|org|net` appears in 196 files (152 of them tests), `httpbin` in 0, `localhost:<port>` in 128. Most are pure parser or rewriter fixtures (crates/next, apps/r2b, apps/shenron); they keep RFC 2606 hosts because a unit test must not depend on the network. Only tests that actually perform I/O move to `test_targets`.
