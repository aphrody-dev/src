//! `ay bun bump`: the Bun version pins of the monorepo, and the edits that move them to a
//! release. Proposed by default; `--write` applies them line by line.
//!
//! Pins: src.lock.json `toolchains.bun`, tools.toml `[[tool]] name = "bun"`,
//! packages/machine/toolchains.lock.toml `[toolchain."bun"]` (URLs and sha256 from the
//! release's GitHub digests), package.json `engines.bun` / `packageManager`, `.bun-version`,
//! workflow `bun-version:`, infra/docker `BUN_VERSION`, `.env.example`.

use super::watch::Gh;
use super::{BumpArgs, bold, dim, error, parse_version, str_of, warn};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::path::Path;
use std::process::{Command, Stdio};

const FIXED: &[&str] = &[
    "src.lock.json",
    "tools.toml",
    "packages/machine/toolchains.lock.toml",
    "infra/docker/Dockerfile",
    "infra/docker/docker-bake.hcl",
    ".env.example",
];

#[derive(Debug, Clone, PartialEq)]
pub struct Edit {
    pub file: String,
    /// 1-based.
    pub line: usize,
    pub before: String,
    pub after: String,
}

/// Asset name -> sha256 hex, from a raw GitHub release (`assets` array) or a watch summary
/// (`assets` object).
pub fn digests(release: &Value) -> BTreeMap<String, String> {
    let hex = |d: &Value| d.as_str().and_then(|s| s.strip_prefix("sha256:")).map(str::to_string);
    match &release["assets"] {
        Value::Array(a) => a.iter().filter_map(|x| Some((str_of(x, "name").to_string(), hex(&x["digest"])?))).collect(),
        Value::Object(o) => o.iter().filter_map(|(n, x)| Some((n.clone(), hex(&x["digest"])?))).collect(),
        _ => BTreeMap::new(),
    }
}

/// Replace the `x.y.z` that follows `marker` in `line` when it is older than `to`.
pub fn bump_after(line: &str, marker: &str, to: &str) -> Option<String> {
    let at = line.find(marker)? + marker.len();
    let rest = &line[at..];
    let len = rest.find(|c: char| !(c.is_ascii_digit() || c == '.')).unwrap_or(rest.len());
    let old = parse_version(&rest[..len])?;
    (old < parse_version(to)?).then(|| format!("{}{to}{}", &line[..at], &rest[len..]))
}

fn marker_for(file: &str) -> &'static [&'static str] {
    let name = file.rsplit('/').next().unwrap_or(file);
    match name {
        "package.json" => &["\"bun\": \">=", "\"bun\": \"^", "\"bun\": \"~", "\"bun\": \"", "\"packageManager\": \"bun@"],
        "src.lock.json" => &["\"bun\": \""],
        ".bun-version" => &[""],
        "Dockerfile" => &["ARG BUN_VERSION="],
        "docker-bake.hcl" => &["BUN_VERSION = \""],
        ".env.example" => &["BUN_VERSION="],
        _ if file.starts_with(".github/workflows/") => &["bun-version: "],
        _ => &[],
    }
}

/// Edits for one file's text. `sums` gives the new sha256 per asset for toolchains.lock.toml.
pub fn edits_for(file: &str, text: &str, to: &str, sums: &BTreeMap<String, String>, warnings: &mut Vec<String>) -> Vec<Edit> {
    let mut out = vec![];
    let mut block = false;
    for (i, line) in text.lines().enumerate() {
        let after = match file {
            "tools.toml" => {
                let t = line.trim();
                if t == "[[tool]]" {
                    block = false;
                } else if t == "name = \"bun\"" {
                    block = true;
                }
                if block { bump_after(line, "version = \"", to) } else { None }
            }
            "packages/machine/toolchains.lock.toml" => {
                let t = line.trim();
                if t.starts_with('[') {
                    block = t == "[toolchain.\"bun\"]";
                }
                if !block {
                    None
                } else if let Some(v) = bump_after(line, "version = \"", to) {
                    Some(v)
                } else {
                    lock_url_line(line, to, sums, warnings)
                }
            }
            _ => marker_for(file).iter().find_map(|m| if m.is_empty() && i > 0 { None } else { bump_after(line, m, to) }),
        };
        if let Some(after) = after {
            out.push(Edit { file: file.to_string(), line: i + 1, before: line.to_string(), after });
        }
    }
    out
}

/// `os = { url = ".../bun-vX/asset.zip", sha256 = "..." }` moved to `to` with the new digest.
fn lock_url_line(line: &str, to: &str, sums: &BTreeMap<String, String>, warnings: &mut Vec<String>) -> Option<String> {
    let at = line.find("/releases/download/bun-v")? + "/releases/download/bun-v".len();
    let rest = &line[at..];
    let len = rest.find('/')?;
    let old = &rest[..len];
    if parse_version(old)? >= parse_version(to)? {
        return None;
    }
    let asset_start = at + len + 1;
    let asset = line[asset_start..].split('"').next()?;
    let Some(sum) = sums.get(asset) else {
        warnings.push(format!("toolchains.lock.toml: no GitHub digest for {asset} in bun-v{to}; line left as is"));
        return None;
    };
    let moved = line.replacen(&format!("bun-v{old}/"), &format!("bun-v{to}/"), 1);
    let s = moved.find("sha256 = \"")? + "sha256 = \"".len();
    let e = s + moved[s..].find('"')?;
    Some(format!("{}{sum}{}", &moved[..s], &moved[e..]))
}

fn tracked(root: &Path) -> Vec<String> {
    let mut files: Vec<String> = FIXED.iter().map(|s| s.to_string()).collect();
    let listed = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["ls-files", "--", "*package.json", "*.bun-version", ".github/workflows/*.yml"])
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).into_owned())
        .unwrap_or_else(|| "package.json\n".into());
    files.extend(listed.lines().filter(|l| !l.starts_with("third_party/") && !l.contains("/node_modules/")).map(str::to_string));
    files.sort();
    files.dedup();
    files
}

pub fn proposals(root: &Path, to: &str, release: Option<&Value>) -> (Vec<Edit>, Vec<String>) {
    let sums = release.map(digests).unwrap_or_default();
    let mut warnings = vec![];
    if release.is_none() {
        warnings.push("no release data: toolchains.lock.toml hashes not proposed".into());
    }
    let mut edits = vec![];
    for f in tracked(root) {
        if let Ok(text) = std::fs::read_to_string(root.join(&f)) {
            edits.extend(edits_for(&f, &text, to, &sums, &mut warnings));
        }
    }
    (edits, warnings)
}

fn current(root: &Path) -> Option<String> {
    let v: Value = serde_json::from_slice(&std::fs::read(root.join("src.lock.json")).ok()?).ok()?;
    v.pointer("/toolchains/bun").and_then(Value::as_str).map(str::to_string)
}

pub fn proposals_json(root: &Path, to: &str, release: Option<&Value>) -> Value {
    let (edits, warnings) = proposals(root, to, release);
    json!({
        "version": to,
        "current": current(root),
        "edits": edits.iter().map(|e| json!({"file": e.file, "line": e.line, "before": e.before, "after": e.after})).collect::<Vec<_>>(),
        "warnings": warnings,
        "written": false,
    })
}

/// Apply the edits; each line must still read as proposed.
pub fn apply(root: &Path, edits: &[Edit]) -> Result<usize, String> {
    let mut by_file: BTreeMap<&str, Vec<&Edit>> = BTreeMap::new();
    for e in edits {
        by_file.entry(e.file.as_str()).or_default().push(e);
    }
    let mut n = 0;
    for (file, list) in by_file {
        let path = root.join(file);
        let text = std::fs::read_to_string(&path).map_err(|e| format!("{file}: {e}"))?;
        let mut lines: Vec<String> = text.split_inclusive('\n').map(str::to_string).collect();
        for e in list {
            let l = lines.get_mut(e.line - 1).ok_or_else(|| format!("{file}:{}: no such line", e.line))?;
            let eol = l[l.trim_end_matches(['\r', '\n']).len()..].to_string();
            if l.trim_end_matches(['\r', '\n']) != e.before {
                return Err(format!("{file}:{}: changed since the proposal", e.line));
            }
            *l = format!("{}{eol}", e.after);
            n += 1;
        }
        std::fs::write(&path, lines.concat()).map_err(|e| format!("{file}: {e}"))?;
    }
    Ok(n)
}

pub fn render(b: &Value) -> String {
    let mut o = String::new();
    if let Some(e) = b.get("error") {
        o.push_str(&format!("{} {e}\n", bold(&format!("{:<9}", "bump"))));
        return o;
    }
    let edits = b["edits"].as_array().cloned().unwrap_or_default();
    let cur = b["current"].as_str().unwrap_or("?");
    let verb = if b["written"].as_bool() == Some(true) { "written" } else { "proposed (ay bun bump --write)" };
    let head = if edits.is_empty() {
        format!("{cur} -> {}: nothing to change", str_of(b, "version"))
    } else {
        format!("{cur} -> {}: {} edits {verb}", str_of(b, "version"), edits.len())
    };
    o.push_str(&format!("{} {head}\n", bold(&format!("{:<9}", "bump"))));
    for e in &edits {
        o.push_str(&format!("  {}:{}\n    {} {}\n    {} {}\n", str_of(e, "file"), e["line"], dim("-"), str_of(e, "before").trim(), dim("+"), str_of(e, "after").trim()));
    }
    o
}

pub fn run(a: &BumpArgs) -> i32 {
    let root = crate::repo_root();
    let mut gh = Gh::new();
    let to = match &a.to {
        Some(v) => v.trim_start_matches("bun-v").trim_start_matches('v').to_string(),
        None => match gh.get("repos/oven-sh/bun/releases/latest", None) {
            Ok(g) => str_of(&g.body.unwrap_or_default(), "tag_name").trim_start_matches("bun-v").to_string(),
            Err(e) => {
                error(&e);
                return 1;
            }
        },
    };
    if parse_version(&to).is_none() {
        error(&format!("not a release version: {to}"));
        return 2;
    }
    let release = match gh.get(&format!("repos/oven-sh/bun/releases/tags/bun-v{to}"), None) {
        Ok(g) => g.body,
        Err(e) => {
            error(&e);
            return 1;
        }
    };
    let mut out = proposals_json(&root, &to, release.as_ref());
    if a.write {
        let edits: Vec<Edit> = out["edits"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|e| Edit { file: str_of(e, "file").into(), line: e["line"].as_u64().unwrap_or(0) as usize, before: str_of(e, "before").into(), after: str_of(e, "after").into() })
            .collect();
        match apply(&root, &edits) {
            Ok(_) => out["written"] = json!(true),
            Err(e) => {
                error(&e);
                return 1;
            }
        }
    }
    if a.json {
        println!("{}", serde_json::to_string_pretty(&out).unwrap_or_default());
    } else {
        print!("{}", render(&out));
        for w in out["warnings"].as_array().into_iter().flatten() {
            warn(w.as_str().unwrap_or(""));
        }
    }
    0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn markers() {
        assert_eq!(bump_after(r#"    "bun": ">=1.4.4""#, "\"bun\": \">=", "1.4.5").as_deref(), Some(r#"    "bun": ">=1.4.5""#));
        assert_eq!(bump_after(r#"  "packageManager": "bun@1.4.4""#, "\"packageManager\": \"bun@", "1.4.5").as_deref(), Some(r#"  "packageManager": "bun@1.4.5""#));
        assert_eq!(bump_after("        with: { bun-version: 1.4.4 }", "bun-version: ", "1.10.0").as_deref(), Some("        with: { bun-version: 1.10.0 }"));
        assert_eq!(bump_after("ARG BUN_VERSION=1.4.4", "ARG BUN_VERSION=", "1.4.4"), None, "same version");
        assert_eq!(bump_after("ARG BUN_VERSION=1.5.0", "ARG BUN_VERSION=", "1.4.9"), None, "never downgrade");
        assert_eq!(bump_after(r#""@types/bun": "1.0.0""#, "\"bun\": \"", "1.4.5"), None);
    }

    #[test]
    fn tools_toml_only_touches_the_bun_block() {
        let text = "[[tool]]\nname = \"ay\"\nversion = \"0.2.0\"\n\n[[tool]]\nname = \"bun\"\nversion = \"1.4.4\"\nlock = \"bun\"\n\n[[tool]]\nname = \"rustup\"\nversion = \"1.29.2\"\n";
        let e = edits_for("tools.toml", text, "1.4.5", &BTreeMap::new(), &mut vec![]);
        assert_eq!(e, vec![Edit { file: "tools.toml".into(), line: 7, before: "version = \"1.4.4\"".into(), after: "version = \"1.4.5\"".into() }]);
    }

    #[test]
    fn toolchains_lock_moves_urls_and_hashes() {
        let text = "[toolchain.\"protoc\"]\nversion = \"36.2\"\n\n[toolchain.\"bun\"]\nversion = \"1.4.4\"\nwindows-x86_64 = { url = \"https://github.com/oven-sh/bun/releases/download/bun-v1.4.4/bun-windows-x64.zip\", sha256 = \"cd2c\" }\nlinux-aarch64 = { url = \"https://github.com/oven-sh/bun/releases/download/bun-v1.4.4/bun-linux-aarch64.zip\", sha256 = \"baa6\" }\n\n[toolchain.\"just\"]\nversion = \"1.0.0\"\n";
        let release = json!({"assets": [{"name": "bun-windows-x64.zip", "digest": "sha256:ffff"}]});
        let mut warnings = vec![];
        let e = edits_for("packages/machine/toolchains.lock.toml", text, "1.4.5", &digests(&release), &mut warnings);
        assert_eq!(e.len(), 2);
        assert_eq!(e[0].after, "version = \"1.4.5\"");
        assert_eq!(e[1].after, "windows-x86_64 = { url = \"https://github.com/oven-sh/bun/releases/download/bun-v1.4.5/bun-windows-x64.zip\", sha256 = \"ffff\" }");
        assert_eq!(warnings.len(), 1, "aarch64 has no digest: left alone and reported");
    }

    #[test]
    fn src_lock_and_workflows() {
        let lock = "{\n    \"toolchains\": {\n        \"agy\": \"1.5.6\",\n        \"bun\": \"1.4.4\",\n        \"go\": \"go1.27\"\n    }\n}\n";
        let e = edits_for("src.lock.json", lock, "1.4.5", &BTreeMap::new(), &mut vec![]);
        assert_eq!(e.len(), 1);
        assert_eq!(e[0].line, 4);
        assert_eq!(edits_for(".bun-version", "1.4.4\n", "1.4.5", &BTreeMap::new(), &mut vec![])[0].after, "1.4.5");
        assert_eq!(edits_for(".github/workflows/x.yml", "  with: { bun-version: 1.4.4 }\n", "1.4.5", &BTreeMap::new(), &mut vec![]).len(), 1);
        assert!(edits_for("README.md", "bun 1.4.4", "1.4.5", &BTreeMap::new(), &mut vec![]).is_empty());
    }

    #[test]
    fn apply_rewrites_lines_and_keeps_line_endings() {
        let dir = std::env::temp_dir().join(format!("ay-bun-bump-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("package.json"), "{\r\n  \"engines\": {\r\n    \"bun\": \">=1.4.4\"\r\n  }\r\n}\r\n").unwrap();
        let text = std::fs::read_to_string(dir.join("package.json")).unwrap();
        let edits = edits_for("package.json", &text, "1.4.5", &BTreeMap::new(), &mut vec![]);
        assert_eq!(apply(&dir, &edits), Ok(1));
        assert_eq!(std::fs::read_to_string(dir.join("package.json")).unwrap(), "{\r\n  \"engines\": {\r\n    \"bun\": \">=1.4.5\"\r\n  }\r\n}\r\n");
        assert!(apply(&dir, &edits).is_err(), "a stale proposal is refused");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
