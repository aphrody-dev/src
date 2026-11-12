//! Dependency references (`dependencies.apm` entries), a subset port of
//! `apm_cli/models/dependency/reference.py`.
//!
//! Supported: local paths, `owner/repo[/virtual/path][#ref]`, host-qualified
//! shorthand (`gitlab.com/owner/repo`), HTTPS / SSH git URLs, Azure DevOps
//! (`dev.azure.com/org/project/repo`), and the object form
//! (`{git, path, ref, alias, skills}` / `{path}` for local).
//! Not supported: registry (`id:`) and marketplace entries (parsed, flagged unsupported).

use anyhow::Result;
use anyhow::bail;

use crate::yaml::Value;

pub const DEFAULT_HOST: &str = "github.com";

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct DependencyReference {
    /// `owner/repo` (or `org/project/repo` for ADO, `_local/<name>` for local deps).
    pub repo_url: String,
    /// Explicit host when not the default (`github.com` is normalized to `None`... kept for URL forms).
    pub host: Option<String>,
    pub reference: Option<String>,
    pub virtual_path: Option<String>,
    pub is_virtual: bool,
    pub alias: Option<String>,
    pub is_local: bool,
    pub local_path: Option<String>,
    /// Explicit clone URL from URL forms / object `git:`.
    pub git_url: Option<String>,
    pub skills: Vec<String>,
    /// Registry / marketplace entries are recognised but cannot be resolved by this port.
    pub unsupported: Option<String>,
}

pub fn is_local_path(s: &str) -> bool {
    let s = s.trim();
    if s.starts_with("//") {
        return false;
    }
    if ["./", "../", "/", "~/", "~\\", ".\\", "..\\"]
        .iter()
        .any(|p| s.starts_with(p))
    {
        return true;
    }
    let b = s.as_bytes();
    b.len() >= 3 && b[0].is_ascii_alphabetic() && b[1] == b':' && (b[2] == b'\\' || b[2] == b'/')
}

fn is_ado_host(host: &str) -> bool {
    host == "dev.azure.com" || host.ends_with(".visualstudio.com")
}

fn looks_like_host(seg: &str) -> bool {
    seg.contains('.')
        && !seg.starts_with('.')
        && seg
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'.' || c == b'-' || c == b':')
}

fn valid_segment(seg: &str) -> bool {
    !seg.is_empty() && seg != "." && seg != ".." && !seg.contains(['\\', '\0'])
}

fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%'
            && i + 2 < b.len()
            && b[i + 1].is_ascii_hexdigit()
            && b[i + 2].is_ascii_hexdigit()
            && let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16)
        {
            out.push(v);
            i += 3;
            continue;
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

impl DependencyReference {
    /// Parse a string-form dependency.
    pub fn parse(dep: &str) -> Result<Self> {
        if dep.trim().is_empty() {
            bail!("Empty dependency string");
        }
        if dep.chars().any(|c| (c as u32) < 32) {
            bail!("Dependency string contains invalid control characters");
        }
        let dep = dep.trim();
        if is_local_path(dep) {
            return Ok(Self::local(dep));
        }
        let (body, reference) = match dep.split_once('#') {
            Some((b, r)) if !r.is_empty() => (b, Some(r.to_owned())),
            Some((b, _)) => (b, None),
            None => (dep, None),
        };
        if dep.contains('@') && !dep.starts_with("git@") && !dep.contains("://") {
            bail!(
                "Alias shorthand '@alias' was removed: use the object form with an `alias:` key ({dep})"
            );
        }
        let mut out = Self {
            reference,
            ..Self::default()
        };

        // file:// repositories (local mirrors, tests): identity = last two path segments.
        if let Some(rest) = body.strip_prefix("file://") {
            let segs: Vec<&str> = rest
                .trim_end_matches('/')
                .trim_end_matches(".git")
                .split('/')
                .filter(|s| !s.is_empty())
                .collect();
            if segs.len() < 2 {
                bail!("Invalid file:// repository URL: {dep}");
            }
            out.repo_url = segs[segs.len() - 2..].join("/");
            out.git_url = Some(body.to_owned());
            return Ok(out);
        }
        // URL forms: https://host/path(.git), ssh://git@host/path, git@host:path
        let url_path: Option<(String, String)> = if let Some(rest) = body
            .strip_prefix("https://")
            .or_else(|| body.strip_prefix("http://"))
        {
            let (host, path) = rest.split_once('/').unwrap_or((rest, ""));
            out.git_url = Some(body.to_owned());
            Some((host.to_owned(), path.to_owned()))
        } else if let Some(rest) = body.strip_prefix("ssh://") {
            let rest = rest.split_once('@').map_or(rest, |(_, r)| r);
            let (host, path) = rest.split_once('/').unwrap_or((rest, ""));
            out.git_url = Some(body.to_owned());
            Some((
                host.split(':').next().unwrap_or(host).to_owned(),
                path.to_owned(),
            ))
        } else if let Some(rest) = body.strip_prefix("git@") {
            let Some((host, path)) = rest.split_once(':') else {
                bail!("Invalid SSH dependency: {dep}")
            };
            out.git_url = Some(body.to_owned());
            Some((host.to_owned(), path.to_owned()))
        } else {
            None
        };

        if let Some((host, path)) = url_path {
            let path = path.trim_end_matches('/');
            let path = path.strip_suffix(".git").unwrap_or(path);
            let mut segs: Vec<String> = path.split('/').map(percent_decode).collect();
            segs.retain(|s| s != "_git");
            if segs.len() < 2 || !segs.iter().all(|s| valid_segment(s)) {
                bail!("Invalid repository path in {dep}");
            }
            out.repo_url = segs.join("/");
            out.host = Some(host);
            return Ok(out);
        }

        // Shorthand: [host/]owner/repo[/virtual...]
        let mut segs: Vec<String> = body.split('/').map(percent_decode).collect();
        let host = if segs.len() > 2 && looks_like_host(&segs[0]) {
            Some(segs.remove(0))
        } else {
            None
        };
        segs.retain(|s| s != "_git");
        if !segs.iter().all(|s| valid_segment(s)) {
            bail!("Invalid dependency format: {dep}");
        }
        let repo_segments = match host.as_deref() {
            Some(h) if is_ado_host(h) => 3,
            _ => 2,
        };
        if segs.len() < repo_segments {
            bail!("Invalid dependency format '{dep}': expected owner/repo");
        }
        out.repo_url = segs[..repo_segments].join("/");
        if segs.len() > repo_segments {
            out.virtual_path = Some(segs[repo_segments..].join("/"));
            out.is_virtual = true;
        }
        out.host = host;
        Ok(out)
    }

    fn local(path: &str) -> Self {
        let name = path
            .trim_end_matches(['/', '\\'])
            .rsplit(['/', '\\'])
            .next()
            .unwrap_or(path)
            .to_owned();
        Self {
            repo_url: format!("_local/{name}"),
            is_local: true,
            local_path: Some(path.to_owned()),
            ..Self::default()
        }
    }

    /// Parse an `apm.yml` entry: string or object form.
    pub fn from_value(v: &Value) -> Result<Self> {
        match v {
            Value::Str(s) => Self::parse(s),
            Value::Map(m) => {
                if m.contains_key("marketplace")
                    || m.contains_key("id")
                    || m.contains_key("registry")
                {
                    let label = m
                        .get("id")
                        .or_else(|| m.get("name"))
                        .and_then(Value::as_str)
                        .unwrap_or("?");
                    return Ok(Self {
                        repo_url: label.to_owned(),
                        unsupported: Some(
                            "registry/marketplace dependencies are not supported by this port"
                                .into(),
                        ),
                        ..Self::default()
                    });
                }
                let s = |k: &str| m.get(k).and_then(Value::to_plain_string);
                let mut dep = if let Some(git) = s("git") {
                    let mut d = Self::parse(&git)?;
                    if let Some(p) = s("path") {
                        let p = p.trim_matches('/').to_owned();
                        if !p.is_empty() {
                            d.virtual_path = Some(p);
                            d.is_virtual = true;
                        }
                    }
                    d
                } else if let Some(p) = s("path") {
                    if !is_local_path(&p) {
                        bail!("Object dependency with only `path:` must be a local path (got {p})");
                    }
                    Self::local(&p)
                } else {
                    bail!("Dependency entry needs a `git:`, `path:`, `id:` or `marketplace:` key");
                };
                if let Some(r) = s("ref") {
                    dep.reference = Some(r);
                }
                dep.alias = s("alias");
                if let Some(Value::Seq(items)) = m.get("skills") {
                    dep.skills = items.iter().filter_map(Value::to_plain_string).collect();
                }
                Ok(dep)
            }
            _ => bail!("Invalid dependency entry: expected a string or mapping"),
        }
    }

    /// Host used for cloning.
    pub fn effective_host(&self) -> &str {
        self.host.as_deref().unwrap_or(DEFAULT_HOST)
    }

    pub fn clone_url(&self) -> String {
        if let Some(u) = &self.git_url {
            return u.clone();
        }
        let host = self.effective_host();
        if is_ado_host(host) {
            let p: Vec<&str> = self.repo_url.split('/').collect();
            if p.len() == 3 {
                return format!("https://{host}/{}/{}/_git/{}", p[0], p[1], p[2]);
            }
        }
        format!("https://{host}/{}.git", self.repo_url)
    }

    /// Lockfile / dedup key (`get_unique_key`): host-qualified unless github.com.
    pub fn unique_key(&self) -> String {
        if self.is_local {
            return self.local_path.clone().unwrap_or_default();
        }
        let mut key = match self.host.as_deref() {
            Some(h) if h != DEFAULT_HOST => format!("{h}/{}", self.repo_url),
            _ => self.repo_url.clone(),
        };
        if let Some(v) = &self.virtual_path {
            key.push('/');
            key.push_str(v);
        }
        key
    }

    /// Directory name used for skill/package naming.
    pub fn package_dir_name(&self) -> String {
        if let Some(v) = &self.virtual_path {
            let last = v.rsplit('/').next().unwrap_or(v);
            return last.to_owned();
        }
        self.repo_url
            .rsplit('/')
            .next()
            .unwrap_or(&self.repo_url)
            .to_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Ported from tests/test_apm_package_models.py::TestDependencyReference
    #[test]
    fn parse_simple_and_refs() {
        let d = DependencyReference::parse("user/repo").unwrap();
        assert_eq!(
            (
                d.repo_url.as_str(),
                d.reference.as_deref(),
                d.alias.as_deref()
            ),
            ("user/repo", None, None)
        );
        for r in ["main", "v1.0.0", "abc123def"] {
            let d = DependencyReference::parse(&format!("user/repo#{r}")).unwrap();
            assert_eq!(d.repo_url, "user/repo");
            assert_eq!(d.reference.as_deref(), Some(r));
        }
    }

    #[test]
    fn alias_shorthand_removed() {
        assert!(DependencyReference::parse("user/repo@myalias").is_err());
        assert!(DependencyReference::parse("user/repo#main@myalias").is_err());
    }

    #[test]
    fn parse_github_and_ghe_urls() {
        for f in [
            "github.com/user/repo",
            "https://github.com/user/repo",
            "https://github.com/user/repo.git",
            "git@github.com:user/repo",
            "git@github.com:user/repo.git",
            "orgname.ghe.com/user/repo",
            "https://orgname.ghe.com/user/repo",
            "https://orgname.ghe.com/user/repo.git",
        ] {
            assert_eq!(
                DependencyReference::parse(f).unwrap().repo_url,
                "user/repo",
                "{f}"
            );
        }
    }

    #[test]
    fn parse_invalid_formats() {
        for f in ["", "   ", "just-repo-name", "user/"] {
            assert!(DependencyReference::parse(f).is_err(), "{f:?}");
        }
    }

    #[test]
    fn parse_azure_devops() {
        let d = DependencyReference::parse("dev.azure.com/myorg/myproject/myrepo").unwrap();
        assert_eq!(d.host.as_deref(), Some("dev.azure.com"));
        assert_eq!(d.repo_url, "myorg/myproject/myrepo");
        assert!(!d.is_virtual);
        let d = DependencyReference::parse("dev.azure.com/org/proj/repo/file.prompt.md").unwrap();
        assert!(d.is_virtual);
        assert_eq!(d.repo_url, "org/proj/repo");
        assert_eq!(d.virtual_path.as_deref(), Some("file.prompt.md"));
        let d = DependencyReference::parse("dev.azure.com/myorg/My%20Project/_git/myrepo").unwrap();
        assert_eq!(d.repo_url, "myorg/My Project/myrepo");
        let d = DependencyReference::parse("mycompany.visualstudio.com/myorg/myproject/myrepo")
            .unwrap();
        assert_eq!(d.host.as_deref(), Some("mycompany.visualstudio.com"));
    }

    #[test]
    fn virtual_subdirectory_and_local() {
        let d = DependencyReference::parse("owner/repo/skills/foo#v2").unwrap();
        assert!(d.is_virtual);
        assert_eq!(d.virtual_path.as_deref(), Some("skills/foo"));
        assert_eq!(d.unique_key(), "owner/repo/skills/foo");
        for p in ["./packages/x", "../x", "/abs/x", "~/x", "C:\\x", "C:/x"] {
            assert!(is_local_path(p), "{p}");
        }
        assert!(!is_local_path("//host/x"));
        let d = DependencyReference::parse("./packages/autopilot/foo").unwrap();
        assert_eq!(d.repo_url, "_local/foo");
        assert_eq!(d.unique_key(), "./packages/autopilot/foo");
    }

    #[test]
    fn object_form() {
        let v = crate::yaml::parse("git: https://gitlab.com/acme/standards.git\npath: instructions/security\nref: v2.0\nalias: sec\n").unwrap();
        let d = DependencyReference::from_value(&v).unwrap();
        assert_eq!(d.repo_url, "acme/standards");
        assert_eq!(d.host.as_deref(), Some("gitlab.com"));
        assert_eq!(d.virtual_path.as_deref(), Some("instructions/security"));
        assert_eq!(d.reference.as_deref(), Some("v2.0"));
        assert_eq!(d.alias.as_deref(), Some("sec"));
        assert_eq!(
            d.unique_key(),
            "gitlab.com/acme/standards/instructions/security"
        );
        let local =
            DependencyReference::from_value(&crate::yaml::parse("path: ./pkgs/a\n").unwrap())
                .unwrap();
        assert!(local.is_local);
        assert!(
            DependencyReference::from_value(&crate::yaml::parse("ref: v1\n").unwrap()).is_err()
        );
    }
}
