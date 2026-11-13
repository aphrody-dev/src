//! `ay steam`: the low-level Steam data of the host as JSON, over `crates/steam-depot` (`bun_steam`).
//!
//! One parser per format for the whole monorepo: text and binary KeyValues, `appinfo.vdf`,
//! `appmanifest_*.acf`, `libraryfolders.vdf`, compatibility tools and the Proton launch
//! environment live in `crates/steam-depot`; `ay steam` prints them as JSON for the Bun side
//! (`packages/gaming`, the `steam` plugin MCP). Credential files are never read
//! (`config.vdf`, `loginusers.vdf`, `local.vdf`, `ssfn*`). Ownership: docs/gaming/OWNERSHIP.md.

use bun_steam::config::library_folders;
use bun_steam::proton::{self, LaunchTuning};
use bun_steam::vdf::{parse_appinfo, parse_binary_vdf, parse_vdf};
use bun_steam::{find_steam_installations, list_installed_games};
use serde_json::{Value, json};
use std::path::{Path, PathBuf};

#[derive(clap::Args, Debug, PartialEq)]
#[command(after_help = "Every subcommand prints JSON on stdout.\n\nExamples:\n  ay steam root\n  ay steam apps --filter proton\n  ay steam vdf ~/.steam/steam/steamapps/libraryfolders.vdf\n  ay steam vdf ~/.steam/steam/appcache/appinfo.vdf --app 1493710\n  ay steam compat\n  ay steam env 2799860 --prefix /srv/pfx/2799860")]
pub struct SteamArgs {
    /// Steam root (default: $STEAM_PATH, else the first installation found)
    #[arg(long, global = true)]
    pub root: Option<PathBuf>,
    #[command(subcommand)]
    pub cmd: SteamCmd,
}

#[derive(clap::Subcommand, Debug, PartialEq)]
pub enum SteamCmd {
    /// Steam installations found on this host and the selected root
    Root,
    /// Library folders (libraryfolders.vdf) and the app ids each one holds
    Libraries,
    /// Installed apps from every appmanifest_*.acf
    Apps {
        /// Keep apps whose id equals, or whose name contains, this text (case-insensitive)
        #[arg(long)]
        filter: Option<String>,
    },
    /// Parse a KeyValues file: text (VDF/ACF), binary (shortcuts.vdf) or appcache/appinfo.vdf
    Vdf {
        path: PathBuf,
        /// auto (default), text, binary, appinfo
        #[arg(long, default_value = "auto")]
        format: String,
        /// appinfo: this app's KeyValues (default: header summary)
        #[arg(long)]
        app: Option<u32>,
    },
    /// Compatibility tools: Valve Proton, Steam Linux Runtime, compatibilitytools.d (GE, CachyOS, umu)
    Compat,
    /// Host capabilities that shape a Proton launch (ntsync, gamemoderun, CPUs, software rendering)
    Host,
    /// Proton launch environment for an app outside the client (proton run, umu)
    Env {
        app: u32,
        /// Proton prefix directory (STEAM_COMPAT_DATA_PATH; default: <library>/steamapps/compatdata/<app>)
        #[arg(long)]
        prefix: Option<PathBuf>,
        /// Game directory (default: the installed app's directory)
        #[arg(long)]
        install_path: Option<PathBuf>,
        /// Shader caches root (<root>/dxvk, <root>/vkd3d, <root>/mesa)
        #[arg(long)]
        cache_root: Option<PathBuf>,
        /// Wrap with gamemoderun when installed
        #[arg(long)]
        gamemode: bool,
    },
}

/// Files that hold login tokens or machine auth; never parsed. Checked on the name as given and,
/// in [`vdf`], again on the resolved path (symlinks, `..`), with trailing dots and spaces stripped
/// (Windows ignores them) and alternate data streams refused.
pub fn is_secret_file(path: &Path) -> bool {
    let raw = path.file_name().map(|n| n.to_string_lossy().to_lowercase()).unwrap_or_default();
    if raw.contains(':') {
        return true;
    }
    let base = raw.trim_end_matches(['.', ' ']);
    base == "config.vdf" || base == "loginusers.vdf" || base == "local.vdf" || base.starts_with("ssfn")
}

/// Largest file `ay steam vdf` reads (appinfo.vdf is a few hundred MB on large libraries).
const MAX_VDF_BYTES: u64 = 2 << 30;

fn steam_root(root: Option<PathBuf>) -> Option<PathBuf> {
    root.or_else(|| std::env::var_os("STEAM_PATH").filter(|v| !v.is_empty()).map(PathBuf::from))
        .or_else(bun_steam::find_steam_dir)
}

fn print(v: &Value) -> i32 {
    match serde_json::to_string_pretty(v) {
        Ok(s) => {
            println!("{s}");
            0
        }
        Err(e) => {
            eprintln!("ay steam: {e}");
            1
        }
    }
}

fn fail(msg: impl std::fmt::Display) -> i32 {
    eprintln!("ay steam: {msg}");
    1
}

pub fn run_steam(a: SteamArgs) -> i32 {
    let root = steam_root(a.root);
    let need_root = || root.clone().ok_or("no Steam installation found (set --root or STEAM_PATH)");
    match a.cmd {
        SteamCmd::Root => print(&json!({ "root": root, "installations": find_steam_installations() })),
        SteamCmd::Libraries => match need_root() {
            Ok(r) => libraries(&r).map_or_else(fail, |v| print(&v)),
            Err(e) => fail(e),
        },
        SteamCmd::Apps { filter } => match need_root() {
            Ok(r) => apps(&r, filter.as_deref()).map_or_else(fail, |v| print(&v)),
            Err(e) => fail(e),
        },
        SteamCmd::Vdf { path, format, app } => vdf(&path, &format, app).map_or_else(fail, |v| print(&v)),
        SteamCmd::Compat => match need_root() {
            Ok(r) => {
                let libs = library_roots(&r);
                print(&json!(proton::discover_compat_tools(&proton::compat_tool_dirs(&r), &libs)))
            }
            Err(e) => fail(e),
        },
        SteamCmd::Host => print(&json!(proton::probe_host())),
        SteamCmd::Env { app, prefix, install_path, cache_root, gamemode } => {
            env(root.as_deref(), app, prefix, install_path, cache_root, gamemode).map_or_else(fail, |v| print(&v))
        }
    }
}

fn library_roots(root: &Path) -> Vec<PathBuf> {
    let mut out = vec![root.to_path_buf()];
    if let Ok(text) = std::fs::read_to_string(root.join("steamapps").join("libraryfolders.vdf"))
        && let Ok(doc) = parse_vdf(&text)
    {
        for f in library_folders(&doc) {
            let p = PathBuf::from(&f.path);
            if !out.iter().any(|o| same_path(o, &p)) {
                out.push(p);
            }
        }
    }
    out
}

fn same_path(a: &Path, b: &Path) -> bool {
    let norm = |p: &Path| p.to_string_lossy().replace('\\', "/").trim_end_matches('/').to_lowercase();
    norm(a) == norm(b)
}

fn libraries(root: &Path) -> Result<Value, String> {
    let text = std::fs::read_to_string(root.join("steamapps").join("libraryfolders.vdf"));
    let mut out: Vec<Value> = match text {
        Ok(t) => {
            let doc = parse_vdf(&t).map_err(|e| e.to_string())?;
            library_folders(&doc)
                .into_iter()
                .map(|f| json!({ "path": f.path, "label": f.label, "apps": f.apps.iter().map(|(id, _)| *id).collect::<Vec<u32>>() }))
                .collect()
        }
        Err(_) => Vec::new(),
    };
    if !out.iter().any(|l| l["path"].as_str().is_some_and(|p| same_path(Path::new(p), root))) {
        out.insert(0, json!({ "path": root, "label": "", "apps": [] }));
    }
    Ok(Value::Array(out))
}

fn apps(root: &Path, filter: Option<&str>) -> Result<Value, String> {
    let games = list_installed_games(root).map_err(|e| e.to_string())?;
    let f = filter.map(str::to_lowercase).unwrap_or_default();
    let mut rows: Vec<Value> = games
        .into_iter()
        .filter(|g| f.is_empty() || g.manifest.app_id.to_string() == f || g.manifest.name.to_lowercase().contains(&f))
        .map(|g| {
            let m = &g.manifest;
            let acf = g.library_path.join("steamapps").join(format!("appmanifest_{}.acf", m.app_id));
            json!({
                "appid": m.app_id,
                "name": m.name,
                "installdir": m.install_dir,
                "library": g.library_path,
                "manifest": acf,
                "install_path": g.install_path,
                "exists_on_disk": g.exists_on_disk,
                "buildid": m.build_id.to_string(),
                "size_on_disk": m.size_on_disk,
                "state_flags": m.state_flags,
                "state": m.state_flag_descriptions(),
                "last_updated": m.last_updated,
                "target_build_id": m.target_build_id,
                "bytes_to_download": m.bytes_to_download,
                "bytes_downloaded": m.bytes_downloaded,
                "depots": installed_depots(&acf),
                "user_config": m.user_config,
            })
        })
        .collect();
    rows.sort_by_key(|r| r["appid"].as_u64().unwrap_or(0));
    Ok(Value::Array(rows))
}

/// `InstalledDepots` of an ACF: depot id, manifest gid and size (the typed manifest keeps ids only).
fn installed_depots(acf: &Path) -> Value {
    let Ok(text) = std::fs::read_to_string(acf) else { return json!([]) };
    let Ok(doc) = parse_vdf(&text) else { return json!([]) };
    let Some(entries) = doc.get_path(&["AppState", "InstalledDepots"]).and_then(|v| v.entries()) else {
        return json!([]);
    };
    Value::Array(
        entries
            .iter()
            .map(|(depot, d)| json!({ "depot": depot, "manifest": d.get_str("manifest"), "size": d.get_str("size") }))
            .collect(),
    )
}

fn vdf(path: &Path, format: &str, app: Option<u32>) -> Result<Value, String> {
    if is_secret_file(path) {
        return Err(format!("{} holds credentials; not read", path.display()));
    }
    let real = std::fs::canonicalize(path).map_err(|e| format!("{}: {e}", path.display()))?;
    if is_secret_file(&real) {
        return Err(format!("{} resolves to a credential file; not read", path.display()));
    }
    let len = std::fs::metadata(&real).map_err(|e| format!("{}: {e}", path.display()))?.len();
    if len > MAX_VDF_BYTES {
        return Err(format!("{}: {len} bytes, over the {MAX_VDF_BYTES} limit", path.display()));
    }
    let bytes = std::fs::read(&real).map_err(|e| format!("{}: {e}", path.display()))?;
    let is_appinfo = path.file_name().is_some_and(|n| n.eq_ignore_ascii_case("appinfo.vdf"));
    let fmt = match format {
        "auto" if is_appinfo => "appinfo",
        // Binary KeyValues start with a type byte (0x00 object, 0x01 string, 0x02 int32); text starts
        // with a quote, a key, a comment or a BOM.
        "auto" if bytes.first().is_some_and(|b| *b <= 0x02) => "binary",
        "auto" => "text",
        other => other,
    };
    match fmt {
        "text" => {
            let text = String::from_utf8_lossy(&bytes);
            Ok(parse_vdf(&text).map_err(|e| e.to_string())?.to_json())
        }
        "binary" => Ok(parse_binary_vdf(&bytes).map_err(|e| e.to_string())?.to_vdf().to_json()),
        "appinfo" => {
            let file = parse_appinfo(&bytes).map_err(|e| e.to_string())?;
            let found = app.and_then(|id| file.apps.iter().find(|e| e.app_id == id));
            Ok(json!({
                "version": file.version & 0xff,
                "universe": file.universe,
                "apps": file.apps.len(),
                "app": found.and_then(|e| e.kv.as_ref()).map(|kv| kv.to_vdf().to_json()),
                "change_number": found.map(|e| e.change_number),
                "last_updated": found.map(|e| e.last_updated),
            }))
        }
        other => Err(format!("unknown format {other} (auto, text, binary, appinfo)")),
    }
}

fn env(
    root: Option<&Path>,
    app: u32,
    prefix: Option<PathBuf>,
    install_path: Option<PathBuf>,
    cache_root: Option<PathBuf>,
    gamemode: bool,
) -> Result<Value, String> {
    let game = root.and_then(|r| list_installed_games(r).ok()).and_then(|g| g.into_iter().find(|g| g.manifest.app_id == app));
    let library = game.as_ref().map(|g| g.library_path.clone()).or_else(|| root.map(Path::to_path_buf));
    let prefix = prefix
        .or_else(|| library.as_ref().map(|l| l.join("steamapps").join("compatdata").join(app.to_string())))
        .ok_or("no prefix: pass --prefix or --root")?;
    let install = install_path.or_else(|| game.as_ref().map(|g| g.install_path.clone())).ok_or("app not installed: pass --install-path")?;
    let client = root.map(Path::to_path_buf).unwrap_or_else(|| prefix.clone());
    let host = proton::probe_host();
    let tuning = LaunchTuning { cache_root, gamemode, ..LaunchTuning::default() };
    let plan = proton::launch_plan(&tuning, &host);
    let mut env = proton::steam_compat_env(app, &prefix, &client, &install);
    env.extend(plan.env.iter().cloned());
    env.sort();
    Ok(json!({
        "app": app,
        "prefix": prefix,
        "install_path": install,
        "env": env.into_iter().collect::<std::collections::BTreeMap<_, _>>(),
        "wrapper": plan.wrapper,
        "launch_options": plan.steam_launch_options(),
        "host": host,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn secret_files_are_refused() {
        for f in ["config/config.vdf", "LoginUsers.vdf", "userdata/1/config/local.vdf", "ssfn123"] {
            assert!(is_secret_file(Path::new(f)), "{f}");
        }
        assert!(!is_secret_file(Path::new("steamapps/libraryfolders.vdf")));
        assert!(is_secret_file(Path::new("config.vdf. ")));
        assert!(is_secret_file(Path::new("config.vdf::$DATA")));
        assert!(vdf(Path::new("config.vdf"), "auto", None).is_err());
    }

    #[test]
    fn text_vdf_to_json() {
        let dir = std::env::temp_dir().join(format!("ay-steam-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let f = dir.join("appmanifest_10.acf");
        std::fs::write(&f, "\"AppState\"\n{\n\t\"appid\"\t\"10\"\n\t\"name\"\t\"Counter-Strike\"\n}\n").unwrap();
        let v = vdf(&f, "auto", None).unwrap();
        assert_eq!(v["AppState"]["name"], "Counter-Strike");
        std::fs::remove_dir_all(&dir).ok();
    }
}
