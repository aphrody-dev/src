//! The gclient dependency tree: `.gclient` solutions, recursively parsed DEPS files, variable
//! scoping and condition evaluation, following `gclient.py` (`GClient`, `Dependency`,
//! `GitDependency`, `CipdDependency`, `GcsDependency`).

use crate::condition;
use crate::deps::{self, merge_conditions, update_condition};
use crate::eval;
use crate::value::{Dict, Value};
use crate::{Error, Result};
use std::collections::VecDeque;
use std::path::{Path, PathBuf};

pub const CIPD_SERVICE_URL: &str = "https://chrome-infra-packages.appspot.com";

/// What kind of checkout a node is.
#[derive(Debug, Clone, PartialEq)]
pub enum DepKind {
    /// The `.gclient` root.
    Root,
    Git,
    Cipd {
        package: String,
        version: String,
    },
    Gcs {
        bucket: String,
        object_name: String,
        sha256sum: String,
        size_bytes: i64,
        output_file: Option<String>,
    },
}

/// A hook from a DEPS file (`Hook.from_dict`).
#[derive(Debug, Clone, PartialEq)]
pub struct Hook {
    pub name: Option<String>,
    pub action: Vec<String>,
    pub pattern: Option<String>,
    pub cwd: PathBuf,
    pub condition: Option<String>,
    /// The DEPS node the hook comes from.
    pub owner: usize,
}

#[derive(Debug, Clone)]
pub struct Node {
    /// Path relative to the gclient root (`src/third_party/angle`), or `path:package` /
    /// `path:object` for CIPD and GCS entries.
    pub name: String,
    /// The key of the entry in its DEPS file, made relative to the root.
    pub deps_key: String,
    /// `url@revision`, `None` when a DEPS entry or custom_deps removes it.
    pub url: Option<String>,
    pub kind: DepKind,
    pub condition: Option<String>,
    pub should_process: bool,
    pub should_recurse: bool,
    pub deps_file: String,
    pub relative: bool,
    pub parent: Option<usize>,
    pub children: Vec<usize>,
    pub hooks: Vec<Hook>,
    pub pre_deps_hooks: Vec<Hook>,
    /// The DEPS file this node's children came from, once parsed.
    pub parsed_from: Option<PathBuf>,
    pub git_dependencies: Option<String>,
    vars: Dict,
    custom_vars: Dict,
    custom_deps: Dict,
    custom_hooks: Vec<Value>,
    local_target_os: Option<Vec<String>>,
    recursedeps: Vec<(String, String)>,
}

impl Node {
    fn new(name: String, url: Option<String>, kind: DepKind, parent: Option<usize>) -> Self {
        let url = url.map(|u| u.replace("/@", "@"));
        Node {
            deps_key: name.clone(),
            name,
            url,
            kind,
            condition: None,
            should_process: true,
            should_recurse: false,
            deps_file: "DEPS".into(),
            relative: false,
            parent,
            children: Vec::new(),
            hooks: Vec::new(),
            pre_deps_hooks: Vec::new(),
            parsed_from: None,
            git_dependencies: None,
            vars: Dict::new(),
            custom_vars: Dict::new(),
            custom_deps: Dict::new(),
            custom_hooks: Vec::new(),
            local_target_os: None,
            recursedeps: Vec::new(),
        }
    }
}

/// `gclient_utils.SplitUrlRevision`: the revision follows the last `@` of the path part, so
/// `user@host` credentials and scp-like `git@host:path` URLs keep their `@`.
pub fn split_url_revision(url: &str) -> (&str, Option<&str>) {
    let path_start = match url.find("://") {
        Some(i) => url[i + 3..]
            .find('/')
            .map(|j| i + 3 + j)
            .unwrap_or(url.len()),
        None => url.find(':').unwrap_or(0),
    };
    match url.rfind('@') {
        Some(at) if at > path_start => (&url[..at], Some(&url[at + 1..])),
        _ => (url, None),
    }
}

/// Options that `gclient` takes from the command line.
#[derive(Debug, Clone, Default)]
pub struct Options {
    /// `--deps`: comma-separated OS list overriding the host OS (`all` for every OS).
    pub deps_os: Option<String>,
    /// `--ignore-dep-type`.
    pub ignore_dep_types: Vec<String>,
    /// Host OS as gclient names it (`win`, `mac`, `linux`); detected when `None`.
    pub host_os: Option<String>,
    /// Host CPU as gclient names it (`x64`, `arm64`, ...); detected when `None`.
    pub host_cpu: Option<String>,
    /// Treat every condition as true (`--process-all-deps`, used by flatten).
    pub process_all_deps: bool,
    /// Load `.gclient` only, without parsing DEPS files (built-in variables, solutions).
    pub skip_deps: bool,
}

/// A loaded gclient checkout.
#[derive(Debug, Clone)]
pub struct Client {
    pub root_dir: PathBuf,
    pub nodes: Vec<Node>,
    pub cache_dir: Option<PathBuf>,
    pub cache_mode: Option<String>,
    enforced_os: Vec<String>,
    enforced_cpu: Vec<String>,
    host_os: String,
    host_cpu: String,
    options: Options,
}

pub fn detect_host_os() -> &'static str {
    if cfg!(windows) {
        "win"
    } else if cfg!(target_os = "macos") {
        "mac"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        std::env::consts::OS
    }
}

pub fn detect_host_cpu() -> &'static str {
    match std::env::consts::ARCH {
        "x86_64" => "x64",
        "x86" => "x86",
        "aarch64" => "arm64",
        "arm" => "arm",
        "mips64" => "mips64",
        "mips" => "mips",
        "powerpc64" => "ppc64",
        "s390x" => "s390x",
        "riscv64" => "riscv64",
        "loongarch64" => "loong64",
        other => other,
    }
}

/// `GClient.DEPS_OS_CHOICES` for the host.
fn host_deps_os(host_os: &str) -> &'static str {
    match host_os {
        "win" => "win",
        "mac" => "mac",
        "android" => "android",
        "ios" => "ios",
        "fuchsia" => "fuchsia",
        "chromeos" => "chromeos",
        "zos" => "zos",
        _ => "unix",
    }
}

const ALL_DEPS_OS: &[&str] = &[
    "unix", "win", "mac", "android", "ios", "fuchsia", "chromeos", "zos",
];

/// Find the directory holding `.gclient` at or above `start` (`$GCLIENT_FILE` overrides the
/// file name, as upstream).
pub fn find_root(start: &Path) -> Option<PathBuf> {
    let file = std::env::var("GCLIENT_FILE").unwrap_or_else(|_| ".gclient".into());
    start
        .ancestors()
        .find(|d| d.join(&file).is_file())
        .map(Path::to_path_buf)
}

fn str_list(v: Option<&Value>) -> Vec<String> {
    v.and_then(Value::as_seq)
        .unwrap_or_default()
        .iter()
        .filter_map(|x| x.as_str().map(str::to_string))
        .collect()
}

fn dedup(mut v: Vec<String>) -> Vec<String> {
    v.sort();
    v.dedup();
    v
}

/// `merge_vars`: values replace earlier ones, a `Str()` constant keeps its kind.
fn merge_vars(result: &mut Dict, new_vars: &Dict) {
    for (k, v) in new_vars.iter() {
        let merged = match (result.get(k), v) {
            (Some(Value::ConstStr(_)), Value::Str(s)) => Value::ConstStr(s.clone()),
            _ => v.clone(),
        };
        result.insert(k.clone(), merged);
    }
}

/// `os.path.normpath(os.path.join(prefix, d))` with `/` separators.
fn norm_join(prefix: &str, d: &str) -> String {
    let joined = if prefix.is_empty() {
        d.to_string()
    } else {
        format!("{prefix}/{d}")
    };
    let mut parts: Vec<&str> = Vec::new();
    for p in joined.split(['/', '\\']) {
        match p {
            "" | "." => {}
            ".." if parts.last().is_some_and(|l| *l != "..") => {
                parts.pop();
            }
            p => parts.push(p),
        }
    }
    if parts.is_empty() {
        ".".into()
    } else {
        parts.join("/")
    }
}

fn dirname(p: &str) -> &str {
    p.rfind('/').map(|i| &p[..i]).unwrap_or("")
}

impl Client {
    /// Load `<root>/.gclient` and every DEPS file it reaches.
    pub fn load(root_dir: &Path, options: Options) -> Result<Client> {
        let file = std::env::var("GCLIENT_FILE").unwrap_or_else(|_| ".gclient".into());
        let path = root_dir.join(&file);
        let content = std::fs::read_to_string(&path)
            .map_err(|e| Error::new(format!("{}: {e}", path.display())))?;
        Self::from_config(root_dir, &content, options)
    }

    /// Build the tree from `.gclient` contents and parse the DEPS files under `root_dir`.
    pub fn from_config(root_dir: &Path, gclient: &str, options: Options) -> Result<Client> {
        let host_os = options
            .host_os
            .clone()
            .unwrap_or_else(|| detect_host_os().into());
        let host_cpu = options
            .host_cpu
            .clone()
            .unwrap_or_else(|| detect_host_cpu().into());
        let mut enforced_os: Vec<String> = match &options.deps_os {
            Some(list) => list.split(',').map(str::to_string).collect(),
            None => vec![host_deps_os(&host_os).to_string()],
        };
        if enforced_os.iter().any(|o| o == "all") {
            enforced_os = ALL_DEPS_OS.iter().map(|s| s.to_string()).collect();
        }
        let config = eval::parse_local_config(gclient, ".gclient")?;

        let target_os = str_list(config.get("target_os"));
        let target_os_only = config.get("target_os_only").is_some_and(Value::truthy);
        if target_os_only && target_os.is_empty() {
            return Err(Error::new(
                "Can't use target_os_only if target_os is not specified",
            ));
        }
        enforced_os = if target_os_only {
            dedup(target_os)
        } else {
            dedup([enforced_os, target_os].concat())
        };
        let target_cpu = str_list(config.get("target_cpu"));
        let target_cpu_only = config.get("target_cpu_only").is_some_and(Value::truthy);
        if target_cpu_only && target_cpu.is_empty() {
            return Err(Error::new(
                "Can't use target_cpu_only if target_cpu is not specified",
            ));
        }
        let enforced_cpu = if target_cpu_only {
            dedup(target_cpu)
        } else {
            dedup([vec![host_cpu.clone()], target_cpu].concat())
        };

        let cache_dir = match config.get("cache_dir") {
            Some(Value::Str(s)) if !s.is_empty() => Some(root_dir.join(s)),
            Some(_) => None,
            None => std::env::var_os("GIT_CACHE_PATH").map(PathBuf::from),
        };
        let cache_mode = config.get_str("cache_mode").map(str::to_string);

        let mut client = Client {
            root_dir: root_dir.to_path_buf(),
            nodes: vec![Node::new(String::new(), None, DepKind::Root, None)],
            cache_dir,
            cache_mode,
            enforced_os,
            enforced_cpu,
            host_os,
            host_cpu,
            options,
        };
        client.nodes[0].should_recurse = true;

        let mut queue = VecDeque::new();
        for s in config
            .get("solutions")
            .and_then(Value::as_seq)
            .unwrap_or_default()
        {
            let s = s
                .as_dict()
                .ok_or_else(|| Error::new("Invalid .gclient file: solutions must be dicts"))?;
            let (Some(name), Some(url)) = (s.get_str("name"), s.get("url")) else {
                return Err(Error::new(format!(
                    "Invalid .gclient file. Solution is incomplete: {}",
                    Value::Dict(s.clone())
                )));
            };
            let mut n = Node::new(
                name.to_string(),
                url.as_str().map(str::to_string),
                DepKind::Git,
                Some(0),
            );
            n.should_recurse = true;
            n.deps_file = s.get_str("deps_file").unwrap_or("DEPS").to_string();
            n.custom_vars = s
                .get("custom_vars")
                .and_then(Value::as_dict)
                .cloned()
                .unwrap_or_default();
            n.custom_deps = s
                .get("custom_deps")
                .and_then(Value::as_dict)
                .cloned()
                .unwrap_or_default();
            n.custom_hooks = s
                .get("custom_hooks")
                .and_then(Value::as_seq)
                .map(<[Value]>::to_vec)
                .unwrap_or_default();
            if let Some(idx) = client.add_child(0, n)? {
                queue.push_back(idx);
            }
        }

        if client.options.skip_deps {
            queue.clear();
        }
        while let Some(idx) = queue.pop_front() {
            if !client.nodes[idx].should_recurse {
                continue;
            }
            for child in client.parse_deps_file(idx)? {
                if client.nodes[child].should_process {
                    queue.push_back(child);
                }
            }
        }
        Ok(client)
    }

    pub fn host_os(&self) -> &str {
        &self.host_os
    }

    fn target_os(&self, idx: usize) -> Vec<String> {
        let n = &self.nodes[idx];
        match n.parent {
            None => self.enforced_os.clone(),
            Some(p) => {
                let mut os = self.target_os(p);
                if let Some(local) = &n.local_target_os {
                    os.extend(local.iter().cloned());
                }
                dedup(os)
            }
        }
    }

    /// `Dependency.get_builtin_vars`.
    pub fn builtin_vars(&self, idx: usize) -> Dict {
        let os = self.target_os(idx);
        let cpu = &self.enforced_cpu;
        let has_os = |names: &[&str]| os.iter().any(|o| names.contains(&o.as_str()));
        let has_cpu = |c: &str| cpu.iter().any(|x| x == c);
        let mut d = Dict::new();
        for (k, v) in [
            ("checkout_android", has_os(&["android"])),
            ("checkout_chromeos", has_os(&["chromeos"])),
            ("checkout_fuchsia", has_os(&["fuchsia"])),
            ("checkout_ios", has_os(&["ios"])),
            ("checkout_linux", has_os(&["linux", "unix"])),
            ("checkout_mac", has_os(&["mac", "osx"])),
            ("checkout_win", has_os(&["win", "windows"])),
        ] {
            d.insert(k, Value::Bool(v));
        }
        d.insert("host_os", Value::Str(self.host_os.clone()));
        for c in [
            "arm", "arm64", "x86", "mips", "mips64", "ppc", "riscv64", "s390", "x64", "loong64",
        ] {
            d.insert(format!("checkout_{c}"), Value::Bool(has_cpu(c)));
        }
        d.insert("host_cpu", Value::Str(self.host_cpu.clone()));
        d
    }

    /// `Dependency.get_vars`: DEPS vars, then parents, then built-ins, then custom_vars.
    pub fn vars(&self, idx: usize) -> Dict {
        let n = &self.nodes[idx];
        let mut result = n.vars.clone();
        if let Some(p) = n.parent {
            merge_vars(&mut result, &self.vars(p));
        }
        result.update(&self.builtin_vars(idx));
        merge_vars(&mut result, &n.custom_vars);
        result
    }

    fn custom_dep(&self, idx: usize, name: &str) -> Option<Value> {
        let mut chain = Vec::new();
        let mut cur = Some(idx);
        while let Some(i) = cur {
            chain.push(i);
            cur = self.nodes[i].parent;
        }
        chain
            .iter()
            .rev()
            .filter_map(|i| self.nodes[*i].custom_deps.get(name).cloned())
            .last()
    }

    /// `_OverrideUrl`: custom_deps, then relative (`/path`) URLs resolved against the parent.
    fn override_url(&self, parent: usize, node: &mut Node) -> Result<()> {
        // custom_deps apply through the parent chain of the new node.
        if let Some(v) = self.custom_dep(parent, &node.name) {
            node.url = v.as_str().map(|s| s.replace("/@", "@"));
            return Ok(());
        }
        let Some(url) = node.url.clone() else {
            return Ok(());
        };
        let (path, rest) = match url.split_once('@') {
            Some((p, r)) => (p.to_string(), format!("@{r}")),
            None => (url.clone(), String::new()),
        };
        if self.root_dir.join(&path).is_dir() || Path::new(&path).is_dir() {
            return Ok(());
        }
        let has_scheme = url.split_once("://").is_some_and(|(s, _)| {
            !s.is_empty()
                && s.chars()
                    .all(|c| c.is_ascii_alphanumeric() || "+-.".contains(c))
        });
        let scp_like = url.split_once('@').is_some_and(|(u, h)| {
            !u.is_empty() && u.chars().all(|c| c.is_alphanumeric() || c == '_') && h.contains(':')
        });
        if has_scheme || scp_like {
            return Ok(());
        }
        if !path.starts_with('/') {
            return Err(Error::new(format!(
                "relative DEPS entry '{url}' must begin with a slash"
            )));
        }
        let parent_url = self.nodes[parent].url.clone().unwrap_or_default();
        let base = match parent_url.rfind('/') {
            Some(i) => &parent_url[..i],
            None => "",
        };
        node.url = Some(format!("{base}{path}{rest}"));
        Ok(())
    }

    /// `verify_validity` + `add_dependency`. Returns the new index, or `None` for a duplicate.
    fn add_child(&mut self, parent: usize, node: Node) -> Result<Option<usize>> {
        if self.nodes[parent]
            .children
            .iter()
            .any(|c| self.nodes[*c].name == node.name)
        {
            return Err(Error::new(format!(
                "The same name \"{}\" appears multiple times in the deps section",
                node.name
            )));
        }
        let same_name = || self.nodes.iter().skip(1).filter(|o| o.name == node.name);
        if !node.should_process {
            if same_name().next().is_some() {
                return Ok(None);
            }
        } else if let Some(sib) = same_name().find(|o| o.should_process) {
            if sib.url != node.url && sib.url.is_some() == node.url.is_some() {
                return Err(Error::new(format!(
                    "Dependency {} specified more than once:\n  {:?}\nvs\n  {:?}",
                    node.name, sib.url, node.url
                )));
            }
            return Ok(None);
        }
        let idx = self.nodes.len();
        self.nodes.push(node);
        self.nodes[parent].children.push(idx);
        Ok(Some(idx))
    }

    /// `Dependency.ParseDepsFile`. Returns the indices of the children added.
    fn parse_deps_file(&mut self, idx: usize) -> Result<Vec<usize>> {
        let (name, deps_file) = (
            self.nodes[idx].name.clone(),
            self.nodes[idx].deps_file.clone(),
        );
        let mut candidates = vec![deps_file.clone()];
        if deps_file != "DEPS" {
            candidates.push("DEPS".into());
        }
        let Some(path) = candidates
            .iter()
            .map(|f| self.root_dir.join(&name).join(f))
            .find(|p| p.is_file())
        else {
            return Ok(Vec::new());
        };
        let content = std::fs::read_to_string(&path)
            .map_err(|e| Error::new(format!("{}: {e}", path.display())))?;
        let filename = path.display().to_string();
        let scope = if content.is_empty() {
            Dict::new()
        } else {
            deps::parse(
                &content,
                &filename,
                Some(&self.vars(idx)),
                Some(&self.builtin_vars(idx)),
            )?
        };
        self.nodes[idx].parsed_from = Some(path);
        self.nodes[idx].git_dependencies = scope.get_str("git_dependencies").map(str::to_string);

        // DEPS vars, with the values that the parents define for the same names.
        let mut own_vars = scope
            .get("vars")
            .and_then(Value::as_dict)
            .cloned()
            .unwrap_or_default();
        if let Some(p) = self.nodes[idx].parent {
            let pv = self.vars(p);
            let keys: Vec<String> = own_vars.keys().cloned().collect();
            for k in keys {
                if let Some(v) = pv.get(&k) {
                    own_vars.insert(k, v.clone());
                }
            }
        }
        self.nodes[idx].vars = own_vars;

        let use_relative_paths = scope.get("use_relative_paths").is_some_and(Value::truthy);
        let rel_prefix: Option<String> = if use_relative_paths {
            Some(name.clone())
        } else if self.nodes[idx].relative {
            Some(dirname(&name).to_string())
        } else {
            None
        };

        let mut recursedeps = Vec::new();
        for ent in scope
            .get("recursedeps")
            .and_then(Value::as_seq)
            .unwrap_or_default()
        {
            match ent {
                Value::Str(s) | Value::ConstStr(s) => {
                    recursedeps.push((s.clone(), deps_file.clone()))
                }
                Value::Tuple(t) | Value::List(t) if t.len() == 2 => {
                    let (a, b) = (
                        t[0].as_str().unwrap_or_default(),
                        t[1].as_str().unwrap_or_default(),
                    );
                    recursedeps.push((a.to_string(), b.to_string()));
                }
                other => {
                    return Err(Error::new(format!(
                        "{filename}: invalid recursedeps entry {other}"
                    )));
                }
            }
        }
        if let Some(prefix) = &rel_prefix {
            recursedeps = recursedeps
                .into_iter()
                .map(|(d, f)| (norm_join(prefix, &d), f))
                .collect();
        }
        self.nodes[idx].recursedeps = recursedeps;
        if scope.contains_key("target_os") {
            self.nodes[idx].local_target_os = Some(str_list(scope.get("target_os")));
        }

        // _postprocess_deps
        let mut processed = scope
            .get("deps")
            .and_then(Value::as_dict)
            .cloned()
            .unwrap_or_default();
        for (dep_name, info) in self.nodes[idx].custom_deps.clone().iter() {
            if let Some(s) = info.as_str()
                && !processed.contains_key(dep_name)
                && !s.is_empty()
                && !s.ends_with("@unmanaged")
            {
                let mut d = Dict::new();
                d.insert("url", Value::Str(s.to_string()));
                d.insert("dep_type", Value::Str("git".into()));
                processed.insert(dep_name.clone(), Value::Dict(d));
            }
        }
        if let Some(cond) = self.nodes[idx].condition.clone() {
            let keys: Vec<String> = processed.keys().cloned().collect();
            for k in keys {
                if let Some(Value::Dict(d)) = processed.get_mut(&k) {
                    update_condition(d, "and", Some(&cond));
                }
            }
        }
        if let Some(prefix) = &rel_prefix {
            processed = processed
                .iter()
                .map(|(d, v)| (norm_join(prefix, d), v.clone()))
                .collect();
        }

        let added = self.deps_to_objects(idx, &processed, use_relative_paths)?;

        // Hooks.
        let hooks_cwd = if use_relative_paths {
            self.root_dir.join(&name)
        } else if self.nodes[idx].relative {
            self.root_dir.join(dirname(&name))
        } else {
            self.root_dir.clone()
        };
        let custom_hooks = self.nodes[idx].custom_hooks.clone();
        let suppressed: Vec<String> = custom_hooks
            .iter()
            .filter_map(|h| h.as_dict()?.get_str("name").map(str::to_string))
            .collect();
        let mut hooks: Vec<&Value> = scope
            .get("hooks")
            .and_then(Value::as_seq)
            .unwrap_or_default()
            .iter()
            .filter(|h| {
                !suppressed.iter().any(|s| {
                    Some(s.as_str()) == h.as_dict().and_then(|d| d.get_str("name")).or(Some(""))
                })
            })
            .collect();
        hooks.extend(
            custom_hooks
                .iter()
                .filter(|h| h.as_dict().is_some_and(|d| d.contains_key("action"))),
        );
        let cond = self.nodes[idx].condition.clone();
        let to_hook = |h: &Value| -> Hook {
            let mut d = h.as_dict().cloned().unwrap_or_default();
            update_condition(&mut d, "and", cond.as_deref());
            Hook {
                name: d.get_str("name").map(str::to_string),
                action: str_list(d.get("action")),
                pattern: d.get_str("pattern").map(str::to_string),
                cwd: match d.get_str("cwd") {
                    Some(c) => hooks_cwd.join(c),
                    None => hooks_cwd.clone(),
                },
                condition: d.get_str("condition").map(str::to_string),
                owner: idx,
            }
        };
        let hooks: Vec<Hook> = hooks.into_iter().map(to_hook).collect();
        let pre: Vec<Hook> = if self.nodes[idx].should_recurse && !added.is_empty() {
            scope
                .get("pre_deps_hooks")
                .and_then(Value::as_seq)
                .unwrap_or_default()
                .iter()
                .map(to_hook)
                .collect()
        } else {
            Vec::new()
        };
        self.nodes[idx].hooks = hooks;
        self.nodes[idx].pre_deps_hooks = pre;
        Ok(added)
    }

    /// `_deps_to_objects`: one node per git entry, CIPD package and GCS object.
    fn deps_to_objects(
        &mut self,
        idx: usize,
        deps: &Dict,
        use_relative_paths: bool,
    ) -> Result<Vec<usize>> {
        let vars = self.vars(idx);
        let mut cache: Vec<(String, bool)> = Vec::new();
        let process_all = self.options.process_all_deps;
        let mut should = |c: Option<&str>| -> Result<bool> {
            let Some(c) = c.filter(|c| !c.is_empty()) else {
                return Ok(true);
            };
            if process_all {
                return Ok(true);
            }
            if let Some((_, v)) = cache.iter().find(|(k, _)| k == c) {
                return Ok(*v);
            }
            let v = condition::evaluate(c, &vars)?.truthy();
            cache.push((c.to_string(), v));
            Ok(v)
        };
        let parent_process = self.nodes[idx].should_process;
        let custom_vars = self.nodes[idx].custom_vars.clone();
        let recursedeps = self.nodes[idx].recursedeps.clone();
        let parent_deps_file = self.nodes[idx].deps_file.clone();
        let mut new_nodes: Vec<Node> = Vec::new();

        for (name, info) in deps.iter() {
            let Some(info) = info.as_dict() else { continue };
            let condition = info.get_str("condition").map(str::to_string);
            let dep_type = info.get_str("dep_type").unwrap_or("git").to_string();
            let process = parent_process && should(condition.as_deref())?;
            if self.options.ignore_dep_types.contains(&dep_type) {
                continue;
            }
            match dep_type.as_str() {
                "cipd" => {
                    for pkg in info
                        .get("packages")
                        .and_then(Value::as_seq)
                        .unwrap_or_default()
                    {
                        let pkg = pkg.as_dict().ok_or_else(|| {
                            Error::new(format!("{name}: CIPD packages must be dicts"))
                        })?;
                        let package = pkg.get_str("package").unwrap_or_default().to_string();
                        let version = match pkg.get_str("version_file") {
                            Some(vf) => {
                                let p = self.root_dir.join(&self.nodes[idx].name).join(vf);
                                std::fs::read_to_string(&p)
                                    .map_err(|e| Error::new(format!("{}: {e}", p.display())))?
                                    .trim()
                                    .to_string()
                            }
                            None => pkg.get_str("version").unwrap_or_default().to_string(),
                        };
                        let url = format!("{CIPD_SERVICE_URL}/{package}@{version}");
                        let mut n = Node::new(
                            format!("{name}:{package}"),
                            Some(url),
                            DepKind::Cipd { package, version },
                            Some(idx),
                        );
                        n.deps_key = name.clone();
                        n.custom_vars = custom_vars.clone();
                        n.should_process = process;
                        n.relative = use_relative_paths;
                        n.condition = condition.clone();
                        n.deps_file = String::new();
                        new_nodes.push(n);
                    }
                }
                "gcs" => {
                    let objects = info
                        .get("objects")
                        .and_then(Value::as_seq)
                        .unwrap_or_default();
                    let bucket = info.get_str("bucket").unwrap_or_default().to_string();
                    for obj in objects {
                        let obj = obj.as_dict().ok_or_else(|| {
                            Error::new(format!("{name}: GCS objects must be dicts"))
                        })?;
                        let object_name =
                            obj.get_str("object_name").unwrap_or_default().to_string();
                        let merged =
                            merge_conditions(&[condition.as_deref(), obj.get_str("condition")]);
                        let process_obj = process && should(merged.as_deref())?;
                        let url = format!("gs://{bucket}/{object_name}");
                        let kind = DepKind::Gcs {
                            bucket: bucket.clone(),
                            object_name: object_name.clone(),
                            sha256sum: obj.get_str("sha256sum").unwrap_or_default().to_string(),
                            size_bytes: match obj.get("size_bytes") {
                                Some(Value::Int(i)) => *i,
                                _ => 0,
                            },
                            output_file: obj.get_str("output_file").map(str::to_string),
                        };
                        let mut n =
                            Node::new(format!("{name}:{object_name}"), Some(url), kind, Some(idx));
                        n.deps_key = name.clone();
                        n.custom_vars = custom_vars.clone();
                        n.should_process = process_obj;
                        n.relative = use_relative_paths;
                        n.condition = merged;
                        n.deps_file = String::new();
                        new_nodes.push(n);
                    }
                }
                _ => {
                    let url = info.get("url").and_then(Value::as_str).map(str::to_string);
                    let mut n = Node::new(name.clone(), url, DepKind::Git, Some(idx));
                    n.custom_vars = custom_vars.clone();
                    n.should_process = process;
                    n.relative = use_relative_paths;
                    n.condition = condition.clone();
                    match recursedeps.iter().find(|(d, _)| d == name) {
                        Some((_, f)) => {
                            n.should_recurse = true;
                            n.deps_file = f.clone();
                        }
                        None => n.deps_file = parent_deps_file.clone(),
                    }
                    self.override_url(idx, &mut n)?;
                    new_nodes.push(n);
                }
            }
        }
        new_nodes.sort_by(|a, b| a.name.cmp(&b.name));
        let mut added = Vec::new();
        for n in new_nodes {
            if let Some(i) = self.add_child(idx, n)? {
                added.push(i);
            }
        }
        Ok(added)
    }

    /// `subtree(False)`: breadth-first, processed nodes only, root excluded.
    pub fn processed(&self) -> Vec<usize> {
        let mut out = Vec::new();
        self.subtree(0, &mut out);
        out
    }

    fn subtree(&self, idx: usize, out: &mut Vec<usize>) {
        let children = &self.nodes[idx].children;
        out.extend(
            children
                .iter()
                .copied()
                .filter(|c| self.nodes[*c].should_process),
        );
        for c in children {
            self.subtree(*c, out);
        }
    }

    /// `PrintRevInfo` without `--actual`/`--snapshot`: sorted `name: url` pairs.
    pub fn revinfo(&self, filter: &[String]) -> Vec<(String, Option<String>)> {
        let mut entries: std::collections::BTreeMap<String, Option<String>> = Default::default();
        for i in self.processed() {
            let n = &self.nodes[i];
            if filter.is_empty() || self.fuzzy_match(i, filter) {
                entries.insert(n.name.clone(), n.url.clone());
            }
        }
        entries.into_iter().collect()
    }

    /// `FuzzyMatchUrl`: exact URL, URL without revision, URL without `.git`, or the name.
    fn fuzzy_match(&self, idx: usize, candidates: &[String]) -> bool {
        let n = &self.nodes[idx];
        let Some(url) = &n.url else {
            return candidates.contains(&n.name);
        };
        let base = url.split('@').next().unwrap_or(url);
        let no_git = base.strip_suffix(".git").unwrap_or(base);
        candidates
            .iter()
            .any(|c| c == url || c == base || c == no_git || *c == n.name)
    }

    /// Every hook in `GetHooks` order: depth-first over processed, recursed nodes.
    pub fn hooks(&self) -> Vec<&Hook> {
        let mut out = Vec::new();
        self.collect_hooks(0, &mut out);
        out
    }

    fn collect_hooks<'a>(&'a self, idx: usize, out: &mut Vec<&'a Hook>) {
        let n = &self.nodes[idx];
        if !n.should_process || !n.should_recurse {
            return;
        }
        out.extend(n.hooks.iter());
        for c in &n.children {
            self.collect_hooks(*c, out);
        }
    }

    /// Whether a hook's condition holds for its DEPS file's variables.
    pub fn hook_enabled(&self, hook: &Hook) -> Result<bool> {
        match &hook.condition {
            None => Ok(true),
            Some(c) => Ok(condition::evaluate(c, &self.vars(hook.owner))?.truthy()),
        }
    }

    /// Solutions (children of the root).
    pub fn solutions(&self) -> impl Iterator<Item = &Node> {
        self.nodes[0].children.iter().map(|i| &self.nodes[*i])
    }
}

/// Render `revinfo` lines exactly like `print("%s: %s" % (name, url))`.
pub fn render_revinfo(entries: &[(String, Option<String>)]) -> String {
    let mut s = String::new();
    for (name, url) in entries {
        s.push_str(name);
        s.push_str(": ");
        s.push_str(url.as_deref().unwrap_or("None"));
        s.push('\n');
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(name: &str) -> PathBuf {
        let d =
            std::env::temp_dir().join(format!("depot-gclient-tree-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn conditions_recursion_and_relative_paths() {
        let root = tmp("rec");
        std::fs::create_dir_all(root.join("src/third_party/sub")).unwrap();
        std::fs::write(
            root.join("src/DEPS"),
            r#"
vars = { 'git': 'https://example.com', 'want_mac': False, 'rev': 'aaa' }
deps = {
  'src/third_party/sub': Var('git') + '/sub.git@' + Var('rev'),
  'src/win_only': { 'url': Var('git') + '/w.git@1', 'condition': 'checkout_win' },
  'src/mac_only': { 'url': Var('git') + '/m.git@2', 'condition': 'want_mac' },
  'src/tool': { 'packages': [{ 'package': 'infra/tool/${{platform}}', 'version': 'v1' }], 'dep_type': 'cipd' },
  'src/data': { 'dep_type': 'gcs', 'bucket': 'b', 'objects': [
      { 'object_name': 'o1', 'sha256sum': 's', 'size_bytes': 1, 'generation': 1 },
      { 'object_name': 'o2', 'sha256sum': 's', 'size_bytes': 1, 'generation': 1, 'condition': 'checkout_mac' } ] },
  'src/relative': '/rel.git@3',
}
recursedeps = [ 'src/third_party/sub' ]
hooks = [ { 'name': 'h', 'action': ['python3', 'x.py', '{rev}'], 'condition': 'checkout_win' } ]
"#,
        )
        .unwrap();
        std::fs::write(
            root.join("src/third_party/sub/DEPS"),
            "use_relative_paths = True\nvars = {'rev': 'zzz'}\ndeps = {'nested': 'https://example.com/n.git@' + Var('rev')}\n",
        )
        .unwrap();
        let gclient = "solutions = [{'name': 'src', 'url': 'https://example.com/src.git', 'custom_vars': {'want_mac': True}}]";
        let opts = Options {
            host_os: Some("win".into()),
            host_cpu: Some("x64".into()),
            ..Default::default()
        };
        let c = Client::from_config(&root, gclient, opts).unwrap();
        let info = render_revinfo(&c.revinfo(&[]));
        assert_eq!(
            info,
            "src: https://example.com/src.git\n\
             src/data:o1: gs://b/o1\n\
             src/mac_only: https://example.com/m.git@2\n\
             src/relative: https://example.com/rel.git@3\n\
             src/third_party/sub: https://example.com/sub.git@aaa\n\
             src/third_party/sub/nested: https://example.com/n.git@aaa\n\
             src/tool:infra/tool/${platform}: https://chrome-infra-packages.appspot.com/infra/tool/${platform}@v1\n\
             src/win_only: https://example.com/w.git@1\n"
        );
        let hooks = c.hooks();
        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].action, ["python3", "x.py", "aaa"]);
        assert!(c.hook_enabled(hooks[0]).unwrap());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn norm_join_handles_dots() {
        assert_eq!(norm_join("src/a", "../b"), "src/b");
        assert_eq!(norm_join("", "x"), "x");
    }
}
