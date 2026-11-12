//! Ensure files (luci-go `cipd/client/cipd/ensure`, `template`, `platform`, and the
//! validators of `cipd/common/common.go`).

use std::collections::BTreeMap;

use crate::{Error, Result, iid};

/// `deployer.ParanoidMode`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Paranoid {
    #[default]
    NotParanoid,
    CheckPresence,
    CheckIntegrity,
}

impl Paranoid {
    pub fn parse(s: &str) -> Option<Paranoid> {
        match s {
            "NotParanoid" => Some(Paranoid::NotParanoid),
            "CheckPresence" => Some(Paranoid::CheckPresence),
            "CheckIntegrity" => Some(Paranoid::CheckIntegrity),
            _ => None,
        }
    }
}

/// One package line: template, unresolved version, line number.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PackageDef {
    pub template: String,
    pub version: String,
    pub line: usize,
}

/// A parsed ensure file (`ensure.File`). Subdirs are kept unexpanded.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EnsureFile {
    pub service_url: Option<String>,
    pub paranoid: Paranoid,
    pub resolved_versions: Option<String>,
    /// `$OverrideInstallMode copy` (the only accepted value).
    pub override_copy: bool,
    pub verified_platforms: Vec<Platform>,
    pub packages: BTreeMap<String, Vec<PackageDef>>,
}

/// `template.Platform`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Platform {
    pub os: String,
    pub arch: String,
}

impl Platform {
    /// `platform.CurrentOS()` / `CurrentArchitecture()` for this build (GOOS/GOARCH names,
    /// `darwin` reported as `mac`).
    pub fn current() -> Platform {
        let os = match std::env::consts::OS {
            "macos" => "mac",
            o => o,
        };
        let arch = match std::env::consts::ARCH {
            "x86_64" => "amd64",
            "x86" => "386",
            "aarch64" => "arm64",
            "arm" => "armv6l",
            "powerpc64" => "ppc64",
            "riscv64" => "riscv64",
            "s390x" => "s390x",
            a => a,
        };
        Platform {
            os: os.into(),
            arch: arch.into(),
        }
    }

    pub fn parse(v: &str) -> Option<Platform> {
        let parts: Vec<&str> = v.split('-').collect();
        (parts.len() == 2).then(|| Platform {
            os: parts[0].into(),
            arch: parts[1].into(),
        })
    }

    fn var(&self, name: &str) -> Option<String> {
        match name {
            "os" => Some(self.os.clone()),
            "arch" => Some(self.arch.clone()),
            "platform" => Some(format!("{}-{}", self.os, self.arch)),
            _ => None,
        }
    }

    /// `Expander.Expand`: `Ok(None)` is `ErrSkipTemplate` (the line does not apply here).
    pub fn expand(&self, template: &str) -> Result<Option<String>> {
        self.expand_impl(template, false)
    }

    /// `Expander.Validate`: every `${var=a,b}` is filled with the current value.
    pub fn validate(&self, template: &str) -> Result<String> {
        Ok(self.expand_impl(template, true)?.unwrap_or_default())
    }

    fn expand_impl(&self, template: &str, always_fill: bool) -> Result<Option<String>> {
        let mut out = String::with_capacity(template.len());
        let mut err: Option<String> = None;
        let mut skip = false;
        let mut rest = template;
        // Regex `\$\{[^}]*\}`, replaced left to right.
        while let Some(start) = rest.find("${") {
            let Some(len) = rest[start + 2..].find('}') else {
                break;
            };
            out.push_str(&rest[..start]);
            let parm = &rest[start..start + 2 + len + 1];
            let contents = &parm[2..parm.len() - 1];
            rest = &rest[start + parm.len()..];
            let (name, values) = match contents.split_once('=') {
                Some((n, v)) => (n, Some(v)),
                None => (contents, None),
            };
            let ours = self.var(name);
            match (values, ours) {
                (None, Some(v)) => out.push_str(&v),
                (_, None) => {
                    err = Some(format!("unknown variable in {parm}"));
                    out.push_str(parm);
                }
                (Some(values), Some(v)) => {
                    if always_fill || values.split(',').any(|x| x == v) {
                        out.push_str(&v);
                    } else {
                        skip = true;
                        out.push_str(parm);
                    }
                }
            }
        }
        out.push_str(rest);
        if skip {
            return Ok(None);
        }
        if let Some(e) = err {
            return Err(Error::new(e));
        }
        if out.contains('$') {
            return Err(Error::new(format!(
                "unable to process some variables in {template:?}"
            )));
        }
        Ok(Some(out))
    }
}

impl std::fmt::Display for Platform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}-{}", self.os, self.arch)
    }
}

fn pathish_ok(p: &str) -> bool {
    !p.is_empty()
        && p.split('/').all(|c| {
            !c.is_empty()
                && c.bytes().all(|b| {
                    b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b, b'_' | b'-' | b'.')
                })
                && !c.bytes().all(|b| b == b'.')
        })
}

/// `common.ValidatePackageName`.
pub fn validate_package_name(name: &str) -> Result<()> {
    if pathish_ok(name) {
        Ok(())
    } else {
        Err(Error::new(format!(
            "invalid package name {name:?}: must be a slash-separated path where each component matches \"[a-z0-9_\\-\\.]+\""
        )))
    }
}

/// `path.Clean` for relative slash paths without a leading `/`.
pub(crate) fn clean_rel(p: &str) -> String {
    let mut out: Vec<&str> = Vec::new();
    for c in p.split('/') {
        match c {
            "" | "." => {}
            ".." => {
                if out.last().is_some_and(|l| *l != "..") {
                    out.pop();
                } else {
                    out.push("..");
                }
            }
            c => out.push(c),
        }
    }
    if out.is_empty() {
        ".".into()
    } else {
        out.join("/")
    }
}

/// `common.ValidateSubdir`.
pub fn validate_subdir(subdir: &str) -> Result<()> {
    let bad = |why: &str| Err(Error::new(format!("bad subdir {subdir:?}: {why}")));
    if subdir.is_empty() {
        return Ok(());
    }
    if subdir.contains('\\') {
        return bad("backslashes are not allowed (use \"/\")");
    }
    if subdir.contains(':') {
        return bad("colons are not allowed");
    }
    if subdir.starts_with('/') {
        return bad("absolute paths are not allowed");
    }
    if clean_rel(subdir) != subdir {
        return bad("should be simplified");
    }
    if subdir.starts_with("./") || subdir.starts_with("../") || subdir == "." || subdir == ".." {
        return bad("contains disallowed dot-path prefix");
    }
    Ok(())
}

/// `common.ValidateInstanceTag` (`key:value`).
pub fn is_tag(t: &str) -> bool {
    let Some((k, v)) = t.split_once(':') else {
        return false;
    };
    t.len() <= 400
        && !k.is_empty()
        && k.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_' || b == b'-')
        && !v.is_empty()
        && !v.starts_with(' ')
        && !v.ends_with(' ')
        && v.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"$()*+,-./:;<=>@\\_{}~ ".contains(&b))
}

/// `common.ValidatePackageRef`.
pub fn is_ref(r: &str) -> bool {
    !iid::is_valid(r)
        && (1..=256).contains(&r.len())
        && r.bytes().all(|b| {
            b.is_ascii_lowercase() || b.is_ascii_digit() || matches!(b, b'_' | b'.' | b'/' | b'-')
        })
}

/// `common.ValidateInstanceVersion`: an instance id, a ref or a tag.
pub fn validate_version(v: &str) -> Result<()> {
    if iid::is_valid(v) || is_ref(v) || is_tag(v) {
        Ok(())
    } else {
        Err(Error::new(format!(
            "bad version {v:?}: not an instance ID, a ref or a tag"
        )))
    }
}

/// `ensure.ParseFile`.
pub fn parse(text: &str) -> Result<EnsureFile> {
    let mut f = EnsureFile::default();
    let mut subdir = String::new();
    let mut settings_allowed = true;
    let here = Platform::current();
    for (i, raw) in text.lines().enumerate() {
        let line_no = i + 1;
        let err = |m: String| {
            Error::new(format!(
                "failed to parse desired state (line {line_no}): {m}"
            ))
        };
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let (tok1, tok2) = match line.find(char::is_whitespace) {
            Some(i) => (&line[..i], line[i..].trim()),
            None => (line, ""),
        };
        let c = tok1.as_bytes()[0];
        if c == b'$' && !settings_allowed {
            return Err(err("$setting found after non-$setting statements".into()));
        }
        if c == b'@' {
            settings_allowed = false;
        }
        if c != b'$' && c != b'@' {
            settings_allowed = false;
            f.packages
                .entry(subdir.clone())
                .or_default()
                .push(PackageDef {
                    template: tok1.into(),
                    version: tok2.into(),
                    line: line_no,
                });
            continue;
        }
        match tok1.to_ascii_lowercase().as_str() {
            "@subdir" => {
                let expanded = here
                    .validate(tok2)
                    .map_err(|e| err(format!("bad subdir {tok2:?}: {e}")))?;
                validate_subdir(&expanded).map_err(|e| err(e.to_string()))?;
                subdir = tok2.into();
            }
            "$serviceurl" => {
                if f.service_url.is_some() {
                    return Err(err("$ServiceURL may only be set once per file".into()));
                }
                f.service_url = Some(tok2.into());
            }
            "$verifiedplatform" => {
                for (n, field) in tok2.split_whitespace().enumerate() {
                    let p = Platform::parse(field).ok_or_else(|| {
                        err(format!(
                            "invalid platform entry #{}: platform must be <os>-<arch>, got {field:?}",
                            n + 1
                        ))
                    })?;
                    f.verified_platforms.push(p);
                }
            }
            "$paranoidmode" => {
                f.paranoid = Paranoid::parse(tok2).ok_or_else(|| {
                    err(format!(
                        "bad $ParanoidMode: unrecognized paranoid mode {tok2:?}"
                    ))
                })?;
            }
            "$resolvedversions" => f.resolved_versions = Some(tok2.into()),
            "$overrideinstallmode" => match tok2 {
                "copy" => f.override_copy = true,
                "" | "symlink" => return Err(err("only copy mode is allowed".into())),
                m => return Err(err(format!("invalid install mode {m:?}"))),
            },
            _ => {
                let kind = if c == b'@' { "@directive" } else { "$setting" };
                return Err(err(format!("unknown {kind}: {tok1:?}")));
            }
        }
    }
    Ok(f)
}

/// A package to ensure after template expansion.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Wanted {
    pub subdir: String,
    pub package: String,
    pub version: String,
    pub line: usize,
}

/// The expansion half of `File.Resolve`: subdirs sorted, templates expanded and validated,
/// lines that do not apply to `platform` dropped, duplicates rejected.
pub fn expand(f: &EnsureFile, platform: &Platform) -> Result<Vec<Wanted>> {
    let mut out: Vec<Wanted> = Vec::new();
    let mut errors = Vec::new();
    for (subdir, defs) in &f.packages {
        let real_subdir = match platform.expand(subdir) {
            Ok(Some(s)) => s,
            Ok(None) => continue,
            Err(e) => return Err(Error::new(format!("normalizing {subdir:?}: {e}"))),
        };
        validate_subdir(&real_subdir)
            .map_err(|e| Error::new(format!("normalizing {subdir:?}: {e}")))?;
        for d in defs {
            let pkg = match platform.expand(&d.template) {
                Ok(Some(p)) => p,
                Ok(None) => continue,
                Err(e) => {
                    return Err(Error::new(format!(
                        "failed to expand package template (line {}): {e}",
                        d.line
                    )));
                }
            };
            validate_package_name(&pkg)
                .map_err(|e| Error::new(format!("bad package name (line {}): {e}", d.line)))?;
            validate_version(&d.version)
                .map_err(|e| Error::new(format!("bad package version (line {}): {e}", d.line)))?;
            if let Some(prev) = out
                .iter()
                .find(|w| w.subdir == real_subdir && w.package == pkg)
            {
                errors.push(format!(
                    "duplicate package in subdir {real_subdir:?}: {pkg:?}: defined on line {} and {}",
                    prev.line, d.line
                ));
                continue;
            }
            out.push(Wanted {
                subdir: real_subdir.clone(),
                package: pkg,
                version: d.version.clone(),
                line: d.line,
            });
        }
    }
    if errors.is_empty() {
        Ok(out)
    } else {
        Err(Error::new(errors.join("\n")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn win() -> Platform {
        Platform::parse("windows-amd64").unwrap()
    }

    #[test]
    fn parses_gclient_ensure_file() {
        let text = "$ParanoidMode CheckPresence\n$OverrideInstallMode copy\n\n\
                    @Subdir src/third_party/7z\ninfra/3pp/tools/7z/${platform} version:3@26.03\n\n\
                    @Subdir src/buildtools/win\ngn/gn/windows-amd64 git_revision:24d41137fac7ea2828590181ebd8284fe7437253\n";
        let f = parse(text).unwrap();
        assert_eq!(f.paranoid, Paranoid::CheckPresence);
        assert!(f.override_copy);
        assert_eq!(f.packages.len(), 2);
        let w = expand(&f, &win()).unwrap();
        assert_eq!(
            w.iter()
                .map(|w| (w.subdir.as_str(), w.package.as_str()))
                .collect::<Vec<_>>(),
            [
                ("src/buildtools/win", "gn/gn/windows-amd64"),
                ("src/third_party/7z", "infra/3pp/tools/7z/windows-amd64"),
            ]
        );
        assert_eq!(w[1].version, "version:3@26.03");
        assert_eq!(w[1].line, 5);
    }

    #[test]
    fn settings_and_directives() {
        let f = parse(
            "# comment\n$ServiceURL https://example.appspot.com\n$VerifiedPlatform linux-amd64 windows-arm64\n\
             $VerifiedPlatform mac-arm64\n$ResolvedVersions cipd.versions\nfoo/bar latest\n",
        )
        .unwrap();
        assert_eq!(
            f.service_url.as_deref(),
            Some("https://example.appspot.com")
        );
        assert_eq!(f.verified_platforms.len(), 3);
        assert_eq!(f.verified_platforms[1].to_string(), "windows-arm64");
        assert_eq!(f.resolved_versions.as_deref(), Some("cipd.versions"));
        assert_eq!(f.packages[""][0].template, "foo/bar");
        // Directive names are case-insensitive.
        assert!(parse("@subdir a\nx/y latest\n").is_ok());
    }

    #[test]
    fn rejects_bad_files() {
        for bad in [
            "foo/bar latest\n$ParanoidMode CheckPresence\n",
            "$ServiceURL a\n$ServiceURL b\n",
            "$OverrideInstallMode symlink\n",
            "$ParanoidMode Sometimes\n",
            "@Unknown x\n",
            "$Unknown x\n",
            "@Subdir ../x\n",
            "@Subdir /abs\n",
            "@Subdir a\\b\n",
            "@Subdir a//b\n",
            "@Subdir c:/x\n",
            "@Subdir ${bogus}\n",
            "$VerifiedPlatform linux\n",
        ] {
            assert!(parse(bad).is_err(), "{bad:?}");
        }
        // Errors surface at expansion time.
        for bad in [
            "Foo/bar latest\n",
            "foo/bar not a version\n",
            "foo/${nope} latest\n",
            "foo/bar latest\nfoo/bar version:1\n",
        ] {
            let f = parse(bad).unwrap();
            assert!(expand(&f, &win()).is_err(), "{bad:?}");
        }
    }

    #[test]
    fn template_expansion() {
        let p = win();
        assert_eq!(
            p.expand("a/${os}/${arch}/${platform}").unwrap().as_deref(),
            Some("a/windows/amd64/windows-amd64")
        );
        assert_eq!(
            p.expand("a/${os=windows,mac}").unwrap().as_deref(),
            Some("a/windows")
        );
        assert_eq!(p.expand("a/${os=linux,mac}").unwrap(), None);
        assert_eq!(p.validate("a/${os=linux}").unwrap(), "a/windows");
        assert!(p.expand("a/${nope}").is_err());
        assert!(p.expand("a/$os").is_err());
        // A skipped variable wins over an unknown one, as in luci-go.
        assert_eq!(p.expand("${nope}/${os=mac}").unwrap(), None);

        let f = parse("@Subdir ${os=linux}\nfoo latest\n@Subdir win\nbar/${arch=amd64} latest\nbaz/${arch=arm64} latest\n").unwrap();
        let w = expand(&f, &p).unwrap();
        assert_eq!(w.len(), 1);
        assert_eq!(
            (w[0].subdir.as_str(), w[0].package.as_str()),
            ("win", "bar/amd64")
        );
    }

    #[test]
    fn versions() {
        for ok in [
            "latest",
            "version:3@26.03",
            "git_revision:24d41137fac7ea2828590181ebd8284fe7437253",
            "HVCRGHnt4bB-ZbwODJv2TSsDvc9t5VVbTldyuOT4x3oC",
            "version:2@1.2.3.chromium.4",
        ] {
            assert!(validate_version(ok).is_ok(), "{ok}");
        }
        for bad in ["", "Latest", "key: value", "k:v!", "KEY:v"] {
            assert!(validate_version(bad).is_err(), "{bad}");
        }
        assert!(validate_package_name("infra/3pp/tools/7z/windows-amd64").is_ok());
        for bad in ["", "a//b", "/a", "a/..", "A/b", "a+b"] {
            assert!(validate_package_name(bad).is_err(), "{bad}");
        }
    }
}
