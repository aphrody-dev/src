use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

pub static SECRET_TOKEN_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?:ya29\.[A-Za-z0-9._-]{24,}|AIza[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9_]{24,}|github_pat_[A-Za-z0-9_]{24,}|glpat-[A-Za-z0-9_-]{20,}|ctx7sk-[A-Za-z0-9_-]{16,}|figd_[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{24,}|sk-proj-[A-Za-z0-9_-]{24,})",
    )
    .expect("valid secret regex")
});

pub static SYSTEM32_MUTATION_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?i)(?:Copy-Item|Move-Item|Remove-Item|New-Item|Out-File|Set-Content|Add-Content|\bcp\b|\bmv\b|\brm\b|--outfile|-o\s+)[^\r\n]{0,120}(?:C:\\\\?Windows\\\\?(?:System32|SysWOW64)|/c/Windows/(?:System32|SysWOW64))",
    )
    .expect("valid system32 regex")
});

pub static AI_WRAPPER_SLOP_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b(?:AI-powered\s+magic|AI\s+wrapper|revolutionary\s+AI\s+platform)\b")
        .expect("valid ai slop regex")
});

pub static FILE_URI_SRC_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"file:///C:/src(?:/([^\s\)\]#`]+))?").expect("valid file:///C:/src regex")
});

pub static SEMVER_OR_CALVER_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|\d{4}\.\d{1,2}\.\d+)$")
        .expect("valid semver/calver regex")
});

pub const ALLOWED_ROOT_PHYSICAL_DIRS: &[&str] = &[
    ".agents",
    ".gemini",
    ".git",
    ".jj",
    ".repo",
    ".cache",
    "apps",
    "crates",
    "docs",
    "graphify-out",
    "infra",
    "node_modules",
    "packages",
    "third_party",
    "tools",
    "var",
];

pub const CRATE_FORBIDDEN_EXTENSIONS: &[&str] = &[
    "ts", "tsx", "js", "jsx", "mjs", "cjs", "cts", "mts", "py", "pyc", "go",
];

pub const CRATE_FORBIDDEN_FILES: &[&str] = &[
    "package.json",
    "tsconfig.json",
    "bun.lock",
    "bun.lockb",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "go.mod",
    "go.sum",
    "pyproject.toml",
    "requirements.txt",
];

pub const SKIP_DIRS: &[&str] = &[
    ".git",
    ".jj",
    "target",
    "node_modules",
    "dist",
    ".next",
    ".turbo",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "upstream",
    "submodules",
    "third_party",
    "graphify-out",
    "var",
    ".cache",
];

pub fn is_reparse_point(path: &Path) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(meta) = fs::symlink_metadata(path) {
            return (meta.file_attributes() & 0x0400) != 0;
        }
    }
    #[cfg(not(windows))]
    {
        if let Ok(meta) = fs::symlink_metadata(path) {
            return meta.file_type().is_symlink();
        }
    }
    false
}

pub fn normalize_rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .replace('\\', "/")
}

pub fn contains_pictographic_emoji(ch: char) -> bool {
    let u = ch as u32;
    // Astral pictographs, emoticons, transport, supplemental symbols, dingbats (excluding standard box drawing 2500..257F and arrows 2190..21FF)
    (0x1F300..=0x1F9FF).contains(&u)
        || (0x1FA00..=0x1FAFF).contains(&u)
        || (0x1F600..=0x1F64F).contains(&u)
        || (0x1F680..=0x1F6FF).contains(&u)
        || (0x2702..=0x27B0).contains(&u)
        || matches!(
            u,
            0x2600..=0x2604
                | 0x260E
                | 0x2611
                | 0x2614..=0x2615
                | 0x2618
                | 0x261D
                | 0x2620
                | 0x2622..=0x2623
                | 0x2626
                | 0x262A
                | 0x262E..=0x262F
                | 0x2638..=0x263A
                | 0x2640
                | 0x2642
                | 0x2648..=0x2653
                | 0x265F..=0x2660
                | 0x2663
                | 0x2665..=0x2666
                | 0x2668
                | 0x267B
                | 0x267E..=0x267F
                | 0x2692..=0x2697
                | 0x2699
                | 0x269B..=0x269C
                | 0x26A0..=0x26A1
                | 0x26AA..=0x26AB
                | 0x26B0..=0x26B1
                | 0x26BD..=0x26BE
                | 0x26C4..=0x26C5
                | 0x26CE..=0x26CF
                | 0x26D1
                | 0x26D3..=0x26D4
                | 0x26E9..=0x26EA
                | 0x26F0..=0x26F5
                | 0x26F7..=0x26FA
                | 0x26FD
        )
}

pub fn find_first_emoji(text: &str) -> Option<(usize, char)> {
    for (idx, line) in text.lines().enumerate() {
        // Ignore regex character class definitions that intentionally match emojis
        if line.contains("\\u{1F") || line.contains("Extended_Pictographic") || line.contains("0x1F300") {
            continue;
        }
        for ch in line.chars() {
            if contains_pictographic_emoji(ch) {
                return Some((idx + 1, ch));
            }
        }
    }
    None
}

pub fn should_skip_dir_name(name: &str) -> bool {
    SKIP_DIRS.contains(&name)
}

pub fn collect_domain_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let p = entry.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if p.is_dir() {
            if should_skip_dir_name(name) {
                continue;
            }
            collect_domain_files(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}
