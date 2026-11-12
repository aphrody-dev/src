//! `fetch <config>`: the `fetch_configs/*.py` specs as data, and the `.gclient` text that
//! `fetch.py` (`GclientGitCheckout._format_spec`) writes for them.

use crate::value::{Dict, Value};
use crate::{Error, Result};

/// One `fetch_configs/<name>.py`.
struct Config {
    name: &'static str,
    root: &'static str,
    solution: &'static str,
    url: &'static str,
    /// Solution keys in upstream order after name and url.
    deps_file: bool,
    custom_deps: bool,
    custom_vars: bool,
    managed: bool,
    with_branch_heads: bool,
    /// Reads `--target_os` / `--target_os_only`.
    target_os: bool,
    target_os_only: bool,
}

const fn c(
    name: &'static str,
    root: &'static str,
    solution: &'static str,
    url: &'static str,
) -> Config {
    Config {
        name,
        root,
        solution,
        url,
        deps_file: true,
        custom_deps: true,
        custom_vars: false,
        managed: false,
        with_branch_heads: false,
        target_os: false,
        target_os_only: false,
    }
}

/// Upstream configs whose spec does not depend on properties (besides `target_os`).
const CONFIGS: &[Config] = &[
    Config {
        custom_deps: false,
        custom_vars: true,
        target_os: true,
        ..c(
            "angle",
            "",
            ".",
            "https://chromium.googlesource.com/angle/angle.git",
        )
    },
    Config {
        deps_file: false,
        target_os: true,
        target_os_only: true,
        ..c(
            "breakpad",
            "src",
            "src",
            "https://chromium.googlesource.com/breakpad/breakpad.git",
        )
    },
    c(
        "catapult",
        "catapult",
        "catapult",
        "https://chromium.googlesource.com/catapult",
    ),
    Config {
        deps_file: false,
        custom_vars: true,
        target_os: true,
        target_os_only: true,
        ..c(
            "chromium",
            "src",
            "src",
            "https://chromium.googlesource.com/chromium/src.git",
        )
    },
    Config {
        deps_file: false,
        custom_deps: false,
        ..c(
            "crashpad",
            "crashpad",
            "crashpad",
            "https://chromium.googlesource.com/crashpad/crashpad.git",
        )
    },
    c(
        "crossbench",
        "crossbench",
        "crossbench",
        "https://chromium.googlesource.com/crossbench.git",
    ),
    Config {
        target_os: true,
        ..c(
            "dart",
            "sdk",
            "sdk",
            "https://dart.googlesource.com/sdk.git",
        )
    },
    c(
        "dawn",
        "dawn",
        "dawn",
        "https://dawn.googlesource.com/dawn.git",
    ),
    Config {
        custom_deps: false,
        ..c(
            "depot_tools",
            "depot_tools",
            "depot_tools",
            "https://chromium.googlesource.com/chromium/tools/depot_tools.git",
        )
    },
    Config {
        with_branch_heads: true,
        ..c(
            "devtools-frontend",
            "devtools-frontend",
            "devtools-frontend",
            "https://chromium.googlesource.com/devtools/devtools-frontend.git",
        )
    },
    Config {
        custom_deps: false,
        ..c("gn", "gn", "gn", "https://gn.googlesource.com/gn.git")
    },
    Config {
        deps_file: false,
        ..c(
            "gyp",
            "gyp",
            "gyp",
            "https://chromium.googlesource.com/external/gyp.git",
        )
    },
    Config {
        deps_file: false,
        custom_deps: false,
        custom_vars: true,
        managed: true,
        ..c(
            "infra_superproject",
            ".",
            ".",
            "https://chromium.googlesource.com/infra/infra_superproject.git",
        )
    },
    Config {
        deps_file: false,
        ..c(
            "inspector_protocol",
            "src",
            "src",
            "https://chromium.googlesource.com/deps/inspector_protocol.git",
        )
    },
    c(
        "ipcz",
        "ipcz",
        "ipcz",
        "https://chromium.googlesource.com/chromium/src/third_party/ipcz",
    ),
    c(
        "libyuv",
        "src",
        "src",
        "https://chromium.googlesource.com/libyuv/libyuv.git",
    ),
    Config {
        target_os: true,
        target_os_only: true,
        ..c(
            "nacl",
            "native_client",
            "native_client",
            "https://chromium.googlesource.com/native_client/src/native_client.git",
        )
    },
    Config {
        target_os: true,
        target_os_only: true,
        ..c(
            "naclports",
            "src",
            "src",
            "https://chromium.googlesource.com/external/naclports.git",
        )
    },
    c(
        "node-ci",
        "node-ci",
        "node-ci",
        "https://chromium.googlesource.com/v8/node-ci.git",
    ),
    c(
        "openscreen",
        "openscreen",
        "openscreen",
        "https://chromium.googlesource.com/openscreen.git",
    ),
    Config {
        deps_file: false,
        custom_deps: false,
        custom_vars: true,
        target_os: true,
        target_os_only: true,
        ..c(
            "pdfium",
            "pdfium",
            "pdfium",
            "https://pdfium.googlesource.com/pdfium.git",
        )
    },
    Config {
        custom_deps: false,
        ..c(
            "skia",
            "skia",
            "skia",
            "https://skia.googlesource.com/skia.git",
        )
    },
    Config {
        custom_deps: false,
        ..c(
            "skia_buildbot",
            "buildbot",
            "buildbot",
            "https://skia.googlesource.com/buildbot.git",
        )
    },
    Config {
        custom_deps: false,
        ..c(
            "syzygy",
            "src",
            "src",
            "https://chromium.googlesource.com/syzygy",
        )
    },
    Config {
        with_branch_heads: true,
        ..c(
            "v8",
            "v8",
            "v8",
            "https://chromium.googlesource.com/v8/v8.git",
        )
    },
    c(
        "v8_perf",
        "v8-perf",
        "v8-perf",
        "https://chrome-internal.googlesource.com/v8/v8-perf.git",
    ),
    c(
        "web-tests",
        "web-tests",
        "web-tests",
        "https://chromium.googlesource.com/chromium/web-tests",
    ),
    Config {
        with_branch_heads: true,
        ..c(
            "web-workload",
            "web-workload",
            "web-workload",
            "https://chromium.googlesource.com/web-workload.git",
        )
    },
    c(
        "webpagereplay",
        "webpagereplay",
        "webpagereplay",
        "https://chromium.googlesource.com/webpagereplay.git",
    ),
    Config {
        with_branch_heads: true,
        target_os: true,
        ..c(
            "webrtc",
            "src",
            "src",
            "https://webrtc.googlesource.com/src.git",
        )
    },
    Config {
        deps_file: false,
        ..c(
            "website",
            "website",
            "website",
            "https://chromium.googlesource.com/website.git",
        )
    },
    c(
        "xnnpack",
        "XNNPACK",
        "XNNPACK",
        "https://github.com/google/XNNPACK.git",
    ),
];

/// `{"alias": ...}` configs: (name, target config, extra properties).
const ALIASES: &[(&str, &str, &[&str])] = &[
    ("android", "chromium", &["--target_os=android"]),
    (
        "android_internal",
        "chromium",
        &["--target_os=android", "--internal=True"],
    ),
    ("chrome", "chromium", &["--internal=True"]),
    ("infra", "infra_superproject", &[]),
    (
        "infra_internal",
        "infra_superproject",
        &["--checkout_internal=True"],
    ),
    (
        "ios",
        "chromium",
        &["--target_os=ios", "--target_os_only=True"],
    ),
    (
        "ios_internal",
        "chromium",
        &[
            "--internal=True",
            "--target_os=ios",
            "--target_os_only=True",
        ],
    ),
    ("webrtc_android", "webrtc", &["--target_os=android,unix"]),
    ("webrtc_ios", "webrtc", &["--target_os=ios,mac"]),
];

/// Names `ay fetch --list` prints.
pub fn config_names() -> Vec<&'static str> {
    let mut v: Vec<&str> = CONFIGS
        .iter()
        .map(|c| c.name)
        .chain(ALIASES.iter().map(|a| a.0))
        .collect();
    v.sort_unstable();
    v
}

/// A resolved fetch spec: the gclient spec dict plus the checkout root.
#[derive(Debug, Clone, PartialEq)]
pub struct Spec {
    pub spec: Dict,
    pub root: String,
    pub with_branch_heads: bool,
}

fn props_of(args: &[String]) -> Result<Dict> {
    let mut d = Dict::new();
    for a in args {
        let Some((k, v)) = a.strip_prefix("--").and_then(|x| x.split_once('=')) else {
            return Err(Error::new(format!("Got bad arguments ['{a}']")));
        };
        d.insert(k, Value::Str(v.to_string()));
    }
    Ok(d)
}

fn truthy_prop(props: &Dict, key: &str) -> bool {
    props.get_str(key) == Some("True")
}

/// `run_config_fetch(config, props)`.
pub fn spec(config: &str, props: &[String]) -> Result<Spec> {
    if let Some((_, target, extra)) = ALIASES.iter().find(|a| a.0 == config) {
        let all: Vec<String> = extra
            .iter()
            .map(|s| s.to_string())
            .chain(props.iter().cloned())
            .collect();
        return spec(target, &all);
    }
    if config == "node" {
        let mut s = spec("node-ci", props)?;
        s.root = "node".into();
        let sol = solution_mut(&mut s.spec);
        sol.insert("name", Value::Str("node".into()));
        let mut cv = Dict::new();
        cv.insert("build_upstream_node", Value::Bool(true));
        cv.insert(
            "node_url",
            Value::Str("https://github.com/nodejs/node.git".into()),
        );
        cv.insert("node_revision", Value::Str("main".into()));
        sol.insert("custom_vars", Value::Dict(cv));
        return Ok(s);
    }
    let cfg = CONFIGS
        .iter()
        .find(|c| c.name == config)
        .ok_or_else(|| Error::new(format!("Could not find a config for {config}")))?;
    let props = props_of(props)?;
    let mut sol = Dict::new();
    sol.insert("name", Value::Str(cfg.solution.into()));
    sol.insert("url", Value::Str(cfg.url.into()));
    if cfg.managed {
        sol.insert("managed", Value::Bool(true));
    }
    if cfg.deps_file {
        sol.insert("deps_file", Value::Str("DEPS".into()));
    }
    if cfg.custom_deps {
        sol.insert("custom_deps", Value::Dict(Dict::new()));
    }
    if cfg.custom_vars {
        let mut cv = Dict::new();
        if config == "chromium" {
            if props.get_str("webkit_revision") == Some("ToT") {
                cv.insert("webkit_revision", Value::Str(String::new()));
            }
            if truthy_prop(&props, "internal") {
                cv.insert("checkout_src_internal", Value::Bool(true));
            }
        }
        if config == "infra_superproject" && truthy_prop(&props, "checkout_internal") {
            cv.insert("checkout_internal", Value::Bool(true));
        }
        if config == "angle" && truthy_prop(&props, "internal") {
            cv.insert("checkout_angle_internal", Value::Bool(true));
        }
        if config == "pdfium"
            && let Some(c) = props
                .get_str("checkout_configuration")
                .filter(|s| !s.is_empty())
        {
            cv.insert("checkout_configuration", Value::Str(c.to_string()));
        }
        sol.insert("custom_vars", Value::Dict(cv));
    }
    let mut spec = Dict::new();
    spec.insert("solutions", Value::List(vec![Value::Dict(sol)]));
    if cfg.with_branch_heads {
        spec.insert("with_branch_heads", Value::Bool(true));
    }
    if cfg.target_os
        && let Some(os) = props.get_str("target_os").filter(|s| !s.is_empty())
    {
        spec.insert(
            "target_os",
            Value::List(os.split(',').map(|s| Value::Str(s.into())).collect()),
        );
    }
    if cfg.target_os_only
        && let Some(only) = props.get("target_os_only").filter(|v| v.truthy())
    {
        spec.insert("target_os_only", only.clone());
    }
    if config == "webrtc"
        && let Some(c) = props.get_str("cache_dir").filter(|s| !s.is_empty())
    {
        spec.insert("cache_dir", Value::Str(c.to_string()));
    }
    Ok(Spec {
        spec,
        root: cfg.root.into(),
        with_branch_heads: cfg.with_branch_heads,
    })
}

fn solution_mut(spec: &mut Dict) -> &mut Dict {
    match spec.get_mut("solutions") {
        Some(Value::List(l)) => l[0].as_dict_mut().expect("solution dict"),
        _ => unreachable!("specs always have one solution"),
    }
}

fn literal(v: &Value) -> String {
    match v {
        Value::Str(s) | Value::ConstStr(s) => format!("\"{s}\""),
        Value::List(l) => format!("[{}]", l.iter().map(literal).collect::<Vec<_>>().join(", ")),
        other => other.to_string(),
    }
}

/// `_format_spec`: the `.gclient` file written by `gclient config --spec`.
pub fn gclient_text(spec: &Dict, cache_dir: Option<&str>) -> String {
    let mut sols = Vec::new();
    for s in spec
        .get("solutions")
        .and_then(Value::as_seq)
        .unwrap_or_default()
    {
        let lines: Vec<String> = s
            .as_dict()
            .map(|d| {
                d.iter()
                    .map(|(k, v)| format!("    \"{k}\": {},", literal(v)))
                    .collect()
            })
            .unwrap_or_default();
        sols.push(format!("  {{\n{}\n  }},", lines.join("\n")));
    }
    let mut out = format!("solutions = [\n{}\n]\n", sols.join("\n"));
    let mut extra = spec.clone();
    if let Some(c) = cache_dir {
        extra.insert("cache_dir", Value::Str(c.to_string()));
    }
    for key in ["target_os", "target_os_only", "cache_dir", "cache_mode"] {
        if let Some(v) = extra.get(key) {
            out.push_str(&format!("{key} = {}\n", literal(v)));
        }
    }
    out
}

/// JSON as `json.dumps` prints it (", " and ": " separators), for comparing with upstream.
pub fn to_json(v: &Value) -> String {
    match v {
        Value::None => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::Int(i) => i.to_string(),
        Value::Str(s) | Value::ConstStr(s) => {
            let mut o = String::from("\"");
            for ch in s.chars() {
                match ch {
                    '"' => o.push_str("\\\""),
                    '\\' => o.push_str("\\\\"),
                    '\n' => o.push_str("\\n"),
                    c if (c as u32) < 0x20 || (c as u32) > 0x7e => {
                        o.push_str(&format!("\\u{:04x}", c as u32))
                    }
                    c => o.push(c),
                }
            }
            o.push('"');
            o
        }
        Value::List(l) | Value::Tuple(l) => {
            format!("[{}]", l.iter().map(to_json).collect::<Vec<_>>().join(", "))
        }
        Value::Dict(d) => format!(
            "{{{}}}",
            d.iter()
                .map(|(k, v)| format!("{}: {}", to_json(&Value::Str(k.clone())), to_json(v)))
                .collect::<Vec<_>>()
                .join(", ")
        ),
    }
}

/// The JSON that `fetch_configs/<config>.py fetch` prints.
pub fn upstream_json(s: &Spec) -> String {
    let mut d = Dict::new();
    d.insert("type", Value::Str("gclient_git".into()));
    d.insert("gclient_git_spec", Value::Dict(s.spec.clone()));
    to_json(&Value::Dict(d))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chromium_spec_and_gclient_file() {
        let s = spec("android_internal", &[]).unwrap();
        assert_eq!(s.root, "src");
        assert_eq!(
            upstream_json(&s),
            r#"{"type": "gclient_git", "gclient_git_spec": {"solutions": [{"name": "src", "url": "https://chromium.googlesource.com/chromium/src.git", "custom_deps": {}, "custom_vars": {"checkout_src_internal": true}}], "target_os": ["android"]}}"#
        );
        let text = gclient_text(&spec("chromium", &[]).unwrap().spec, None);
        assert_eq!(
            text,
            "solutions = [\n  {\n    \"name\": \"src\",\n    \"url\": \"https://chromium.googlesource.com/chromium/src.git\",\n    \"custom_deps\": {},\n    \"custom_vars\": {},\n  },\n]\n"
        );
        // The text is a valid .gclient file for our own loader.
        assert!(crate::eval::parse_local_config(&text, ".gclient").is_ok());
        assert!(spec("nope", &[]).is_err());
    }
}
