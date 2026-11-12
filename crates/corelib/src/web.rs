// SPDX-License-Identifier: Apache-2.0
//! Google Boq (`batchexecute`) Wire Protocol, Sovereign Adblock Engine, and `bun:ffi` C-ABI Bridge.
//!
//! Consolidates `crates/aphrody-boq`, `crates/aphrody-chromium-ffi`, and `crates/brave-adblock`
//! from `yolo-rs/yolo-web` into `sovereign-corelib` (`corelib::web`) with zero external bloat.
//!
//! C-ABI envelope returned by FFI functions:
//! ```text
//! [u64 payload length, little endian][u8 status: 0 ok, 1 error][UTF-8 payload]
//! ```

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashSet;

// ============================================================================
// 1. Google Boq (`batchexecute`) Request Encoder & Streamed Response Parser
// ============================================================================

/// Anti-XSSI safety prefix every Google Boq response starts with.
pub const BOQ_XSSI_PREFIX: &str = ")]}'\n";

/// Encode a single-RPC `f.req` body string for Google Boq `batchexecute`.
///
/// `payload` is JSON-stringified into the inner slot, then wrapped in the
/// `[[[rpc_id, inner, null, "generic"]]]` envelope and stringified again.
pub fn boq_encode_f_req(rpc_id: &str, payload: &Value) -> serde_json::Result<String> {
    let inner = serde_json::to_string(payload)?;
    serde_json::to_string(&Value::Array(vec![Value::Array(vec![Value::Array(vec![
        Value::String(rpc_id.to_string()),
        Value::String(inner),
        Value::Null,
        Value::String("generic".to_string()),
    ])])]))
}

/// Strip the leading `)]}'` anti-XSSI safety prefix (with or without trailing newline).
#[must_use]
pub fn boq_strip_xssi(raw: &str) -> &str {
    let stripped = raw.strip_prefix(")]}'\n").unwrap_or(raw);
    stripped
        .strip_prefix(")]}'")
        .unwrap_or(stripped)
        .trim_start()
}

/// Walk the length-prefixed Boq chunk stream and yield every JSON array chunk.
#[must_use]
pub fn boq_extract_chunks(body: &str) -> Vec<Value> {
    let mut chunks = Vec::new();
    let lines: Vec<&str> = body.split('\n').collect();
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() {
            i += 1;
            continue;
        }

        if line.chars().all(|c| c.is_ascii_digit()) {
            let length: usize = line.parse().unwrap_or(0);
            if i + 1 < lines.len() {
                let next = lines[i + 1].trim();
                if !next.is_empty()
                    && let Ok(value) = serde_json::from_str::<Value>(next)
                {
                    chunks.push(value);
                    i += 2;
                    continue;
                }
            }
            let mut accumulated = String::new();
            let mut j = i + 1;
            while j < lines.len() && accumulated.len() < length {
                if !accumulated.is_empty() {
                    accumulated.push('\n');
                }
                accumulated.push_str(lines[j]);
                j += 1;
            }
            if let Ok(value) = serde_json::from_str::<Value>(accumulated.trim()) {
                chunks.push(value);
            }
            i = j;
        } else if let Ok(value) = serde_json::from_str::<Value>(line) {
            chunks.push(value);
            i += 1;
        } else {
            i += 1;
        }
    }
    chunks
}

/// Iterate every `wrb.fr` envelope in a raw Boq response and return the inner JSON payloads.
#[must_use]
pub fn boq_parse_envelopes(raw: &str) -> Vec<Value> {
    let stripped = boq_strip_xssi(raw);
    let chunks = boq_extract_chunks(stripped);
    let mut results = Vec::new();
    for chunk in chunks {
        let Value::Array(envelopes) = chunk else {
            continue;
        };
        for env in envelopes {
            let Value::Array(items) = env else { continue };
            if items.first().and_then(Value::as_str) != Some("wrb.fr") {
                continue;
            }
            if let Some(Value::String(inner)) = items.get(2)
                && let Ok(parsed) = serde_json::from_str::<Value>(inner)
            {
                results.push(parsed);
            }
        }
    }
    results
}

/// Return the first `wrb.fr` envelope of a raw Boq response, or `None` when it carries none.
#[must_use]
pub fn boq_first_envelope(raw: &str) -> Option<Value> {
    boq_parse_envelopes(raw).into_iter().next()
}

// ============================================================================
// 2. Sovereign Adblock & Cosmetic Filter Engine (ABP / Hosts / Cosmetic Rules)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AdblockCheckResult {
    pub matched: bool,
    pub blocked: bool,
    pub important: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filter: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exception: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SovereignAdblockEngine {
    pub blocked_domains: HashSet<String>,
    pub exception_domains: HashSet<String>,
    pub blocked_substrings: Vec<String>,
    pub important_substrings: Vec<String>,
    pub cosmetic_hide_selectors: Vec<String>,
}

impl SovereignAdblockEngine {
    #[must_use]
    pub fn from_rules(rules_text: &str) -> Self {
        let mut engine = Self::default();
        engine.add_rules(rules_text);
        engine
    }

    pub fn add_rules(&mut self, rules_text: &str) {
        for raw_line in rules_text.lines() {
            let line = raw_line.trim();
            if line.is_empty() || line.starts_with('!') || line.starts_with('[') {
                continue;
            }
            // Cosmetic filter: `##.ad-banner` or `example.com##.ad-banner`
            if let Some((_domain_part, selector)) = line.split_once("##") {
                let sel = selector.trim();
                if !sel.is_empty() {
                    self.cosmetic_hide_selectors.push(sel.to_string());
                }
                continue;
            }
            if line.starts_with('#') {
                continue;
            }
            // Hosts format: `0.0.0.0 doubleclick.net` or `127.0.0.1 ads.example.com`
            if let Some(rest) = line.strip_prefix("0.0.0.0 ").or_else(|| line.strip_prefix("127.0.0.1 ")) {
                let host = rest.split_whitespace().next().unwrap_or("").trim().to_ascii_lowercase();
                if !host.is_empty() && host != "localhost" {
                    self.blocked_domains.insert(host);
                }
                continue;
            }
            // Exception rule: `@@||example.com^`
            if let Some(exc) = line.strip_prefix("@@") {
                let cleaned = Self::extract_domain_anchor(exc);
                if !cleaned.is_empty() {
                    self.exception_domains.insert(cleaned);
                }
                continue;
            }
            // Domain anchor rule: `||doubleclick.net^`
            if line.starts_with("||") {
                let is_important = line.contains("$important");
                let cleaned = Self::extract_domain_anchor(line);
                if !cleaned.is_empty() {
                    if is_important {
                        self.important_substrings.push(cleaned.clone());
                    }
                    self.blocked_domains.insert(cleaned);
                }
                continue;
            }
            // Generic substring filter
            let pattern = line.split('$').next().unwrap_or(line).trim().to_ascii_lowercase();
            if !pattern.is_empty() {
                if line.contains("$important") {
                    self.important_substrings.push(pattern);
                } else {
                    self.blocked_substrings.push(pattern);
                }
            }
        }
        self.cosmetic_hide_selectors.sort();
        self.cosmetic_hide_selectors.dedup();
    }

    fn extract_domain_anchor(rule: &str) -> String {
        let without_prefix = rule.trim_start_matches("||");
        let core = without_prefix
            .split(['^', '/', '$', '*'])
            .next()
            .unwrap_or("")
            .trim()
            .to_ascii_lowercase();
        core
    }

    fn extract_url_host(url: &str) -> String {
        let after_scheme = url
            .split_once("://")
            .map(|(_, rest)| rest)
            .unwrap_or(url);
        let host_port = after_scheme.split(['/', '?', '#']).next().unwrap_or("");
        host_port.split(':').next().unwrap_or("").to_ascii_lowercase()
    }

    #[must_use]
    pub fn check_network_url(&self, url: &str) -> AdblockCheckResult {
        let lower_url = url.to_ascii_lowercase();
        let host = Self::extract_url_host(&lower_url);

        // 1. Check important rules first (override exceptions)
        for imp in &self.important_substrings {
            if lower_url.contains(imp) {
                return AdblockCheckResult {
                    matched: true,
                    blocked: true,
                    important: true,
                    filter: Some(format!("||{imp}^$important")),
                    exception: None,
                };
            }
        }

        // 2. Check domain exceptions
        if !host.is_empty() {
            for exc in &self.exception_domains {
                if &host == exc || host.ends_with(&format!(".{exc}")) {
                    return AdblockCheckResult {
                        matched: true,
                        blocked: false,
                        important: false,
                        filter: None,
                        exception: Some(format!("@@||{exc}^")),
                    };
                }
            }
        }

        // 3. Check blocked domain anchors
        if !host.is_empty() {
            for dom in &self.blocked_domains {
                if &host == dom || host.ends_with(&format!(".{dom}")) {
                    return AdblockCheckResult {
                        matched: true,
                        blocked: true,
                        important: false,
                        filter: Some(format!("||{dom}^")),
                        exception: None,
                    };
                }
            }
        }

        // 4. Check substring filters
        for sub in &self.blocked_substrings {
            if lower_url.contains(sub) {
                return AdblockCheckResult {
                    matched: true,
                    blocked: true,
                    important: false,
                    filter: Some(sub.clone()),
                    exception: None,
                };
            }
        }

        AdblockCheckResult {
            matched: false,
            blocked: false,
            important: false,
            filter: None,
            exception: None,
        }
    }
}

// ============================================================================
// 3. C-ABI `bun:ffi` Exports (`aphrody_chromium_*`, `aphrody_adblock_*`, `aphrody_boq_*`)
// ============================================================================

const FFI_HEADER_LEN: usize = 9;

fn ffi_pack_buffer(status: u8, payload: &[u8]) -> *mut u8 {
    let mut out = Vec::with_capacity(FFI_HEADER_LEN + payload.len());
    out.extend_from_slice(&(payload.len() as u64).to_le_bytes());
    out.push(status);
    out.extend_from_slice(payload);
    let mut boxed = out.into_boxed_slice();
    let ptr = boxed.as_mut_ptr();
    std::mem::forget(boxed);
    ptr
}

unsafe fn ffi_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    if ptr.is_null() || len == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }
}

/// Free a framed buffer returned by any `aphrody_*` C-ABI function.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_chromium_buf_free(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let mut len_bytes = [0u8; 8];
        std::ptr::copy_nonoverlapping(ptr, len_bytes.as_mut_ptr(), 8);
        let total = FFI_HEADER_LEN + u64::from_le_bytes(len_bytes) as usize;
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, total)));
    }
}

/// Parse a Google Boq `batchexecute` response over C-ABI and return JSON array of envelopes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_boq_parse(raw_ptr: *const u8, raw_len: usize) -> *mut u8 {
    let bytes = unsafe { ffi_slice(raw_ptr, raw_len) };
    let Ok(text) = std::str::from_utf8(bytes) else {
        return ffi_pack_buffer(1, b"boq input must be valid UTF-8");
    };
    let envelopes = boq_parse_envelopes(text);
    let serialized = serde_json::to_vec(&envelopes).unwrap_or_else(|_| b"[]".to_vec());
    ffi_pack_buffer(0, &serialized)
}

/// Evaluate a URL against newline-delimited Adblock rules over C-ABI.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_eval(
    rules_ptr: *const u8,
    rules_len: usize,
    url_ptr: *const u8,
    url_len: usize,
) -> *mut u8 {
    let Ok(rules) = std::str::from_utf8(unsafe { ffi_slice(rules_ptr, rules_len) }) else {
        return ffi_pack_buffer(1, b"rules must be UTF-8");
    };
    let Ok(url) = std::str::from_utf8(unsafe { ffi_slice(url_ptr, url_len) }) else {
        return ffi_pack_buffer(1, b"url must be UTF-8");
    };
    let engine = SovereignAdblockEngine::from_rules(rules);
    let res = engine.check_network_url(url);
    let payload = serde_json::to_vec(&json!({
        "matched": res.matched,
        "blocked": res.blocked,
        "important": res.important,
        "filter": res.filter,
        "exception": res.exception,
        "cosmeticSelectors": engine.cosmetic_hide_selectors,
    }))
    .unwrap_or_default();
    ffi_pack_buffer(0, &payload)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_boq_encode_and_parse_roundtrip() {
        let payload = json!(["query-1", 1, [0, null, 1]]);
        let encoded = boq_encode_f_req("CCqFvf", &payload).unwrap();
        assert!(encoded.contains("CCqFvf"));
        assert!(encoded.contains("generic"));

        let raw = format!(
            "{}{}\n{}",
            BOQ_XSSI_PREFIX,
            "82",
            r#"[["wrb.fr","CCqFvf","[\"nbid-1\",[\"thread-1\"]]",null,null,null,"generic"]]"#,
        );
        let envelopes = boq_parse_envelopes(&raw);
        assert_eq!(envelopes.len(), 1);
        assert_eq!(envelopes[0][0].as_str(), Some("nbid-1"));
        assert_eq!(boq_first_envelope(&raw).unwrap()[0].as_str(), Some("nbid-1"));
    }

    #[test]
    fn test_sovereign_adblock_engine_rules() {
        let rules = "\
            ! Sovereign Filter List\n\
            ||doubleclick.net^\n\
            ||ads.example.com^$important\n\
            @@||partner.doubleclick.net^\n\
            0.0.0.0 telemetry.tracker.io\n\
            /pagead/js/\n\
            ##.ConsentBanner\n\
            example.com##.sponsored-slot\n\
        ";
        let engine = SovereignAdblockEngine::from_rules(rules);

        let r1 = engine.check_network_url("https://ad.doubleclick.net/pixel.gif");
        assert!(r1.blocked);
        assert_eq!(r1.filter.as_deref(), Some("||doubleclick.net^"));

        // Exception subdomain should not be blocked
        let r2 = engine.check_network_url("https://partner.doubleclick.net/sdk.js");
        assert!(!r2.blocked);
        assert_eq!(r2.exception.as_deref(), Some("@@||partner.doubleclick.net^"));

        // Important rule overrides
        let r3 = engine.check_network_url("https://ads.example.com/banner.js");
        assert!(r3.blocked);
        assert!(r3.important);

        // Hosts rule
        let r4 = engine.check_network_url("https://telemetry.tracker.io/collect");
        assert!(r4.blocked);

        // Clean URL
        let r5 = engine.check_network_url("https://aphrody.com/search?q=bun");
        assert!(!r5.blocked);

        assert_eq!(
            engine.cosmetic_hide_selectors,
            vec![".ConsentBanner".to_string(), ".sponsored-slot".to_string()]
        );
    }
}
