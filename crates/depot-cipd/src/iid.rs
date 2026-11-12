//! Instance ids (luci-go `cipd/common/iid.go`).
//!
//! A legacy id is the 40-char lowercase hex SHA1 of the instance zip. Every other id is
//! `base64url(digest || algo)` without padding, `algo` being the `caspb.HashAlgo` value
//! (2 for SHA256), so a SHA256 id is 44 chars ending in `C`.

use base64::Engine;
use base64::engine::{DecodePaddingMode, GeneralPurpose, GeneralPurposeConfig};

pub const SHA1: u8 = 1;
pub const SHA256: u8 = 2;

/// Go's `base64.RawURLEncoding`: no padding, non-zero trailing bits accepted.
const RAW_URL: GeneralPurpose = GeneralPurpose::new(
    &base64::alphabet::URL_SAFE,
    GeneralPurposeConfig::new()
        .with_encode_padding(false)
        .with_decode_allow_trailing_bits(true)
        .with_decode_padding_mode(DecodePaddingMode::RequireNone),
);

/// A `caspb.ObjectRef`: hash algorithm and lowercase hex digest.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ObjectRef {
    pub algo: u8,
    pub hex: String,
}

fn digest_len(algo: u8) -> Option<usize> {
    match algo {
        SHA1 => Some(20),
        SHA256 => Some(32),
        _ => None,
    }
}

/// The proto enum name used by the pRPC JSON API.
pub fn algo_name(algo: u8) -> &'static str {
    match algo {
        SHA1 => "SHA1",
        SHA256 => "SHA256",
        _ => "HASH_ALGO_UNSPECIFIED",
    }
}

pub fn algo_from_name(name: &str) -> Option<u8> {
    match name {
        "SHA1" => Some(SHA1),
        "SHA256" => Some(SHA256),
        _ => None,
    }
}

pub fn is_lower_hex(s: &str) -> bool {
    !s.is_empty()
        && s.len() % 2 == 0
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

pub fn to_hex(bytes: &[u8]) -> String {
    const D: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(D[(b >> 4) as usize] as char);
        s.push(D[(b & 15) as usize] as char);
    }
    s
}

fn from_hex(s: &str) -> Option<Vec<u8>> {
    if !is_lower_hex(s) {
        return None;
    }
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).ok())
        .collect()
}

/// `InstanceIDToObjectRef` with `AnyHash` validation; `None` for an invalid id.
pub fn decode(iid: &str) -> Option<ObjectRef> {
    if iid.len() == 40 {
        return is_lower_hex(iid).then(|| ObjectRef {
            algo: SHA1,
            hex: iid.to_string(),
        });
    }
    if iid.len() < 28 {
        return None;
    }
    let blob = RAW_URL.decode(iid).ok()?;
    if blob.is_empty() || blob.len() % 2 != 1 {
        return None;
    }
    let (digest, algo) = blob.split_at(blob.len() - 1);
    let algo = algo[0];
    if algo == 0 || digest_len(algo).is_some_and(|n| n != digest.len()) {
        return None;
    }
    Some(ObjectRef {
        algo,
        hex: to_hex(digest),
    })
}

/// `ValidateInstanceID(iid, AnyHash)`.
pub fn is_valid(iid: &str) -> bool {
    decode(iid).is_some()
}

/// `ObjectRefToInstanceID`: legacy hex for SHA1, base64url otherwise.
pub fn encode(r: &ObjectRef) -> Option<String> {
    if r.algo == SHA1 {
        return (r.hex.len() == 40 && is_lower_hex(&r.hex)).then(|| r.hex.clone());
    }
    let mut blob = from_hex(&r.hex)?;
    if r.algo == 0 || digest_len(r.algo).is_some_and(|n| n != blob.len()) {
        return None;
    }
    blob.push(r.algo);
    Some(RAW_URL.encode(blob))
}

/// The SHA256 instance id of a raw digest (file hashes in `.cipdpkg/manifest.json`).
pub fn sha256_iid(digest: &[u8]) -> String {
    let mut blob = digest.to_vec();
    blob.push(SHA256);
    RAW_URL.encode(blob)
}

/// The sha256 hex digest behind a SHA256 instance id, the key of the depot-cas store.
pub fn sha256_hex(iid: &str) -> Option<String> {
    decode(iid).filter(|r| r.algo == SHA256).map(|r| r.hex)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Pins observed with the official client (gn, 7z and ninja from chromium DEPS).
    const GN: &str = "HVCRGHnt4bB-ZbwODJv2TSsDvc9t5VVbTldyuOT4x3oC";
    const GN_HEX: &str = "1d50911879ede1b07e65bc0e0c9bf64d2b03bdcf6de5555b4e5772b8e4f8c77a";
    const SEVENZ: &str = "03X72e-T2obdkyf-j53et5BK6dIa1zqsBWGnXPNll7MC";
    const SEVENZ_HEX: &str = "d375fbd9ef93da86dd9327fe8f9ddeb7904ae9d21ad73aac0561a75cf36597b3";

    #[test]
    fn sha256_ids_round_trip() {
        for (iid, hex) in [(GN, GN_HEX), (SEVENZ, SEVENZ_HEX)] {
            assert_eq!(
                decode(iid),
                Some(ObjectRef {
                    algo: SHA256,
                    hex: hex.into()
                })
            );
            assert_eq!(sha256_hex(iid).as_deref(), Some(hex));
            assert_eq!(
                encode(&ObjectRef {
                    algo: SHA256,
                    hex: hex.into()
                })
                .as_deref(),
                Some(iid)
            );
            assert_eq!(iid.len(), 44);
            assert!(iid.ends_with('C'));
        }
    }

    #[test]
    fn legacy_sha1_ids() {
        let id = "0123456789abcdef0123456789abcdef01234567";
        assert_eq!(decode(id).map(|r| r.algo), Some(SHA1));
        assert_eq!(sha256_hex(id), None);
        assert!(!is_valid("0123456789ABCDEF0123456789abcdef01234567"));
    }

    #[test]
    fn rejects_non_ids() {
        for bad in [
            "",
            "latest",
            "version:3@26.03",
            "git_revision:24d41137fac7ea2828590181ebd8284fe7437253",
            // Right length, algo byte 0.
            "HVCRGHnt4bB-ZbwODJv2TSsDvc9t5VVbTldyuOT4x3oA",
            // SHA256 algo byte with a 20-byte digest.
            &RAW_URL.encode([[0u8; 20].as_slice(), &[SHA256]].concat()),
        ] {
            assert!(!is_valid(bad), "{bad}");
        }
    }

    #[test]
    fn file_hash_ids() {
        use sha2::{Digest, Sha256};
        let d = Sha256::digest(b"");
        let id = sha256_iid(&d);
        assert_eq!(
            sha256_hex(&id).as_deref(),
            Some("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
        );
    }
}
