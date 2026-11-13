//! C ABI of the adblock engine (`aphrody_adblock` shared library: `aphrody_adblock.dll`,
//! `libaphrody_adblock.so`, `libaphrody_adblock.dylib`). Header: `include/aphrody_adblock.h`.
//!
//! The rules are compiled once into an opaque engine, then queried by two functions:
//! - [`aphrody_adblock_check_request`]: network request (`url`, issuing page `source_url`,
//!   resource `request_type`), so `$third-party`, `$script`... rules apply;
//! - [`aphrody_adblock_cosmetic`]: hide selectors of a page (per-site rules, plus the generic
//!   rules triggered by the classes and ids present in its DOM, minus exceptions/`$generichide`).
//!
//! Results are framed buffers released with [`aphrody_adblock_buf_free`]:
//! ```text
//! [u64 payload length, little endian][u8 status: 0 ok, 1 error][UTF-8 JSON payload]
//! ```
//! Strings are (pointer, length) pairs of UTF-8, not NUL-terminated; a null pointer with length 0
//! is the empty string. All filtering is done by Brave's `adblock` crate through
//! `corelib::SovereignAdblockEngine`; this crate only marshals.

use corelib::SovereignAdblockEngine;

const HEADER_LEN: usize = 9;

/// Opaque compiled rule set.
pub struct AphrodyAdblockEngine(SovereignAdblockEngine);

fn pack(status: u8, payload: &[u8]) -> *mut u8 {
    let mut out = Vec::with_capacity(HEADER_LEN + payload.len());
    out.extend_from_slice(&(payload.len() as u64).to_le_bytes());
    out.push(status);
    out.extend_from_slice(payload);
    Box::into_raw(out.into_boxed_slice()).cast::<u8>()
}

/// # Safety
/// `ptr` is null or points to `len` readable bytes.
unsafe fn text<'a>(ptr: *const u8, len: usize) -> Option<&'a str> {
    if ptr.is_null() || len == 0 {
        return Some("");
    }
    std::str::from_utf8(unsafe { std::slice::from_raw_parts(ptr, len) }).ok()
}

/// Compile newline-delimited ABP/uBO rules and hosts-format lines. Returns null when `rules`
/// is not UTF-8. Release with [`aphrody_adblock_free`].
///
/// # Safety
/// `rules_ptr` is null or points to `rules_len` readable bytes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_new(
    rules_ptr: *const u8,
    rules_len: usize,
) -> *mut AphrodyAdblockEngine {
    match unsafe { text(rules_ptr, rules_len) } {
        Some(rules) => Box::into_raw(Box::new(AphrodyAdblockEngine(
            SovereignAdblockEngine::from_rules(rules),
        ))),
        None => std::ptr::null_mut(),
    }
}

/// Release an engine from [`aphrody_adblock_new`] (null is a no-op).
///
/// # Safety
/// `engine` is null or an engine not yet freed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_free(engine: *mut AphrodyAdblockEngine) {
    if !engine.is_null() {
        drop(unsafe { Box::from_raw(engine) });
    }
}

/// Check one network request. `source_url` is the page that issued it (empty = unknown,
/// third-party for adblock); `request_type` is an adblock/webRequest type (`script`, `image`,
/// `xmlhttprequest`, `sub_frame`, `document`, `other`...; empty = `other`).
/// Payload: `{"matched","blocked","important","filter"?,"exception"?}`.
///
/// # Safety
/// `engine` comes from [`aphrody_adblock_new`]; every (pointer, length) pair is null/0 or readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_check_request(
    engine: *const AphrodyAdblockEngine,
    url_ptr: *const u8,
    url_len: usize,
    source_ptr: *const u8,
    source_len: usize,
    type_ptr: *const u8,
    type_len: usize,
) -> *mut u8 {
    let Some(engine) = (unsafe { engine.as_ref() }) else {
        return pack(1, b"null engine");
    };
    let (Some(url), Some(source), Some(kind)) = (unsafe {
        (
            text(url_ptr, url_len),
            text(source_ptr, source_len),
            text(type_ptr, type_len),
        )
    }) else {
        return pack(1, b"url, source_url and request_type must be UTF-8");
    };
    let kind = if kind.is_empty() { "other" } else { kind };
    let res = engine.0.check_request(url, source, kind);
    pack(0, &serde_json::to_vec(&res).unwrap_or_default())
}

/// Cosmetic filtering of `page_url`. `classes` and `ids` are the class names and ids present
/// in the page DOM, separated by ASCII whitespace (empty = per-site rules only).
/// Payload: `{"hideSelectors":[...],"generichide":bool}`.
///
/// # Safety
/// `engine` comes from [`aphrody_adblock_new`]; every (pointer, length) pair is null/0 or readable.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_cosmetic(
    engine: *const AphrodyAdblockEngine,
    page_ptr: *const u8,
    page_len: usize,
    classes_ptr: *const u8,
    classes_len: usize,
    ids_ptr: *const u8,
    ids_len: usize,
) -> *mut u8 {
    let Some(engine) = (unsafe { engine.as_ref() }) else {
        return pack(1, b"null engine");
    };
    let (Some(page), Some(classes), Some(ids)) = (unsafe {
        (
            text(page_ptr, page_len),
            text(classes_ptr, classes_len),
            text(ids_ptr, ids_len),
        )
    }) else {
        return pack(1, b"page_url, classes and ids must be UTF-8");
    };
    let classes: Vec<&str> = classes.split_ascii_whitespace().collect();
    let ids: Vec<&str> = ids.split_ascii_whitespace().collect();
    let res = engine.0.cosmetic(page, &classes, &ids);
    pack(0, &serde_json::to_vec(&res).unwrap_or_default())
}

/// Release a framed buffer returned by `aphrody_adblock_check_request` / `aphrody_adblock_cosmetic`
/// (null is a no-op).
///
/// # Safety
/// `ptr` is null or a buffer from this library not yet freed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_adblock_buf_free(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let mut len = [0u8; 8];
        std::ptr::copy_nonoverlapping(ptr, len.as_mut_ptr(), 8);
        let total = HEADER_LEN + u64::from_le_bytes(len) as usize;
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
            ptr, total,
        )));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn take(ptr: *mut u8) -> (u8, serde_json::Value) {
        assert!(!ptr.is_null());
        unsafe {
            let mut len = [0u8; 8];
            std::ptr::copy_nonoverlapping(ptr, len.as_mut_ptr(), 8);
            let len = u64::from_le_bytes(len) as usize;
            let status = *ptr.add(8);
            let body = std::slice::from_raw_parts(ptr.add(HEADER_LEN), len).to_vec();
            aphrody_adblock_buf_free(ptr);
            let v = serde_json::from_slice(&body)
                .unwrap_or_else(|_| serde_json::Value::String(String::from_utf8(body).unwrap()));
            (status, v)
        }
    }

    fn check(
        e: *const AphrodyAdblockEngine,
        url: &str,
        src: &str,
        kind: &str,
    ) -> (u8, serde_json::Value) {
        take(unsafe {
            aphrody_adblock_check_request(
                e,
                url.as_ptr(),
                url.len(),
                src.as_ptr(),
                src.len(),
                kind.as_ptr(),
                kind.len(),
            )
        })
    }

    fn cosmetic(e: *const AphrodyAdblockEngine, page: &str, classes: &str) -> serde_json::Value {
        let (st, v) = take(unsafe {
            aphrody_adblock_cosmetic(
                e,
                page.as_ptr(),
                page.len(),
                classes.as_ptr(),
                classes.len(),
                std::ptr::null(),
                0,
            )
        });
        assert_eq!(st, 0);
        v
    }

    #[test]
    fn network_and_cosmetic_through_the_abi() {
        let rules = "||ads.google.com^\n||cdn.tracker.io^$third-party\n##.ConsentBanner\ngoogle.com##.sponsored-slot\n";
        let e = unsafe { aphrody_adblock_new(rules.as_ptr(), rules.len()) };
        assert!(!e.is_null());

        let (st, v) = check(
            e,
            "https://ads.google.com/banner.js",
            "https://news.site.org/",
            "script",
        );
        assert_eq!(st, 0);
        assert_eq!(v["blocked"], true);
        assert_eq!(v["filter"], "||ads.google.com^");

        // $third-party: blocked from another site, allowed first-party.
        assert_eq!(
            check(
                e,
                "https://cdn.tracker.io/a.js",
                "https://news.site.org/",
                "script"
            )
            .1["blocked"],
            true
        );
        assert_eq!(
            check(
                e,
                "https://cdn.tracker.io/a.js",
                "https://cdn.tracker.io/",
                "script"
            )
            .1["blocked"],
            false
        );
        assert_eq!(check(e, "https://aphrody.com/", "", "").1["blocked"], false);

        let g = cosmetic(e, "https://www.google.com/", "ConsentBanner other");
        let sel: Vec<&str> = g["hideSelectors"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|s| s.as_str())
            .collect();
        assert!(
            sel.contains(&".sponsored-slot") && sel.contains(&".ConsentBanner"),
            "{g}"
        );
        let other = cosmetic(e, "https://news.site.org/", "unrelated");
        assert!(
            other["hideSelectors"].as_array().unwrap().is_empty(),
            "{other}"
        );
        assert_eq!(other["generichide"], false);

        unsafe { aphrody_adblock_free(e) };
    }

    #[test]
    fn errors_are_framed_and_nulls_are_safe() {
        let bad = [0xffu8, 0xfe];
        assert!(unsafe { aphrody_adblock_new(bad.as_ptr(), bad.len()) }.is_null());
        assert_eq!(check(std::ptr::null(), "https://a.b/", "", "").0, 1);
        let e = unsafe { aphrody_adblock_new(std::ptr::null(), 0) };
        let (st, _) = take(unsafe {
            aphrody_adblock_check_request(
                e,
                bad.as_ptr(),
                bad.len(),
                std::ptr::null(),
                0,
                std::ptr::null(),
                0,
            )
        });
        assert_eq!(st, 1);
        unsafe {
            aphrody_adblock_free(e);
            aphrody_adblock_free(std::ptr::null_mut());
            aphrody_adblock_buf_free(std::ptr::null_mut());
        }
    }
}
