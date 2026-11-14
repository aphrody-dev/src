//! Multi-distro package recipes (`infra/pkg/recipes/<name>.toml`):
//! PKGBUILD, debian/, APKBUILD, ebuild, Android.bp, Nix derivation, and OCI layer Dockerfile.

use anyhow::{Context, Result, bail};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256, Sha512};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FileSpec {
    pub src: String,
    pub dest: String,
    pub mode: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Recipe {
    pub name: String,
    pub version: String,
    #[serde(default = "default_release")]
    pub release: u32,
    pub date: String,
    pub summary: String,
    pub description: String,
    pub license: String,
    pub homepage: String,
    pub maintainer: String,
    pub arch: String,
    pub portage_category: Option<String>,
    pub targets: Vec<String>,
    pub files: Vec<FileSpec>,
    pub license_files: Option<BTreeMap<String, String>>,
    pub depends: Option<BTreeMap<String, Vec<String>>>,
}

fn default_release() -> u32 {
    1
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Arch,
    Debian,
    Alpine,
    Portage,
    Soong,
    Nix,
    Docker,
}

pub const FORMATS: [Format; 7] = [
    Format::Arch,
    Format::Debian,
    Format::Alpine,
    Format::Portage,
    Format::Soong,
    Format::Nix,
    Format::Docker,
];

impl Format {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Arch => "arch",
            Self::Debian => "debian",
            Self::Alpine => "alpine",
            Self::Portage => "portage",
            Self::Soong => "soong",
            Self::Nix => "nix",
            Self::Docker => "docker",
        }
    }

    pub fn target_name(self) -> &'static str {
        match self {
            Self::Soong => "android",
            _ => self.as_str(),
        }
    }

    pub fn parse(s: &str) -> Result<Self> {
        match s.trim() {
            "arch" => Ok(Self::Arch),
            "debian" => Ok(Self::Debian),
            "alpine" => Ok(Self::Alpine),
            "portage" => Ok(Self::Portage),
            "soong" => Ok(Self::Soong),
            "nix" => Ok(Self::Nix),
            "docker" => Ok(Self::Docker),
            other => bail!("unknown target format '{other}'"),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
struct RawDistro {
    format: String,
    image: Option<String>,
    nixpkgs: Option<String>,
    ci: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Distro {
    pub name: String,
    pub format: Format,
    pub image: Option<String>,
    pub nixpkgs: Option<String>,
    pub ci: bool,
}

#[derive(Debug, Deserialize)]
struct DistrosDoc {
    distro: BTreeMap<String, RawDistro>,
}

#[derive(Debug, Clone)]
pub struct GeneratedOutput {
    pub files: BTreeMap<String, Vec<u8>>,
    pub modes: BTreeMap<String, u32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MatrixEntry {
    pub recipe: String,
    pub distro: String,
    pub format: Format,
    pub image: String,
}

const COMMON_LICENSES: &[&str] = &[
    "Apache-2.0",
    "GPL-2",
    "GPL-3",
    "LGPL-2.1",
    "MPL-2.0",
    "CC0-1.0",
];

fn file_basename(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

fn posix_dirname(path: &str) -> &str {
    match path.rsplit_once('/') {
        Some(("", _)) => "/",
        Some((dir, _)) => dir,
        None => ".",
    }
}

fn posix_basename(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

fn validate_recipe(r: Recipe, file: &str) -> Result<Recipe> {
    if r.name.is_empty()
        || r.version.is_empty()
        || r.summary.is_empty()
        || r.description.is_empty()
        || r.license.is_empty()
        || r.homepage.is_empty()
        || r.maintainer.is_empty()
        || r.date.is_empty()
    {
        bail!("{file}: missing required recipe field");
    }
    if format!("{}.toml", r.name) != file {
        bail!("{file}: name = \"{}\" does not match file name", r.name);
    }
    let name_re = Regex::new(r"^[a-z0-9][a-z0-9+.-]*$").expect("valid name regex");
    if !name_re.is_match(&r.name) {
        bail!("{file}: invalid package name '{}'", r.name);
    }
    if r.arch != "all" {
        bail!("{file}: only arch = \"all\" is supported");
    }
    if r.files.is_empty() {
        bail!("{file}: no [[files]] defined");
    }
    let mut seen_names = BTreeSet::new();
    for f in &r.files {
        if !f.dest.starts_with('/') {
            bail!("{file}: dest '{}' must be absolute", f.dest);
        }
        if !seen_names.insert(file_basename(&f.src)) {
            bail!("{file}: duplicate basename '{}'", file_basename(&f.src));
        }
    }
    Ok(r)
}

pub fn load_recipes(root: &Path) -> Result<Vec<Recipe>> {
    let dir = root.join("infra").join("pkg").join("recipes");
    let mut entries: Vec<_> = fs::read_dir(&dir)
        .with_context(|| format!("failed to read {}", dir.display()))?
        .flatten()
        .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("toml"))
        .collect();
    entries.sort_by_key(|e| e.file_name());

    let mut out = Vec::with_capacity(entries.len());
    for entry in entries {
        let fname = entry.file_name().to_string_lossy().into_owned();
        let raw = fs::read_to_string(entry.path())?;
        let parsed: Recipe = toml::from_str(&raw)
            .with_context(|| format!("failed to parse {fname}"))?;
        out.push(validate_recipe(parsed, &fname)?);
    }
    Ok(out)
}

pub fn load_distros(root: &Path) -> Result<Vec<Distro>> {
    let path = root.join("infra").join("pkg").join("distros.toml");
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    let doc: DistrosDoc = toml::from_str(&raw)?;
    let mut out = Vec::with_capacity(doc.distro.len());
    for (name, d) in doc.distro {
        out.push(Distro {
            name,
            format: Format::parse(&d.format)?,
            image: d.image,
            nixpkgs: d.nixpkgs,
            ci: d.ci,
        });
    }
    Ok(out)
}

fn quote_sh(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if matches!(ch, '"' | '\\' | '$' | '`') {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

fn header(r: &Recipe, comment: &str) -> String {
    format!(
        "{comment} Generated by `ay pkg gen` from infra/pkg/recipes/{}.toml. Do not edit.\n",
        r.name
    )
}

fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

fn sha512_hex(bytes: &[u8]) -> String {
    hex::encode(Sha512::digest(bytes))
}

fn deb_text(t: &str) -> String {
    t.trim_end()
        .lines()
        .map(|l| {
            if l.trim().is_empty() {
                " .".to_string()
            } else {
                format!(" {l}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn wrap_79(t: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut line = String::new();
    for word in t.split_whitespace() {
        if !line.is_empty() && line.len() + 1 + word.len() > 79 {
            out.push(std::mem::take(&mut line));
        }
        if !line.is_empty() {
            line.push(' ');
        }
        line.push_str(word);
    }
    if !line.is_empty() {
        out.push(line);
    }
    out
}

/// Convert `YYYY-MM-DD` to RFC 2822 UTC string (`Fri, 13 Nov 2026 00:00:00 +0000`).
pub fn rfc2822(date: &str) -> String {
    let parts: Vec<i32> = date
        .split('-')
        .filter_map(|p| p.parse::<i32>().ok())
        .collect();
    if parts.len() != 3 {
        return format!("{date} 00:00:00 +0000");
    }
    let (y, m, d) = (parts[0], parts[1], parts[2]);
    const T: [i32; 12] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let adj_y = if m < 3 { y - 1 } else { y };
    let dow = (adj_y + adj_y / 4 - adj_y / 100 + adj_y / 400 + T[(m - 1).clamp(0, 11) as usize] + d)
        .rem_euclid(7) as usize;
    const DAYS: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS: [&str; 12] = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let mon = MONTHS.get((m - 1).clamp(0, 11) as usize).copied().unwrap_or("Jan");
    format!("{}, {:02} {} {:04} 00:00:00 +0000", DAYS[dow], d, mon, y)
}

/// SPDX expression -> Gentoo `LICENSE` (`"MIT OR Apache-2.0"` -> `"|| ( MIT Apache-2.0 )"`).
pub fn gentoo_license(spdx: &str) -> String {
    let alts: Vec<_> = spdx.split(" OR ").collect();
    if alts.len() > 1 {
        format!("|| ( {} )", alts.join(" "))
    } else {
        spdx.to_string()
    }
}

/// SPDX expression -> nixpkgs `lib.licenses` attributes.
pub fn nix_licenses(spdx: &str) -> String {
    let re = Regex::new(r"\s+(?:OR|AND)\s+").expect("valid spdx split regex");
    re.split(spdx)
        .map(|l| match l {
            "MIT" => "mit".to_string(),
            "Apache-2.0" => "asl20".to_string(),
            "GPL-2.0-only" => "gpl2Only".to_string(),
            "GPL-3.0-only" => "gpl3Only".to_string(),
            "BSD-3-Clause" => "bsd3".to_string(),
            other => format!("{{ spdxId = \"{other}\"; }}"),
        })
        .collect::<Vec<_>>()
        .join(" ")
}

struct LicenseEntry {
    id: String,
    text: String,
    base: String,
}

fn read_licenses(root: &Path, r: &Recipe) -> Result<Vec<LicenseEntry>> {
    let mut out = Vec::new();
    if let Some(map) = &r.license_files {
        for (id, rel) in map {
            let file = root.join(rel);
            if !file.is_file() {
                bail!("{}: license '{}' not found", r.name, rel);
            }
            out.push(LicenseEntry {
                id: id.clone(),
                text: fs::read_to_string(&file)?,
                base: file_basename(rel).to_string(),
            });
        }
    }
    Ok(out)
}

fn read_sources(root: &Path, r: &Recipe) -> Result<Vec<(String, Vec<u8>)>> {
    let mut out = Vec::with_capacity(r.files.len());
    for f in &r.files {
        let p = root.join(&f.src);
        if !p.is_file() {
            bail!("{}: source '{}' not found", r.name, f.src);
        }
        out.push((file_basename(&f.src).to_string(), fs::read(&p)?));
    }
    Ok(out)
}

pub fn generate(
    root: &Path,
    r: &Recipe,
    format: Format,
    distro: Option<&Distro>,
) -> Result<GeneratedOutput> {
    if !r.targets.iter().any(|t| t == format.target_name()) {
        bail!(
            "{}: target '{}' absent from recipe targets",
            r.name,
            format.target_name()
        );
    }
    let mut src = read_sources(root, r)?;
    let mut files: BTreeMap<String, Vec<u8>> = BTreeMap::new();
    let mut modes: BTreeMap<String, u32> = BTreeMap::new();
    let mut put = |path: String, bytes: Vec<u8>, mode: Option<u32>| {
        if let Some(m) = mode {
            modes.insert(path.clone(), m);
        }
        files.insert(path, bytes);
    };

    let deps = r
        .depends
        .as_ref()
        .and_then(|d| d.get(format.target_name()))
        .cloned()
        .unwrap_or_default();

    match format {
        Format::Arch => {
            let lics = read_licenses(root, r)?;
            for l in &lics {
                src.push((l.base.clone(), l.text.as_bytes().to_vec()));
            }
            let names: Vec<_> = src.iter().map(|(n, _)| format!("'{n}'")).collect();
            let sums: Vec<_> = src
                .iter()
                .map(|(_, b)| format!("'{}'", sha256_hex(b)))
                .collect();
            let deps_quoted: Vec<_> = deps.iter().map(|d| format!("'{d}'")).collect();
            let mut pkgbuild = format!(
                "{}# Maintainer: {}\npkgname={}\npkgver={}\npkgrel={}\npkgdesc=\"{}\"\narch=('any')\nurl=\"{}\"\nlicense=('{}')\ndepends=({})\nsource=({})\nsha256sums=({})\n\npackage() {{\n",
                header(r, "#"),
                r.maintainer,
                r.name,
                r.version,
                r.release,
                quote_sh(&r.summary),
                r.homepage,
                r.license,
                deps_quoted.join(" "),
                names.join(" "),
                sums.join(" ")
            );
            for f in &r.files {
                let m = f.mode.as_deref().unwrap_or("644");
                pkgbuild.push_str(&format!(
                    "  install -Dm{m} \"$srcdir/{}\" \"$pkgdir{}\"\n",
                    file_basename(&f.src),
                    f.dest
                ));
            }
            for l in &lics {
                pkgbuild.push_str(&format!(
                    "  install -Dm644 \"$srcdir/{}\" \"$pkgdir/usr/share/licenses/$pkgname/{}\"\n",
                    l.base, l.base
                ));
            }
            pkgbuild.push_str("}\n");
            put("PKGBUILD".into(), pkgbuild.into_bytes(), None);
            for (n, b) in src {
                put(n, b, None);
            }
            let tests: String = r
                .files
                .iter()
                .map(|f| format!("test -f {}\n", f.dest))
                .collect();
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\npacman -Syu --noconfirm --needed base-devel\nid build >/dev/null 2>&1 || useradd -m build\nchown -R build /w\nsu build -c 'cd /w && makepkg -fd --noconfirm'\npacman -U --noconfirm /w/{}-{}-{}-any.pkg.tar.zst\n{}pacman -Qi {} | head -3\npacman -S --noconfirm --needed namcap >/dev/null\nnamcap /w/PKGBUILD /w/{}-{}-{}-any.pkg.tar.zst > /w/namcap.txt\ncat /w/namcap.txt\nif grep -q ' E: ' /w/namcap.txt; then echo 'namcap: errors' >&2; exit 1; fi\n",
                header(r, "#"),
                r.name,
                r.version,
                r.release,
                tests,
                r.name,
                r.name,
                r.version,
                r.release
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Debian => {
            let d = format!("{}-{}", r.name, r.version);
            let mut pkg_deps = vec!["${misc:Depends}".to_string()];
            pkg_deps.extend(deps);
            let desc_lines: String = wrap_79(&r.description)
                .into_iter()
                .map(|l| format!(" {l}"))
                .collect::<Vec<_>>()
                .join("\n");
            let control = format!(
                "Source: {}\nSection: admin\nPriority: optional\nMaintainer: {}\nBuild-Depends: debhelper-compat (= 13)\nStandards-Version: 4.7.4\nHomepage: {}\nRules-Requires-Root: no\n\nPackage: {}\nArchitecture: all\nDepends: {}\nDescription: {}\n{}\n",
                r.name,
                r.maintainer,
                r.homepage,
                r.name,
                pkg_deps.join(", "),
                r.summary,
                desc_lines
            );
            put(format!("{d}/debian/control"), control.into_bytes(), None);
            let changelog = format!(
                "{} ({}-{}) unstable; urgency=medium\n\n  * Generated from infra/pkg/recipes/{}.toml.\n\n -- {}  {}\n",
                r.name,
                r.version,
                r.release,
                r.name,
                r.maintainer,
                rfc2822(&r.date)
            );
            put(format!("{d}/debian/changelog"), changelog.into_bytes(), None);
            let installs: String = r
                .files
                .iter()
                .map(|f| {
                    let m = f.mode.as_deref().unwrap_or("644");
                    format!(
                        "\tinstall -Dm{m} files/{} debian/{}{}\n",
                        file_basename(&f.src),
                        r.name,
                        f.dest
                    )
                })
                .collect();
            let rules = format!(
                "#!/usr/bin/make -f\n{}%:\n\tdh $@\n\noverride_dh_auto_install:\n{}",
                header(r, "#"),
                installs
            );
            put(format!("{d}/debian/rules"), rules.into_bytes(), Some(0o755));
            put(
                format!("{d}/debian/source/format"),
                b"3.0 (quilt)\n".to_vec(),
                None,
            );
            put(
                format!("{d}/debian/{}.lintian-overrides", r.name),
                format!("{}: initial-upload-closes-no-bugs\n", r.name).into_bytes(),
                None,
            );
            let lics = read_licenses(root, r)?;
            let mut copyright = format!(
                "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/\nUpstream-Name: {}\nSource: {}\n\nFiles: *\nCopyright: {} Aphrody\nLicense: {}\n",
                r.name,
                r.homepage,
                r.date.get(0..4).unwrap_or("2026"),
                r.license.replace(" OR ", " or ")
            );
            for l in lics {
                if COMMON_LICENSES.contains(&l.id.as_str()) {
                    copyright.push_str(&format!(
                        "\nLicense: {}\n On Debian systems, the complete text is in /usr/share/common-licenses/{}.\n",
                        l.id, l.id
                    ));
                } else {
                    copyright.push_str(&format!("\nLicense: {}\n{}\n", l.id, deb_text(&l.text)));
                }
            }
            put(format!("{d}/debian/copyright"), copyright.into_bytes(), None);
            for (n, b) in src {
                put(format!("{d}/files/{n}"), b, None);
            }
            let tests: String = r
                .files
                .iter()
                .map(|f| format!("test -f {}\n", f.dest))
                .collect();
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\nexport DEBIAN_FRONTEND=noninteractive\napt-get update -q\napt-get install -y -q --no-install-recommends build-essential debhelper dpkg-dev lintian\ncd /w/{} && dpkg-buildpackage -us -uc -b\napt-get install -y -q /w/{}_{}-{}_all.deb\n{}dpkg -s {} | head -3\nlintian --fail-on error,warning --display-info /w/{}_{}-{}_all.deb\n",
                header(r, "#"),
                d,
                r.name,
                r.version,
                r.release,
                tests,
                r.name,
                r.name,
                r.version,
                r.release
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Alpine => {
            let names: Vec<_> = src.iter().map(|(n, _)| n.clone()).collect();
            let dir = format!("aphrody/{}", r.name);
            let pkgrel = r.release.saturating_sub(1);
            let installs: String = r
                .files
                .iter()
                .map(|f| {
                    let m = f.mode.as_deref().unwrap_or("644");
                    format!(
                        "\tinstall -Dm{m} \"$srcdir\"/{} \"$pkgdir\"{}\n",
                        file_basename(&f.src),
                        f.dest
                    )
                })
                .collect();
            let sums: String = src
                .iter()
                .map(|(n, b)| format!("{}  {n}\n", sha512_hex(b)))
                .collect();
            let apkbuild = format!(
                "{}# Maintainer: {}\npkgname={}\npkgver={}\npkgrel={}\npkgdesc=\"{}\"\nurl=\"{}\"\narch=\"noarch\"\nlicense=\"{}\"\ndepends=\"{}\"\noptions=\"!check\"\nsource=\"{}\"\n\npackage() {{\n{}}}\n\nsha512sums=\"\n{}\"\n",
                header(r, "#"),
                r.maintainer,
                r.name,
                r.version,
                pkgrel,
                quote_sh(&r.summary),
                r.homepage,
                r.license,
                deps.join(" "),
                names.join(" "),
                installs,
                sums
            );
            put(format!("{dir}/APKBUILD"), apkbuild.into_bytes(), None);
            for (n, b) in src {
                put(format!("{dir}/{n}"), b, None);
            }
            let tests: String = r
                .files
                .iter()
                .map(|f| format!("test -f {}\n", f.dest))
                .collect();
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\napk add --no-cache alpine-sdk atools\nabuild-keygen -an\ncp /root/.abuild/*.rsa.pub /etc/apk/keys/\ncd /w/{} && abuild -F -d -P /w/repo\napk add --no-cache --allow-untrusted $(find /w/repo -name '{}-{}-r{}.apk')\n{}apk info -e {}\ncd /w/{} && apkbuild-lint APKBUILD\n",
                header(r, "#"),
                dir,
                r.name,
                r.version,
                pkgrel,
                tests,
                r.name,
                dir
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Portage => {
            let cat = r.portage_category.as_deref().unwrap_or("app-misc");
            let rev = if r.release > 1 {
                format!("-r{}", r.release - 1)
            } else {
                String::new()
            };
            let dir = format!("{cat}/{}", r.name);
            let mut installs = String::new();
            for f in &r.files {
                let n = file_basename(&f.src);
                let m = f.mode.as_deref().unwrap_or("644");
                let exe = m == "755";
                installs.push_str(&format!(
                    "\t{} {}\n",
                    if exe { "exeinto" } else { "insinto" },
                    posix_dirname(&f.dest)
                ));
                if !exe {
                    installs.push_str(&format!("\tinsopts -m0{m}\n"));
                }
                installs.push_str(&format!(
                    "\t{} \"${{FILESDIR}}/{}\" {}\n",
                    if exe { "newexe" } else { "newins" },
                    n,
                    posix_basename(&f.dest)
                ));
            }
            let ebuild = format!(
                "# Copyright {} Aphrody\n# Distributed under the terms of {}\n{}\nEAPI=8\n\nDESCRIPTION=\"{}\"\nHOMEPAGE=\"{}\"\nS=\"${{WORKDIR}}\"\n\nLICENSE=\"{}\"\nSLOT=\"0\"\nKEYWORDS=\"~amd64 ~arm64\"\nRDEPEND=\"{}\"\n\nsrc_install() {{\n{}}}\n",
                r.date.get(0..4).unwrap_or("2026"),
                r.license,
                header(r, "#"),
                quote_sh(&r.summary),
                r.homepage,
                gentoo_license(&r.license),
                deps.join(" "),
                installs
            );
            put(
                format!("{dir}/{}-{}{rev}.ebuild", r.name, r.version),
                ebuild.into_bytes(),
                None,
            );
            let email = r
                .maintainer
                .split_once('<')
                .and_then(|(_, rest)| rest.strip_suffix('>'))
                .unwrap_or(&r.maintainer)
                .trim();
            let maint_name = r
                .maintainer
                .split_once('<')
                .map(|(n, _)| n.trim())
                .unwrap_or(&r.maintainer);
            let meta = format!(
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pkgmetadata SYSTEM \"https://www.gentoo.org/dtd/metadata.dtd\">\n<pkgmetadata>\n\t<maintainer type=\"person\">\n\t\t<email>{email}</email>\n\t\t<name>{maint_name}</name>\n\t</maintainer>\n</pkgmetadata>\n"
            );
            put(format!("{dir}/metadata.xml"), meta.into_bytes(), None);
            for (n, b) in src {
                put(format!("{dir}/files/{n}"), b, None);
            }
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\nfor f in /w/{dir}/*.ebuild; do bash -n \"$f\"; done\n",
                header(r, "#")
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Soong => {
            let etc_re = Regex::new(r"^/(?:system/)?etc/(.*)$").expect("valid etc regex");
            let mut mods = Vec::with_capacity(r.files.len());
            for f in &r.files {
                let n = file_basename(&f.src);
                let id: String = format!("{}-{n}", r.name)
                    .chars()
                    .map(|c| {
                        if c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '-') {
                            c
                        } else {
                            '_'
                        }
                    })
                    .collect();
                let m = f.mode.as_deref().unwrap_or("644");
                if m == "755" {
                    mods.push(format!(
                        "sh_binary {{\n    name: \"{id}\",\n    src: \"{n}\",\n    filename: \"{}\",\n}}\n",
                        posix_basename(&f.dest)
                    ));
                } else {
                    let parent = format!("{}/", posix_dirname(&f.dest));
                    let Some(caps) = etc_re.captures(&parent) else {
                        bail!(
                            "{}: {} has no Android equivalent (/etc or /system/etc)",
                            r.name,
                            f.dest
                        );
                    };
                    let sub = caps.get(1).map(|m| m.as_str().trim_end_matches('/')).unwrap_or("");
                    let sub_line = if sub.is_empty() {
                        String::new()
                    } else {
                        format!("    sub_dir: \"{sub}\",\n")
                    };
                    mods.push(format!(
                        "prebuilt_etc {{\n    name: \"{id}\",\n    src: \"{n}\",\n    filename: \"{}\",\n{sub_line}}}\n",
                        posix_basename(&f.dest)
                    ));
                }
            }
            put(
                "Android.bp".into(),
                format!("{}\n{}", header(r, "//"), mods.join("\n")).into_bytes(),
                None,
            );
            for (n, b) in src {
                put(n, b, None);
            }
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\ntest -s /w/Android.bp\n",
                header(r, "#")
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Nix => {
            let nix_dest = |d: &str| d.strip_prefix("/usr/").map(|s| format!("/{s}")).unwrap_or_else(|| d.to_string());
            let mut args = vec!["lib".to_string(), "stdenvNoCC".to_string()];
            args.extend(deps.clone());
            let prop = if deps.is_empty() {
                String::new()
            } else {
                format!("  propagatedBuildInputs = [ {} ];\n", deps.join(" "))
            };
            let installs: String = r
                .files
                .iter()
                .map(|f| {
                    let m = f.mode.as_deref().unwrap_or("644");
                    format!(
                        "    install -Dm{m} $src/{} $out{}\n",
                        file_basename(&f.src),
                        nix_dest(&f.dest)
                    )
                })
                .collect();
            let default_nix = format!(
                "{}{{ {} }}:\n\nstdenvNoCC.mkDerivation {{\n  pname = \"{}\";\n  version = \"{}\";\n  src = ./files;\n{}  dontConfigure = true;\n  dontBuild = true;\n  installPhase = ''\n    runHook preInstall\n{}    runHook postInstall\n  '';\n  meta = {{\n    description = \"{}\";\n    homepage = \"{}\";\n    license = with lib.licenses; [ {} ];\n    platforms = lib.platforms.linux;\n  }};\n}}\n",
                header(r, "#"),
                args.join(", "),
                r.name,
                r.version,
                prop,
                installs,
                quote_sh(&r.summary),
                r.homepage,
                nix_licenses(&r.license)
            );
            put("default.nix".into(), default_nix.into_bytes(), None);
            for (n, b) in src {
                put(format!("files/{n}"), b, None);
            }
            let flake = distro
                .and_then(|d| d.nixpkgs.as_deref())
                .unwrap_or("github:NixOS/nixpkgs/nixos-unstable");
            let tests: String = r
                .files
                .iter()
                .map(|f| format!("test -f /w/result{}\n", nix_dest(&f.dest)))
                .collect();
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\nnix --extra-experimental-features 'nix-command flakes' build --impure --print-build-logs --option sandbox false -o /w/result \\\n  --expr '(builtins.getFlake \"{}\").legacyPackages.x86_64-linux.callPackage /w/default.nix {{}}'\n{}",
                header(r, "#"),
                flake,
                tests
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
        Format::Docker => {
            let copies: String = r
                .files
                .iter()
                .map(|f| {
                    let m = f.mode.as_deref().unwrap_or("644");
                    format!(
                        "COPY --chmod={m} files/{} {}\n",
                        file_basename(&f.src),
                        f.dest
                    )
                })
                .collect();
            let dockerfile = format!(
                "# syntax=docker/dockerfile:1\n{}# OCI layer of {}: `COPY --from=ghcr.io/aphrody-labs/pkg-{}:{} / /`.\nFROM scratch\n{}LABEL org.opencontainers.image.title=\"{}\" \\\n      org.opencontainers.image.description=\"{}\" \\\n      org.opencontainers.image.version=\"{}-{}\" \\\n      org.opencontainers.image.licenses=\"{}\" \\\n      org.opencontainers.image.source=\"https://github.com/aphrody-labs/src\"\n",
                header(r, "#"),
                r.name,
                r.name,
                r.version,
                copies,
                r.name,
                quote_sh(&r.summary),
                r.version,
                r.release,
                r.license
            );
            put("Dockerfile".into(), dockerfile.into_bytes(), None);
            for (n, b) in src {
                put(format!("files/{n}"), b, None);
            }
            let checks: String = r
                .files
                .iter()
                .map(|f| format!("grep -qx '{}' files.txt\n", &f.dest[1..]))
                .collect();
            let build_sh = format!(
                "#!/bin/sh\n{}set -eu\ncd \"$(dirname \"$0\")\"\ndocker build -q -t pkg-{}:{}-{} .\ncid=$(docker create pkg-{}:{}-{} /none)\ndocker export \"$cid\" | tar -t > files.txt\ndocker rm \"$cid\" >/dev/null\n{}",
                header(r, "#"),
                r.name,
                r.version,
                r.release,
                r.name,
                r.version,
                r.release,
                checks
            );
            put("build.sh".into(), build_sh.into_bytes(), Some(0o755));
        }
    }

    Ok(GeneratedOutput { files, modes })
}

pub fn formats_of(r: &Recipe) -> Vec<Format> {
    FORMATS
        .iter()
        .copied()
        .filter(|f| r.targets.iter().any(|t| t == f.target_name()))
        .collect()
}

pub fn matrix(recipes: &[Recipe], distros: &[Distro], ci_only: bool) -> Vec<MatrixEntry> {
    let mut out = Vec::new();
    for r in recipes {
        for d in distros {
            if (!ci_only || d.ci) && r.targets.iter().any(|t| t == d.format.target_name()) {
                out.push(MatrixEntry {
                    recipe: r.name.clone(),
                    distro: d.name.clone(),
                    format: d.format,
                    image: d.image.clone().unwrap_or_default(),
                });
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recipes_matrix_checksums_and_soong() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let recipes = load_recipes(&root).expect("load recipes");
        let distros = load_distros(&root).expect("load distros");

        for r in &recipes {
            for f in formats_of(r) {
                let d = distros.iter().find(|x| x.format == f);
                let g = generate(&root, r, f, d).expect("generate");
                assert!(g.files.contains_key("build.sh"));
            }
        }

        let m = matrix(&recipes, &distros, true);
        for d in ["arch", "debian", "alpine", "nix"] {
            assert!(m.iter().any(|x| x.distro == d));
        }
        for x in &m {
            if x.format != Format::Docker {
                assert!(x.image.contains("@sha256:"));
            }
        }

        let r = recipes.iter().find(|x| x.name == "aphrody-sysctl").unwrap();
        let body = fs::read(root.join(&r.files[0].src)).unwrap();
        let pkgbuild = String::from_utf8(
            generate(&root, r, Format::Arch, None).files["PKGBUILD"].clone(),
        )
        .unwrap();
        assert!(pkgbuild.contains(&sha256_hex(&body)));

        let apk_map = generate(&root, r, Format::Alpine, None).files;
        let apk = String::from_utf8(apk_map["aphrody/aphrody-sysctl/APKBUILD"].clone()).unwrap();
        assert!(apk.contains(&sha512_hex(&body)));
        assert!(apk.contains("pkgrel=0"));

        assert_eq!(gentoo_license("MIT OR Apache-2.0"), "|| ( MIT Apache-2.0 )");
        assert_eq!(nix_licenses("MIT OR Apache-2.0"), "mit asl20");
        assert_eq!(rfc2822("2026-11-13"), "Fri, 13 Nov 2026 00:00:00 +0000");

        let dir = std::env::temp_dir().join("aphrody_omarchy_soong_test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("a.conf"), "x=1\n").unwrap();
        let base = Recipe {
            name: "t".into(),
            version: "1".into(),
            release: 1,
            date: "2026-11-13".into(),
            summary: "s".into(),
            description: "d".into(),
            license: "MIT".into(),
            homepage: "https://example.invalid".into(),
            maintainer: "m <m@x>".into(),
            arch: "all".into(),
            portage_category: None,
            targets: vec!["android".into()],
            files: vec![FileSpec {
                src: "a.conf".into(),
                dest: "/system/etc/t/a.conf".into(),
                mode: None,
            }],
            license_files: None,
            depends: None,
        };
        let bp = String::from_utf8(
            generate(&dir, &base, Format::Soong, None).files["Android.bp"].clone(),
        )
        .unwrap();
        assert!(bp.contains("prebuilt_etc {"));
        assert!(bp.contains("sub_dir: \"t\""));

        let mut bad = base;
        bad.files[0].dest = "/usr/lib/a.conf".into();
        assert!(generate(&dir, &bad, Format::Soong, None).is_err());
        let _ = fs::remove_dir_all(&dir);

        assert_eq!(FORMATS.len(), 7);
    }
}
