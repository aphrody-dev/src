//! Runtime and engine combinations: the versioned matrix (`ay rt matrix`), project detection
//! (`ay rt detect`) and `ay rt switch --runtime node@<v> --engine chrome@<channel> [--gpu dawn]`.
//!
//! Runtimes (Node, Deno, Bun, Python) are handled here; browsers, render engines and automation
//! tools come from the engines facade `packages/chromium-bun/src/engines` (one registry, run
//! through `bun`), and V8 / Dawn per Chrome channel from `aphrody_conformance::channels`
//! (chromiumdash and the Chromium DEPS of each channel tag).

use std::path::{Path, PathBuf};
use std::process::Command;

use crate::js;

/// File holding the project's browser engine choice (`chrome@beta`, `firefox@nightly`, `servo`).
pub const ENGINE_FILE: &str = ".engine-version";

/// Repository root: `$SRC_ROOT`, else the nearest ancestor of the working directory with `src.lock.json`.
pub fn repo_root() -> Option<PathBuf> {
    if let Some(r) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return Some(PathBuf::from(r));
    }
    let cwd = std::env::current_dir().ok()?;
    cwd.ancestors()
        .find(|d| d.join("src.lock.json").is_file())
        .map(Path::to_path_buf)
}

/// Run the engines facade (`bun packages/chromium-bun/src/engines/cli.ts <args>`) and return its stdout.
pub fn facade(args: &[&str]) -> Result<String, String> {
    let root = repo_root().ok_or("engines facade: set SRC_ROOT or run inside the src checkout")?;
    let cli = root.join("packages/chromium-bun/src/engines/cli.ts");
    if !cli.is_file() {
        return Err(format!("engines facade missing: {}", cli.display()));
    }
    let out = Command::new("bun")
        .arg(&cli)
        .args(args)
        .current_dir(&root)
        .output()
        .map_err(|e| format!("bun: {e}"))?;
    let text = String::from_utf8_lossy(&out.stdout).into_owned();
    if out.status.success() {
        Ok(text)
    } else {
        Err(format!(
            "chromium-bun engines {}: {}{}",
            args.join(" "),
            text.trim(),
            String::from_utf8_lossy(&out.stderr).trim()
        ))
    }
}

/// One matrix row, rendered as a table line or JSON.
#[derive(Debug, Clone)]
pub struct Row {
    pub kind: &'static str,
    pub id: String,
    pub latest: String,
    pub installed: String,
    pub active: String,
    pub source: String,
}

impl Row {
    fn json(&self) -> serde_json::Value {
        serde_json::json!({
            "kind": self.kind,
            "id": self.id,
            "latest": self.latest,
            "installed": self.installed,
            "active": self.active,
            "source": self.source,
        })
    }
}

fn runtime_rows(tools: &Path, dir: &Path) -> Vec<Row> {
    let mut rows = Vec::new();
    for rt in ["node", "deno", "bun"] {
        let rels = js::releases(rt);
        let latest = rels
            .as_ref()
            .ok()
            .and_then(|r| js::pick(r, "latest"))
            .map(|r| r.version.clone());
        let lts = if rt == "node" {
            rels.as_ref()
                .ok()
                .and_then(|r| js::pick(r, "lts/*"))
                .map(|r| format!(" (lts {})", r.version))
                .unwrap_or_default()
        } else {
            String::new()
        };
        let active = js::project_request(dir, rt)
            .map(|(v, f)| format!("{v} [{f}]"))
            .unwrap_or_else(|| "-".into());
        let installed = js::installed(tools, rt).join(" ");
        rows.push(Row {
            kind: "runtime",
            id: rt.into(),
            latest: latest
                .map(|v| v + &lts)
                .unwrap_or_else(|| format!("? ({})", rels.err().unwrap_or_default())),
            installed: if installed.is_empty() {
                "-".into()
            } else {
                installed
            },
            active,
            source: js::source(rt).into(),
        });
    }
    // Python: uv owns the list of builds (CPython, free-threaded, PyPy, GraalPy, Pyodide).
    let uv = |args: &[&str]| {
        Command::new("uv")
            .args(args)
            .output()
            .ok()
            .map(|o| String::from_utf8_lossy(&o.stdout).into_owned())
            .unwrap_or_default()
    };
    let first_version = |s: &str| {
        s.lines()
            .filter_map(|l| l.split_whitespace().next())
            .filter_map(|k| k.strip_prefix("cpython-"))
            .find_map(|k| {
                k.split('-')
                    .next()
                    .filter(|v| js::parse_version(v).is_some())
            })
            .map(str::to_string)
    };
    let available = uv(&["python", "list", "--only-downloads"]);
    let installed = uv(&["python", "list", "--only-installed"]);
    rows.push(Row {
        kind: "runtime",
        id: "python".into(),
        latest: first_version(&available).unwrap_or_else(|| "?".into()),
        installed: {
            // uv lists one line per interpreter path; keep each build once.
            let mut seen: Vec<&str> = Vec::new();
            for k in installed
                .lines()
                .filter_map(|l| l.split_whitespace().next())
            {
                if !seen.contains(&k) {
                    seen.push(k);
                }
            }
            seen.join(" ")
        },
        active: std::fs::read_to_string(dir.join(".python-version"))
            .map(|v| format!("{} [.python-version]", v.trim()))
            .unwrap_or_else(|_| "-".into()),
        source: "uv python list (python-build-standalone)".into(),
    });
    rows
}

/// JavaScriptCore revision Bun ships, read from the Bun release tag (scripts/build/deps/webkit.ts).
fn jsc_row(bun_latest: Option<&str>) -> Row {
    let rev = bun_latest.and_then(|v| {
        let url = format!(
            "https://raw.githubusercontent.com/oven-sh/bun/bun-v{v}/scripts/build/deps/webkit.ts"
        );
        let body = up::fetch::get(&url, &[]).ok()?;
        let text = String::from_utf8_lossy(&body).into_owned();
        let line = text
            .lines()
            .find(|l| l.contains("WEBKIT_VERSION ="))?
            .to_string();
        line.split('"')
            .nth(1)
            .map(|s| format!("oven-sh/WebKit@{} (bun {v})", &s[..s.len().min(12)]))
    });
    Row {
        kind: "js-engine",
        id: "javascriptcore".into(),
        latest: rev.unwrap_or_else(|| "?".into()),
        installed: "in bun".into(),
        active: "-".into(),
        source: "https://github.com/oven-sh/bun (scripts/build/deps/webkit.ts)".into(),
    }
}

/// V8 and Dawn of every Chrome channel (chromiumdash, then the DEPS of the channel tag).
fn channel_rows() -> Vec<Row> {
    let parsed = aphrody_conformance::channels::fetch_toml("Windows", "ay rt matrix")
        .and_then(|t| aphrody_conformance::channels::parse_toml(&t));
    match parsed {
        Ok(chs) => chs
            .into_iter()
            .flat_map(|c| {
                let dawn = c
                    .deps
                    .iter()
                    .find(|(k, _)| k == "dawn_revision")
                    .map(|(_, v)| v[..v.len().min(12)].to_string())
                    .unwrap_or_else(|| "?".into());
                [
                    Row {
                        kind: "js-engine",
                        id: format!("v8@{}", c.name),
                        latest: format!("{} (chromium {})", c.v8, c.chromium),
                        installed: "-".into(),
                        active: "-".into(),
                        source: "https://chromiumdash.appspot.com/fetch_releases".into(),
                    },
                    Row {
                        kind: "gpu",
                        id: format!("dawn@{}", c.name),
                        latest: format!("{dawn} (chromium {})", c.chromium),
                        installed: "-".into(),
                        active: "-".into(),
                        source: "https://chromium.googlesource.com/chromium/src/+/refs/tags/<version>/DEPS".into(),
                    },
                ]
            })
            .collect(),
        Err(e) => vec![Row {
            kind: "js-engine",
            id: "v8".into(),
            latest: format!("? ({e})"),
            installed: "-".into(),
            active: "-".into(),
            source: "https://chromiumdash.appspot.com/fetch_releases".into(),
        }],
    }
}

fn engine_rows(dir: &Path) -> Vec<Row> {
    let active = std::fs::read_to_string(dir.join(ENGINE_FILE))
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    let json = match facade(&["matrix", "--json"]) {
        Ok(j) => j,
        Err(e) => {
            return vec![Row {
                kind: "engine",
                id: "engines".into(),
                latest: format!("? ({e})"),
                installed: "-".into(),
                active: "-".into(),
                source: "packages/chromium-bun/src/engines".into(),
            }];
        }
    };
    let v: serde_json::Value = serde_json::from_str(&json).unwrap_or_default();
    let s = |r: &serde_json::Value, k: &str| {
        r.get(k).and_then(|x| x.as_str()).unwrap_or("-").to_string()
    };
    v.as_array()
        .map(|a| {
            a.iter()
                .map(|r| {
                    let id = s(r, "id");
                    Row {
                        kind: match r.get("role").and_then(|p| p.as_str()) {
                            Some("render") => "render",
                            Some("js-engine") => "js-engine",
                            Some("gpu") => "gpu",
                            Some("tool") => "tool",
                            Some("library") => "library",
                            _ => "browser",
                        },
                        active: if id == active {
                            "yes [.engine-version]".into()
                        } else {
                            "-".into()
                        },
                        latest: format!("{} js={} gpu={}", s(r, "latest"), s(r, "js"), s(r, "gpu")),
                        installed: s(r, "installed"),
                        source: s(r, "source"),
                        id,
                    }
                })
                .collect()
        })
        .unwrap_or_default()
}

pub fn matrix(tools: &Path, json: bool) -> Result<i32, String> {
    let dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let mut rows = runtime_rows(tools, &dir);
    let bun_latest = rows
        .iter()
        .find(|r| r.id == "bun")
        .and_then(|r| r.latest.split_whitespace().next())
        .filter(|v| js::parse_version(v).is_some())
        .map(str::to_string);
    rows.push(jsc_row(bun_latest.as_deref()));
    rows.extend(channel_rows());
    rows.extend(engine_rows(&dir));
    if json {
        let v: Vec<_> = rows.iter().map(Row::json).collect();
        println!(
            "{}",
            serde_json::to_string_pretty(&v).map_err(|e| e.to_string())?
        );
    } else {
        println!("KIND\tID\tLATEST\tINSTALLED\tACTIVE\tSOURCE");
        for r in &rows {
            println!(
                "{}\t{}\t{}\t{}\t{}\t{}",
                r.kind, r.id, r.latest, r.installed, r.active, r.source
            );
        }
    }
    Ok(0)
}

/// Exact version for a runtime request: the newest installed match, else the newest live release.
pub fn resolve(tools: &Path, runtime: &str, want: &str) -> Result<(String, bool), String> {
    let rels = js::releases(runtime)?;
    let installed = js::installed(tools, runtime);
    let is_alias = matches!(
        want.to_ascii_lowercase().as_str(),
        "" | "latest" | "current" | "stable" | "node" | "*"
    ) || want.to_ascii_lowercase().starts_with("lts");
    if !is_alias && let Some(v) = installed.iter().find(|v| js::satisfies(v, want)) {
        return Ok((v.clone(), true));
    }
    let r = js::pick(&rels, want).ok_or_else(|| {
        format!(
            "no {runtime} release matches {want} ({})",
            js::source(runtime)
        )
    })?;
    let have = installed.contains(&r.version);
    Ok((r.version.clone(), have))
}

pub fn install_runtime(tools: &Path, runtime: &str, version: &str) -> Result<String, String> {
    match runtime {
        "node" => js::install_node(tools, version),
        "deno" => js::install_deno(tools, version),
        "bun" => crate::install_bun_version(version),
        other => Err(format!("unknown JS runtime {other} (node, deno, bun)")),
    }
}

/// Print what a project asks for and what each request resolves to now.
pub fn detect(tools: &Path) -> Result<i32, String> {
    let dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let rts = js::project_runtimes(&dir);
    if rts.is_empty() {
        println!(
            "no JS runtime declared here (.nvmrc, .node-version, .dvmrc, .bun-version, package.json engines, deno.json, bunfig.toml)"
        );
    }
    for rt in rts {
        let (want, from) = js::project_request(&dir, rt)
            .unwrap_or(("latest".into(), "fallback: latest stable".into()));
        match resolve(tools, rt, &want) {
            Ok((v, have)) => println!(
                "{rt}\t{want}\t[{from}]\t-> {v}{}",
                if have {
                    " (installed)"
                } else {
                    " (not installed)"
                }
            ),
            Err(e) => println!("{rt}\t{want}\t[{from}]\t-> ? {e}"),
        }
    }
    if let Ok(e) = std::fs::read_to_string(dir.join(ENGINE_FILE)) {
        println!("engine\t{}\t[{ENGINE_FILE}]", e.trim());
    }
    Ok(0)
}

/// Install and select a combination; idempotent (installed versions and engines are reused).
pub fn switch(
    tools: &Path,
    runtimes: &[String],
    engines: &[String],
    gpu: Option<&str>,
    auto: bool,
    write: bool,
) -> Result<i32, String> {
    let dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let mut wanted: Vec<(String, String)> = runtimes
        .iter()
        .map(|s| {
            let (n, v) = crate::split_spec(s);
            (n.to_string(), v.unwrap_or("latest").to_string())
        })
        .collect();
    let mut engines: Vec<String> = engines.to_vec();
    if auto {
        for rt in js::project_runtimes(&dir) {
            if !wanted.iter().any(|(n, _)| n == rt) {
                let want = js::project_request(&dir, rt)
                    .map(|(v, _)| v)
                    .unwrap_or_else(|| "latest".into());
                wanted.push((rt.to_string(), want));
            }
        }
        if engines.is_empty()
            && let Ok(e) = std::fs::read_to_string(dir.join(ENGINE_FILE))
        {
            engines.push(e.trim().to_string());
        }
    }
    for (rt, want) in &wanted {
        if rt == "python" {
            crate::status("uv", &["python".into(), "install".into(), want.clone()])?;
            if write {
                crate::status("uv", &["python".into(), "pin".into(), want.clone()])?;
            }
            continue;
        }
        let (version, have) = resolve(tools, rt, want)?;
        if !have {
            println!("{}", install_runtime(tools, rt, &version)?);
        }
        if write && let Some(f) = js::version_file(rt) {
            // Keep a range the project already wrote; record the exact version otherwise.
            if js::project_request(&dir, rt).map(|(w, _)| w) != Some(want.clone()) {
                std::fs::write(dir.join(f), format!("{version}\n")).map_err(|e| e.to_string())?;
            }
        }
        println!(
            "{rt} {version} active ({})",
            js::runtime_bin(&js::runtime_dir(tools, rt, &version), rt).display()
        );
    }
    if let Some(g) = gpu {
        let list = facade(&["matrix", "--json"])?;
        let v: serde_json::Value = serde_json::from_str(&list).map_err(|e| e.to_string())?;
        for e in &engines {
            let backend = v
                .as_array()
                .and_then(|a| {
                    a.iter()
                        .find(|r| r.get("id").and_then(|i| i.as_str()) == Some(e))
                })
                .and_then(|r| r.get("gpu").and_then(|x| x.as_str()))
                .unwrap_or("none");
            if backend != g {
                return Err(format!("{e} uses WebGPU backend {backend}, not {g}"));
            }
        }
        if engines.is_empty() && wanted.iter().any(|(n, _)| n == "deno") && g != "wgpu" {
            return Err(format!("deno implements WebGPU with wgpu, not {g}"));
        }
    }
    for e in &engines {
        print!("{}", facade(&["install", e])?);
    }
    if write && let Some(e) = engines.first() {
        std::fs::write(dir.join(ENGINE_FILE), format!("{e}\n")).map_err(|e| e.to_string())?;
    }
    Ok(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rows_render_as_json() {
        let r = Row {
            kind: "runtime",
            id: "node".into(),
            latest: "26.13.1".into(),
            installed: "-".into(),
            active: "-".into(),
            source: js::NODE_INDEX.into(),
        };
        assert_eq!(r.json()["id"], "node");
        assert_eq!(r.json()["source"], js::NODE_INDEX);
    }
}
