use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use hmac::{Hmac, KeyInit, Mac};
use pbkdf2::pbkdf2_hmac;
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PasswordAlgorithm {
    Argon2id,
    Pbkdf2Sha256,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub email_verified: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSession {
    pub id: String,
    pub user_id: String,
    pub token: String,
    pub expires_at: u64,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionEnvelope {
    pub token: String,
    pub jwt: String,
    pub user: AuthUser,
    pub session: AuthSession,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignUpEmailRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
    pub algorithm: Option<PasswordAlgorithm>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignInEmailRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthAuthorizeRequest {
    pub client_id: String,
    pub redirect_uri: String,
    pub response_type: String,
    pub code_challenge: String,
    pub code_challenge_method: Option<String>,
    pub scope: Option<String>,
    pub state: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthAuthorizeResponse {
    pub code: String,
    pub redirect_uri: String,
    pub state: Option<String>,
    pub expires_in: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokenRequest {
    pub grant_type: String,
    pub code: Option<String>,
    pub code_verifier: Option<String>,
    pub redirect_uri: Option<String>,
    pub client_id: Option<String>,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u64,
    pub refresh_token: String,
    pub id_token: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyCreateRequest {
    pub name: String,
    pub scopes: Vec<String>,
    pub ttl_secs: Option<u64>,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyIssued {
    pub id: String,
    pub key: String,
    pub prefix: String,
    pub name: String,
    pub scopes: Vec<String>,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyVerified {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyChallengeRequest {
    pub user_id: Option<String>,
    pub rp_id: Option<String>,
    pub operation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyChallengeResponse {
    pub challenge_id: String,
    pub challenge: String,
    pub rp_id: String,
    pub operation: String,
    pub timeout_ms: u64,
    pub user_verification: String,
    pub pub_key_cred_params: Vec<PasskeyAlgParam>,
    pub expires_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasskeyAlgParam {
    #[serde(rename = "type")]
    pub cred_type: String,
    pub alg: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwksDocument {
    pub keys: Vec<JwkEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwkEntry {
    pub kty: String,
    pub crv: String,
    pub kid: String,
    #[serde(rename = "use")]
    pub key_use: String,
    pub alg: String,
    pub x: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,
    pub iss: String,
    pub iat: u64,
    pub exp: u64,
    pub jti: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
}

#[derive(Clone)]
pub struct AuthEngine {
    db: Arc<Mutex<Connection>>,
    db_path: PathBuf,
    hmac_secret: Arc<Vec<u8>>,
    ed25519_signing: Arc<SigningKey>,
    ed25519_kid: String,
    issuer: String,
}

impl AuthEngine {
    pub fn open(path: impl AsRef<Path>, hmac_secret: &[u8]) -> Result<Self, String> {
        let db_path = path.as_ref().to_path_buf();
        if let Some(parent) = db_path.parent()
            && !parent.as_os_str().is_empty()
        {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("failed to create auth db dir: {e}"))?;
        }
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("failed to open sqlite auth store: {e}"))?;
        Self::from_connection(conn, db_path, hmac_secret)
    }

    pub fn open_in_memory(hmac_secret: &[u8]) -> Result<Self, String> {
        let conn = Connection::open_in_memory()
            .map_err(|e| format!("failed to open in-memory sqlite auth store: {e}"))?;
        Self::from_connection(conn, PathBuf::from(":memory:"), hmac_secret)
    }

    fn from_connection(
        conn: Connection,
        db_path: PathBuf,
        hmac_secret: &[u8],
    ) -> Result<Self, String> {
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;
             PRAGMA busy_timeout = 5000;

             CREATE TABLE IF NOT EXISTS auth_users (
                 id TEXT PRIMARY KEY,
                 email TEXT NOT NULL UNIQUE,
                 name TEXT NOT NULL,
                 password_hash TEXT NOT NULL,
                 email_verified INTEGER NOT NULL DEFAULT 0,
                 created_at INTEGER NOT NULL,
                 updated_at INTEGER NOT NULL
             );

             CREATE TABLE IF NOT EXISTS auth_sessions (
                 id TEXT PRIMARY KEY,
                 user_id TEXT NOT NULL,
                 token_hash TEXT NOT NULL UNIQUE,
                 expires_at INTEGER NOT NULL,
                 ip_address TEXT,
                 user_agent TEXT,
                 created_at INTEGER NOT NULL,
                 FOREIGN KEY(user_id) REFERENCES auth_users(id) ON DELETE CASCADE
             );

             CREATE TABLE IF NOT EXISTS auth_oauth_codes (
                 code_hash TEXT PRIMARY KEY,
                 client_id TEXT NOT NULL,
                 user_id TEXT NOT NULL,
                 redirect_uri TEXT NOT NULL,
                 code_challenge TEXT NOT NULL,
                 code_challenge_method TEXT NOT NULL,
                 scope TEXT NOT NULL,
                 expires_at INTEGER NOT NULL,
                 consumed INTEGER NOT NULL DEFAULT 0
             );

             CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
                 token_hash TEXT PRIMARY KEY,
                 client_id TEXT NOT NULL,
                 user_id TEXT NOT NULL,
                 scope TEXT NOT NULL,
                 expires_at INTEGER NOT NULL,
                 revoked INTEGER NOT NULL DEFAULT 0
             );

             CREATE TABLE IF NOT EXISTS auth_api_keys (
                 id TEXT PRIMARY KEY,
                 user_id TEXT NOT NULL,
                 name TEXT NOT NULL,
                 prefix TEXT NOT NULL,
                 key_hash TEXT NOT NULL UNIQUE,
                 scopes_json TEXT NOT NULL,
                 created_at INTEGER NOT NULL,
                 expires_at INTEGER
             );

             CREATE TABLE IF NOT EXISTS auth_passkey_challenges (
                 id TEXT PRIMARY KEY,
                 user_id TEXT,
                 rp_id TEXT NOT NULL,
                 operation TEXT NOT NULL,
                 challenge TEXT NOT NULL,
                 expires_at INTEGER NOT NULL,
                 consumed INTEGER NOT NULL DEFAULT 0
             );

             CREATE TABLE IF NOT EXISTS auth_SigningKeys (
                 kid TEXT PRIMARY KEY,
                 seed_hex TEXT NOT NULL,
                 created_at INTEGER NOT NULL
             );",
        )
        .map_err(|e| format!("failed to initialize auth schema: {e}"))?;

        let (kid, signing_key) = load_or_create_ed25519_key(&conn)?;
        let secret = if hmac_secret.is_empty() {
            let mut derived = [0u8; 32];
            getrandom::fill(&mut derived).map_err(|e| format!("getrandom failed: {e}"))?;
            derived.to_vec()
        } else {
            hmac_secret.to_vec()
        };

        Ok(Self {
            db: Arc::new(Mutex::new(conn)),
            db_path,
            hmac_secret: Arc::new(secret),
            ed25519_signing: Arc::new(signing_key),
            ed25519_kid: kid,
            issuer: "https://rust-stack.sovereign.local".to_string(),
        })
    }

    pub fn db_path(&self) -> &Path {
        &self.db_path
    }

    pub fn sign_up_email(
        &self,
        req: SignUpEmailRequest,
        ip: Option<String>,
        ua: Option<String>,
    ) -> Result<AuthSessionEnvelope, String> {
        let email = normalize_email(&req.email)?;
        if req.password.len() < 8 {
            return Err("password must be at least 8 bytes".to_string());
        }
        let algo = req.algorithm.unwrap_or(PasswordAlgorithm::Argon2id);
        let password_hash = hash_password(&req.password, algo)?;
        let now = unix_now();
        let user_id = format!("usr_{}", random_hex(12)?);
        let display_name = req
            .name
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| email.split('@').next().unwrap_or("user").to_string());

        {
            let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
            db.execute(
                "INSERT INTO auth_users (id, email, name, password_hash, email_verified, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, 0, ?5, ?5)",
                params![user_id, email, display_name, password_hash, now as i64],
            )
            .map_err(|e| format!("failed to insert user (email may already exist): {e}"))?;
        }

        let user = AuthUser {
            id: user_id,
            email,
            name: display_name,
            email_verified: false,
            created_at: now,
            updated_at: now,
        };
        self.create_session_for_user(user, 86_400 * 7, ip, ua)
    }

    pub fn sign_in_email(
        &self,
        req: SignInEmailRequest,
        ip: Option<String>,
        ua: Option<String>,
    ) -> Result<AuthSessionEnvelope, String> {
        let email = normalize_email(&req.email)?;
        let row: Option<(String, String, String, String, i64, i64, i64)> = {
            let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
            db.query_row(
                "SELECT id, email, name, password_hash, email_verified, created_at, updated_at
                 FROM auth_users WHERE email = ?1",
                params![email],
                |r| {
                    Ok((
                        r.get(0)?,
                        r.get(1)?,
                        r.get(2)?,
                        r.get(3)?,
                        r.get(4)?,
                        r.get(5)?,
                        r.get(6)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| format!("db query failed: {e}"))?
        };

        let (id, email, name, stored_hash, verified, created_at, updated_at) =
            row.ok_or_else(|| "invalid email or password".to_string())?;

        if !verify_password(&req.password, &stored_hash)? {
            return Err("invalid email or password".to_string());
        }

        let user = AuthUser {
            id,
            email,
            name,
            email_verified: verified != 0,
            created_at: created_at as u64,
            updated_at: updated_at as u64,
        };
        self.create_session_for_user(user, 86_400 * 7, ip, ua)
    }

    pub fn get_session(&self, raw_token: &str) -> Result<Option<AuthSessionEnvelope>, String> {
        let trimmed = raw_token.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }
        let token_hash = sha256_hex(trimmed.as_bytes());
        let now = unix_now();
        let row: Option<(
            String,
            String,
            i64,
            Option<String>,
            Option<String>,
            i64,
            String,
            String,
            i64,
            i64,
            i64,
        )> = {
            let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
            db.query_row(
                "SELECT s.id, s.user_id, s.expires_at, s.ip_address, s.user_agent, s.created_at,
                        u.email, u.name, u.email_verified, u.created_at, u.updated_at
                 FROM auth_sessions s
                 JOIN auth_users u ON u.id = s.user_id
                 WHERE s.token_hash = ?1",
                params![token_hash],
                |r| {
                    Ok((
                        r.get(0)?,
                        r.get(1)?,
                        r.get(2)?,
                        r.get(3)?,
                        r.get(4)?,
                        r.get(5)?,
                        r.get(6)?,
                        r.get(7)?,
                        r.get(8)?,
                        r.get(9)?,
                        r.get(10)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| format!("session lookup failed: {e}"))?
        };

        let Some((
            sess_id,
            user_id,
            expires_at,
            ip,
            ua,
            sess_created,
            email,
            name,
            verified,
            u_created,
            u_updated,
        )) = row
        else {
            return Ok(None);
        };

        if (expires_at as u64) <= now {
            let _ = self.sign_out(trimmed);
            return Ok(None);
        }

        let ttl = (expires_at as u64).saturating_sub(now);
        let jwt = self.issue_ed25519_jwt(&user_id, ttl.max(60), Some("openid profile email"))?;

        Ok(Some(AuthSessionEnvelope {
            token: trimmed.to_string(),
            jwt,
            user: AuthUser {
                id: user_id.clone(),
                email,
                name,
                email_verified: verified != 0,
                created_at: u_created as u64,
                updated_at: u_updated as u64,
            },
            session: AuthSession {
                id: sess_id,
                user_id,
                token: trimmed.to_string(),
                expires_at: expires_at as u64,
                ip_address: ip,
                user_agent: ua,
                created_at: sess_created as u64,
            },
        }))
    }

    pub fn sign_out(&self, raw_token: &str) -> Result<bool, String> {
        let token_hash = sha256_hex(raw_token.trim().as_bytes());
        let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
        let deleted = db
            .execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?1",
                params![token_hash],
            )
            .map_err(|e| format!("sign_out failed: {e}"))?;
        Ok(deleted > 0)
    }

    pub fn oauth2_authorize(
        &self,
        req: OAuthAuthorizeRequest,
    ) -> Result<OAuthAuthorizeResponse, String> {
        if req.response_type != "code" {
            return Err("unsupported response_type; OAuth 2.1 requires 'code'".to_string());
        }
        let method = req
            .code_challenge_method
            .as_deref()
            .unwrap_or("S256")
            .to_uppercase();
        if method != "S256" {
            return Err("OAuth 2.1 requires PKCE code_challenge_method=S256".to_string());
        }
        if req.code_challenge.trim().len() < 32 {
            return Err("PKCE code_challenge too short".to_string());
        }
        let user_id = req.user_id.unwrap_or_else(|| "usr_anonymous".to_string());
        let scope = req
            .scope
            .unwrap_or_else(|| "openid profile email".to_string());
        let raw_code = format!("rsc_{}", random_url_token(32)?);
        let code_hash = sha256_hex(raw_code.as_bytes());
        let expires_in = 300u64;
        let expires_at = unix_now() + expires_in;

        let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
        db.execute(
            "INSERT INTO auth_oauth_codes
             (code_hash, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, scope, expires_at, consumed)
             VALUES (?1, ?2, ?3, ?4, ?5, 'S256', ?6, ?7, 0)",
            params![
                code_hash,
                req.client_id,
                user_id,
                req.redirect_uri,
                req.code_challenge.trim(),
                scope,
                expires_at as i64
            ],
        )
        .map_err(|e| format!("failed to persist oauth code: {e}"))?;

        Ok(OAuthAuthorizeResponse {
            code: raw_code,
            redirect_uri: req.redirect_uri,
            state: req.state,
            expires_in,
        })
    }

    pub fn oauth2_token(&self, req: OAuthTokenRequest) -> Result<OAuthTokenResponse, String> {
        match req.grant_type.as_str() {
            "authorization_code" => {
                let code = req
                    .code
                    .as_deref()
                    .ok_or_else(|| "missing authorization code".to_string())?;
                let verifier = req
                    .code_verifier
                    .as_deref()
                    .ok_or_else(|| "missing PKCE code_verifier".to_string())?;
                let code_hash = sha256_hex(code.as_bytes());
                let now = unix_now();

                let (client_id, user_id, redirect_uri, challenge, scope, expires_at, consumed): (
                    String,
                    String,
                    String,
                    String,
                    String,
                    i64,
                    i64,
                ) = {
                    let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
                    let row = db
                        .query_row(
                            "SELECT client_id, user_id, redirect_uri, code_challenge, scope, expires_at, consumed
                             FROM auth_oauth_codes WHERE code_hash = ?1",
                            params![code_hash],
                            |r| {
                                Ok((
                                    r.get(0)?,
                                    r.get(1)?,
                                    r.get(2)?,
                                    r.get(3)?,
                                    r.get(4)?,
                                    r.get(5)?,
                                    r.get(6)?,
                                ))
                            },
                        )
                        .optional()
                        .map_err(|e| format!("oauth code query failed: {e}"))?
                        .ok_or_else(|| "invalid authorization code".to_string())?;

                    db.execute(
                        "UPDATE auth_oauth_codes SET consumed = 1 WHERE code_hash = ?1",
                        params![code_hash],
                    )
                    .map_err(|e| format!("oauth code mark consumed failed: {e}"))?;
                    row
                };

                if consumed != 0 {
                    return Err("authorization code already consumed".to_string());
                }
                if (expires_at as u64) <= now {
                    return Err("authorization code expired".to_string());
                }
                if let Some(expected_client) = req.client_id.as_deref()
                    && expected_client != client_id
                {
                    return Err("client_id mismatch".to_string());
                }
                if let Some(expected_redirect) = req.redirect_uri.as_deref()
                    && expected_redirect != redirect_uri
                {
                    return Err("redirect_uri mismatch".to_string());
                }

                let computed_challenge = pkce_s256_challenge(verifier);
                if !constant_time_eq(computed_challenge.as_bytes(), challenge.as_bytes()) {
                    return Err("PKCE S256 verification failed".to_string());
                }

                self.issue_oauth_tokens(&client_id, &user_id, &scope)
            }
            "refresh_token" => {
                let raw_refresh = req
                    .refresh_token
                    .as_deref()
                    .ok_or_else(|| "missing refresh_token".to_string())?;
                let refresh_hash = sha256_hex(raw_refresh.as_bytes());
                let now = unix_now();

                let (client_id, user_id, scope, expires_at, revoked): (
                    String,
                    String,
                    String,
                    i64,
                    i64,
                ) = {
                    let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
                    let row = db
                        .query_row(
                            "SELECT client_id, user_id, scope, expires_at, revoked
                             FROM auth_refresh_tokens WHERE token_hash = ?1",
                            params![refresh_hash],
                            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
                        )
                        .optional()
                        .map_err(|e| format!("refresh token query failed: {e}"))?
                        .ok_or_else(|| "invalid refresh_token".to_string())?;

                    db.execute(
                        "UPDATE auth_refresh_tokens SET revoked = 1 WHERE token_hash = ?1",
                        params![refresh_hash],
                    )
                    .map_err(|e| format!("refresh rotation failed: {e}"))?;
                    row
                };

                if revoked != 0 || (expires_at as u64) <= now {
                    return Err("refresh_token expired or revoked".to_string());
                }

                self.issue_oauth_tokens(&client_id, &user_id, &scope)
            }
            other => Err(format!("unsupported grant_type: {other}")),
        }
    }

    fn issue_oauth_tokens(
        &self,
        client_id: &str,
        user_id: &str,
        scope: &str,
    ) -> Result<OAuthTokenResponse, String> {
        let expires_in = 3600u64;
        let access_token = issue_hs256_jwt(user_id, &self.hmac_secret, expires_in, Some(scope))?;
        let id_token = self.issue_ed25519_jwt(user_id, expires_in, Some(scope))?;
        let refresh_token = format!("rsr_{}", random_url_token(32)?);
        let refresh_hash = sha256_hex(refresh_token.as_bytes());
        let refresh_exp = unix_now() + 86_400 * 30;

        let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
        db.execute(
            "INSERT INTO auth_refresh_tokens (token_hash, client_id, user_id, scope, expires_at, revoked)
             VALUES (?1, ?2, ?3, ?4, ?5, 0)",
            params![refresh_hash, client_id, user_id, scope, refresh_exp as i64],
        )
        .map_err(|e| format!("failed to store refresh token: {e}"))?;

        Ok(OAuthTokenResponse {
            access_token,
            token_type: "Bearer".to_string(),
            expires_in,
            refresh_token,
            id_token,
            scope: scope.to_string(),
        })
    }

    pub fn jwks(&self) -> JwksDocument {
        let vk: VerifyingKey = self.ed25519_signing.verifying_key();
        JwksDocument {
            keys: vec![JwkEntry {
                kty: "OKP".to_string(),
                crv: "Ed25519".to_string(),
                kid: self.ed25519_kid.clone(),
                key_use: "sig".to_string(),
                alg: "EdDSA".to_string(),
                x: URL_SAFE_NO_PAD.encode(vk.as_bytes()),
            }],
        }
    }

    pub fn create_api_key(&self, req: ApiKeyCreateRequest) -> Result<ApiKeyIssued, String> {
        if req.name.trim().is_empty() {
            return Err("api key name must not be empty".to_string());
        }
        let id = format!("key_{}", random_hex(10)?);
        let secret_tail = random_hex(20)?;
        let raw_key = format!("sk_sov_{secret_tail}");
        let prefix = raw_key.chars().take(13).collect::<String>();
        let key_hash = blake3::hash(raw_key.as_bytes()).to_hex().to_string();
        let now = unix_now();
        let expires_at = req.ttl_secs.map(|ttl| now + ttl);
        let user_id = req.user_id.unwrap_or_else(|| "usr_system".to_string());
        let scopes_json = serde_json::to_string(&req.scopes)
            .map_err(|e| format!("failed to serialize scopes: {e}"))?;

        let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
        db.execute(
            "INSERT INTO auth_api_keys (id, user_id, name, prefix, key_hash, scopes_json, created_at, expires_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                id,
                user_id,
                req.name.trim(),
                prefix,
                key_hash,
                scopes_json,
                now as i64,
                expires_at.map(|v| v as i64),
            ],
        )
        .map_err(|e| format!("failed to persist api key: {e}"))?;

        Ok(ApiKeyIssued {
            id,
            key: raw_key,
            prefix,
            name: req.name.trim().to_string(),
            scopes: req.scopes,
            created_at: now,
            expires_at,
        })
    }

    pub fn verify_api_key(&self, raw_key: &str) -> Result<Option<ApiKeyVerified>, String> {
        let trimmed = raw_key.trim();
        if !trimmed.starts_with("sk_sov_") {
            return Ok(None);
        }
        let key_hash = blake3::hash(trimmed.as_bytes()).to_hex().to_string();
        let now = unix_now();
        let row: Option<(String, String, String, String, Option<i64>)> = {
            let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
            db.query_row(
                "SELECT id, user_id, name, scopes_json, expires_at FROM auth_api_keys WHERE key_hash = ?1",
                params![key_hash],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
            )
            .optional()
            .map_err(|e| format!("api key query failed: {e}"))?
        };

        let Some((id, user_id, name, scopes_json, expires_at)) = row else {
            return Ok(None);
        };
        if let Some(exp) = expires_at
            && (exp as u64) <= now
        {
            return Ok(None);
        }
        let scopes: Vec<String> = serde_json::from_str(&scopes_json).unwrap_or_default();
        Ok(Some(ApiKeyVerified {
            id,
            user_id,
            name,
            scopes,
        }))
    }

    pub fn generate_passkey_challenge(
        &self,
        req: PasskeyChallengeRequest,
    ) -> Result<PasskeyChallengeResponse, String> {
        let challenge_id = format!("pkc_{}", random_hex(12)?);
        let challenge = random_url_token(32)?;
        let rp_id = req
            .rp_id
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| "localhost".to_string());
        let operation = req
            .operation
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| "authentication".to_string());
        let expires_at = unix_now() + 300;

        let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
        db.execute(
            "INSERT INTO auth_passkey_challenges (id, user_id, rp_id, operation, challenge, expires_at, consumed)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)",
            params![
                challenge_id,
                req.user_id,
                rp_id,
                operation,
                challenge,
                expires_at as i64
            ],
        )
        .map_err(|e| format!("failed to persist passkey challenge: {e}"))?;

        Ok(PasskeyChallengeResponse {
            challenge_id,
            challenge,
            rp_id,
            operation,
            timeout_ms: 60_000,
            user_verification: "preferred".to_string(),
            pub_key_cred_params: vec![
                PasskeyAlgParam {
                    cred_type: "public-key".to_string(),
                    alg: -8, // EdDSA (Ed25519)
                },
                PasskeyAlgParam {
                    cred_type: "public-key".to_string(),
                    alg: -7, // ES256
                },
            ],
            expires_at,
        })
    }

    pub fn issue_ed25519_jwt(
        &self,
        subject: &str,
        ttl_secs: u64,
        scope: Option<&str>,
    ) -> Result<String, String> {
        let now = unix_now();
        let header = serde_json::json!({
            "alg": "EdDSA",
            "typ": "JWT",
            "kid": self.ed25519_kid,
        });
        let claims = JwtClaims {
            sub: subject.to_string(),
            iss: self.issuer.clone(),
            iat: now,
            exp: now.saturating_add(ttl_secs),
            jti: random_hex(8)?,
            scope: scope.map(str::to_string),
        };
        let h_b64 = URL_SAFE_NO_PAD.encode(header.to_string().as_bytes());
        let p_b64 = URL_SAFE_NO_PAD
            .encode(serde_json::to_vec(&claims).map_err(|e| format!("jwt serialize failed: {e}"))?);
        let signing_input = format!("{h_b64}.{p_b64}");
        let sig: Signature = self.ed25519_signing.sign(signing_input.as_bytes());
        let s_b64 = URL_SAFE_NO_PAD.encode(sig.to_bytes());
        Ok(format!("{signing_input}.{s_b64}"))
    }

    pub fn verify_ed25519_jwt(&self, token: &str) -> Result<JwtClaims, String> {
        let mut parts = token.split('.');
        let h_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
        let p_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
        let s_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
        if parts.next().is_some() {
            return Err("malformed jwt: extra segment".to_string());
        }

        let sig_bytes = URL_SAFE_NO_PAD
            .decode(s_b64)
            .map_err(|e| format!("invalid jwt signature base64: {e}"))?;
        let sig = Signature::from_slice(&sig_bytes)
            .map_err(|e| format!("invalid ed25519 signature length: {e}"))?;
        let signing_input = format!("{h_b64}.{p_b64}");
        let vk = self.ed25519_signing.verifying_key();
        vk.verify(signing_input.as_bytes(), &sig)
            .map_err(|_| "ed25519 signature verification failed".to_string())?;

        let payload_bytes = URL_SAFE_NO_PAD
            .decode(p_b64)
            .map_err(|e| format!("invalid jwt payload base64: {e}"))?;
        let claims: JwtClaims = serde_json::from_slice(&payload_bytes)
            .map_err(|e| format!("invalid jwt claims json: {e}"))?;
        if claims.exp <= unix_now() {
            return Err("jwt expired".to_string());
        }
        Ok(claims)
    }

    fn create_session_for_user(
        &self,
        user: AuthUser,
        ttl_secs: u64,
        ip: Option<String>,
        ua: Option<String>,
    ) -> Result<AuthSessionEnvelope, String> {
        let now = unix_now();
        let expires_at = now + ttl_secs;
        let session_id = format!("ses_{}", random_hex(12)?);
        let raw_token = format!("rss_{}", random_url_token(32)?);
        let token_hash = sha256_hex(raw_token.as_bytes());

        {
            let db = self.db.lock().map_err(|_| "auth db poisoned".to_string())?;
            db.execute(
                "INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    session_id,
                    user.id,
                    token_hash,
                    expires_at as i64,
                    ip,
                    ua,
                    now as i64
                ],
            )
            .map_err(|e| format!("failed to create session: {e}"))?;
        }

        let jwt = self.issue_ed25519_jwt(&user.id, ttl_secs, Some("openid profile email"))?;
        let session = AuthSession {
            id: session_id,
            user_id: user.id.clone(),
            token: raw_token.clone(),
            expires_at,
            ip_address: ip,
            user_agent: ua,
            created_at: now,
        };

        Ok(AuthSessionEnvelope {
            token: raw_token,
            jwt,
            user,
            session,
        })
    }
}

pub fn issue_hs256_jwt(
    subject: &str,
    secret: &[u8],
    ttl_secs: u64,
    scope: Option<&str>,
) -> Result<String, String> {
    if subject.is_empty() {
        return Err("subject cannot be empty".to_string());
    }
    if secret.is_empty() {
        return Err("secret cannot be empty".to_string());
    }
    let now = unix_now();
    // Fast zero-overhead JSON header + payload formatting
    let h_b64 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
    let claims = JwtClaims {
        sub: subject.to_string(),
        iss: "rust-stack".to_string(),
        iat: now,
        exp: now.saturating_add(ttl_secs),
        jti: blake3::hash(format!("{subject}:{now}").as_bytes()).to_hex()[..16].to_string(),
        scope: scope.map(str::to_string),
    };
    let payload_vec =
        serde_json::to_vec(&claims).map_err(|e| format!("claims serialize failed: {e}"))?;
    let p_b64 = URL_SAFE_NO_PAD.encode(&payload_vec);
    let signing_input = format!("{h_b64}.{p_b64}");

    let mut mac =
        HmacSha256::new_from_slice(secret).map_err(|e| format!("hmac init failed: {e}"))?;
    mac.update(signing_input.as_bytes());
    let tag = mac.finalize().into_bytes();
    let s_b64 = URL_SAFE_NO_PAD.encode(tag);
    Ok(format!("{signing_input}.{s_b64}"))
}

pub fn verify_hs256_jwt(token: &str, secret: &[u8]) -> Result<JwtClaims, String> {
    if secret.is_empty() {
        return Err("secret cannot be empty".to_string());
    }
    let mut parts = token.split('.');
    let h_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
    let p_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
    let s_b64 = parts.next().ok_or_else(|| "malformed jwt".to_string())?;
    if parts.next().is_some() {
        return Err("malformed jwt: extra segment".to_string());
    }

    let header_bytes = URL_SAFE_NO_PAD
        .decode(h_b64)
        .map_err(|_| "invalid header base64".to_string())?;
    let header_str = std::str::from_utf8(&header_bytes).map_err(|_| "invalid header utf8")?;
    if !header_str.contains("HS256") {
        return Err("unsupported jwt alg; expected HS256".to_string());
    }

    let sig_bytes = URL_SAFE_NO_PAD
        .decode(s_b64)
        .map_err(|_| "invalid signature base64".to_string())?;
    let mut mac =
        HmacSha256::new_from_slice(secret).map_err(|e| format!("hmac init failed: {e}"))?;
    mac.update(h_b64.as_bytes());
    mac.update(b".");
    mac.update(p_b64.as_bytes());
    mac.verify_slice(&sig_bytes)
        .map_err(|_| "jwt hmac signature mismatch".to_string())?;

    let payload_bytes = URL_SAFE_NO_PAD
        .decode(p_b64)
        .map_err(|_| "invalid payload base64".to_string())?;
    let claims: JwtClaims =
        serde_json::from_slice(&payload_bytes).map_err(|_| "invalid jwt claims".to_string())?;
    if claims.exp <= unix_now() {
        return Err("jwt expired".to_string());
    }
    Ok(claims)
}

pub fn hash_password(password: &str, algo: PasswordAlgorithm) -> Result<String, String> {
    let mut salt_bytes = [0u8; 16];
    getrandom::fill(&mut salt_bytes).map_err(|e| format!("rng failed: {e}"))?;
    match algo {
        PasswordAlgorithm::Argon2id => {
            let argon2 = Argon2::default();
            argon2
                .hash_password_with_salt(password.as_bytes(), &salt_bytes)
                .map(|h| h.to_string())
                .map_err(|e| format!("argon2id failed: {e}"))
        }
        PasswordAlgorithm::Pbkdf2Sha256 => {
            let rounds = 210_000u32;
            let mut dk = [0u8; 32];
            pbkdf2_hmac::<Sha256>(password.as_bytes(), &salt_bytes, rounds, &mut dk);
            Ok(format!(
                "$pbkdf2-sha256${rounds}${}${}",
                hex::encode(salt_bytes),
                hex::encode(dk)
            ))
        }
    }
}

pub fn verify_password(password: &str, encoded: &str) -> Result<bool, String> {
    if let Some(rest) = encoded.strip_prefix("$pbkdf2-sha256$") {
        let parts: Vec<&str> = rest.split('$').collect();
        if parts.len() != 3 {
            return Err("malformed pbkdf2 hash".to_string());
        }
        let rounds: u32 = parts[0]
            .parse()
            .map_err(|_| "invalid pbkdf2 rounds".to_string())?;
        let salt = hex::decode(parts[1]).map_err(|_| "invalid pbkdf2 salt".to_string())?;
        let expected = hex::decode(parts[2]).map_err(|_| "invalid pbkdf2 digest".to_string())?;
        let mut dk = vec![0u8; expected.len()];
        pbkdf2_hmac::<Sha256>(password.as_bytes(), &salt, rounds, &mut dk);
        Ok(constant_time_eq(&dk, &expected))
    } else {
        let parsed =
            PasswordHash::new(encoded).map_err(|e| format!("invalid password hash format: {e}"))?;
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok())
    }
}

pub fn pkce_s256_challenge(code_verifier: &str) -> String {
    let digest = Sha256::digest(code_verifier.as_bytes());
    URL_SAFE_NO_PAD.encode(digest)
}

fn load_or_create_ed25519_key(conn: &Connection) -> Result<(String, SigningKey), String> {
    let existing: Option<(String, String)> = conn
        .query_row(
            "SELECT kid, seed_hex FROM auth_SigningKeys ORDER BY created_at DESC LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .optional()
        .map_err(|e| format!("failed to query signing key: {e}"))?;

    if let Some((kid, seed_hex)) = existing {
        let bytes = hex::decode(seed_hex).map_err(|e| format!("invalid seed hex: {e}"))?;
        let arr: [u8; 32] = bytes
            .try_into()
            .map_err(|_| "invalid ed25519 seed length".to_string())?;
        return Ok((kid, SigningKey::from_bytes(&arr)));
    }

    let mut seed = [0u8; 32];
    getrandom::fill(&mut seed).map_err(|e| format!("rng failed: {e}"))?;
    let signing = SigningKey::from_bytes(&seed);
    let vk_hash = blake3::hash(signing.verifying_key().as_bytes()).to_hex();
    let kid = format!("rsk-ed25519-{}", &vk_hash[..12]);
    let seed_hex = hex::encode(seed);
    conn.execute(
        "INSERT INTO auth_SigningKeys (kid, seed_hex, created_at) VALUES (?1, ?2, ?3)",
        params![kid, seed_hex, unix_now() as i64],
    )
    .map_err(|e| format!("failed to save signing key: {e}"))?;
    Ok((kid, signing))
}

fn normalize_email(raw: &str) -> Result<String, String> {
    let clean = raw.trim().to_ascii_lowercase();
    if !clean.contains('@') || clean.len() < 5 {
        return Err("invalid email address".to_string());
    }
    Ok(clean)
}

fn sha256_hex(data: &[u8]) -> String {
    hex::encode(Sha256::digest(data))
}

fn random_hex(bytes_len: usize) -> Result<String, String> {
    let mut buf = vec![0u8; bytes_len];
    getrandom::fill(&mut buf).map_err(|e| format!("rng failed: {e}"))?;
    Ok(hex::encode(buf))
}

fn random_url_token(bytes_len: usize) -> Result<String, String> {
    let mut buf = vec![0u8; bytes_len];
    getrandom::fill(&mut buf).map_err(|e| format!("rng failed: {e}"))?;
    Ok(URL_SAFE_NO_PAD.encode(buf))
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (&x, &y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

pub fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signup_signin_session_oauth_apikey_passkey_roundtrip() {
        let engine = AuthEngine::open_in_memory(b"unit-test-secret-32-bytes-key!!").unwrap();

        let env = engine
            .sign_up_email(
                SignUpEmailRequest {
                    email: "Linus@Kernel.org".to_string(),
                    password: "correct-horse-battery-staple".to_string(),
                    name: Some("Linus".to_string()),
                    algorithm: Some(PasswordAlgorithm::Argon2id),
                },
                Some("127.0.0.1".to_string()),
                Some("cargo-test".to_string()),
            )
            .unwrap();
        assert_eq!(env.user.email, "linus@kernel.org");
        assert!(env.token.starts_with("rss_"));

        let loaded = engine.get_session(&env.token).unwrap().unwrap();
        assert_eq!(loaded.user.id, env.user.id);
        let claims = engine.verify_ed25519_jwt(&loaded.jwt).unwrap();
        assert_eq!(claims.sub, env.user.id);

        // OAuth 2.1 + PKCE S256
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk-sovereign-pkce";
        let challenge = pkce_s256_challenge(verifier);
        let authz = engine
            .oauth2_authorize(OAuthAuthorizeRequest {
                client_id: "webui".to_string(),
                redirect_uri: "http://127.0.0.1:4320/callback".to_string(),
                response_type: "code".to_string(),
                code_challenge: challenge,
                code_challenge_method: Some("S256".to_string()),
                scope: Some("openid chat:write".to_string()),
                state: Some("xyz".to_string()),
                user_id: Some(env.user.id.clone()),
            })
            .unwrap();

        let tok = engine
            .oauth2_token(OAuthTokenRequest {
                grant_type: "authorization_code".to_string(),
                code: Some(authz.code),
                code_verifier: Some(verifier.to_string()),
                redirect_uri: Some("http://127.0.0.1:4320/callback".to_string()),
                client_id: Some("webui".to_string()),
                refresh_token: None,
            })
            .unwrap();
        assert_eq!(tok.token_type, "Bearer");
        let rotated = engine
            .oauth2_token(OAuthTokenRequest {
                grant_type: "refresh_token".to_string(),
                code: None,
                code_verifier: None,
                redirect_uri: None,
                client_id: Some("webui".to_string()),
                refresh_token: Some(tok.refresh_token),
            })
            .unwrap();
        assert!(!rotated.access_token.is_empty());

        // PBKDF2-HMAC-SHA256 verification path
        let pbkdf2_hash = hash_password("hunter2222", PasswordAlgorithm::Pbkdf2Sha256).unwrap();
        assert!(verify_password("hunter2222", &pbkdf2_hash).unwrap());
        assert!(!verify_password("wrongpass", &pbkdf2_hash).unwrap());

        // Scoped sk_sov_ API Key
        let issued = engine
            .create_api_key(ApiKeyCreateRequest {
                name: "ci-runner".to_string(),
                scopes: vec!["models:read".to_string(), "chat:completions".to_string()],
                ttl_secs: Some(3600),
                user_id: Some(env.user.id.clone()),
            })
            .unwrap();
        assert!(issued.key.starts_with("sk_sov_"));
        let verified = engine.verify_api_key(&issued.key).unwrap().unwrap();
        assert_eq!(verified.scopes.len(), 2);

        // Passkey challenge + JWKS
        let pk = engine
            .generate_passkey_challenge(PasskeyChallengeRequest {
                user_id: Some(env.user.id),
                rp_id: Some("localhost".to_string()),
                operation: Some("registration".to_string()),
            })
            .unwrap();
        assert!(pk.challenge_id.starts_with("pkc_"));
        assert_eq!(engine.jwks().keys[0].crv, "Ed25519");

        assert!(engine.sign_out(&env.token).unwrap());
        assert!(engine.get_session(&env.token).unwrap().is_none());
    }
}
