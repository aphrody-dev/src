//! Shared ureq 3 agent. Error statuses come back as responses so their body ends up in
//! `ForgeError::Http`, as with ureq 2's `Error::Status`.

use std::sync::LazyLock;

use serde::de::DeserializeOwned;
use ureq::typestate::{WithBody, WithoutBody};

use crate::error::ForgeError;

pub(crate) type Response = ureq::http::Response<ureq::Body>;
pub(crate) type Request<B> = ureq::RequestBuilder<B>;

static AGENT: LazyLock<ureq::Agent> = LazyLock::new(|| {
    ureq::Agent::config_builder()
        .http_status_as_error(false)
        .build()
        .into()
});

pub(crate) fn get(url: &str) -> Request<WithoutBody> {
    AGENT.get(url)
}

pub(crate) fn post(url: &str) -> Request<WithBody> {
    AGENT.post(url)
}

/// Maps transport failures to `Network` and 4xx/5xx statuses to `Http` with the body text.
pub(crate) trait CheckStatus {
    fn check(self, url: &str) -> Result<Response, ForgeError>;
}

impl CheckStatus for Result<Response, ureq::Error> {
    fn check(self, url: &str) -> Result<Response, ForgeError> {
        let resp = self.map_err(|e| ForgeError::Network(format!("URL: {} -> {}", url, e)))?;
        let code = resp.status().as_u16();
        if code >= 400 {
            let msg = resp
                .into_string()
                .unwrap_or_else(|_| "Unknown HTTP error".to_string());
            return Err(ForgeError::Http(code, format!("URL: {} -> {}", url, msg)));
        }
        Ok(resp)
    }
}

pub(crate) trait ReadBody {
    fn into_json<T: DeserializeOwned>(self) -> Result<T, ureq::Error>;
    fn into_string(self) -> Result<String, ureq::Error>;
}

impl ReadBody for Response {
    fn into_json<T: DeserializeOwned>(self) -> Result<T, ureq::Error> {
        self.into_body().read_json()
    }

    fn into_string(self) -> Result<String, ureq::Error> {
        self.into_body().read_to_string()
    }
}
