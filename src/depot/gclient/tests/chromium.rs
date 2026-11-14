//! Tests on the real checkout in `third_party/chromium` and on depot_tools' own test data.
//! They skip (pass with a note) when the checkout is absent, as in a fresh clone.

use depot_gclient::tree::{Client, Options, render_revinfo};
use depot_gclient::{Value, deps, eval};
use std::path::{Path, PathBuf};
use std::process::Command;

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../../crates")
        .canonicalize()
        .unwrap()
}

fn chromium() -> Option<PathBuf> {
    let p = repo_root().join("third_party/chromium");
    (p.join(".gclient").is_file() && p.join("src/DEPS").is_file()).then_some(p)
}

fn depot_tools() -> Option<PathBuf> {
    let p = repo_root().join("third_party/depot_tools");
    p.join("gclient.py").is_file().then_some(p)
}

#[test]
fn chromium_deps_evaluates() {
    let Some(root) = chromium() else {
        return eprintln!("skip: no third_party/chromium checkout");
    };
    let content = std::fs::read_to_string(root.join("src/DEPS")).unwrap();
    let scope = deps::parse(&content, "src/DEPS", None, None).unwrap();
    let deps = scope.get("deps").unwrap().as_dict().unwrap();
    assert!(
        deps.len() > 300,
        "chromium has hundreds of deps, got {}",
        deps.len()
    );
    assert_eq!(scope.get_str("git_dependencies"), Some("SYNC"));
    let hooks = scope.get("hooks").unwrap().as_seq().unwrap();
    assert!(hooks.len() > 50);
    // Every git dep URL is fully expanded.
    for (name, info) in deps.iter() {
        let info = info.as_dict().unwrap();
        if let Some(Value::Str(url)) = info.get("url") {
            assert!(!url.contains('{'), "{name}: unexpanded {url}");
        }
    }
}

#[test]
fn chromium_tree_loads() {
    let Some(root) = chromium() else {
        return eprintln!("skip: no third_party/chromium checkout");
    };
    let opts = Options {
        host_os: Some("win".into()),
        host_cpu: Some("x64".into()),
        ..Default::default()
    };
    let c = Client::load(&root, opts).unwrap();
    let info = c.revinfo(&[]);
    assert!(info.len() > 200);
    assert_eq!(info[0].0, "src");
}

/// The gclient_eval unit-test inputs used by depot_tools (`tests/gclient_eval_unittest.py`),
/// evaluated through our port.
#[test]
fn depot_tools_eval_cases() {
    let cases = [
        ("a = {'b': Var('c')}\nvars = {'c': 'd'}\n", true),
        ("vars = {'foo': Str('bar')}\nx = Var('foo')\n", true),
        ("x = Var('undeclared')\n", false),
        ("a = 1 + 'x'\n", false),
        ("x = Foo('b')\n", false),
        ("x = {'a': 1, 'a': 2}\n", false),
    ];
    for (src, ok) in cases {
        assert_eq!(eval::exec(src, "t", None, None).is_ok(), ok, "{src}");
    }
}

/// `gclient revinfo` from upstream (bundled Python) against ours. Slow (about 15 s), so it runs
/// on demand: `cargo test -p depot-gclient --test chromium -- --ignored revinfo`.
#[test]
#[ignore]
fn revinfo_matches_upstream() {
    let (Some(root), Some(dt)) = (chromium(), depot_tools()) else {
        return eprintln!("skip");
    };
    let python = std::fs::read_to_string(dt.join("python3_bin_reldir.txt"))
        .map(|r| {
            dt.join(r.trim()).join(if cfg!(windows) {
                "python3.exe"
            } else {
                "python3"
            })
        })
        .unwrap();
    for deps_os in [
        None,
        Some("all"),
        Some("unix,android"),
        Some("mac,ios"),
        Some("chromeos,fuchsia"),
    ] {
        let mut cmd = Command::new(&python);
        cmd.arg(dt.join("gclient.py")).arg("revinfo");
        if let Some(d) = deps_os {
            cmd.arg(format!("--deps={d}"));
        }
        let out = cmd
            .current_dir(&root)
            .env("DEPOT_TOOLS_UPDATE", "0")
            .env("DEPOT_TOOLS_METRICS", "0")
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        let upstream = String::from_utf8(out.stdout).unwrap().replace("\r\n", "\n");
        let ours = render_revinfo(
            &Client::load(
                &root,
                Options {
                    deps_os: deps_os.map(str::to_string),
                    ..Default::default()
                },
            )
            .unwrap()
            .revinfo(&[]),
        );
        if upstream != ours {
            let up: Vec<&str> = upstream.lines().collect();
            let me: Vec<&str> = ours.lines().collect();
            for l in &up {
                if !me.contains(l) {
                    eprintln!("- {l}");
                }
            }
            for l in &me {
                if !up.contains(l) {
                    eprintln!("+ {l}");
                }
            }
            panic!(
                "revinfo {deps_os:?} differs: upstream {} lines, ours {}",
                up.len(),
                me.len()
            );
        }
        eprintln!(
            "revinfo {deps_os:?}: {} lines identical",
            ours.lines().count()
        );
    }
}

fn upstream_python(dt: &Path) -> PathBuf {
    let rel = std::fs::read_to_string(dt.join("python3_bin_reldir.txt")).unwrap();
    dt.join(rel.trim()).join(if cfg!(windows) {
        "python3.exe"
    } else {
        "python3"
    })
}

/// `gclient setdep` on a copy of chromium's DEPS, upstream against ours, byte for byte.
#[test]
#[ignore]
fn setdep_matches_upstream() {
    let (Some(root), Some(dt)) = (chromium(), depot_tools()) else {
        return eprintln!("skip");
    };
    let original = std::fs::read_to_string(root.join("src/DEPS")).unwrap();
    let cases: &[&[&str]] = &[
        &[
            "-r",
            "src/third_party/snappy/src@0123456789abcdef0123456789abcdef01234567",
        ],
        &[
            "-r",
            "src/buildtools/win:gn/gn/windows-amd64@git_revision:1111111111111111111111111111111111111111",
        ],
        &[
            "--var",
            "v8_revision=aaaabbbbccccddddeeeeffff0000111122223333",
        ],
        &["--var", "brand_new_var=xyz"],
    ];
    for (i, case) in cases.iter().enumerate() {
        let dir = std::env::temp_dir().join(format!("ay-setdep-{}-{i}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("DEPS");
        std::fs::write(&file, &original).unwrap();
        let st = Command::new(upstream_python(&dt))
            .arg(dt.join("gclient.py"))
            .arg("setdep")
            .args(*case)
            .args(["--deps-file", "DEPS"])
            .current_dir(&dir)
            .env("DEPOT_TOOLS_UPDATE", "0")
            .output()
            .unwrap();
        assert!(
            st.status.success(),
            "{}",
            String::from_utf8_lossy(&st.stderr)
        );
        let upstream = std::fs::read_to_string(&file).unwrap();
        let mut ed = depot_gclient::edit::DepsEditor::new(original.clone(), "DEPS", None);
        match case[0] {
            "--var" => {
                let (k, v) = case[1].split_once('=').unwrap();
                ed.set_var(k, v).unwrap();
            }
            _ => {
                let (dep, rev) = case[1].rsplit_once('@').unwrap();
                match dep.split_once(':') {
                    Some((p, pkg)) => ed.set_cipd(p, pkg, rev).unwrap(),
                    None => ed.set_revision(dep, rev).unwrap(),
                }
            }
        }
        assert_eq!(upstream, ed.into_content(), "setdep {case:?}");
        let _ = std::fs::remove_dir_all(&dir);
    }
}

/// Every `fetch_configs/*.py fetch` JSON against our table.
#[test]
#[ignore]
fn fetch_configs_match_upstream() {
    let Some(dt) = depot_tools() else {
        return eprintln!("skip");
    };
    let py = upstream_python(&dt);
    let props: &[&[&str]] = &[&[], &["--target_os=android,ios"], &["--internal=True"]];
    for name in depot_gclient::fetch::config_names() {
        for p in props {
            let mut cfg = name.to_string();
            let mut all: Vec<String> = p.iter().map(|s| s.to_string()).collect();
            // Aliases: resolve like fetch.py does, then compare the target config's output.
            loop {
                let out = Command::new(&py)
                    .arg(dt.join("fetch_configs").join(format!("{cfg}.py")))
                    .arg("fetch")
                    .args(&all)
                    .output()
                    .unwrap();
                let text = String::from_utf8(out.stdout).unwrap();
                if let Some(rest) = text.strip_prefix("{\"alias\": {\"config\": \"") {
                    let (target, tail) = rest.split_once('"').unwrap();
                    let extra: Vec<String> = tail
                        .split('[')
                        .nth(1)
                        .unwrap()
                        .split(']')
                        .next()
                        .unwrap()
                        .split(", ")
                        .filter(|s| !s.is_empty())
                        .map(|s| s.trim_matches('"').to_string())
                        .collect();
                    cfg = target.to_string();
                    all = extra.into_iter().chain(all).collect();
                    continue;
                }
                let ours = depot_gclient::fetch::upstream_json(
                    &depot_gclient::fetch::spec(
                        name,
                        &p.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
                    )
                    .unwrap(),
                );
                assert_eq!(text.trim_end(), ours, "fetch {name} {p:?}");
                break;
            }
        }
    }
}
