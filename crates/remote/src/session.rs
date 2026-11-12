//! One authenticated SSH connection (russh): host key verification, agent then key-file
//! public-key auth, command execution with streamed output, and SFTP transfers.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result, anyhow, bail};
use russh::client::{self, Handle};
use russh::keys::agent::client::{AgentClient, AgentStream};
use russh::keys::{PrivateKeyWithHashAlg, PublicKey, PublicKeyOrCertificate, load_secret_key};
use russh::{ChannelMsg, Disconnect};
use russh_sftp::client::SftpSession;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use crate::config::{HostConfig, home_dir};
use crate::known_hosts::{self, Verdict};

/// Exit code used when the connection itself fails (same convention as OpenSSH).
pub const CONNECT_FAILURE: i32 = 255;

#[derive(Debug, Clone)]
pub struct ConnectOptions {
    /// Record unknown host keys instead of refusing them (never overrides a mismatch).
    pub accept_new: bool,
    /// Used when the config has no ConnectTimeout.
    pub timeout: Duration,
    /// Overrides the configured User.
    pub user: Option<String>,
}

impl Default for ConnectOptions {
    fn default() -> Self {
        Self {
            accept_new: false,
            timeout: Duration::from_secs(10),
            user: None,
        }
    }
}

/// Host key policy, evaluated inside the key exchange.
struct Verifier {
    name: String,
    port: u16,
    files: Vec<PathBuf>,
    accept_new: bool,
}

impl client::Handler for Verifier {
    type Error = anyhow::Error;

    async fn check_server_key(
        &mut self,
        server: &PublicKeyOrCertificate,
    ) -> Result<bool, Self::Error> {
        let key: PublicKey = match server {
            PublicKeyOrCertificate::PublicKey { key, .. } => key.clone(),
            PublicKeyOrCertificate::Certificate(cert) => {
                PublicKey::new(cert.public_key().clone(), "")
            }
        };
        let fp = known_hosts::fingerprint(&key);
        let host = known_hosts::host_field(&self.name, self.port);
        match known_hosts::check(&self.files, &self.name, self.port, &key) {
            Verdict::Known { .. } => Ok(true),
            Verdict::Mismatch { file, line } => Err(anyhow!(
                "HOST KEY MISMATCH for {host}: server offers {} {fp}, {}:{line} records a different key; refusing to connect",
                key.algorithm(),
                file.display()
            )),
            Verdict::Revoked { file, line } => Err(anyhow!(
                "host key for {host} is revoked ({}:{line}); refusing to connect",
                file.display()
            )),
            Verdict::Unknown if self.accept_new => {
                let file = self
                    .files
                    .first()
                    .cloned()
                    .unwrap_or_else(|| home_dir().join(".ssh").join("known_hosts"));
                known_hosts::learn(&file, &self.name, self.port, &key)
                    .with_context(|| format!("recording host key in {}", file.display()))?;
                eprintln!(
                    "ay ssh: added {host} {} {fp} to {}",
                    key.algorithm(),
                    file.display()
                );
                Ok(true)
            }
            Verdict::Unknown => Err(anyhow!(
                "host {host} is not in known_hosts (server key {} {fp}); rerun with --accept-new to trust it",
                key.algorithm()
            )),
        }
    }
}

/// An authenticated connection.
pub struct Session {
    handle: Handle<Verifier>,
    pub host: HostConfig,
    pub user: String,
    /// How authentication succeeded, e.g. `agent ed25519 SHA256:...` (no secrets).
    pub auth: String,
}

type DynAgent = AgentClient<Box<dyn AgentStream + Send + Unpin + 'static>>;

/// Default Windows OpenSSH agent pipe.
#[cfg(windows)]
const WINDOWS_AGENT_PIPE: &str = r"\\.\pipe\openssh-ssh-agent";

#[cfg(windows)]
async fn connect_agent() -> Option<DynAgent> {
    let pipe = std::env::var("SSH_AUTH_SOCK")
        .ok()
        .filter(|s| s.starts_with(r"\\.\pipe\") || s.starts_with("//./pipe/"))
        .unwrap_or_else(|| WINDOWS_AGENT_PIPE.to_string());
    AgentClient::connect_named_pipe(pipe)
        .await
        .ok()
        .map(AgentClient::dynamic)
}

#[cfg(unix)]
async fn connect_agent() -> Option<DynAgent> {
    AgentClient::connect_env()
        .await
        .ok()
        .map(AgentClient::dynamic)
}

#[cfg(not(any(unix, windows)))]
async fn connect_agent() -> Option<DynAgent> {
    None
}

/// Identity files to try: the configured ones, else the OpenSSH defaults.
fn identity_candidates(host: &HostConfig) -> Vec<PathBuf> {
    if !host.identity_files.is_empty() {
        return host.identity_files.clone();
    }
    let ssh = home_dir().join(".ssh");
    ["id_ed25519", "id_ecdsa", "id_rsa"]
        .iter()
        .map(|n| ssh.join(n))
        .collect()
}

fn read_public(path: &Path) -> Option<PublicKey> {
    let mut pub_path = path.as_os_str().to_owned();
    pub_path.push(".pub");
    let text = std::fs::read_to_string(PathBuf::from(pub_path)).ok()?;
    PublicKey::from_openssh(text.trim()).ok()
}

fn describe(key: &PublicKey) -> String {
    format!("{} {}", key.algorithm(), known_hosts::fingerprint(key))
}

impl Session {
    /// Resolve nothing here: `host` is already resolved from ~/.ssh/config.
    pub async fn connect(host: HostConfig, opts: &ConnectOptions) -> Result<Session> {
        let user = opts
            .user
            .clone()
            .or_else(|| host.user.clone())
            .or_else(|| std::env::var("USER").ok())
            .or_else(|| std::env::var("USERNAME").ok())
            .ok_or_else(|| anyhow!("no User for {} (set it in ~/.ssh/config)", host.alias))?;
        let config = Arc::new(client::Config {
            inactivity_timeout: Some(Duration::from_secs(300)),
            keepalive_interval: Some(Duration::from_secs(15)),
            keepalive_max: 4,
            nodelay: true,
            ..Default::default()
        });
        let verifier = Verifier {
            name: host.known_hosts_name().to_string(),
            port: host.port,
            files: host.known_hosts_files.clone(),
            accept_new: opts.accept_new || host.accept_new,
        };
        let timeout = host
            .connect_timeout_secs
            .map(Duration::from_secs)
            .unwrap_or(opts.timeout);
        let addr = (host.hostname.clone(), host.port);
        let mut handle = tokio::time::timeout(timeout, client::connect(config, addr, verifier))
            .await
            .map_err(|_| {
                anyhow!(
                    "connect to {}:{} timed out after {}s",
                    host.hostname,
                    host.port,
                    timeout.as_secs()
                )
            })?
            .with_context(|| format!("connect to {}:{}", host.hostname, host.port))?;
        let auth = tokio::time::timeout(timeout * 3, authenticate(&mut handle, &host, &user))
            .await
            .map_err(|_| anyhow!("authentication on {} timed out", host.alias))??;
        Ok(Session {
            handle,
            host,
            user,
            auth,
        })
    }

    /// Run `command`, streaming output through `out`; returns the remote exit status.
    pub async fn exec(&self, command: &str, out: &mut Output) -> Result<i32> {
        let mut channel = self.handle.channel_open_session().await?;
        channel.exec(true, command).await?;
        // No stdin is forwarded: signal EOF so commands that read it do not hang.
        let _ = channel.eof().await;
        let mut code = None;
        while let Some(msg) = channel.wait().await {
            match msg {
                ChannelMsg::Data { ref data } => out.write(Stream::Out, data),
                ChannelMsg::ExtendedData { ref data, ext: 1 } => out.write(Stream::Err, data),
                ChannelMsg::ExitStatus { exit_status } => code = Some(exit_status as i32),
                ChannelMsg::ExitSignal {
                    signal_name,
                    error_message,
                    ..
                } => {
                    out.note(&format!(
                        "remote command killed by signal {signal_name:?} {error_message}"
                    ));
                    code = Some(CONNECT_FAILURE);
                }
                _ => {}
            }
        }
        out.finish();
        code.ok_or_else(|| {
            anyhow!(
                "remote command on {} ended without an exit status",
                self.host.alias
            )
        })
    }

    /// Run `command` and capture stdout (trimmed); fails on a non-zero exit status.
    pub async fn capture(&self, command: &str) -> Result<String> {
        let mut out = Output::capture();
        let code = self.exec(command, &mut out).await?;
        let (stdout, stderr) = out.into_captured();
        if code != 0 {
            bail!(
                "`{command}` exited {code}: {}",
                String::from_utf8_lossy(&stderr).trim()
            );
        }
        Ok(String::from_utf8_lossy(&stdout).trim().to_string())
    }

    async fn sftp(&self) -> Result<SftpSession> {
        let channel = self.handle.channel_open_session().await?;
        channel.request_subsystem(true, "sftp").await?;
        SftpSession::new(channel.into_stream())
            .await
            .context("sftp subsystem")
    }

    /// Upload a local file; when `remote` is an existing directory (or ends in `/`) the file
    /// keeps its name. Returns the remote path and byte count.
    pub async fn upload(&self, local: &Path, remote: &str) -> Result<(String, u64)> {
        let sftp = self.sftp().await?;
        let name = local
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        let remote = remote_path(remote);
        let is_dir = remote.ends_with('/')
            || sftp
                .metadata(remote.clone())
                .await
                .map(|m| m.is_dir())
                .unwrap_or(false);
        let target = if is_dir {
            format!("{}/{name}", remote.trim_end_matches('/'))
        } else {
            remote
        };
        let mut src = tokio::fs::File::open(local)
            .await
            .with_context(|| local.display().to_string())?;
        let mut dst = sftp
            .create(target.clone())
            .await
            .with_context(|| format!("create {target}"))?;
        let bytes = tokio::io::copy(&mut src, &mut dst)
            .await
            .with_context(|| format!("write {target}"))?;
        dst.close()
            .await
            .with_context(|| format!("close {target}"))?;
        let _ = sftp.close().await;
        Ok((target, bytes))
    }

    /// Download a remote file; when `local` is a directory the file keeps its name.
    pub async fn download(&self, remote: &str, local: &Path) -> Result<(PathBuf, u64)> {
        let sftp = self.sftp().await?;
        let remote = remote_path(remote);
        let name = remote.rsplit('/').next().unwrap_or("download").to_string();
        let target = if local.is_dir() {
            local.join(name)
        } else {
            local.to_path_buf()
        };
        let mut src = sftp
            .open(remote.clone())
            .await
            .with_context(|| format!("open {remote}"))?;
        let mut buf = Vec::new();
        src.read_to_end(&mut buf)
            .await
            .with_context(|| format!("read {remote}"))?;
        let _ = src.close().await;
        let mut dst = tokio::fs::File::create(&target)
            .await
            .with_context(|| target.display().to_string())?;
        dst.write_all(&buf).await?;
        dst.flush().await?;
        let _ = sftp.close().await;
        Ok((target, buf.len() as u64))
    }

    pub async fn close(self) {
        let _ = self
            .handle
            .disconnect(Disconnect::ByApplication, "", "en")
            .await;
    }
}

/// SFTP paths are relative to the login directory; accept `~/x` and `~` as ssh users write them.
fn remote_path(p: &str) -> String {
    match p {
        "" | "~" => ".".to_string(),
        _ => p
            .strip_prefix("~/")
            .map(str::to_string)
            .unwrap_or_else(|| p.to_string()),
    }
}

/// Agent identities first (restricted to the configured keys under IdentitiesOnly), then the
/// unencrypted identity files. Returns a description of the method that worked.
async fn authenticate(
    handle: &mut Handle<Verifier>,
    host: &HostConfig,
    user: &str,
) -> Result<String> {
    let candidates = identity_candidates(host);
    let configured: Vec<PublicKey> = candidates.iter().filter_map(|p| read_public(p)).collect();
    let mut tried: Vec<String> = Vec::new();
    let rsa_hash = handle
        .best_supported_rsa_hash()
        .await
        .ok()
        .flatten()
        .flatten();

    if let Some(mut agent) = connect_agent().await {
        let identities = agent.request_identities().await.unwrap_or_default();
        for id in identities {
            let key = id.public_key().into_owned();
            let wanted = !host.identities_only
                || configured.is_empty()
                || configured.iter().any(|c| c.key_data() == key.key_data());
            if !wanted {
                continue;
            }
            let hash = if key.algorithm().is_rsa() {
                rsa_hash
            } else {
                None
            };
            tried.push(format!("agent {}", describe(&key)));
            match handle
                .authenticate_publickey_with(user, key.clone(), hash, &mut agent)
                .await
            {
                Ok(r) if r.success() => return Ok(format!("agent {}", describe(&key))),
                _ => continue,
            }
        }
    } else {
        tried.push("agent unavailable".into());
    }

    for path in &candidates {
        if !path.is_file() {
            continue;
        }
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        // Key material stays in memory; errors are summarized, never echoed.
        let Ok(key) = load_secret_key(path, None) else {
            tried.push(format!(
                "{name} (encrypted or unreadable; load it into ssh-agent)"
            ));
            continue;
        };
        let hash = if key.algorithm().is_rsa() {
            rsa_hash
        } else {
            None
        };
        let label = format!("key {name} {}", describe(key.public_key()));
        tried.push(label.clone());
        let res = handle
            .authenticate_publickey(user, PrivateKeyWithHashAlg::new(Arc::new(key), hash))
            .await?;
        if res.success() {
            return Ok(label);
        }
    }
    bail!(
        "{user}@{}: permission denied (publickey); tried: {}",
        host.alias,
        tried.join(", ")
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stream {
    Out,
    Err,
}

/// Where remote output goes: straight through, line-prefixed (several hosts), or captured.
pub struct Output {
    mode: Mode,
    out_buf: Vec<u8>,
    err_buf: Vec<u8>,
}

enum Mode {
    Raw,
    Prefixed(String),
    Capture,
}

impl Output {
    pub fn raw() -> Self {
        Self {
            mode: Mode::Raw,
            out_buf: Vec::new(),
            err_buf: Vec::new(),
        }
    }

    /// Every line is written as `<label> | line`, whole lines at a time.
    pub fn prefixed(label: &str, width: usize) -> Self {
        Self {
            mode: Mode::Prefixed(format!("{label:<width$} | ")),
            out_buf: Vec::new(),
            err_buf: Vec::new(),
        }
    }

    pub fn capture() -> Self {
        Self {
            mode: Mode::Capture,
            out_buf: Vec::new(),
            err_buf: Vec::new(),
        }
    }

    pub fn into_captured(self) -> (Vec<u8>, Vec<u8>) {
        (self.out_buf, self.err_buf)
    }

    fn sink(stream: Stream) -> Box<dyn Write> {
        match stream {
            Stream::Out => Box::new(std::io::stdout().lock()),
            Stream::Err => Box::new(std::io::stderr().lock()),
        }
    }

    pub fn write(&mut self, stream: Stream, data: &[u8]) {
        match &self.mode {
            Mode::Raw => {
                let mut s = Self::sink(stream);
                let _ = s.write_all(data);
                let _ = s.flush();
            }
            Mode::Capture => match stream {
                Stream::Out => self.out_buf.extend_from_slice(data),
                Stream::Err => self.err_buf.extend_from_slice(data),
            },
            Mode::Prefixed(prefix) => {
                let prefix = prefix.clone();
                let buf = if stream == Stream::Out {
                    &mut self.out_buf
                } else {
                    &mut self.err_buf
                };
                buf.extend_from_slice(data);
                let mut chunk = Vec::new();
                while let Some(pos) = buf.iter().position(|b| *b == b'\n') {
                    let line: Vec<u8> = buf.drain(..=pos).collect();
                    chunk.extend_from_slice(prefix.as_bytes());
                    chunk.extend_from_slice(&line);
                }
                if !chunk.is_empty() {
                    let mut s = Self::sink(stream);
                    let _ = s.write_all(&chunk);
                    let _ = s.flush();
                }
            }
        }
    }

    /// Flush a trailing partial line (prefixed mode).
    pub fn finish(&mut self) {
        if let Mode::Prefixed(prefix) = &self.mode {
            let prefix = prefix.clone();
            for stream in [Stream::Out, Stream::Err] {
                let buf = std::mem::take(if stream == Stream::Out {
                    &mut self.out_buf
                } else {
                    &mut self.err_buf
                });
                if !buf.is_empty() {
                    let mut s = Self::sink(stream);
                    let _ = s.write_all(prefix.as_bytes());
                    let _ = s.write_all(&buf);
                    let _ = s.write_all(b"\n");
                }
            }
        }
    }

    /// A message from `ay` itself about this host, on stderr.
    pub fn note(&mut self, msg: &str) {
        match &self.mode {
            Mode::Prefixed(prefix) => eprintln!("{prefix}{msg}"),
            Mode::Capture => self.err_buf.extend_from_slice(msg.as_bytes()),
            Mode::Raw => eprintln!("ay ssh: {msg}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn remote_paths() {
        assert_eq!(remote_path("~/x/y"), "x/y");
        assert_eq!(remote_path("~"), ".");
        assert_eq!(remote_path("/tmp/a"), "/tmp/a");
    }

    #[test]
    fn capture_splits_streams() {
        let mut o = Output::capture();
        o.write(Stream::Out, b"a\nb");
        o.write(Stream::Err, b"e");
        o.finish();
        assert_eq!(o.into_captured(), (b"a\nb".to_vec(), b"e".to_vec()));
    }

    #[test]
    fn default_identities_when_unconfigured() {
        let cfg = crate::config::SshConfig::parse("", Path::new("/h")).resolve("x");
        let c = identity_candidates(&cfg);
        assert_eq!(c.len(), 3);
        assert!(c[0].ends_with("id_ed25519"));
    }
}
