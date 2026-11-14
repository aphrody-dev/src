//! JavaScript runtimes beside Bun: Node.js (V8) and Deno (V8, wgpu), with versions read live from
//! their official sources and project version files (`.nvmrc`, `.node-version`, `.dvmrc`,
//! `.deno-version`, `.bun-version`, `package.json` `engines` / `packageManager`).
//!
//! Sources: <https://nodejs.org/dist/index.json> (with `SHASUMS256.txt` per release) and the
//! GitHub releases of `denoland/deno` and `oven-sh/bun` (per-asset sha256 digests).

use std::path::{Path, PathBuf};

/// One released version, newest first in every list.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Release {
    pub version: String,
    /// Node LTS codename; `None` for Current lines and for Deno and Bun.
    pub lts: Option<String>,
}

/// `1.2.3` -> (1, 2, 3); prerelease or build suffixes make the version non-stable.
pub fn parse_version(v: &str) -> Option<(u64, u64, u64)> {
    let v = v.trim().trim_start_matches('v');
    if v.contains('-') || v.contains('+') {
        return None;
    }
    let mut it = v.split('.').map(|p| p.parse::<u64>().ok());
    let major = it.next()??;
    let minor = it.next().unwrap_or(Some(0))?;
    let patch = it.next().unwrap_or(Some(0))?;
    Some((major, minor, patch))
}

fn cmp_ok(op: &str, v: (u64, u64, u64), want: &str) -> bool {
    let parts: Vec<&str> = want.trim_start_matches('v').split('.').collect();
    let num = |i: usize| parts.get(i).and_then(|p| p.parse::<u64>().ok());
    let wild = |i: usize| parts.get(i).is_none_or(|p| matches!(*p, "x" | "X" | "*"));
    let (ma, mi, pa) = (num(0), num(1), num(2));
    let base = (ma.unwrap_or(0), mi.unwrap_or(0), pa.unwrap_or(0));
    match op {
        ">=" => v >= base,
        ">" => v > base,
        "<=" => v <= base,
        "<" => v < base,
        "^" => {
            v >= base
                && match base {
                    (0, 0, _) if !wild(2) => v.0 == 0 && v.1 == 0 && v.2 == base.2,
                    (0, _, _) if !wild(1) => v.0 == 0 && v.1 == base.1,
                    _ => v.0 == base.0,
                }
        }
        "~" => v >= base && v.0 == base.0 && (wild(1) || v.1 == base.1),
        _ => {
            // Exact or partial (`20`, `20.11`, `20.x`): every given component must match.
            ma.is_none_or(|m| v.0 == m)
                && (wild(1) || mi.is_none_or(|m| v.1 == m))
                && (wild(2) || pa.is_none_or(|p| v.2 == p))
        }
    }
}

/// npm-style range match (`>=20 <23`, `^22.1`, `~20.11`, `20.x`, `18 || 20`, `*`).
pub fn satisfies(version: &str, range: &str) -> bool {
    let Some(v) = parse_version(version) else {
        return false;
    };
    range.split("||").any(|alt| {
        let alt = alt.trim();
        if alt.is_empty() || alt == "*" || alt == "latest" {
            return true;
        }
        if let Some((lo, hi)) = alt.split_once(" - ") {
            return cmp_ok(">=", v, lo.trim()) && cmp_ok("<=", v, hi.trim());
        }
        let alt = alt.replace(", ", " ").replace(',', " ");
        alt.split_whitespace().all(|c| {
            for op in [">=", "<=", ">", "<", "^", "~", "="] {
                if let Some(rest) = c.strip_prefix(op) {
                    return cmp_ok(if op == "=" { "" } else { op }, v, rest);
                }
            }
            cmp_ok("", v, c)
        })
    })
}

/// Pick the newest stable release that satisfies `want` (`latest`, `lts`, `lts/*`, `lts/<name>`,
/// a version or an npm range). `releases` must be newest first.
pub fn pick<'a>(releases: &'a [Release], want: &str) -> Option<&'a Release> {
    let want = want.trim();
    let stable = releases
        .iter()
        .filter(|r| parse_version(&r.version).is_some());
    match want.to_ascii_lowercase().as_str() {
        "" | "latest" | "current" | "node" | "stable" | "*" => stable.into_iter().next(),
        "lts" | "lts/*" => stable.into_iter().find(|r| r.lts.is_some()),
        w if w.starts_with("lts/") => {
            let name = &w[4..];
            stable.into_iter().find(|r| {
                r.lts
                    .as_deref()
                    .is_some_and(|l| l.eq_ignore_ascii_case(name))
            })
        }
        _ => stable.into_iter().find(|r| satisfies(&r.version, want)),
    }
}

fn get_json(url: &str) -> Result<serde_json::Value, String> {
    let body = up::fetch::get(url, &[("Accept", "application/json")]).map_err(|(_, m)| m)?;
    serde_json::from_slice(&body).map_err(|e| format!("{url}: {e}"))
}

pub const NODE_INDEX: &str = "https://nodejs.org/dist/index.json";

/// Node.js releases from the official index, newest first.
pub fn node_releases() -> Result<Vec<Release>, String> {
    let v = get_json(NODE_INDEX)?;
    Ok(v.as_array()
        .ok_or("node index: not an array")?
        .iter()
        .filter_map(|r| {
            Some(Release {
                version: r
                    .get("version")?
                    .as_str()?
                    .trim_start_matches('v')
                    .to_string(),
                lts: r.get("lts").and_then(|l| l.as_str()).map(str::to_string),
            })
        })
        .collect())
}

/// Releases of a GitHub project whose tags are `<prefix><version>`, newest first.
pub fn github_releases(repo: &str, prefix: &str) -> Result<Vec<Release>, String> {
    let v = get_json(&format!(
        "https://api.github.com/repos/{repo}/releases?per_page=100"
    ))?;
    Ok(v.as_array()
        .ok_or_else(|| format!("{repo}: no release list"))?
        .iter()
        .filter(|r| {
            !r.get("prerelease")
                .and_then(|p| p.as_bool())
                .unwrap_or(false)
        })
        .filter_map(|r| r.get("tag_name")?.as_str()?.strip_prefix(prefix))
        .map(|t| Release {
            version: t.to_string(),
            lts: None,
        })
        .collect())
}

pub fn releases(runtime: &str) -> Result<Vec<Release>, String> {
    match runtime {
        "node" => node_releases(),
        "deno" => github_releases("denoland/deno", "v"),
        "bun" => github_releases("oven-sh/bun", "bun-v"),
        other => Err(format!("no release source for {other}")),
    }
}

/// Official source a version comes from, shown by `ay rt matrix`.
pub fn source(runtime: &str) -> &'static str {
    match runtime {
        "node" => NODE_INDEX,
        "deno" => "https://github.com/denoland/deno/releases",
        "bun" => "https://github.com/oven-sh/bun/releases",
        _ => "-",
    }
}

/// Node.js archive name for an `ay up` platform key.
pub fn node_asset(version: &str, platform: &str) -> Option<String> {
    let os_arch = match platform {
        "windows-x86_64" => "win-x64.zip",
        "windows-aarch64" => "win-arm64.zip",
        "linux-x86_64" => "linux-x64.tar.xz",
        "linux-aarch64" => "linux-arm64.tar.xz",
        "macos-x86_64" => "darwin-x64.tar.gz",
        "macos-aarch64" => "darwin-arm64.tar.gz",
        _ => return None,
    };
    Some(format!("node-v{version}-{os_arch}"))
}

/// Deno archive name for an `ay up` platform key.
pub fn deno_asset(platform: &str) -> Option<&'static str> {
    Some(match platform {
        "windows-x86_64" => "deno-x86_64-pc-windows-msvc.zip",
        "linux-x86_64" => "deno-x86_64-unknown-linux-gnu.zip",
        "linux-aarch64" => "deno-aarch64-unknown-linux-gnu.zip",
        "macos-x86_64" => "deno-x86_64-apple-darwin.zip",
        "macos-aarch64" => "deno-aarch64-apple-darwin.zip",
        _ => return None,
    })
}

/// Where a runtime version is unpacked: `tools_dir/<runtime>/<version>`.
pub fn runtime_dir(tools: &Path, runtime: &str, version: &str) -> PathBuf {
    tools.join(runtime).join(version)
}

/// The executable inside an unpacked runtime.
pub fn runtime_bin(dir: &Path, runtime: &str) -> PathBuf {
    let exe = |n: &str| {
        if cfg!(windows) {
            format!("{n}.exe")
        } else {
            n.to_string()
        }
    };
    match runtime {
        "node" if cfg!(windows) => dir.join(exe("node")),
        "node" => dir.join("bin").join("node"),
        other => dir.join(exe(other)),
    }
}

/// Installed versions under `tools_dir/<runtime>`, newest first.
pub fn installed(tools: &Path, runtime: &str) -> Vec<String> {
    let mut v: Vec<String> = std::fs::read_dir(tools.join(runtime))
        .map(|rd| {
            rd.flatten()
                .filter(|e| runtime_bin(&e.path(), runtime).is_file())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();
    v.sort_by(|a, b| parse_version(b).cmp(&parse_version(a)).then(b.cmp(a)));
    v
}

fn unpack_tree(asset: &str, data: &[u8], dest: &Path) -> Result<(), String> {
    let mut entries = up::archive::entries(asset, data)?;
    up::archive::strip_common_root(&mut entries);
    for e in &entries {
        let exec = e.mode.is_some_and(|m| m & 0o111 != 0) || e.path.starts_with("bin");
        up::install::place_file(&dest.join(&e.path), &e.data, exec)?;
    }
    Ok(())
}

/// Install Node.js `version` (exact) into `tools_dir/node/<version>`, checked against SHASUMS256.txt.
pub fn install_node(tools: &Path, version: &str) -> Result<String, String> {
    let dir = runtime_dir(tools, "node", version);
    if runtime_bin(&dir, "node").is_file() {
        return Ok(format!("node {version} already in {}", dir.display()));
    }
    let platform = up::manifest::current_platform();
    let asset =
        node_asset(version, &platform).ok_or_else(|| format!("no Node.js build for {platform}"))?;
    let base = format!("https://nodejs.org/dist/v{version}");
    let data = up::fetch::get(&format!("{base}/{asset}"), &[]).map_err(|(_, m)| m)?;
    let sums = up::fetch::get(&format!("{base}/SHASUMS256.txt"), &[]).map_err(|(_, m)| m)?;
    let sum = up::fetch::checksum_for(&String::from_utf8_lossy(&sums), &asset)
        .ok_or_else(|| format!("{asset} missing from SHASUMS256.txt"))?;
    up::fetch::verify(&data, &sum, &asset)?;
    unpack_tree(&asset, &data, &dir)?;
    Ok(format!(
        "node {version} -> {} (sha256 verified)",
        dir.display()
    ))
}

/// Install Deno `version` (exact) into `tools_dir/deno/<version>`, checked against the GitHub digest.
pub fn install_deno(tools: &Path, version: &str) -> Result<String, String> {
    let dir = runtime_dir(tools, "deno", version);
    if runtime_bin(&dir, "deno").is_file() {
        return Ok(format!("deno {version} already in {}", dir.display()));
    }
    let platform = up::manifest::current_platform();
    let asset = deno_asset(&platform).ok_or_else(|| format!("no Deno build for {platform}"))?;
    let tag = format!("v{version}");
    let data = up::fetch::github_asset("denoland/deno", &tag, asset, None)?;
    let sum = crate::github_digest("denoland/deno", &tag, asset).or_else(|| {
        up::fetch::github_asset("denoland/deno", &tag, &format!("{asset}.sha256sum"), None)
            .ok()
            .and_then(|b| {
                String::from_utf8_lossy(&b)
                    .split_whitespace()
                    .find(|w| w.len() == 64 && w.chars().all(|c| c.is_ascii_hexdigit()))
                    .map(|s| s.to_ascii_lowercase())
            })
    });
    let verified = match sum {
        Some(s) => {
            up::fetch::verify(&data, &s, asset)?;
            true
        }
        None => false,
    };
    unpack_tree(asset, &data, &dir)?;
    Ok(format!(
        "deno {version} -> {}{}",
        dir.display(),
        if verified {
            " (sha256 verified)"
        } else {
            " (no checksum published)"
        }
    ))
}

/// The version request a project declares for `runtime`, and the file it came from.
pub fn project_request(dir: &Path, runtime: &str) -> Option<(String, String)> {
    let read = |f: &str| {
        std::fs::read_to_string(dir.join(f))
            .ok()
            .map(|s| s.lines().next().unwrap_or("").trim().to_string())
            .filter(|s| !s.is_empty() && !s.starts_with('#'))
    };
    let files: &[&str] = match runtime {
        "node" => &[".nvmrc", ".node-version"],
        "deno" => &[".dvmrc", ".deno-version"],
        "bun" => &[".bun-version"],
        _ => &[],
    };
    for f in files {
        if let Some(v) = read(f) {
            return Some((v, (*f).to_string()));
        }
    }
    let pkg: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("package.json")).ok()?).ok()?;
    if let Some(r) = pkg
        .pointer(&format!("/engines/{runtime}"))
        .and_then(|v| v.as_str())
    {
        return Some((r.to_string(), "package.json engines".into()));
    }
    if runtime == "bun" {
        // `packageManager: "bun@1.4.4"` (Corepack format).
        if let Some(v) = pkg
            .get("packageManager")
            .and_then(|v| v.as_str())
            .and_then(|s| s.strip_prefix("bun@"))
        {
            return Some((
                v.split('+').next().unwrap_or(v).to_string(),
                "package.json packageManager".into(),
            ));
        }
    }
    None
}

/// Runtimes a project uses: a version file or `engines` entry, `deno.json[c]`, `bunfig.toml` or `bun.lock`.
pub fn project_runtimes(dir: &Path) -> Vec<&'static str> {
    let has = |f: &str| dir.join(f).exists();
    let mut out = Vec::new();
    for rt in ["node", "deno", "bun"] {
        let marker = match rt {
            "deno" => has("deno.json") || has("deno.jsonc"),
            "bun" => has("bunfig.toml") || has("bun.lock") || has("bun.lockb"),
            _ => false,
        };
        if marker || project_request(dir, rt).is_some() {
            out.push(rt);
        }
    }
    out
}

/// The file `ay rt use <runtime>@<version>` writes, in the format the runtime's own tooling reads.
pub fn version_file(runtime: &str) -> Option<&'static str> {
    Some(match runtime {
        "node" => ".node-version",
        "deno" => ".dvmrc",
        "bun" => ".bun-version",
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rel(v: &str, lts: Option<&str>) -> Release {
        Release {
            version: v.into(),
            lts: lts.map(str::to_string),
        }
    }

    #[test]
    fn ranges() {
        assert!(satisfies("22.11.0", ">=20"));
        assert!(satisfies("22.11.0", ">=20 <23"));
        assert!(!satisfies("23.0.0", ">=20 <23"));
        assert!(satisfies("20.18.1", "^20.1"));
        assert!(!satisfies("21.0.0", "^20.1"));
        assert!(satisfies("20.11.9", "~20.11"));
        assert!(!satisfies("20.12.0", "~20.11"));
        assert!(satisfies("18.20.4", "18 || 20"));
        assert!(satisfies("20.3.0", "20.x"));
        assert!(satisfies("1.4.4", "1.4.4"));
        assert!(!satisfies("1.4.3", "1.4.4"));
        assert!(satisfies("2.5.0", "2.0.0 - 2.9.9"));
        assert!(!satisfies("27.0.0-alpha.0", "*"));
    }

    #[test]
    fn picks_stable_lts_and_ranges() {
        let r = vec![
            rel("27.0.0-alpha.0.1.0", None),
            rel("27.1.0", None),
            rel("26.13.1", Some("Lithium")),
            rel("24.9.0", Some("Krypton")),
        ];
        assert_eq!(pick(&r, "latest").unwrap().version, "27.1.0");
        assert_eq!(pick(&r, "lts/*").unwrap().version, "26.13.1");
        assert_eq!(pick(&r, "lts/krypton").unwrap().version, "24.9.0");
        assert_eq!(pick(&r, "24").unwrap().version, "24.9.0");
        assert_eq!(pick(&r, ">=25 <27").unwrap().version, "26.13.1");
        assert!(pick(&r, "30").is_none());
    }

    #[test]
    fn assets() {
        assert_eq!(
            node_asset("26.13.1", "windows-x86_64").unwrap(),
            "node-v26.13.1-win-x64.zip"
        );
        assert_eq!(
            node_asset("26.13.1", "linux-x86_64").unwrap(),
            "node-v26.13.1-linux-x64.tar.xz"
        );
        assert_eq!(
            deno_asset("linux-aarch64"),
            Some("deno-aarch64-unknown-linux-gnu.zip")
        );
        assert_eq!(version_file("deno"), Some(".dvmrc"));
    }

    #[test]
    fn project_files() {
        let d = std::env::temp_dir().join(format!("ay-rt-js-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(d.join(".nvmrc"), "lts/*\n").unwrap();
        std::fs::write(
            d.join("package.json"),
            r#"{"engines":{"deno":">=2"},"packageManager":"bun@1.4.4+sha512.abc"}"#,
        )
        .unwrap();
        assert_eq!(project_request(&d, "node").unwrap().0, "lts/*");
        assert_eq!(
            project_request(&d, "deno").unwrap().1,
            "package.json engines"
        );
        assert_eq!(project_request(&d, "bun").unwrap().0, "1.4.4");
        assert_eq!(project_runtimes(&d), vec!["node", "deno", "bun"]);
        std::fs::remove_dir_all(&d).unwrap();
    }
}
