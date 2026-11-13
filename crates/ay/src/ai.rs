//! `ay ai`: local inference runtimes and remote providers behind one LiteLLM proxy.
//!
//! Everything comes from the manifest (`infra/ai/ai.toml`, else the embedded copy):
//! runtimes say how to install, serve and feed a local server; providers say which LiteLLM route
//! a key or a local server enables. Models are never listed here: LiteLLM's wildcard routes
//! (`<id>/*` with `check_provider_endpoint`) ask each provider. Secrets are read from the
//! dotenv files (`--env-file`, `$AY_ENV_FILE`, `<repo>/.env`), then the process environment, passed to
//! LiteLLM as `os.environ/<KEY>` references and never printed.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use serde::Deserialize;
use serde_json::{Value, json};

const EMBEDDED: &str = include_str!("../../../infra/ai/ai.toml");

#[derive(clap::Args, Debug, PartialEq, Default)]
pub struct AiArgs {
    #[command(subcommand)]
    pub cmd: Option<AiCmd>,
    /// Manifest (default: $AY_AI_MANIFEST, <repo>/infra/ai/ai.toml, then the embedded copy)
    #[arg(long, global = true, value_name = "PATH")]
    pub manifest: Option<PathBuf>,
    /// Secrets in dotenv format, repeatable (default: $AY_ENV_FILE, then <repo>/.env)
    #[arg(long = "env-file", global = true, value_name = "PATH")]
    pub env_files: Vec<PathBuf>,
    /// JSON output (ls, check)
    #[arg(long, global = true)]
    pub json: bool,
}

#[derive(clap::Subcommand, Debug, PartialEq)]
pub enum AiCmd {
    /// Providers and runtimes with their state (default)
    Ls,
    /// Install the runtimes of this OS (skipped when their binary is on PATH, unless --force)
    Install {
        ids: Vec<String>,
        #[arg(long)]
        force: bool,
    },
    /// Write the LiteLLM config from the keys and servers present
    Config,
    /// Run one runtime in the foreground (what the services start)
    Serve { id: String },
    /// Register and start runtimes as services (Task Scheduler at boot, systemd)
    Service {
        ids: Vec<String>,
        #[arg(long)]
        remove: bool,
    },
    /// Stop then start a runtime service
    Restart { id: String },
    /// Fetch the models a runtime lists
    Pull { ids: Vec<String> },
    /// LiteLLM health, model list and one real call per provider
    Check,
    /// Missing API keys: open the key page, read the copied key from the clipboard, store it
    Auth {
        ids: Vec<String>,
        /// Seconds to wait for each key
        #[arg(long, default_value_t = 600)]
        timeout: u64,
        /// Ask again even when a valid key is stored
        #[arg(long)]
        force: bool,
    },
    /// install, service, pull, config, restart LiteLLM, check
    Up,
    /// Copy these providers' secrets to another host's store (`ssh <host> ay ai import`, add-only)
    Push {
        host: String,
        /// Provider ids (default: the providers declared in the manifest)
        ids: Vec<String>,
        /// Dotenv file on the remote host (default: the remote `ay ai` default)
        #[arg(long, value_name = "PATH")]
        remote_env_file: Option<String>,
    },
    /// Add dotenv keys from stdin to the first env file; existing keys are kept (names printed only)
    Import,
    /// Distributed inference fabric (infra/ai/fabric.toml): `up [--only a,b] [--split x,y]`, `status`, `down`,
    /// `bench`, `node <id>`; runs `ai-os fabric` from the checkout (bun), else the installed `ai-os`
    Fabric {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
}

// ----------------------------------------------------------------------------------------------
// Manifest

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Manifest {
    pub settings: Settings,
    #[serde(default, rename = "runtime")]
    pub runtimes: Vec<Runtime>,
    #[serde(default, rename = "provider")]
    pub providers: Vec<Provider>,
    /// Registry vocabulary -> LiteLLM: `providers` (registry id -> LiteLLM provider) and `npm`
    /// (AI SDK package of an endpoint -> LiteLLM route, e.g. openai-compatible -> openai).
    #[serde(default)]
    pub litellm: LitellmMap,
    /// Registry env name -> name used in this repository's secret store.
    #[serde(default)]
    pub env: BTreeMap<String, String>,
}

#[derive(Deserialize, Debug, Default)]
#[serde(deny_unknown_fields)]
pub struct LitellmMap {
    #[serde(default)]
    pub providers: BTreeMap<String, String>,
    #[serde(default)]
    pub npm: BTreeMap<String, String>,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct Settings {
    pub host: String,
    pub port: u16,
    pub config: String,
    pub prompt: String,
    /// Variable holding the proxy's master key; generated and stored once when missing.
    pub master_key: String,
    /// Provider and model registry in the models.dev format (opencode); cached for a day.
    pub registry: Option<String>,
}

#[derive(Deserialize, Debug, Default)]
#[serde(deny_unknown_fields)]
pub struct Runtime {
    pub id: String,
    #[serde(default)]
    pub os: Vec<String>,
    pub bin: Option<String>,
    #[serde(default)]
    pub path: Vec<String>,
    #[serde(default)]
    pub install: BTreeMap<String, Vec<Vec<String>>>,
    #[serde(default)]
    pub serve: Vec<String>,
    #[serde(default)]
    pub oneshot: bool,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    pub health: Option<String>,
    #[serde(default)]
    pub pull: Vec<String>,
    #[serde(default)]
    pub models: Vec<String>,
}

#[derive(Deserialize, Debug, Default, Clone)]
#[serde(deny_unknown_fields)]
pub struct Provider {
    pub id: String,
    /// Display name (registry `name`).
    #[serde(skip)]
    pub name: String,
    /// Models the registry knows for this provider, cheapest first.
    #[serde(skip)]
    pub catalog: Vec<(String, f64)>,
    /// Declared in the manifest (shown even when missing); registry-only providers are counted.
    #[serde(skip)]
    pub declared: bool,
    pub route: Option<String>,
    pub key: Option<String>,
    #[serde(default)]
    pub requires: Vec<String>,
    pub api_base: Option<String>,
    pub health: Option<String>,
    #[serde(default)]
    pub params: BTreeMap<String, String>,
    #[serde(default)]
    pub credentials: Vec<String>,
    pub probe: Option<String>,
    pub models_url: Option<String>,
    pub auth_url: Option<String>,
    pub key_pattern: Option<String>,
    pub validate: Option<String>,
    pub cli: Option<CliSpec>,
}

#[derive(Deserialize, Debug, Default, Clone)]
#[serde(deny_unknown_fields)]
pub struct CliSpec {
    pub models: Vec<String>,
    pub ask: Vec<String>,
}

pub fn os_name() -> &'static str {
    if cfg!(windows) {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

impl Runtime {
    fn here(&self) -> bool {
        self.os.is_empty() || self.os.iter().any(|o| o == os_name())
    }
    fn install_steps(&self) -> &[Vec<String>] {
        self.install.get(os_name()).or_else(|| self.install.get("all")).map(Vec::as_slice).unwrap_or(&[])
    }
}

pub fn parse_manifest(text: &str) -> Result<Manifest, String> {
    let m: Manifest = toml::from_str(text).map_err(|e| format!("ai.toml: {e}"))?;
    let mut seen = BTreeSet::new();
    for p in &m.providers {
        if !seen.insert(p.id.as_str()) {
            return Err(format!("ai.toml: provider {} declared twice", p.id));
        }
    }
    Ok(m)
}

/// Providers of a models.dev-format registry, mapped onto LiteLLM routes. A provider's `env`
/// lists key variables (`*KEY`, `*TOKEN`, `*SECRET`: any one is enough) and settings it needs
/// (account, project, location: all required); `api` is its OpenAI-style base URL.
pub fn registry_providers(reg: &Value, m: &Manifest, env: &Env) -> Vec<Provider> {
    let Some(obj) = reg.as_object() else { return vec![] };
    let is_key = |e: &str| ["KEY", "TOKEN", "SECRET"].iter().any(|s| e.ends_with(s));
    obj.iter()
        .filter_map(|(id, r)| {
            let envs: Vec<String> = r["env"]
                .as_array()?
                .iter()
                .filter_map(Value::as_str)
                .map(|e| m.env.get(e).cloned().unwrap_or_else(|| e.to_string()))
                .collect();
            let keys: Vec<&String> = envs.iter().filter(|e| is_key(e)).collect();
            let key = keys.iter().find(|k| env.get(k).is_some()).or(keys.first()).map(|k| k.to_string());
            let npm = r["npm"].as_str().unwrap_or_default();
            let route = m.litellm.npm.get(npm).or_else(|| m.litellm.providers.get(id)).cloned().unwrap_or_else(|| id.clone());
            let mut catalog: Vec<(String, f64)> = r["models"]
                .as_object()
                .map(|ms| {
                    ms.iter()
                        .filter(|(_, mm)| mm["modalities"]["output"].as_array().is_none_or(|o| o.iter().any(|x| x == "text")))
                        .map(|(mid, mm)| (mid.clone(), mm["cost"]["input"].as_f64().unwrap_or(f64::MAX)))
                        .collect()
                })
                .unwrap_or_default();
            catalog.sort_by(|a, b| a.1.total_cmp(&b.1));
            Some(Provider {
                id: id.clone(),
                name: r["name"].as_str().unwrap_or(id).to_string(),
                route: Some(route),
                key,
                requires: envs.iter().filter(|e| !is_key(e)).cloned().collect(),
                api_base: r["api"].as_str().map(String::from),
                catalog,
                ..Default::default()
            })
        })
        .collect()
}

/// Registry providers, then the manifest: an entry with a registry id overrides the fields it
/// sets (a local `health` or `credentials` replaces the registry's key and settings); others add.
pub fn merge_providers(mut reg: Vec<Provider>, manifest: &[Provider]) -> Vec<Provider> {
    for mp in manifest {
        match reg.iter_mut().find(|p| p.id == mp.id) {
            Some(p) => {
                p.declared = true;
                if mp.health.is_some() || !mp.credentials.is_empty() || mp.cli.is_some() {
                    p.key = mp.key.clone();
                    p.requires = mp.requires.clone();
                }
                macro_rules! take {
                    ($($f:ident),*) => { $( if mp.$f.is_some() { p.$f = mp.$f.clone(); } )* };
                }
                take!(route, key, api_base, health, probe, models_url, auth_url, key_pattern, validate, cli);
                if !mp.requires.is_empty() {
                    p.requires = mp.requires.clone();
                }
                if !mp.params.is_empty() {
                    p.params = mp.params.clone();
                }
                if !mp.credentials.is_empty() {
                    p.credentials = mp.credentials.clone();
                }
            }
            None => reg.push(Provider { declared: true, name: mp.id.clone(), ..mp.clone() }),
        }
    }
    reg.retain(|p| p.route.is_some() || p.cli.is_some());
    reg
}

/// The registry from its URL, cached under the data dir for a day; the cache serves offline.
fn load_registry(m: &Manifest) -> Value {
    let Some(url) = &m.settings.registry else { return Value::Null };
    let cache = data_dir().join("registry.json");
    let fresh = cache.metadata().and_then(|md| md.modified()).ok().and_then(|t| t.elapsed().ok()).is_some_and(|age| age < Duration::from_secs(86_400));
    if !fresh {
        if let Ok((200, v @ Value::Object(_))) = http_get(url, None, 30) {
            let _ = std::fs::create_dir_all(data_dir());
            let _ = std::fs::write(&cache, v.to_string());
            return v;
        }
    }
    std::fs::read_to_string(&cache).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(Value::Null)
}

fn manifest_path(arg: &Option<PathBuf>) -> Option<PathBuf> {
    arg.clone()
        .or_else(|| std::env::var_os("AY_AI_MANIFEST").filter(|v| !v.is_empty()).map(PathBuf::from))
        .or_else(|| Some(crate::repo_root().join("infra").join("ai").join("ai.toml")).filter(|p| p.is_file()))
}

fn load_manifest(arg: &Option<PathBuf>) -> Result<(Manifest, Option<PathBuf>), String> {
    match manifest_path(arg) {
        Some(p) => {
            let text = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
            Ok((parse_manifest(&text)?, Some(absolute(&p))))
        }
        None => Ok((parse_manifest(EMBEDDED)?, None)),
    }
}

fn absolute(p: &Path) -> PathBuf {
    std::path::absolute(p).unwrap_or_else(|_| p.to_path_buf())
}

// ----------------------------------------------------------------------------------------------
// Environment and secrets

fn home() -> PathBuf {
    std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

pub fn expand_home(s: &str) -> PathBuf {
    match s.strip_prefix("~/").or_else(|| s.strip_prefix("~\\")) {
        Some(rest) => home().join(rest),
        None if s == "~" => home(),
        None => PathBuf::from(s),
    }
}

fn data_dir() -> PathBuf {
    expand_home("~/.local/share/ay/ai")
}

/// The dotenv files first (the vault is the reference; the user environment can lag behind),
/// then the process environment.
pub struct Env {
    files: Vec<PathBuf>,
    vars: BTreeMap<String, String>,
    /// Values as written in the files (double quotes decoded as a JSON string), for multi-encoded JSON.
    raw: BTreeMap<String, String>,
}

impl Env {
    fn load(given: &[PathBuf]) -> Env {
        let files: Vec<PathBuf> = if !given.is_empty() {
            given.iter().map(|p| absolute(p)).collect()
        } else if let Some(v) = std::env::var_os("AY_ENV_FILE").filter(|v| !v.is_empty()) {
            std::env::split_paths(&v).collect()
        } else {
            vec![crate::repo_root().join(".env")]
        };
        let mut vars = BTreeMap::new();
        let mut raw = BTreeMap::new();
        for f in files.iter().rev() {
            let mut parsed = BTreeMap::new();
            if let Ok(iter) = dotenvy::from_path_iter(f) {
                parsed.extend(iter.flatten());
            }
            // Lines dotenvy rejects (escaped JSON, odd quoting) are still read: raw value, a
            // double-quoted value decoded as a JSON string, or single quotes stripped.
            for line in std::fs::read_to_string(f).unwrap_or_default().lines() {
                let Some((k, v)) = line.trim_start().strip_prefix("export ").unwrap_or(line.trim_start()).split_once('=') else { continue };
                let k = k.trim();
                if k.is_empty() || k.starts_with('#') || !k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
                    continue;
                }
                let v = v.trim();
                let value = if v.len() >= 2 && v.starts_with('"') && v.ends_with('"') {
                    serde_json::from_str::<String>(v).unwrap_or_else(|_| v[1..v.len() - 1].to_string())
                } else if v.len() >= 2 && v.starts_with('\'') && v.ends_with('\'') {
                    v[1..v.len() - 1].to_string()
                } else {
                    v.to_string()
                };
                raw.insert(k.to_string(), value.clone());
                parsed.entry(k.to_string()).or_insert(value);
            }
            vars.extend(parsed);
        }
        Env { files: files.into_iter().filter(|f| f.is_file()).collect(), vars, raw }
    }

    pub fn get(&self, key: &str) -> Option<String> {
        self.vars.get(key).filter(|v| !v.is_empty()).cloned().or_else(|| std::env::var(key).ok().filter(|v| !v.is_empty()))
    }

    fn in_file(&self, key: &str) -> bool {
        self.vars.contains_key(key)
    }

    fn set(&mut self, key: &str, value: &str) {
        self.vars.insert(key.to_string(), value.to_string());
    }

    /// Replace every known secret value in `text` (provider error bodies may echo part of a key).
    fn redact(&self, text: &str, keys: &[String]) -> String {
        let mut out = text.to_string();
        for k in keys {
            if let Some(v) = self.get(k).filter(|v| v.len() >= 8) {
                out = out.replace(&v, "[secret]");
            }
        }
        let re = regex::Regex::new(r"(sk|hf|vck)[-_][A-Za-z0-9*_-]{6,}").expect("static regex");
        re.replace_all(&out, "[secret]").into_owned()
    }
}

/// A service-account JSON stored inline, possibly quoted or escaped one or more times.
pub fn service_account(raw: &str) -> Option<Value> {
    let mut text = raw.trim().to_string();
    for _ in 0..6 {
        let parsed = serde_json::from_str::<Value>(&text).or_else(|_| serde_json::from_str::<Value>(&escape_newlines_in_strings(&text)));
        match parsed {
            Ok(Value::String(s)) => text = s,
            Ok(v) if v.get("project_id").is_some() || v.get("quota_project_id").is_some() => return Some(v),
            Ok(_) => return None,
            Err(_) => match serde_json::from_str::<String>(&format!("\"{text}\"")) {
                Ok(s) if s != text => text = s,
                _ => return None,
            },
        }
    }
    None
}

/// Real line breaks inside JSON strings (a PEM key decoded one level too far) back to `\n` escapes.
fn escape_newlines_in_strings(text: &str) -> String {
    let (mut out, mut in_str, mut esc) = (String::with_capacity(text.len()), false, false);
    for c in text.chars() {
        match (in_str, esc, c) {
            (true, true, _) => {
                esc = false;
                out.push(c);
            }
            (true, false, '\\') => {
                esc = true;
                out.push(c);
            }
            (true, false, '\n') => out.push_str("\\n"),
            (true, false, '\r') => {}
            (_, _, '"') => {
                in_str = !in_str;
                out.push(c);
            }
            _ => out.push(c),
        }
    }
    out
}

// ----------------------------------------------------------------------------------------------
// Processes and HTTP

fn extra_path(rt: Option<&Runtime>) -> Vec<PathBuf> {
    let mut dirs = vec![expand_home("~/.local/bin")];
    if let Some(rt) = rt {
        dirs.extend(rt.path.iter().map(|p| expand_home(p)));
    }
    dirs
}

pub fn which_in(bin: &str, extra: &[PathBuf]) -> Option<PathBuf> {
    let p = if bin.starts_with('~') { expand_home(bin) } else { PathBuf::from(bin) };
    if p.components().count() > 1 {
        return p.is_file().then_some(p);
    }
    let exts: Vec<String> = if cfg!(windows) {
        std::env::var("PATHEXT")
            .unwrap_or_else(|_| ".EXE;.CMD;.BAT".into())
            .split(';')
            .filter(|e| !e.is_empty())
            .map(|e| e.to_ascii_lowercase())
            .chain(std::iter::once(String::new()))
            .collect()
    } else {
        vec![String::new()]
    };
    let path = std::env::var_os("PATH").unwrap_or_default();
    extra.iter().cloned().chain(std::env::split_paths(&path)).find_map(|dir| {
        exts.iter().map(|e| dir.join(format!("{bin}{e}"))).find(|c| c.is_file())
    })
}

fn command(argv: &[String], rt: Option<&Runtime>) -> Result<Command, String> {
    let (prog, args) = argv.split_first().ok_or("empty command")?;
    let extra = extra_path(rt);
    let resolved = which_in(prog, &extra).ok_or_else(|| format!("{prog}: not found on PATH"))?;
    let mut cmd = Command::new(resolved);
    cmd.args(args);
    if let Some(rt) = rt {
        let path = std::env::var_os("PATH").unwrap_or_default();
        let joined = std::env::join_paths(extra.iter().cloned().chain(std::env::split_paths(&path)))
            .map_err(|e| e.to_string())?;
        cmd.env("PATH", joined);
        for (k, v) in &rt.env {
            cmd.env(k, v);
        }
    }
    Ok(cmd)
}

fn run_status(argv: &[String], rt: Option<&Runtime>) -> i32 {
    match command(argv, rt) {
        Ok(mut c) => crate::status_of(&mut c),
        Err(e) => {
            eprintln!("ay ai: {e}");
            127
        }
    }
}

fn run_capture(argv: &[String], rt: Option<&Runtime>) -> Result<(i32, String), String> {
    let out = command(argv, rt)?
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .map_err(|e| format!("{}: {e}", argv[0]))?;
    Ok((out.status.code().unwrap_or(1), String::from_utf8_lossy(&out.stdout).into_owned()))
}

fn agent(secs: u64) -> ureq::Agent {
    ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(secs)))
        .http_status_as_error(false)
        .build()
        .into()
}

fn read_body(mut resp: ureq::http::Response<ureq::Body>) -> (u16, Value) {
    let status = resp.status().as_u16();
    let text = resp.body_mut().with_config().limit(64 << 20).read_to_string().unwrap_or_default();
    (status, serde_json::from_str(&text).unwrap_or(Value::String(text)))
}

pub fn http_get(url: &str, bearer: Option<&str>, secs: u64) -> Result<(u16, Value), String> {
    let mut req = agent(secs).get(url);
    if let Some(k) = bearer {
        req = req.header("Authorization", format!("Bearer {k}"));
    }
    req.call().map(read_body).map_err(|e| format!("{}: {e}", url.split('?').next().unwrap_or(url)))
}

fn http_post(url: &str, body: &Value, bearer: Option<&str>, secs: u64) -> Result<(u16, Value), String> {
    let mut req = agent(secs).post(url);
    if let Some(k) = bearer {
        req = req.header("Authorization", format!("Bearer {k}"));
    }
    req.send_json(body).map(read_body).map_err(|e| format!("{url}: {e}"))
}

fn healthy(url: &str) -> bool {
    matches!(http_get(url, None, 3), Ok((s, _)) if s < 300)
}

fn wait_healthy(url: &str, secs: u64) -> bool {
    let t0 = Instant::now();
    while t0.elapsed() < Duration::from_secs(secs) {
        if healthy(url) {
            return true;
        }
        std::thread::sleep(Duration::from_secs(2));
    }
    false
}

// ----------------------------------------------------------------------------------------------
// Templates

struct Ctx<'a> {
    m: &'a Manifest,
    env: &'a Env,
    model: Option<&'a str>,
}

impl Ctx<'_> {
    fn config_path(&self) -> PathBuf {
        expand_home(&self.m.settings.config)
    }

    fn expand(&self, s: &str) -> Result<String, String> {
        let mut out = String::new();
        let mut rest = s;
        while let Some(start) = rest.find('{') {
            out.push_str(&rest[..start]);
            let end = rest[start..].find('}').ok_or_else(|| format!("unclosed {{ in {s}"))? + start;
            let key = &rest[start + 1..end];
            out.push_str(&self.value(key)?);
            rest = &rest[end + 1..];
        }
        out.push_str(rest);
        Ok(out)
    }

    fn value(&self, key: &str) -> Result<String, String> {
        Ok(match key.split_once(':') {
            Some(("ollama_gguf", model)) => ollama_gguf(model)?.display().to_string(),
            Some(("env", var)) => self.env.get(var).ok_or_else(|| format!("{var} is not set"))?,
            _ => match key {
                "config" => self.config_path().display().to_string(),
                "host" => self.m.settings.host.clone(),
                "port" => self.m.settings.port.to_string(),
                "prompt" => self.m.settings.prompt.clone(),
                "model" => self.model.ok_or("{model} outside a model step")?.to_string(),
                _ => return Err(format!("unknown placeholder {{{key}}}")),
            },
        })
    }

    fn argv(&self, argv: &[String]) -> Result<Vec<String>, String> {
        argv.iter().map(|a| self.expand(a)).collect()
    }
}

/// The GGUF blob Ollama downloaded for `model`, hard-linked under a `.gguf` name so llama.cpp and
/// LM Studio read the same file without a second download.
fn ollama_gguf(model: &str) -> Result<PathBuf, String> {
    let (code, out) = run_capture(&["ollama".into(), "show".into(), "--modelfile".into(), model.into()], None)?;
    if code != 0 {
        return Err(format!("ollama show {model}: exit {code} (is the model pulled?)"));
    }
    let blob = out
        .lines()
        .filter_map(|l| l.strip_prefix("FROM "))
        .map(|p| PathBuf::from(p.trim()))
        .find(|p| p.is_file())
        .ok_or_else(|| format!("ollama show {model}: no local blob"))?;
    let dir = data_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let link = dir.join(format!("{}.gguf", model.replace([':', '/', '\\'], "-")));
    let same = |a: &Path, b: &Path| match (a.metadata(), b.metadata()) {
        (Ok(x), Ok(y)) => x.len() == y.len(),
        _ => false,
    };
    if !same(&link, &blob) {
        let _ = std::fs::remove_file(&link);
        if std::fs::hard_link(&blob, &link).is_err() {
            return Ok(blob);
        }
    }
    Ok(link)
}

// ----------------------------------------------------------------------------------------------
// Provider state and LiteLLM config

#[derive(Debug, Clone, PartialEq)]
pub enum State {
    Ready(String),
    Missing(String),
}

/// One LiteLLM route (`name/*`), with the env vars it reads and the env it adds for the proxy.
#[derive(Debug)]
pub struct Route {
    pub name: String,
    pub provider: String,
    pub entry: Value,
    pub keys: Vec<String>,
    pub extra_env: Vec<(String, String)>,
}

fn param_value(v: &str) -> Value {
    match v.strip_prefix("env:") {
        Some(var) => Value::String(format!("os.environ/{var}")),
        None => Value::String(v.to_string()),
    }
}

fn provider_state(p: &Provider, env: &Env, m: &Manifest) -> State {
    if let Some(cli) = &p.cli {
        return match cli.models.first().and_then(|b| which_in(b, &extra_path(None))) {
            Some(_) => State::Ready("CLI".into()),
            None => State::Missing(format!("CLI {} absente", cli.models.first().map(String::as_str).unwrap_or("?"))),
        };
    }
    if let Some(k) = &p.key {
        if env.get(k).is_none() {
            return State::Missing(format!("clé {k} absente"));
        }
    }
    if let Some(r) = p.requires.iter().find(|r| env.get(r).is_none()) {
        return State::Missing(format!("{r} absent"));
    }
    if !p.credentials.is_empty() {
        let n = vertex_credentials(p, env).len();
        return if n > 0 {
            State::Ready(format!("{n} compte(s) de service"))
        } else {
            State::Missing("aucun compte de service lisible".into())
        };
    }
    if p.key.is_none() {
        if let Some(base) = &p.api_base {
            let url = format!("{}{}", base.trim_end_matches('/'), p.health.as_deref().unwrap_or(""));
            if healthy(&url) {
                return State::Ready("serveur local".into());
            }
            let declared = m.runtimes.iter().any(|r| r.id == p.id && r.here());
            return State::Missing(if declared { "serveur arrêté".into() } else { format!("pas de runtime {} sur {}", p.id, os_name()) });
        }
    }
    State::Ready("clé présente".into())
}

/// (project, credential source) per readable service account; inline JSON goes through an env var.
fn vertex_credentials(p: &Provider, env: &Env) -> Vec<(String, String, Option<String>)> {
    let mut out: Vec<(String, String, Option<String>)> = Vec::new();
    for c in &p.credentials {
        let (project, source, inline) = if let Some(var) = c.strip_prefix("env:") {
            let Some(sa) = env.get(var).and_then(|v| service_account(&v)).or_else(|| env.raw.get(var).and_then(|v| service_account(v))) else { continue };
            let project = sa["project_id"].as_str().or(sa["quota_project_id"].as_str()).unwrap_or_default().to_string();
            let holder = format!("AY_VERTEX_{}", project.to_ascii_uppercase().replace(|c: char| !c.is_ascii_alphanumeric(), "_"));
            (project, format!("os.environ/{holder}"), Some(holder + "=" + &sa.to_string()))
        } else if let Some(file) = c.strip_prefix("file:") {
            let path = expand_home(file);
            let Some(sa) = std::fs::read_to_string(&path).ok().and_then(|t| service_account(&t)) else { continue };
            (sa["project_id"].as_str().or(sa["quota_project_id"].as_str()).unwrap_or_default().to_string(), path.display().to_string(), None)
        } else {
            continue;
        };
        if !project.is_empty() && !out.iter().any(|(p, _, _)| *p == project) {
            out.push((project, source, inline));
        }
    }
    out
}

/// `${VAR}` in registry URLs (account ids); None when a variable is unset.
pub fn expand_dollar(s: &str, env: &Env) -> Option<String> {
    let mut out = String::new();
    let mut rest = s;
    while let Some(i) = rest.find("${") {
        let j = rest[i..].find('}')? + i;
        out.push_str(&rest[..i]);
        out.push_str(&env.get(&rest[i + 2..j])?);
        rest = &rest[j + 1..];
    }
    out.push_str(rest);
    Some(out)
}

pub fn routes(m: &Manifest, env: &Env) -> Vec<Route> {
    let mut out = Vec::new();
    for p in &m.providers {
        let Some(route) = &p.route else { continue };
        let ready = matches!(provider_state(p, env, m), State::Ready(_));
        let local_declared = p.key.is_none() && m.runtimes.iter().any(|r| r.id == p.id && r.here());
        if !ready && !local_declared {
            continue;
        }
        let mut params = serde_json::Map::new();
        params.insert("model".into(), json!(format!("{route}/*")));
        let mut keys: Vec<String> = p.requires.clone();
        if let Some(k) = &p.key {
            params.insert("api_key".into(), json!(format!("os.environ/{k}")));
            keys.push(k.clone());
        }
        if let Some(b) = &p.api_base {
            let Some(b) = expand_dollar(b, env) else { continue };
            params.insert("api_base".into(), json!(b));
        }
        for (k, v) in &p.params {
            params.insert(k.clone(), param_value(v));
            if let Some(var) = v.strip_prefix("env:") {
                keys.push(var.to_string());
            }
        }
        if p.credentials.is_empty() {
            out.push(Route {
                name: p.id.clone(),
                provider: p.id.clone(),
                entry: json!({ "model_name": format!("{}/*", p.id), "litellm_params": Value::Object(params) }),
                keys,
                extra_env: vec![],
            });
            continue;
        }
        for (project, source, inline) in vertex_credentials(p, env) {
            let mut lp = params.clone();
            lp.insert("vertex_project".into(), json!(project));
            lp.insert("vertex_credentials".into(), json!(source));
            let name = format!("{}-{project}", p.id);
            let extra_env = inline
                .and_then(|kv| kv.split_once('=').map(|(k, v)| (k.to_string(), v.to_string())))
                .into_iter()
                .collect();
            out.push(Route {
                name: name.clone(),
                provider: p.id.clone(),
                entry: json!({ "model_name": format!("{name}/*"), "litellm_params": Value::Object(lp) }),
                keys: keys.clone(),
                extra_env,
            });
        }
    }
    out
}

pub fn litellm_config(routes: &[Route], master_key: &str) -> Value {
    json!({
        "model_list": routes.iter().map(|r| r.entry.clone()).collect::<Vec<_>>(),
        "litellm_settings": { "check_provider_endpoint": true, "drop_params": true, "num_retries": 0, "request_timeout": 180 },
        "general_settings": { "master_key": format!("os.environ/{master_key}") },
    })
}

/// The proxy refuses to start without a master key: create one (random, 256 bits) the first time.
fn ensure_master_key(m: &Manifest, env: &mut Env) -> Result<String, String> {
    let name = &m.settings.master_key;
    if let Some(k) = env.get(name) {
        return Ok(k);
    }
    let key = format!("sk-{}{}", uuid::Uuid::new_v4().simple(), uuid::Uuid::new_v4().simple());
    store_secret(env, name, &key)?;
    env.set(name, &key);
    println!("{name} créée et rangée (valeur non affichée)");
    Ok(key)
}

fn write_config(ctx: &Ctx) -> Result<Vec<Route>, String> {
    let rs = routes(ctx.m, ctx.env);
    let path = ctx.config_path();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    // JSON is YAML: LiteLLM reads it with yaml.safe_load. Only `os.environ/` references, no values.
    let text = serde_json::to_string_pretty(&litellm_config(&rs, &ctx.m.settings.master_key)).map_err(|e| e.to_string())?;
    std::fs::write(&path, text + "\n").map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(rs)
}

// ----------------------------------------------------------------------------------------------
// Commands

fn select<'a, T>(items: &'a [T], ids: &[String], id: impl Fn(&T) -> &str) -> Result<Vec<&'a T>, String> {
    if let Some(bad) = ids.iter().find(|i| !items.iter().any(|t| id(t) == i.as_str())) {
        return Err(format!("unknown id {bad}"));
    }
    Ok(items.iter().filter(|t| ids.is_empty() || ids.iter().any(|i| i == id(t))).collect())
}

/// Missing providers worth listing: declared in the manifest, and for local servers only where
/// a runtime exists on this OS.
fn shown(p: &Provider, m: &Manifest) -> bool {
    p.declared && (p.health.is_none() || m.runtimes.iter().any(|r| r.id == p.id && r.here()))
}

fn cmd_ls(m: &Manifest, env: &Env, json_out: bool) -> i32 {
    let rts: Vec<Value> = m
        .runtimes
        .iter()
        .filter(|r| r.here())
        .map(|r| {
            let installed = r.bin.as_deref().map(|b| which_in(b, &extra_path(Some(r))).is_some());
            let up = r.health.as_deref().map(|h| Ctx { m, env, model: None }.expand(h).map(|u| healthy(&u)).unwrap_or(false));
            json!({ "id": r.id, "installed": installed, "running": up })
        })
        .collect();
    let mut hidden = 0;
    let provs: Vec<Value> = m
        .providers
        .iter()
        .filter_map(|p| match provider_state(p, env, m) {
            State::Ready(why) => Some(json!({ "id": p.id, "ready": true, "detail": why })),
            State::Missing(why) if shown(p, m) => Some(json!({ "id": p.id, "ready": false, "detail": why })),
            State::Missing(_) => {
                hidden += 1;
                None
            }
        })
        .collect();
    if json_out {
        println!("{}", json!({ "os": os_name(), "runtimes": rts, "providers": provs, "registry_without_access": hidden }));
        return 0;
    }
    println!("runtimes ({})", os_name());
    for r in &rts {
        let flag = |v: &Value, yes: &str, no: &str| match v.as_bool() {
            Some(true) => yes.to_string(),
            Some(false) => no.to_string(),
            None => "-".into(),
        };
        println!("  {:<12} {:<12} {}", r["id"].as_str().unwrap_or(""), flag(&r["installed"], "installé", "absent"), flag(&r["running"], "en marche", "arrêté"));
    }
    println!("fournisseurs");
    for p in &provs {
        let mark = if p["ready"].as_bool() == Some(true) { "prêt" } else { "manque" };
        println!("  {:<22} {:<7} {}", p["id"].as_str().unwrap_or(""), mark, p["detail"].as_str().unwrap_or(""));
    }
    println!("  + {hidden} fournisseurs du registre sans accès sur cet hôte");
    0
}

fn cmd_install(m: &Manifest, ids: &[String], force: bool) -> Result<i32, String> {
    let mut failed = 0;
    for r in select(&m.runtimes, ids, |r| &r.id)?.into_iter().filter(|r| r.here()) {
        if !force && r.bin.as_deref().is_some_and(|b| which_in(b, &extra_path(Some(r))).is_some()) {
            println!("{}: installé", r.id);
            continue;
        }
        let steps = r.install_steps();
        if steps.is_empty() {
            println!("{}: pas d'installation pour {}", r.id, os_name());
            continue;
        }
        println!("{}: installation", r.id);
        for step in steps {
            let code = run_status(step, Some(r));
            if code != 0 {
                eprintln!("{}: {} a échoué (code {code})", r.id, step.join(" "));
                failed += 1;
                break;
            }
        }
    }
    Ok(if failed > 0 { 1 } else { 0 })
}

fn pid_file(id: &str) -> PathBuf {
    data_dir().join(format!("{id}.pid"))
}

fn cmd_serve(m: &Manifest, env: &Env, id: &str) -> Result<i32, String> {
    let r = m.runtimes.iter().find(|r| r.id == id).ok_or_else(|| format!("unknown runtime {id}"))?;
    if r.serve.is_empty() {
        return Err(format!("{id}: nothing to serve"));
    }
    let ctx = Ctx { m, env, model: None };
    let mut cmd = command(&ctx.argv(&r.serve)?, Some(r))?;
    if id == "litellm" {
        if let Some(k) = env.get(&m.settings.master_key) {
            cmd.env(&m.settings.master_key, k);
        }
        for route in write_config(&ctx)? {
            for k in &route.keys {
                if let Some(v) = env.get(k) {
                    cmd.env(k, v);
                }
            }
            for (k, v) in &route.extra_env {
                cmd.env(k, v);
            }
        }
    }
    std::fs::create_dir_all(data_dir()).ok();
    let _ = std::fs::write(pid_file(id), std::process::id().to_string());
    let code = crate::status_of(&mut cmd);
    if r.oneshot && code == 0 && r.health.is_some() {
        let url = ctx.expand(r.health.as_deref().unwrap_or_default())?;
        if !wait_healthy(&url, 60) {
            return Err(format!("{id}: started but {url} does not answer"));
        }
    }
    Ok(code)
}

fn service_name(id: &str) -> String {
    format!("ay-ai-{id}")
}

fn service_args(id: &str, manifest: &Option<PathBuf>, env: &Env) -> Vec<String> {
    let mut a = vec!["ai".to_string(), "serve".into(), id.into()];
    if let Some(p) = manifest {
        a.extend(["--manifest".into(), p.display().to_string()]);
    }
    for f in &env.files {
        a.extend(["--env-file".into(), f.display().to_string()]);
    }
    a
}

fn quote(a: &str) -> String {
    if a.contains([' ', '"']) { format!("\"{}\"", a.replace('"', "\\\"")) } else { a.to_string() }
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

/// Task Scheduler definition: at boot, as the current user without a stored password (S4U),
/// below-normal priority, no time limit, restarted on failure.
pub fn task_xml(user: &str, exe: &str, args: &[String], workdir: &str, oneshot: bool) -> String {
    let restart = if oneshot { "" } else { "<RestartOnFailure><Interval>PT1M</Interval><Count>999</Count></RestartOnFailure>" };
    format!(
        r#"<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>ay {args_text}</Description></RegistrationInfo>
  <Triggers><BootTrigger><Enabled>true</Enabled></BootTrigger></Triggers>
  <Principals><Principal id="Author"><UserId>{user}</UserId><LogonType>S4U</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd></IdleSettings>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    {restart}
  </Settings>
  <Actions Context="Author"><Exec><Command>{exe}</Command><Arguments>{args_text}</Arguments><WorkingDirectory>{workdir}</WorkingDirectory></Exec></Actions>
</Task>
"#,
        user = xml_escape(user),
        exe = xml_escape(exe),
        workdir = xml_escape(workdir),
        args_text = xml_escape(&args.iter().map(|a| quote(a)).collect::<Vec<_>>().join(" ")),
    )
}

/// systemd unit: niced, low CPU weight, at most four cores, restarted on failure.
pub fn systemd_unit(id: &str, exe: &str, args: &[String], oneshot: bool) -> String {
    let exec = std::iter::once(exe.to_string()).chain(args.iter().map(|a| quote(a))).collect::<Vec<_>>().join(" ");
    let kind = if oneshot { "Type=oneshot\nRemainAfterExit=yes" } else { "Type=simple\nRestart=on-failure\nRestartSec=10" };
    let home = home().display().to_string();
    format!(
        "[Unit]\nDescription=ay ai {id}\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\n{kind}\nEnvironment=HOME={home}\nExecStart={exec}\nNice=19\nCPUWeight=20\nCPUQuota=400%\nIOSchedulingClass=idle\n\n[Install]\nWantedBy=default.target\n"
    )
}

fn systemd_scope() -> (Vec<String>, PathBuf) {
    let root = std::env::var("USER").map(|u| u == "root").unwrap_or(false) || home() == Path::new("/root");
    if root {
        (vec![], PathBuf::from("/etc/systemd/system"))
    } else {
        (vec!["--user".into()], expand_home("~/.config/systemd/user"))
    }
}

fn systemctl(args: &[&str]) -> i32 {
    let (scope, _) = systemd_scope();
    let argv: Vec<String> = std::iter::once("systemctl".to_string()).chain(scope).chain(args.iter().map(|s| s.to_string())).collect();
    run_status(&argv, None)
}

fn stop_service(id: &str) {
    let name = service_name(id);
    if cfg!(windows) {
        if let Ok(pid) = std::fs::read_to_string(pid_file(id)) {
            let _ = run_capture(&["taskkill".into(), "/F".into(), "/T".into(), "/PID".into(), pid.trim().into()], None);
        }
        let _ = run_capture(&["schtasks".into(), "/End".into(), "/TN".into(), name], None);
    } else {
        systemctl(&["stop", &name]);
    }
}

fn start_service(id: &str) -> i32 {
    let name = service_name(id);
    if cfg!(windows) {
        run_capture(&["schtasks".into(), "/Run".into(), "/TN".into(), name], None).map(|(c, _)| c).unwrap_or(1)
    } else {
        systemctl(&["start", &name])
    }
}

fn cmd_service(m: &Manifest, env: &Env, manifest: &Option<PathBuf>, ids: &[String], remove: bool) -> Result<i32, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?.display().to_string();
    let mut failed = 0;
    for r in select(&m.runtimes, ids, |r| &r.id)?.into_iter().filter(|r| r.here() && !r.serve.is_empty()) {
        let name = service_name(&r.id);
        if r.bin.as_deref().is_some_and(|b| which_in(b, &extra_path(Some(r))).is_none()) && !remove {
            println!("{}: non installé, service ignoré", r.id);
            continue;
        }
        let args = service_args(&r.id, manifest, env);
        let code = if cfg!(windows) {
            stop_service(&r.id);
            if remove {
                run_capture(&["schtasks".into(), "/Delete".into(), "/TN".into(), name.clone(), "/F".into()], None).map(|(c, _)| c).unwrap_or(1)
            } else {
                let user = format!("{}\\{}", std::env::var("USERDOMAIN").unwrap_or_default(), std::env::var("USERNAME").unwrap_or_default());
                let xml = task_xml(&user, &exe, &args, &home().display().to_string(), r.oneshot);
                let file = std::env::temp_dir().join(format!("{name}.xml"));
                let mut bytes = vec![0xFF, 0xFE];
                bytes.extend(xml.encode_utf16().flat_map(|u| u.to_le_bytes()));
                std::fs::write(&file, bytes).map_err(|e| e.to_string())?;
                let (c, _) = run_capture(&["schtasks".into(), "/Create".into(), "/TN".into(), name.clone(), "/XML".into(), file.display().to_string(), "/F".into()], None)?;
                let _ = std::fs::remove_file(&file);
                if c == 0 { start_service(&r.id) } else { c }
            }
        } else {
            let (_, dir) = systemd_scope();
            let unit = dir.join(format!("{name}.service"));
            if remove {
                systemctl(&["disable", "--now", &name]);
                let _ = std::fs::remove_file(&unit);
                systemctl(&["daemon-reload"])
            } else {
                std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
                std::fs::write(&unit, systemd_unit(&r.id, &exe, &args, r.oneshot)).map_err(|e| format!("{}: {e}", unit.display()))?;
                systemctl(&["daemon-reload"]);
                systemctl(&["enable", &name]);
                systemctl(&["restart", &name])
            }
        };
        println!("{}: {} ({})", r.id, if remove { "service retiré" } else { "service démarré" }, if code == 0 { "ok" } else { "échec" });
        if code != 0 {
            failed += 1;
        }
    }
    Ok(if failed > 0 { 1 } else { 0 })
}

fn cmd_pull(m: &Manifest, env: &Env, ids: &[String]) -> Result<i32, String> {
    let mut failed = 0;
    for r in select(&m.runtimes, ids, |r| &r.id)?.into_iter().filter(|r| r.here() && !r.pull.is_empty()) {
        let ctx = Ctx { m, env, model: None };
        if let Some(h) = &r.health {
            let url = ctx.expand(h)?;
            if !wait_healthy(&url, 90) {
                eprintln!("{}: {url} ne répond pas, modèles non chargés", r.id);
                failed += 1;
                continue;
            }
        }
        let models: Vec<Option<&str>> = if r.models.is_empty() { vec![None] } else { r.models.iter().map(|s| Some(s.as_str())).collect() };
        for model in models {
            let ctx = Ctx { m, env, model };
            let code = match ctx.argv(&r.pull) {
                Ok(argv) => run_status(&argv, Some(r)),
                Err(e) => {
                    eprintln!("{}: {e}", r.id);
                    1
                }
            };
            // Re-importing an existing file is an error for some CLIs: report, do not fail.
            println!("{}: {} {}", r.id, model.unwrap_or("modèles"), if code == 0 { "prêt" } else { "déjà présent ou échec (voir ci-dessus)" });
        }
    }
    Ok(if failed > 0 { 1 } else { 0 })
}

// ----------------------------------------------------------------------------------------------
// Check

struct Probe {
    provider: String,
    status: String,
    models: usize,
    model: String,
    ms: Option<u128>,
}

fn model_ids(v: &Value) -> Vec<String> {
    let arr = v.get("data").or_else(|| v.get("result")).or_else(|| v.get("models")).and_then(Value::as_array);
    arr.map(|a| a.iter().filter_map(|m| m.get("id").or_else(|| m.get("name")).and_then(Value::as_str).map(String::from)).collect())
        .unwrap_or_default()
}

/// Models to try, at most four: the live list (else the registry catalog), cheapest first by the
/// registry's input price, narrowed by the optional `probe` regex. Nothing is named in advance.
pub fn candidates(live: &[String], catalog: &[(String, f64)], probe: Option<&str>) -> Vec<String> {
    let mut pool: Vec<String> = if live.is_empty() { catalog.iter().map(|(id, _)| id.clone()).collect() } else { live.to_vec() };
    if let Some(re) = probe.and_then(|p| regex::Regex::new(p).ok()) {
        let narrowed: Vec<String> = pool.iter().filter(|m| re.is_match(m)).cloned().collect();
        if !narrowed.is_empty() {
            pool = narrowed;
        }
    }
    let cost = |id: &str| catalog.iter().find(|(c, _)| c == id || id.ends_with(&format!("/{c}"))).map(|(_, x)| *x).unwrap_or(f64::MAX);
    pool.sort_by(|a, b| cost(a).total_cmp(&cost(b)));
    pool.truncate(4);
    pool
}

fn chat(base: &str, key: Option<&str>, model: &str, prompt: &str) -> Result<(u128, String), String> {
    let t0 = Instant::now();
    let body = json!({ "model": model, "messages": [{ "role": "user", "content": prompt }], "max_tokens": 64 });
    let (status, v) = http_post(&format!("{base}/v1/chat/completions"), &body, key, 180)?;
    let ms = t0.elapsed().as_millis();
    if status == 200 && v["choices"].as_array().is_some_and(|c| !c.is_empty()) {
        Ok((ms, v["choices"][0]["message"]["content"].as_str().unwrap_or("").trim().chars().take(40).collect()))
    } else {
        let msg = v.get("error").map(|e| e.get("message").cloned().unwrap_or(e.clone())).unwrap_or(v);
        let text = match msg {
            Value::String(s) => s,
            other => other.to_string(),
        };
        Err(format!("HTTP {status}: {}", text.chars().take(160).collect::<String>()))
    }
}

fn cmd_check(m: &Manifest, env: &Env, json_out: bool) -> i32 {
    let base = format!("http://{}:{}", m.settings.host, m.settings.port);
    let ctx = Ctx { m, env, model: None };
    let health = format!("{base}/health/liveliness");
    let gateway_up = healthy(&health);
    let master = env.get(&m.settings.master_key);
    let listed: Vec<String> = if gateway_up { http_get(&format!("{base}/v1/models"), master.as_deref(), 120).map(|(_, v)| model_ids(&v)).unwrap_or_default() } else { vec![] };
    let rs = routes(m, env);
    let all_keys: Vec<String> = rs.iter().flat_map(|r| r.keys.clone()).chain(std::iter::once(m.settings.master_key.clone())).collect();
    let mut rows: Vec<Probe> = Vec::new();
    for p in &m.providers {
        if let State::Missing(why) = provider_state(p, env, m) {
            if shown(p, m) {
                rows.push(Probe { provider: p.id.clone(), status: format!("manque : {why}"), models: 0, model: String::new(), ms: None });
            }
            continue;
        }
        if let Some(cli) = &p.cli {
            let models: Vec<String> = run_capture(&cli.models, None).map(|(_, out)| cli_models(&out)).unwrap_or_default();
            let mut row = Probe { provider: p.id.clone(), status: "échec".into(), models: models.len(), model: String::new(), ms: None };
            for model in candidates(&models, &p.catalog, p.probe.as_deref()) {
                let t0 = Instant::now();
                let Ok(argv) = Ctx { m, env, model: Some(&model) }.argv(&cli.ask) else { break };
                if let Ok((0, out)) = run_capture(&argv, None) {
                    row = Probe { status: format!("ok ({})", out.trim().chars().take(20).collect::<String>()), model, ms: Some(t0.elapsed().as_millis()), ..row };
                    break;
                }
                row.model = model;
            }
            rows.push(row);
            continue;
        }
        for r in rs.iter().filter(|r| r.provider == p.id) {
            let prefix = format!("{}/", r.name);
            let mut models: Vec<String> = listed.iter().filter_map(|id| id.strip_prefix(&prefix)).filter(|id| *id != "*").map(String::from).collect();
            if models.is_empty() {
                if let Some(url) = &p.models_url {
                    if let Ok(url) = ctx.expand(url) {
                        let key = p.key.as_deref().and_then(|k| env.get(k));
                        models = http_get(&url, key.as_deref(), 30).map(|(_, v)| model_ids(&v)).unwrap_or_default();
                    }
                }
            }
            let mut row = Probe { provider: r.name.clone(), status: if gateway_up { "aucun modèle".into() } else { "LiteLLM arrêté".into() }, models: models.len(), model: String::new(), ms: None };
            if gateway_up {
                for model in candidates(&models, &p.catalog, p.probe.as_deref()) {
                    match chat(&base, master.as_deref(), &format!("{prefix}{model}"), &m.settings.prompt) {
                        Ok((ms, text)) => {
                            row = Probe { status: format!("ok ({text})"), model, ms: Some(ms), ..row };
                            break;
                        }
                        Err(e) => {
                            row.status = env.redact(&e, &all_keys);
                            row.model = model;
                        }
                    }
                }
            }
            rows.push(row);
        }
    }
    let ok = rows.iter().filter(|r| r.status.starts_with("ok")).count();
    if json_out {
        let arr: Vec<Value> = rows.iter().map(|r| json!({ "provider": r.provider, "status": one_line(&r.status), "models": r.models, "model": r.model, "latency_ms": r.ms })).collect();
        println!("{}", json!({ "gateway": base, "gateway_up": gateway_up, "providers": arr }));
    } else {
        println!("LiteLLM {base} : {}", if gateway_up { "en marche" } else { "arrêté" });
        println!("{:<22} {:>7} {:>9}  {:<40} statut", "fournisseur", "modèles", "latence", "modèle testé");
        for r in &rows {
            let ms = r.ms.map(|m| format!("{m} ms")).unwrap_or_else(|| "-".into());
            println!("{:<22} {:>7} {:>9}  {:<40} {}", r.provider, r.models, ms, r.model.chars().take(40).collect::<String>(), one_line(&r.status));
        }
        println!("{ok}/{} fournisseurs répondent", rows.len());
    }
    if gateway_up { 0 } else { 1 }
}

fn one_line(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(140).collect()
}

/// `id<TAB>name` lines of a CLI model listing (other lines are banners and progress).
pub fn cli_models(out: &str) -> Vec<String> {
    out.lines()
        .filter_map(|l| l.split_once('\t').map(|(id, _)| id.trim()))
        .filter(|id| !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || "-._:/".contains(c)))
        .map(String::from)
        .collect()
}

// ----------------------------------------------------------------------------------------------
// Auth: browser + clipboard, secret never printed

fn open_url(url: &str) -> i32 {
    let argv: Vec<String> = if cfg!(windows) {
        vec!["rundll32".into(), "url.dll,FileProtocolHandler".into(), url.into()]
    } else if cfg!(target_os = "macos") {
        vec!["open".into(), url.into()]
    } else {
        vec!["xdg-open".into(), url.into()]
    };
    run_capture(&argv, None).map(|(c, _)| c).unwrap_or(1)
}

fn clipboard_get() -> Option<String> {
    let (_, out) = run_capture(&["agent-desktop".into(), "clipboard-get".into()], None).ok()?;
    let v: Value = serde_json::from_str(out.trim()).ok()?;
    v["data"]["text"].as_str().map(|s| s.trim().to_string())
}

fn clipboard_clear() {
    let _ = run_capture(&["agent-desktop".into(), "clipboard-clear".into()], None);
}

fn key_valid(p: &Provider, key: &str) -> bool {
    match &p.validate {
        Some(url) => matches!(http_get(url, Some(key), 20), Ok((s, _)) if s == 200),
        None => true,
    }
}

/// Store a secret: env-kit when installed (vault `.env`, user environment, editors), else append
/// to the first dotenv file (created 0600).
fn store_secret(env: &Env, name: &str, value: &str) -> Result<(), String> {
    // env-kit from the checkout (bun on its TypeScript source, as `ay` runs it), else installed.
    let src = crate::repo_root().join("packages").join("env-kit").join("src").join("cli.ts");
    let envkit: Vec<String> = if src.is_file() && which_in("bun", &extra_path(None)).is_some() {
        vec!["bun".into(), src.display().to_string()]
    } else if which_in("env-kit", &extra_path(None)).is_some() {
        vec!["env-kit".into()]
    } else {
        vec![]
    };
    if envkit.is_empty() {
        let file = env.files.first().cloned().unwrap_or_else(|| crate::repo_root().join(".env"));
        let mut opts = std::fs::OpenOptions::new();
        opts.create(true).append(true);
        #[cfg(unix)]
        std::os::unix::fs::OpenOptionsExt::mode(&mut opts, 0o600);
        use std::io::Write;
        let mut f = opts.open(&file).map_err(|e| format!("{}: {e}", file.display()))?;
        return writeln!(f, "{name}={value}").map_err(|e| format!("{}: {e}", file.display()));
    }
    let mut cmd = if env.in_file(name) {
        command(&[envkit, vec!["set".into(), name.into(), value.into()]].concat(), None)?
    } else {
        command(&[envkit, vec!["merge".into(), "--source".into(), "ay-ai".into()]].concat(), None)?
    };
    let mut child = cmd.stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e| format!("env-kit: {e}"))?;
    if !env.in_file(name) {
        use std::io::Write;
        let mut stdin = child.stdin.take().ok_or("env-kit: no stdin")?;
        stdin.write_all(format!("{name}={value}\n").as_bytes()).map_err(|e| e.to_string())?;
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    if status.success() { Ok(()) } else { Err(format!("env-kit: exit {}", status.code().unwrap_or(1))) }
}

fn cmd_auth(m: &Manifest, env: &Env, ids: &[String], timeout: u64, force: bool) -> Result<i32, String> {
    let mut stored = 0;
    let mut failed = 0;
    for p in select(&m.providers, ids, |p| &p.id)?.into_iter().filter(|p| p.auth_url.is_some() && p.key.is_some()) {
        let name = p.key.as_deref().unwrap_or_default();
        if let Some(existing) = env.get(name) {
            if !force && key_valid(p, &existing) {
                println!("{}: clé {name} présente et valide", p.id);
                continue;
            }
        }
        let pattern = regex::Regex::new(p.key_pattern.as_deref().unwrap_or(r"^\S{16,}$")).map_err(|e| format!("{}: key_pattern: {e}", p.id))?;
        clipboard_clear();
        let url = p.auth_url.as_deref().unwrap_or_default();
        println!("{}: page ouverte dans le navigateur ({url}) ; crée la clé et copie-la, {timeout} s maximum", p.id);
        open_url(url);
        let t0 = Instant::now();
        let mut last = String::new();
        let mut found = None;
        while t0.elapsed() < Duration::from_secs(timeout) {
            if let Some(text) = clipboard_get() {
                if text != last && pattern.is_match(&text) {
                    if key_valid(p, &text) {
                        found = Some(text);
                        break;
                    }
                    println!("{}: valeur copiée refusée par le fournisseur", p.id);
                    last = text;
                }
            }
            std::thread::sleep(Duration::from_secs(1));
        }
        clipboard_clear();
        match found {
            Some(key) => {
                store_secret(env, name, &key)?;
                println!("{}: {name} rangée (valeur non affichée)", p.id);
                stored += 1;
            }
            None => {
                println!("{}: aucune clé reçue", p.id);
                failed += 1;
            }
        }
    }
    if stored > 0 {
        println!("config LiteLLM régénérée ; redémarrage du service");
        stop_service("litellm");
        start_service("litellm");
    }
    Ok(if failed > 0 { 1 } else { 0 })
}

/// Secret names the manifest reads from the environment, with their values on this host.
fn manifest_secrets(m: &Manifest, env: &Env, ids: &[String]) -> Vec<(String, String)> {
    let mut names: Vec<String> = Vec::new();
    for p in m.providers.iter().filter(|p| if ids.is_empty() { p.declared } else { ids.contains(&p.id) }) {
        names.extend(p.key.iter().cloned());
        names.extend(p.requires.iter().cloned());
        names.extend(p.params.values().filter_map(|v| v.strip_prefix("env:")).map(String::from));
        names.extend(p.credentials.iter().filter_map(|c| c.strip_prefix("env:")).map(String::from));
    }
    let mut out: Vec<(String, String)> = Vec::new();
    for n in names {
        if out.iter().any(|(k, _)| *k == n) {
            continue;
        }
        if let Some(v) = env.get(&n) {
            // Service-account JSON travels compact so the remote dotenv parser reads it back as-is.
            let v = service_account(&v).map(|sa| sa.to_string()).unwrap_or(v);
            out.push((n, v));
        }
    }
    out
}

pub fn dotenv_line(k: &str, v: &str) -> String {
    if v.chars().any(|c| c.is_whitespace() || "#\"'\\$`".contains(c)) && !v.contains('\'') {
        format!("{k}='{v}'")
    } else {
        format!("{k}={v}")
    }
}

/// Replace or append `KEY=` lines; other lines are kept byte for byte.
pub fn upsert_dotenv(text: &str, items: &[(String, String)]) -> String {
    let mut done = BTreeSet::new();
    let mut lines: Vec<String> = text
        .lines()
        .map(|l| {
            let key = l.trim_start().strip_prefix("export ").unwrap_or(l.trim_start()).split('=').next().unwrap_or("").trim();
            match items.iter().find(|(k, _)| k == key && l.contains('=')) {
                Some((k, v)) => {
                    done.insert(k.clone());
                    dotenv_line(k, v)
                }
                None => l.to_string(),
            }
        })
        .collect();
    lines.extend(items.iter().filter(|(k, _)| !done.contains(k)).map(|(k, v)| dotenv_line(k, v)));
    lines.join("\n") + "\n"
}

fn cmd_import(env: &Env) -> Result<i32, String> {
    use std::io::Read;
    let mut input = String::new();
    std::io::stdin().read_to_string(&mut input).map_err(|e| e.to_string())?;
    let file = env.files.first().cloned().unwrap_or_else(|| crate::repo_root().join(".env"));
    let (items, kept): (Vec<(String, String)>, Vec<(String, String)>) =
        dotenvy::from_read_iter(input.as_bytes()).flatten().partition(|(k, _)| !env.vars.get(k).is_some_and(|v| !v.is_empty()));
    let old = std::fs::read_to_string(&file).unwrap_or_default();
    let mut opts = std::fs::OpenOptions::new();
    opts.create(true).write(true).truncate(true);
    #[cfg(unix)]
    std::os::unix::fs::OpenOptionsExt::mode(&mut opts, 0o600);
    use std::io::Write;
    let mut f = opts.open(&file).map_err(|e| format!("{}: {e}", file.display()))?;
    f.write_all(upsert_dotenv(&old, &items).as_bytes()).map_err(|e| format!("{}: {e}", file.display()))?;
    let names = |v: &[(String, String)]| v.iter().map(|(k, _)| k.as_str()).collect::<Vec<_>>().join(", ");
    println!("{} : ajoutées [{}], déjà présentes [{}]", file.display(), names(&items), names(&kept));
    Ok(0)
}

fn cmd_push(m: &Manifest, env: &Env, host: &str, ids: &[String], remote_env_file: Option<&str>) -> Result<i32, String> {
    select(&m.providers, ids, |p| &p.id)?;
    let items = manifest_secrets(m, env, ids);
    let mut remote = String::from("PATH=$HOME/.local/bin:$PATH ay ai import");
    if let Some(f) = remote_env_file {
        remote.push_str(&format!(" --env-file '{}'", f.replace('\'', "")));
    }
    let mut child = command(&["ssh".into(), host.into(), remote], None)?
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("ssh: {e}"))?;
    {
        use std::io::Write;
        let mut stdin = child.stdin.take().ok_or("ssh: no stdin")?;
        for (k, v) in &items {
            writeln!(stdin, "{}", dotenv_line(k, v)).map_err(|e| e.to_string())?;
        }
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    Ok(status.code().unwrap_or(1))
}

fn cmd_up(m: &Manifest, env: &Env, manifest: &Option<PathBuf>, json_out: bool) -> Result<i32, String> {
    let mut rc = cmd_install(m, &[], false)?;
    let ids: Vec<String> = m.runtimes.iter().filter(|r| r.here() && r.id != "litellm").map(|r| r.id.clone()).collect();
    rc |= cmd_service(m, env, manifest, &ids, false)?;
    rc |= cmd_pull(m, env, &[])?;
    // Servers that depend on pulled models (llama.cpp on Ollama's GGUF) start after the pull.
    for r in m.runtimes.iter().filter(|r| r.here() && r.id != "litellm" && !r.oneshot) {
        if let Some(h) = &r.health {
            if !healthy(&Ctx { m, env, model: None }.expand(h)?) && which_in(r.bin.as_deref().unwrap_or(&r.id), &extra_path(Some(r))).is_some() {
                stop_service(&r.id);
                start_service(&r.id);
            }
        }
    }
    let rs = write_config(&Ctx { m, env, model: None })?;
    println!("LiteLLM : {} routes ({})", rs.len(), rs.iter().map(|r| r.name.as_str()).collect::<Vec<_>>().join(", "));
    rc |= cmd_service(m, env, manifest, &["litellm".into()], false)?;
    let health = format!("http://{}:{}/health/liveliness", m.settings.host, m.settings.port);
    if !wait_healthy(&health, 180) {
        eprintln!("LiteLLM ne répond pas sur {health}");
        return Ok(1);
    }
    Ok(rc | cmd_check(m, env, json_out))
}

/// argv of `ai-os fabric <args>`: bun on the checkout's TypeScript source, else the installed binary.
pub fn fabric_argv(src: Option<&Path>, bun: bool, args: &[String]) -> Vec<String> {
    let mut v: Vec<String> = match src {
        Some(p) if bun => vec!["bun".into(), p.display().to_string()],
        _ => vec!["ai-os".into()],
    };
    v.push("fabric".into());
    v.extend(args.iter().cloned());
    v
}

fn cmd_fabric(args: &[String]) -> i32 {
    let src = crate::repo_root().join("packages").join("ai-os").join("src").join("cli.ts");
    let bun = which_in("bun", &extra_path(None)).is_some();
    run_status(&fabric_argv(src.is_file().then_some(src.as_path()), bun, args), None)
}

pub fn run(a: AiArgs) -> i32 {
    if let Some(AiCmd::Fabric { args }) = &a.cmd {
        return cmd_fabric(args);
    }
    let (mut m, manifest) = match load_manifest(&a.manifest) {
        Ok(x) => x,
        Err(e) => {
            eprintln!("ay ai: {e}");
            return 2;
        }
    };
    let mut env = Env::load(&a.env_files);
    let cmd = a.cmd.unwrap_or(AiCmd::Ls);
    if !matches!(cmd, AiCmd::Import) {
        let declared = std::mem::take(&mut m.providers);
        m.providers = merge_providers(registry_providers(&load_registry(&m), &m, &env), &declared);
    }
    if matches!(cmd, AiCmd::Config | AiCmd::Serve { .. } | AiCmd::Service { .. } | AiCmd::Up) {
        if let Err(e) = ensure_master_key(&m, &mut env) {
            eprintln!("ay ai: {e}");
            return 1;
        }
    }
    let env = env;
    let res = match cmd {
        AiCmd::Ls => Ok(cmd_ls(&m, &env, a.json)),
        AiCmd::Install { ids, force } => cmd_install(&m, &ids, force),
        AiCmd::Config => write_config(&Ctx { m: &m, env: &env, model: None }).map(|rs| {
            println!("{} ({} routes : {})", expand_home(&m.settings.config).display(), rs.len(), rs.iter().map(|r| r.name.as_str()).collect::<Vec<_>>().join(", "));
            0
        }),
        AiCmd::Serve { id } => cmd_serve(&m, &env, &id),
        AiCmd::Service { ids, remove } => cmd_service(&m, &env, &manifest, &ids, remove),
        AiCmd::Restart { id } => {
            stop_service(&id);
            Ok(start_service(&id))
        }
        AiCmd::Pull { ids } => cmd_pull(&m, &env, &ids),
        AiCmd::Check => Ok(cmd_check(&m, &env, a.json)),
        AiCmd::Auth { ids, timeout, force } => cmd_auth(&m, &env, &ids, timeout, force),
        AiCmd::Up => cmd_up(&m, &env, &manifest, a.json),
        AiCmd::Push { host, ids, remote_env_file } => cmd_push(&m, &env, &host, &ids, remote_env_file.as_deref()),
        AiCmd::Import => cmd_import(&env),
        AiCmd::Fabric { .. } => unreachable!("handled before the manifest is loaded"),
    };
    match res {
        Ok(code) => code,
        Err(e) => {
            eprintln!("ay ai: {e}");
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn env_with(vars: &[(&str, &str)]) -> Env {
        Env { files: vec![], vars: vars.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect(), raw: BTreeMap::new() }
    }

    #[test]
    fn fabric_runs_checkout_with_bun_else_installed() {
        let args = vec!["up".to_string(), "--only".into(), "fr1".into()];
        let src = Path::new("/r/packages/ai-os/src/cli.ts");
        assert_eq!(fabric_argv(Some(src), true, &args), ["bun", "/r/packages/ai-os/src/cli.ts", "fabric", "up", "--only", "fr1"]);
        assert_eq!(fabric_argv(Some(src), false, &args)[..2], ["ai-os", "fabric"]);
        assert_eq!(fabric_argv(None, true, &[]), ["ai-os", "fabric"]);
    }

    #[test]
    fn embedded_manifest_parses() {
        let m = parse_manifest(EMBEDDED).expect("ai.toml");
        assert!(m.runtimes.iter().any(|r| r.id == "litellm"));
        assert!(m.settings.registry.is_some());
    }

    #[test]
    fn keyed_routes_reference_env_never_values() {
        let m = parse_manifest(
            r#"
[settings]
host = "127.0.0.1"
port = 4000
config = "~/x.yaml"
prompt = "hi"
master_key = "AY_TEST_MASTER"
[[provider]]
id = "openrouter"
route = "openrouter"
key = "AY_TEST_ROUTER_KEY"
[[provider]]
id = "absent"
route = "openai"
key = "AY_TEST_ABSENT_KEY"
"#,
        )
        .unwrap();
        let env = env_with(&[("AY_TEST_ROUTER_KEY", "sk-or-v1-secretvalue")]);
        let rs = routes(&m, &env);
        assert_eq!(rs.len(), 1);
        let text = litellm_config(&rs, "AY_TEST_MASTER").to_string();
        assert!(text.contains("os.environ/AY_TEST_ROUTER_KEY"));
        assert!(text.contains("\"openrouter/*\""));
        assert!(!text.contains("secretvalue"));
    }

    #[test]
    fn service_account_unwraps_quoted_json() {
        let sa = r#"{"type":"service_account","project_id":"p1"}"#;
        assert_eq!(service_account(sa).unwrap()["project_id"], "p1");
        let quoted = serde_json::to_string(sa).unwrap();
        assert_eq!(service_account(&quoted).unwrap()["project_id"], "p1");
        let escaped = sa.replace('"', "\\\"");
        assert_eq!(service_account(&escaped).unwrap()["project_id"], "p1");
        assert!(service_account("not json").is_none());
        let pem = "{\"project_id\":\"p2\",\"private_key\":\"a\nb\"}";
        assert_eq!(service_account(pem).unwrap()["private_key"], "a\nb");
    }

    #[test]
    fn redact_hides_secrets() {
        let env = env_with(&[("K", "abcdefgh12345")]);
        let out = env.redact("bad key abcdefgh12345 and sk-proj-AAAAAAAAAA", &["K".into()]);
        assert!(!out.contains("abcdefgh12345") && !out.contains("sk-proj-AAAA"));
    }

    #[test]
    fn probe_prefers_cheap_catalog_models() {
        let ms: Vec<String> = ["tts-1", "big", "small", "x"].iter().map(|s| s.to_string()).collect();
        let catalog = vec![("small".to_string(), 0.1), ("big".to_string(), 5.0)];
        assert_eq!(candidates(&ms, &catalog, None), vec!["small".to_string(), "big".into(), "tts-1".into(), "x".into()]);
        assert_eq!(candidates(&ms, &catalog, Some("^x$")), vec!["x".to_string()]);
        assert_eq!(candidates(&[], &catalog, None), vec!["small".to_string(), "big".into()]);
    }

    #[test]
    fn registry_maps_onto_litellm() {
        let m = parse_manifest(EMBEDDED).unwrap();
        let reg = json!({
            "cloudflare-workers-ai": { "name": "CF", "env": ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_KEY"], "npm": "@ai-sdk/openai-compatible",
                "api": "https://x/${CLOUDFLARE_ACCOUNT_ID}/ai/v1", "models": { "m1": { "cost": { "input": 0.2 } } } },
            "google": { "env": ["GOOGLE_API_KEY", "GEMINI_API_KEY"], "npm": "@ai-sdk/google", "models": {} }
        });
        let env = env_with(&[("CLOUDFLARE_ACCOUNT_ID", "acc"), ("CLOUDFLARE_API_TOKEN", "t0123456789"), ("GEMINI_API_KEY", "g0123456789")]);
        let ps = merge_providers(registry_providers(&reg, &m, &env), &[]);
        let cf = ps.iter().find(|p| p.id == "cloudflare-workers-ai").unwrap();
        assert_eq!(cf.key.as_deref(), Some("CLOUDFLARE_API_TOKEN"), "env alias from the manifest");
        assert_eq!(cf.requires, vec!["CLOUDFLARE_ACCOUNT_ID".to_string()]);
        assert_eq!(expand_dollar(cf.api_base.as_deref().unwrap(), &env).unwrap(), "https://x/acc/ai/v1");
        let g = ps.iter().find(|p| p.id == "google").unwrap();
        assert_eq!((g.key.as_deref(), g.route.as_deref()), (Some("GEMINI_API_KEY"), Some("gemini")));
    }

    #[test]
    fn service_definitions() {
        let args = vec!["ai".to_string(), "serve".into(), "ollama".into()];
        let xml = task_xml("PC\\me", "C:/bin/ay.exe", &args, "C:/Users/me", false);
        assert!(xml.contains("<LogonType>S4U</LogonType>") && xml.contains("PT0S") && xml.contains("ai serve ollama"));
        let unit = systemd_unit("vllm", "/usr/bin/ay", &args, false);
        assert!(unit.contains("ExecStart=/usr/bin/ay ai serve ollama") && unit.contains("Nice=19"));
    }

    #[test]
    fn templates_expand() {
        let m = parse_manifest(EMBEDDED).unwrap();
        let env = env_with(&[("AY_TEST_X", "v")]);
        let ctx = Ctx { m: &m, env: &env, model: Some("a:b") };
        assert_eq!(ctx.expand("http://{host}:{port}/{model}").unwrap(), "http://127.0.0.1:4000/a:b");
        assert_eq!(ctx.expand("{env:AY_TEST_X}").unwrap(), "v");
        assert!(ctx.expand("{nope}").is_err());
    }

    #[test]
    fn dotenv_upsert_round_trips() {
        let json = r#"{"a":"x\ny"}"#;
        let items = vec![("A".to_string(), "new".to_string()), ("J".to_string(), json.to_string())];
        let out = upsert_dotenv("# c\nA=old\nB=keep\n", &items);
        assert_eq!(out, format!("# c\nA=new\nB=keep\nJ='{json}'\n"));
        let back: Vec<(String, String)> = dotenvy::from_read_iter(out.as_bytes()).flatten().collect();
        assert!(back.contains(&("J".to_string(), json.to_string())));
        assert_eq!(upsert_dotenv(&out, &items), out, "idempotent");
    }
}
