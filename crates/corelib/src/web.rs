// SPDX-License-Identifier: Apache-2.0
//! Google Boq (`batchexecute`) wire protocol and adblock glue over Brave's `adblock` crate. The C ABI over them lives in `crates/ffi` (`aphrody_*`).
//!
//! Consolidates `crates/aphrody-boq` and `crates/aphrody-chromium-ffi` from `yolo-rs/yolo-web`; the
//! former in-house filter engine is replaced by the upstream `adblock` crate (Brave, MPL-2.0).

use serde::{Deserialize, Serialize};
use serde_json::Value;

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
// 2. Adblock: network filtering by Brave's `adblock` crate (upstream, MPL-2.0); this file is glue only
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

/// ABP/uBO network and cosmetic rules plus hosts-format lines, all evaluated by `adblock::Engine`.
/// `cosmetic_hide_selectors` keeps only the generic `##selector` rules (valid on every site);
/// site-specific and exception cosmetic rules come from [`Self::hide_selectors_for`].
pub struct SovereignAdblockEngine {
    engine: adblock::Engine,
    pub cosmetic_hide_selectors: Vec<String>,
}

impl SovereignAdblockEngine {
    #[must_use]
    pub fn from_rules(rules_text: &str) -> Self {
        use adblock::lists::{FilterFormat, FilterSet, ParseOptions};
        // debug = true keeps the raw filter text, reported in `filter` / `exception`.
        let mut set = FilterSet::new(true);
        let (hosts, standard): (Vec<&str>, Vec<&str>) = rules_text
            .lines()
            .map(str::trim)
            .filter(|l| !l.is_empty())
            .partition(|l| l.starts_with("0.0.0.0 ") || l.starts_with("127.0.0.1 "));
        set.add_filter_list(standard.join("\n"), ParseOptions::default());
        set.add_filter_list(hosts.join("\n"), ParseOptions { format: FilterFormat::Hosts, ..ParseOptions::default() });
        let cosmetic_hide_selectors = standard
            .iter()
            .filter_map(|l| l.strip_prefix("##"))
            .map(str::trim)
            .filter(|sel| !sel.is_empty() && !sel.starts_with('+'))
            .map(str::to_string)
            .collect();
        Self { engine: adblock::Engine::new_with_filter_set(set), cosmetic_hide_selectors }
    }

    /// Check a request: `source_url` is the page that issued it (empty = unknown, treated as
    /// third-party by adblock), `request_type` an adblock/webRequest type (`script`, `image`,
    /// `xmlhttprequest`, `sub_frame`, `document`, `other`, ...).
    #[must_use]
    pub fn check_request(&self, url: &str, source_url: &str, request_type: &str) -> AdblockCheckResult {
        let Ok(request) = adblock::request::Request::new(url, source_url, request_type, "GET") else {
            return AdblockCheckResult { matched: false, blocked: false, important: false, filter: None, exception: None };
        };
        let r = self.engine.check_network_request(&request);
        AdblockCheckResult {
            matched: r.filter.is_some() || r.exception.is_some(),
            blocked: r.should_block(),
            important: r.important,
            filter: r.filter.and_then(|f| f.raw_line),
            exception: r.exception.and_then(|f| f.raw_line),
        }
    }

    /// A request whose page is unknown: adblock treats it as third-party, type `other`.
    /// Callers that know the page and the resource type use [`Self::check_request`].
    #[must_use]
    pub fn check_network_url(&self, url: &str) -> AdblockCheckResult {
        self.check_request(url, "", "other")
    }

    /// Site-specific hide selectors for a page (`example.org##sel`, minus `#@#` exceptions), sorted.
    #[must_use]
    pub fn hide_selectors_for(&self, page_url: &str) -> Vec<String> {
        let mut v: Vec<String> = self.engine.url_cosmetic_resources(page_url).hide_selectors.into_iter().collect();
        v.sort();
        v
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

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
            ||ads.google.com^$important\n\
            @@||partner.doubleclick.net^\n\
            0.0.0.0 telemetry.tracker.io\n\
            /pagead/js/\n\
            ||cdn.tracker.io^$third-party\n\
            ##.ConsentBanner\n\
            google.com##.sponsored-slot\n\
        ";
        let engine = SovereignAdblockEngine::from_rules(rules);

        let r1 = engine.check_request("https://ad.doubleclick.net/pixel.gif", "https://news.site.org/", "image");
        assert!(r1.blocked);
        assert_eq!(r1.filter.as_deref(), Some("||doubleclick.net^"));

        let r2 = engine.check_request("https://partner.doubleclick.net/sdk.js", "https://news.site.org/", "script");
        assert!(!r2.blocked);
        assert_eq!(r2.exception.as_deref(), Some("@@||partner.doubleclick.net^"));

        let r3 = engine.check_request("https://ads.google.com/banner.js", "https://news.site.org/", "script");
        assert!(r3.blocked && r3.important);

        assert!(engine.check_request("https://telemetry.tracker.io/collect", "https://news.site.org/", "xmlhttprequest").blocked);

        // $third-party: blocked from another site, allowed first-party.
        assert!(engine.check_request("https://cdn.tracker.io/a.js", "https://news.site.org/", "script").blocked);
        assert!(!engine.check_request("https://cdn.tracker.io/a.js", "https://cdn.tracker.io/", "script").blocked);

        assert!(!engine.check_network_url("https://aphrody.com/search?q=bun").blocked);

        // Generic rules only; the google.com rule stays scoped to google.com.
        assert_eq!(engine.cosmetic_hide_selectors, vec![".ConsentBanner".to_string()]);
        assert!(engine.hide_selectors_for("https://www.google.com/").contains(&".sponsored-slot".to_string()));
        assert!(!engine.hide_selectors_for("https://news.site.org/").contains(&".sponsored-slot".to_string()));
    }
}
