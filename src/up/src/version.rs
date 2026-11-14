//! Version strings as tools print them: `gh version 2.102.0 (2026-09-30)`, `v0.15.0`,
//! `Google Cloud SDK 588.0.0`. Only the numeric dotted core is compared.

use std::cmp::Ordering;

/// First dotted numeric token with at least two components (`1.58.0`, `0.17.0`, `588.0.0`),
/// pre-release suffix dropped.
pub fn extract(text: &str) -> Option<String> {
    let bytes = text.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_digit()
            && (i == 0 || !bytes[i - 1].is_ascii_alphanumeric() || bytes[i - 1] == b'v')
        {
            let start = i;
            let mut dots = 0;
            while i < bytes.len()
                && (bytes[i].is_ascii_digit()
                    || (bytes[i] == b'.' && i + 1 < bytes.len() && bytes[i + 1].is_ascii_digit()))
            {
                if bytes[i] == b'.' {
                    dots += 1;
                }
                i += 1;
            }
            if dots >= 1 {
                return Some(text[start..i].to_string());
            }
        }
        i += 1;
    }
    None
}

fn parts(v: &str) -> Vec<u64> {
    v.trim_start_matches('v')
        .split(['.', '-', '+'])
        .map_while(|p| p.parse().ok())
        .collect()
}

/// Compare dotted versions numerically; missing components count as 0.
pub fn compare(a: &str, b: &str) -> Ordering {
    let (pa, pb) = (parts(a), parts(b));
    let len = pa.len().max(pb.len());
    (0..len)
        .map(|i| pa.get(i).unwrap_or(&0).cmp(pb.get(i).unwrap_or(&0)))
        .find(|o| *o != Ordering::Equal)
        .unwrap_or(Ordering::Equal)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_from_real_outputs() {
        assert_eq!(
            extract("gh version 2.102.0 (2026-09-30)").as_deref(),
            Some("2.102.0")
        );
        assert_eq!(
            extract("rustup 1.29.2 (d8c92c676 2026-10-21)").as_deref(),
            Some("1.29.2")
        );
        assert_eq!(
            extract("Google Cloud SDK 588.0.0\nbq 2.1").as_deref(),
            Some("588.0.0")
        );
        assert_eq!(
            extract("| v0.15.0 | 760fd72de93c |").as_deref(),
            Some("0.15.0")
        );
        assert_eq!(
            extract("ripgrep 15.2.0 (rev e89fff89ac)").as_deref(),
            Some("15.2.0")
        );
        assert_eq!(
            extract("coreutils 0.12.0 (multi-call binary)").as_deref(),
            Some("0.12.0")
        );
        assert_eq!(extract("cargo-zigbuild 0.24.1").as_deref(), Some("0.24.1"));
        assert_eq!(extract("1.4.4").as_deref(), Some("1.4.4"));
        assert_eq!(extract("just 1.58.0").as_deref(), Some("1.58.0"));
        assert_eq!(extract("no digits here 7"), None);
        assert_eq!(
            extract("x86_64 build 3.1").as_deref(),
            Some("3.1"),
            "digits glued to letters are skipped"
        );
    }

    #[test]
    fn compares_numerically() {
        assert_eq!(compare("1.10.0", "1.9.9"), Ordering::Greater);
        assert_eq!(compare("0.15.0", "0.16.0"), Ordering::Less);
        assert_eq!(compare("1.4", "1.4.0"), Ordering::Equal);
        assert_eq!(compare("v2.0.0", "2.0.0"), Ordering::Equal);
        assert_eq!(compare("1.0.0-rc.1", "1.0.0"), Ordering::Equal);
    }
}
