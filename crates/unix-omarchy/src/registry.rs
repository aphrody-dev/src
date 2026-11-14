//! Native Rust parity for the Omarchy (`quattro`) Command Center & Manual index.
//!
//! Scans `third_party/omarchy/bin/omarchy-*` (or `$OMARCHY_PATH/bin`, `/usr/share/omarchy/bin`)
//! for `# omarchy:<key>=<value>` metadata headers across the 73 official groups, plus
//! CachyOS/Aphrody native groups (`wsl`, `arch`, `manual`).

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

const METADATA_SCAN_LIMIT: usize = 80;

pub const GROUP_DESCRIPTIONS: &[(&str, &str)] = &[
    ("agent", "AI coding agents, their usage, and subscription accounts"),
    ("arch", "Arch GitLab, CachyOS v3, and Omarchy repository manifests"),
    ("ascii", "Text drawn as ASCII art"),
    ("audio", "Audio input and output controls"),
    ("bar", "Omarchy shell bar layout and settings"),
    ("battery", "Battery status helpers"),
    ("bluetooth", "Bluetooth device controls"),
    ("branch", "Omarchy git branch management"),
    ("branding", "About and screensaver branding"),
    ("brightness", "Display and keyboard brightness"),
    ("capture", "Screenshots and screen recording"),
    ("channel", "Omarchy release channel management"),
    ("clipboard", "Clipboard helpers"),
    ("cmd", "Command and shortcut helpers"),
    ("config", "System configuration helpers"),
    ("crash", "Crash notification controls"),
    ("debug", "Diagnostics and support logs"),
    ("default", "Default application selection"),
    ("dev", "Omarchy development tools"),
    ("dictation", "Dictation recording"),
    ("disk", "Disk performance helpers"),
    ("display", "Display and text scaling"),
    ("dns", "DNS resolver configuration"),
    ("dock", "Dock shown on floating workspaces"),
    ("drive", "Drive selection and encryption"),
    ("file", "File selection helpers"),
    ("finalize", "Finalize user setup"),
    ("font", "Font management"),
    ("games", "Game launchers, CachyOS Proton, and helpers"),
    ("hibernation", "Hibernation setup and removal"),
    ("hook", "User hook runner"),
    ("hw", "Hardware detection and controls"),
    ("hyprland", "Hyprland window, monitor, and toggle controls"),
    ("install", "Optional software installers"),
    ("installed", "Installed optional service checks"),
    ("kernel", "CachyOS kernel flavors, patchsets, and boot kernel selection"),
    ("keyboard", "Keyboard top row and Fn-lock"),
    ("language", "Display language and system locale"),
    ("launch", "Application launchers"),
    ("manual", "Offline Omarchy quattro manual chapters"),
    ("menu", "Omarchy menu commands"),
    ("migrate", "Migration runner"),
    ("mise", "Mise tool wrappers"),
    ("monitor", "Monitor status helpers"),
    ("network", "Network status helpers"),
    ("notification", "Notification helpers"),
    ("openclaw", "OpenClaw agent platform setup"),
    ("osd", "On-screen display status helpers"),
    ("pkg", "CachyOS pacman/makepkg, Arch helpers, and multi-distro recipes"),
    ("plugin", "Omarchy shell plugin and bar widget management"),
    ("plymouth", "Plymouth boot theme management"),
    ("power", "Power supply detection"),
    ("powerprofiles", "Power profile management"),
    ("refresh", "Reset config to defaults"),
    ("reinstall", "Reinstall and reset workflows"),
    ("reminder", "Desktop notification reminders"),
    ("remove", "Removal workflows"),
    ("restart", "Restart Omarchy components"),
    ("setup", "Interactive setup wizards"),
    ("shell", "Omarchy shell IPC helpers"),
    ("snapshot", "System snapshots"),
    ("sudo", "Sudo configuration helpers"),
    ("system", "System status, reboot, shutdown, logout, and lock"),
    ("tailscale", "Tailscale helpers"),
    ("theme", "Theme management and Aether/Omarchy templates"),
    ("toggle", "Toggle Omarchy features"),
    ("transcode", "Image and video transcoding"),
    ("tui", "Terminal UI launchers"),
    ("update", "Omarchy and system updates"),
    ("version", "Version and channel information"),
    ("voxtype", "Voxtype dictation"),
    ("weather", "Weather status"),
    ("webapp", "Web app launchers"),
    ("wifi", "Wi-Fi helpers"),
    ("windows", "Windows VM management"),
    ("wsl", "Native WSL2 distribution bundle builder and launcher"),
];

pub fn group_description(group: &str) -> Option<&'static str> {
    GROUP_DESCRIPTIONS
        .iter()
        .find(|(k, _)| *k == group)
        .map(|(_, v)| *v)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandSpec {
    pub route: String,
    pub binary: String,
    pub binary_path: PathBuf,
    pub group: String,
    pub name: String,
    pub summary: String,
    pub usage: String,
    pub args: String,
    pub examples: Vec<String>,
    pub aliases: Vec<String>,
    pub requires_sudo: bool,
    pub hidden: bool,
    pub filename_route: String,
    pub routes: Vec<String>,
    pub has_summary: bool,
    pub metadata_errors: Vec<String>,
    pub executable_ok: bool,
}

#[derive(Debug, Clone)]
pub struct RouteMatch {
    pub key: String,
    pub matched_route: String,
    pub consumed_words: usize,
}

#[derive(Debug, Clone)]
pub struct OmarchyCommandRegistry {
    pub bin_dir: PathBuf,
    pub commands: BTreeMap<String, CommandSpec>,
    pub route_to_key: BTreeMap<String, String>,
    pub route_is_alias: BTreeSet<String>,
    pub route_collisions: Vec<String>,
}

impl OmarchyCommandRegistry {
    pub const DEFAULT_BIN_DIR: &'static str =
        concat!(env!("CARGO_MANIFEST_DIR"), "/../../third_party/omarchy/bin");

    pub fn resolve_bin_dir(repo_root: &Path) -> PathBuf {
        if let Some(p) = std::env::var_os("OMARCHY_PATH").filter(|v| !v.is_empty()) {
            let candidate = PathBuf::from(p).join("bin");
            if candidate.is_dir() {
                return candidate;
            }
        }
        let repo_bin = repo_root.join("third_party").join("omarchy").join("bin");
        if repo_bin.is_dir() {
            return repo_bin;
        }
        let manifest_bin = PathBuf::from(Self::DEFAULT_BIN_DIR);
        if manifest_bin.is_dir() {
            return manifest_bin;
        }
        PathBuf::from("/usr/share/omarchy/bin")
    }

    pub fn scan_default(repo_root: &Path) -> Self {
        Self::scan_bin_dir(&Self::resolve_bin_dir(repo_root))
    }

    pub fn scan_bin_dir(bin_dir: &Path) -> Self {
        let mut reg = Self {
            bin_dir: bin_dir.to_path_buf(),
            commands: BTreeMap::new(),
            route_to_key: BTreeMap::new(),
            route_is_alias: BTreeSet::new(),
            route_collisions: Vec::new(),
        };
        let Ok(entries) = fs::read_dir(bin_dir) else {
            return reg;
        };
        let mut paths: Vec<PathBuf> = entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| {
                p.is_file()
                    && p.file_name()
                        .and_then(|n| n.to_str())
                        .is_some_and(|n| n.starts_with("omarchy-"))
            })
            .collect();
        paths.sort();

        for path in paths {
            reg.register_file(&path);
        }
        reg
    }

    fn register_route(&mut self, route: &str, key: &str, is_alias: bool) {
        if route.is_empty() || key.is_empty() {
            return;
        }
        if let Some(existing) = self.route_to_key.get(route)
            && existing != key
        {
            self.route_collisions
                .push(format!("{route} -> {existing} conflicts with {key}"));
            return;
        }
        self.route_to_key
            .insert(route.to_string(), key.to_string());
        if is_alias {
            self.route_is_alias.insert(route.to_string());
        }
    }

    fn register_file(&mut self, path: &Path) {
        let Some(binary) = path.file_name().and_then(|n| n.to_str()).map(str::to_string) else {
            return;
        };
        let Ok(file) = File::open(path) else {
            return;
        };
        let mut reader = BufReader::new(file);

        let mut group = String::new();
        let mut name = String::new();
        let mut name_seen = false;
        let mut summary = String::new();
        let mut fallback_summary = String::new();
        let mut has_summary = false;
        let mut args = String::new();
        let mut examples: Vec<String> = Vec::new();
        let mut aliases_raw: Vec<String> = Vec::new();
        let mut requires_sudo = false;
        let mut hidden = false;
        let mut metadata_errors: Vec<String> = Vec::new();
        let mut first_line_is_shebang = false;

        let mut line = String::new();
        let mut line_count = 0usize;
        while line_count < METADATA_SCAN_LIMIT {
            line.clear();
            let Ok(read) = reader.read_line(&mut line) else {
                break;
            };
            if read == 0 {
                break;
            }
            line_count += 1;
            let trimmed_end = line.trim_end_matches(&['\r', '\n'][..]);
            if line_count == 1 && trimmed_end.starts_with("#!") {
                first_line_is_shebang = true;
                continue;
            }
            let trimmed = trimmed_end.trim();
            if trimmed.is_empty() {
                continue;
            }
            let Some(comment_body) = trimmed.strip_prefix('#') else {
                break;
            };
            let comment_body = comment_body.trim_start();
            if let Some(meta) = comment_body.strip_prefix("omarchy:") {
                if let Some((k, v)) = meta.split_once('=') {
                    let val = v.replace('\t', " ");
                    match k.trim() {
                        "group" => group = val,
                        "name" => {
                            name = val;
                            name_seen = true;
                        }
                        "summary" => {
                            if !val.is_empty() {
                                has_summary = true;
                            }
                            summary = val;
                        }
                        "args" => args = val,
                        "examples" => {
                            for item in val.split('|') {
                                let clean = item.trim();
                                if !clean.is_empty() {
                                    examples.push(clean.to_string());
                                }
                            }
                        }
                        "alias" | "aliases" => {
                            for item in val.split('|') {
                                let clean = item.trim();
                                if !clean.is_empty() {
                                    aliases_raw.push(clean.to_string());
                                }
                            }
                        }
                        "requires-sudo" => {
                            if val == "true" {
                                requires_sudo = true;
                            } else {
                                metadata_errors.push(
                                    "requires-sudo must be omitted or true".to_string(),
                                );
                            }
                        }
                        "hidden" => {
                            if val == "true" {
                                hidden = true;
                            } else {
                                metadata_errors
                                    .push("hidden must be omitted or true".to_string());
                            }
                        }
                        _ => {}
                    }
                }
            } else if fallback_summary.is_empty() && !comment_body.is_empty() {
                fallback_summary = comment_body.replace('\t', " ");
            }
        }

        let executable_ok = is_script_runnable(path, first_line_is_shebang);
        if !executable_ok {
            return;
        }

        let stem = binary.strip_prefix("omarchy-").unwrap_or(&binary);
        let fallback_group;
        let fallback_name;
        if let Some((g, rest)) = stem.split_once('-') {
            fallback_group = g.to_string();
            fallback_name = rest.replace('-', " ");
        } else {
            fallback_group = stem.to_string();
            fallback_name = String::new();
        }
        let fallback_route = format!("omarchy {}", stem.replace('-', " "));

        if group.is_empty() {
            group = fallback_group;
        }
        if !name_seen {
            name = fallback_name;
        }
        if summary.is_empty() {
            if !fallback_summary.is_empty() {
                summary = fallback_summary;
            } else {
                summary = format!("Run the {} command", stem.replace('-', " "));
            }
        }

        let route = if name.is_empty() {
            format!("omarchy {group}")
        } else {
            format!("omarchy {group} {name}")
        };
        let usage = if args.is_empty() {
            route.clone()
        } else {
            format!("{route} {args}")
        };

        let mut aliases = Vec::new();
        let mut route_set = BTreeSet::new();
        route_set.insert(route.clone());
        route_set.insert(fallback_route.clone());

        self.register_route(&route, &binary, false);
        self.register_route(&fallback_route, &binary, false);

        for alias_route in aliases_raw {
            if alias_route == route {
                continue;
            }
            self.register_route(&alias_route, &binary, true);
            aliases.push(alias_route.clone());
            route_set.insert(alias_route);
        }

        let spec = CommandSpec {
            route,
            binary: binary.clone(),
            binary_path: path.to_path_buf(),
            group,
            name,
            summary,
            usage,
            args,
            examples,
            aliases,
            requires_sudo,
            hidden,
            filename_route: fallback_route,
            routes: route_set.into_iter().collect(),
            has_summary,
            metadata_errors,
            executable_ok,
        };
        self.commands.insert(binary, spec);
    }

    pub fn resolve_route(&self, args: &[String]) -> Option<RouteMatch> {
        for prefix_len in (1..=args.len()).rev() {
            let candidate = format!("omarchy {}", args[..prefix_len].join(" "));
            if let Some(key) = self.route_to_key.get(&candidate) {
                return Some(RouteMatch {
                    key: key.clone(),
                    matched_route: candidate,
                    consumed_words: prefix_len,
                });
            }
        }
        None
    }

    pub fn group_exists(&self, group: &str) -> bool {
        self.commands
            .values()
            .any(|c| c.group == group && !c.name.is_empty())
            || group_description(group).is_some()
    }

    pub fn suggest(&self, first: &str) -> Option<String> {
        let prefix = first.trim();
        if prefix.is_empty() {
            return None;
        }
        for route in self.route_to_key.keys() {
            let rest = route.strip_prefix("omarchy ").unwrap_or(route);
            if rest.starts_with(prefix) {
                return rest.split_whitespace().next().map(str::to_string);
            }
        }
        None
    }

    pub fn sorted_commands(&self, include_all: bool) -> Vec<&CommandSpec> {
        let mut items: Vec<&CommandSpec> = self
            .commands
            .values()
            .filter(|c| include_all || !c.hidden)
            .collect();
        items.sort_by(|a, b| a.route.cmp(&b.route).then_with(|| a.binary.cmp(&b.binary)));
        items
    }

    pub fn show_main_help(&self) -> String {
        let mut out = String::from(
            "Omarchy command center\n\n\
             Usage:\n\
             \x20 omarchy <command> [args...]\n\
             \x20 omarchy commands [--all] [--json] [--check]\n\
             \x20 omarchy <group> --help\n\
             \x20 omarchy <group> <command> --help\n\n\
             Common commands:\n\
             \x20 omarchy update              Update Omarchy and system packages\n\
             \x20 omarchy theme list          List available themes\n\
             \x20 omarchy theme set <name>    Apply a theme\n\
             \x20 omarchy font list           List available fonts\n\
             \x20 omarchy screenshot          Take a screenshot\n\
             \x20 omarchy hw --json           Probe CPU/GPU/RAM hardware tier\n\
             \x20 omarchy kernel flavors      List CachyOS kernel flavors\n\
             \x20 omarchy debug               Print debugging information\n\n\
             Groups:\n",
        );

        let mut sorted: Vec<(&str, &str)> = GROUP_DESCRIPTIONS.to_vec();
        sorted.sort_by_key(|(k, _)| *k);
        for (group, desc) in sorted {
            out.push_str(&format!("  {group:<14} {desc}\n"));
        }

        out.push_str(
            "\nDiscovery:\n\
             \x20 omarchy commands            List all commands\n\
             \x20 omarchy commands --all      Include commands explicitly marked hidden\n\
             \x20 omarchy commands --json     Machine-readable command list\n\
             \x20 omarchy commands --check    Validate command metadata and routes\n\
             \x20 omarchy manual              Browse offline quattro manual chapters\n",
        );
        out
    }

    pub fn show_commands(&self, include_all: bool) -> String {
        let items = self.sorted_commands(include_all);
        let mut out = if include_all {
            String::from("Omarchy commands (all):\n")
        } else {
            String::from("Omarchy commands:\n")
        };
        let width = items.iter().map(|c| c.usage.len()).max().unwrap_or(0);
        for c in &items {
            out.push_str(&format!("  {:<width$}  {}\n", c.usage, c.summary));
        }

        let mut aliases: Vec<(&String, &String)> = self
            .route_is_alias
            .iter()
            .filter_map(|r| {
                let key = self.route_to_key.get(r)?;
                let spec = self.commands.get(key)?;
                if !include_all && spec.hidden {
                    return None;
                }
                Some((r, &spec.route))
            })
            .collect();
        aliases.sort_by(|a, b| a.0.cmp(b.0));

        if !aliases.is_empty() {
            let aw = aliases.iter().map(|(r, _)| r.len()).max().unwrap_or(0);
            out.push_str("\nAliases:\n");
            for (alias, target) in aliases {
                out.push_str(&format!("  {alias:<aw$}  {target}\n"));
            }
        }
        out
    }

    pub fn show_commands_markdown(&self, include_all: bool) -> String {
        let mut out = String::from("| Command | Binary | Summary |\n| --- | --- | --- |\n");
        for c in self.sorted_commands(include_all) {
            out.push_str(&format!(
                "| `{}` | `{}` | {} |\n",
                c.usage.replace('|', "\\|"),
                c.binary.replace('|', "\\|"),
                c.summary.replace('|', "\\|"),
            ));
        }
        out
    }

    pub fn show_commands_json(&self, include_all: bool) -> serde_json::Value {
        let cmds: Vec<serde_json::Value> = self
            .sorted_commands(include_all)
            .into_iter()
            .map(command_json_value)
            .collect();
        serde_json::json!({
            "ok": true,
            "commands": cmds,
        })
    }

    pub fn show_command_json(&self, key: &str) -> Option<serde_json::Value> {
        let spec = self.commands.get(key)?;
        Some(serde_json::json!({
            "ok": true,
            "command": command_json_value(spec),
        }))
    }

    pub fn show_commands_check(&self) -> Result<String, Vec<String>> {
        let mut errors = Vec::new();
        for col in &self.route_collisions {
            errors.push(format!("Route collision: {col}"));
        }
        for spec in self.commands.values() {
            if !spec.has_summary {
                errors.push(format!("Missing metadata summary: {}", spec.binary));
            }
            for err in &spec.metadata_errors {
                errors.push(format!("Invalid metadata in {}: {err}", spec.binary));
            }
            if !spec.binary_path.is_file() {
                errors.push(format!("Missing binary: {}", spec.binary));
            }
        }
        if errors.is_empty() {
            Ok(format!(
                "Command metadata check passed ({} commands)",
                self.commands.len()
            ))
        } else {
            errors.push(format!(
                "Command metadata check failed ({} issues)",
                errors.len()
            ));
            Err(errors)
        }
    }

    pub fn show_group_help(&self, group: &str, include_all: bool) -> Option<String> {
        let mut rows: Vec<(String, String)> = Vec::new();
        for c in self.commands.values() {
            if !include_all && c.hidden {
                continue;
            }
            let fallback_group = c
                .filename_route
                .strip_prefix("omarchy ")
                .unwrap_or(&c.filename_route)
                .split_whitespace()
                .next()
                .unwrap_or("");
            if c.group != group && fallback_group != group {
                continue;
            }
            let route = if fallback_group == group && c.group != group {
                &c.filename_route
            } else {
                &c.route
            };
            let usage = if c.args.is_empty() {
                route.clone()
            } else {
                format!("{route} {}", c.args)
            };
            rows.push((usage, c.summary.clone()));
        }
        rows.sort_by(|a, b| a.0.cmp(&b.0));

        let title = group_description(group);
        if rows.is_empty() && title.is_none() {
            return None;
        }
        let capitalized = capitalize_ascii(group);
        let mut out = if let Some(desc) = title {
            format!("{capitalized} commands -- {desc}:\n")
        } else {
            format!("{capitalized} commands:\n")
        };
        if rows.is_empty() {
            out.push_str("  Built-in native command group. Try --help on a subcommand or run `omarchy commands --all`.\n");
        } else {
            let width = rows.iter().map(|(u, _)| u.len()).max().unwrap_or(0);
            for (u, s) in rows {
                out.push_str(&format!("  {u:<width$}  {s}\n"));
            }
        }
        Some(out)
    }

    pub fn show_command_help(&self, key: &str) -> Option<String> {
        let c = self.commands.get(key)?;
        let mut out = format!("Usage:\n  {}\n\n{}\n", c.usage, c.summary);
        if !c.args.is_empty() {
            out.push_str(&format!("\nArguments:\n  {}\n", c.args));
        }
        if !c.examples.is_empty() {
            out.push_str("\nExamples:\n");
            for ex in &c.examples {
                out.push_str(&format!("  {ex}\n"));
            }
        }
        if !c.aliases.is_empty() {
            out.push_str("\nAliases:\n");
            for a in &c.aliases {
                out.push_str(&format!("  {a}\n"));
            }
        }
        out.push_str(&format!("\nBinary:\n  {}\n", c.binary));
        if c.filename_route != c.route {
            out.push_str(&format!("\nFilename route:\n  {}\n", c.filename_route));
        }
        Some(out)
    }

    pub fn command_requires_args(&self, key: &str) -> bool {
        let Some(c) = self.commands.get(key) else {
            return false;
        };
        let mut required = String::with_capacity(c.args.len());
        let mut depth = 0usize;
        for ch in c.args.chars() {
            match ch {
                '[' => depth += 1,
                ']' => depth = depth.saturating_sub(1),
                _ if depth == 0 && !ch.is_whitespace() => required.push(ch),
                _ => {}
            }
        }
        !required.is_empty()
    }
}

fn command_json_value(spec: &CommandSpec) -> serde_json::Value {
    serde_json::json!({
        "route": spec.route,
        "binary": spec.binary,
        "group": spec.group,
        "name": spec.name,
        "summary": spec.summary,
        "requires_sudo": spec.requires_sudo,
        "hidden": spec.hidden,
        "args": spec.args,
        "examples": spec.examples,
        "aliases": spec.aliases,
        "filename_route": spec.filename_route,
        "routes": spec.routes,
    })
}

fn is_script_runnable(path: &Path, has_shebang: bool) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::metadata(path)
            .map(|m| (m.permissions().mode() & 0o111) != 0 || has_shebang)
            .unwrap_or(false)
    }
    #[cfg(not(unix))]
    {
        path.is_file() && has_shebang
    }
}

fn capitalize_ascii(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => String::new(),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualChapter {
    pub number: String,
    pub slug: String,
    pub title: String,
    pub path: PathBuf,
}

pub struct OmarchyManualIndex {
    pub manual_dir: PathBuf,
    pub chapters: Vec<ManualChapter>,
}

impl OmarchyManualIndex {
    pub const DEFAULT_MANUAL_DIR: &'static str =
        concat!(env!("CARGO_MANIFEST_DIR"), "/../../third_party/omarchy/manual");

    pub fn scan(repo_root: &Path) -> Self {
        let candidate = repo_root.join("third_party").join("omarchy").join("manual");
        let manual_dir = if candidate.is_dir() {
            candidate
        } else {
            PathBuf::from(Self::DEFAULT_MANUAL_DIR)
        };
        let mut chapters = Vec::new();
        if let Ok(entries) = fs::read_dir(&manual_dir) {
            let mut files: Vec<PathBuf> = entries
                .flatten()
                .map(|e| e.path())
                .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("md"))
                .collect();
            files.sort();
            for p in files {
                let Some(stem) = p.file_stem().and_then(|s| s.to_str()) else {
                    continue;
                };
                let (number, slug) = match stem.split_once('-') {
                    Some((n, s)) if n.chars().all(|c| c.is_ascii_digit()) => {
                        (n.to_string(), s.to_string())
                    }
                    _ => (String::new(), stem.to_string()),
                };
                let title = fs::read_to_string(&p)
                    .ok()
                    .and_then(|raw| {
                        raw.lines()
                            .find_map(|l| l.trim().strip_prefix("# ").map(str::to_string))
                    })
                    .unwrap_or_else(|| slug.replace('-', " "));
                chapters.push(ManualChapter {
                    number,
                    slug,
                    title,
                    path: p,
                });
            }
        }
        Self {
            manual_dir,
            chapters,
        }
    }

    pub fn find(&self, query: &str) -> Option<&ManualChapter> {
        let q = query.trim().trim_end_matches(".md").to_ascii_lowercase();
        let q_num = q.trim_start_matches('0');
        self.chapters.iter().find(|c| {
            c.slug.eq_ignore_ascii_case(&q)
                || c.number == q
                || (!q_num.is_empty() && c.number.trim_start_matches('0') == q_num)
                || format!("{}-{}", c.number, c.slug).eq_ignore_ascii_case(&q)
                || c.slug.to_ascii_lowercase().contains(&q)
        })
    }
}
