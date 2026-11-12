//! The CIPD backend over pRPC with JSON bodies (`cipd.Repository`, `cipd/api/cipd/v1`).
//!
//! Anonymous only: public packages such as everything chromium's DEPS pins.

use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;
use std::time::Duration;

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

use crate::{Error, Result, iid};

pub const DEFAULT_SERVICE_URL: &str = "https://chrome-infra-packages.appspot.com";

/// pRPC prefixes JSON responses with this XSSI guard.
const XSSI: &str = ")]}'";

pub struct Client {
    service: String,
    agent: ureq::Agent,
}

impl Client {
    pub fn new(service_url: &str) -> Client {
        let agent = ureq::Agent::config_builder()
            .user_agent(concat!("ay-cipd/", env!("CARGO_PKG_VERSION")))
            .timeout_connect(Some(Duration::from_secs(20)))
            .http_status_as_error(false)
            .build()
            .into();
        Client {
            service: service_url.trim_end_matches('/').to_string(),
            agent,
        }
    }

    pub fn service_url(&self) -> &str {
        &self.service
    }

    fn call(&self, method: &str, body: Value) -> Result<Value> {
        let url = format!("{}/prpc/cipd.Repository/{method}", self.service);
        let mut last = None;
        for attempt in 0..3 {
            if attempt > 0 {
                std::thread::sleep(Duration::from_millis(500 << attempt));
            }
            let resp = self
                .agent
                .post(&url)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .send(body.to_string());
            let mut resp = match resp {
                Ok(r) => r,
                Err(e) => {
                    last = Some(Error::new(format!("{method}: {e}")));
                    continue;
                }
            };
            let status = resp.status().as_u16();
            let text = resp
                .body_mut()
                .read_to_string()
                .map_err(|e| Error::new(format!("{method}: {e}")))?;
            if status == 200 {
                let json = text.trim_start().strip_prefix(XSSI).unwrap_or(&text);
                return serde_json::from_str(json)
                    .map_err(|e| Error::new(format!("{method}: bad response: {e}")));
            }
            let err = Error::new(format!("{method}: HTTP {status}: {}", text.trim()));
            // Retry transient server errors only.
            if status < 500 {
                return Err(err);
            }
            last = Some(err);
        }
        Err(last.unwrap_or_else(|| Error::new(format!("{method}: failed"))))
    }

    /// `ResolveVersion`: a ref or tag to an instance id.
    pub fn resolve_version(&self, package: &str, version: &str) -> Result<String> {
        let v = self.call(
            "ResolveVersion",
            json!({ "package": package, "version": version }),
        )?;
        instance_id(&v["instance"])
            .ok_or_else(|| Error::new(format!("ResolveVersion: unexpected response {v}")))
    }

    /// `GetInstanceURL`: a signed URL for the instance zip.
    pub fn instance_url(&self, package: &str, instance_id: &str) -> Result<String> {
        let r = iid::decode(instance_id)
            .ok_or_else(|| Error::new(format!("bad instance id {instance_id:?}")))?;
        let v = self.call(
            "GetInstanceURL",
            json!({
                "package": package,
                "instance": { "hashAlgo": iid::algo_name(r.algo), "hexDigest": r.hex },
            }),
        )?;
        v["signedUrl"]
            .as_str()
            .map(str::to_string)
            .ok_or_else(|| Error::new(format!("GetInstanceURL: unexpected response {v}")))
    }

    /// Download `url` into `dest`, returning the sha256 hex of the body.
    pub fn download(&self, url: &str, dest: &Path) -> Result<String> {
        let shown = url.split('?').next().unwrap_or(url);
        let mut resp = self
            .agent
            .get(url)
            .call()
            .map_err(|e| Error::new(format!("{shown}: {e}")))?;
        let status = resp.status().as_u16();
        if status != 200 {
            return Err(Error::new(format!("HTTP {status} for {shown}")));
        }
        let mut r = resp.body_mut().with_config().limit(u64::MAX).reader();
        let mut w = File::create(dest)?;
        let mut h = Sha256::new();
        let mut buf = vec![0u8; 1 << 20];
        loop {
            let n = r.read(&mut buf)?;
            if n == 0 {
                break;
            }
            h.update(&buf[..n]);
            w.write_all(&buf[..n])?;
        }
        w.sync_all()?;
        Ok(iid::to_hex(&h.finalize()))
    }
}

/// An `ObjectRef` JSON value (`{"hashAlgo": "SHA256", "hexDigest": "..."}`) as an instance id.
pub fn instance_id(v: &Value) -> Option<String> {
    let algo = iid::algo_from_name(v["hashAlgo"].as_str()?)?;
    iid::encode(&iid::ObjectRef {
        algo,
        hex: v["hexDigest"].as_str()?.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_resolve_version_instance() {
        let v: Value = serde_json::from_str(
            r#"{"package":"gn/gn/windows-amd64","instance":{"hashAlgo":"SHA256","hexDigest":"1d50911879ede1b07e65bc0e0c9bf64d2b03bdcf6de5555b4e5772b8e4f8c77a"}}"#,
        )
        .unwrap();
        assert_eq!(
            instance_id(&v["instance"]).as_deref(),
            Some("HVCRGHnt4bB-ZbwODJv2TSsDvc9t5VVbTldyuOT4x3oC")
        );
        assert_eq!(
            instance_id(&json!({"hashAlgo": "MD5", "hexDigest": "00"})),
            None
        );
    }
}
