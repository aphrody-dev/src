// SPDX-License-Identifier: Apache-2.0
//! Pure-Rust parser, linter, spec reporter, and token exporter for `DESIGN.md`.
//!
//! Replaces the legacy TypeScript `packages/google-design` linter (`google-labs-code/design.md`)
//! with a zero-JS, zero-`unsafe` implementation backed by `aphrody-ui`.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

/// Canonical top-level YAML frontmatter keys supported by `DESIGN.md`.
pub const CANONICAL_TOP_KEYS: &[&str] = &[
    "version",
    "name",
    "description",
    "colors",
    "typography",
    "rounded",
    "spacing",
    "components",
];

/// Canonical Markdown sections in recommended order, with recognized aliases.
pub const CANONICAL_SECTIONS: &[(&str, &[&str])] = &[
    ("Overview", &["Brand & Style"]),
    ("Colors", &[]),
    ("Typography", &[]),
    ("Layout", &["Layout & Spacing"]),
    ("Elevation & Depth", &["Elevation"]),
    ("Shapes", &[]),
    ("Components", &[]),
    ("Do's and Don'ts", &["Dos and Donts"]),
];

/// Recommended M3 / DESIGN.md color roles.
pub const RECOMMENDED_COLORS: &[&str] = &[
    "primary",
    "on-primary",
    "secondary",
    "tertiary",
    "surface",
    "on-surface",
    "background",
    "on-background",
    "error",
    "on-error",
];

/// Severity level for `DESIGN.md` lint findings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
    Info,
}

/// Single diagnostic reported by [`lint_design_md`].
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LintFinding {
    pub rule: String,
    pub severity: Severity,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

/// Summary counts for a lint run.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct LintSummary {
    pub errors: usize,
    pub warnings: usize,
    pub infos: usize,
}

/// Extracted typography token properties.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TypographyStyle {
    pub properties: BTreeMap<String, String>,
}

/// Extracted component token properties.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ComponentTokens {
    pub properties: BTreeMap<String, String>,
}

/// Partitioned Markdown heading + prose section.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DocumentSection {
    pub heading: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical: Option<String>,
    pub content: String,
}

/// Parsed representation of a `DESIGN.md` document.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ParsedDesignMd {
    pub has_frontmatter: bool,
    pub version: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub unknown_top_keys: Vec<String>,
    pub colors: BTreeMap<String, String>,
    pub typography: BTreeMap<String, TypographyStyle>,
    pub rounded: BTreeMap<String, String>,
    pub spacing: BTreeMap<String, String>,
    pub components: BTreeMap<String, ComponentTokens>,
    pub sections: Vec<DocumentSection>,
}

/// Full lint report for a `DESIGN.md` file.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DesignMdLintReport {
    pub ok: bool,
    pub design_system: ParsedDesignMd,
    pub findings: Vec<LintFinding>,
    pub summary: LintSummary,
    pub sections: Vec<String>,
}

/// Supported token export formats.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportFormat {
    CssVars,
    Dtcg,
    CssTailwind,
    Json,
}

impl ExportFormat {
    /// Parse CLI `--format` flag for `export`.
    pub fn parse(raw: &str) -> Result<Self, String> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "css" | "css-vars" | "vars" => Ok(Self::CssVars),
            "dtcg" | "w3c" => Ok(Self::Dtcg),
            "tailwind" | "css-tailwind" | "theme" => Ok(Self::CssTailwind),
            "json" => Ok(Self::Json),
            other => Err(format!(
                "unsupported export format '{other}' (expected css-vars, dtcg, css-tailwind, or json)"
            )),
        }
    }
}

/// Compute Levenshtein edit distance between two strings.
#[must_use]
pub fn levenshtein(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    if a_chars.is_empty() {
        return b_chars.len();
    }
    if b_chars.is_empty() {
        return a_chars.len();
    }
    let mut prev: Vec<usize> = (0..=b_chars.len()).collect();
    let mut curr = vec![0usize; b_chars.len() + 1];
    for (i, &ca) in a_chars.iter().enumerate() {
        curr[0] = i + 1;
        for (j, &cb) in b_chars.iter().enumerate() {
            let cost = usize::from(ca != cb);
            curr[j + 1] = (prev[j + 1] + 1)
                .min(curr[j] + 1)
                .min(prev[j] + cost);
        }
        prev.clone_from(&curr);
    }
    prev[b_chars.len()]
}

fn suggest_key<'a>(unknown: &str, candidates: &[&'a str]) -> Option<&'a str> {
    let target = unknown.to_ascii_lowercase();
    candidates
        .iter()
        .copied()
        .map(|cand| (cand, levenshtein(&target, &cand.to_ascii_lowercase())))
        .filter(|(_, dist)| *dist <= 2)
        .min_by_key(|(_, dist)| *dist)
        .map(|(cand, _)| cand)
}

fn canonical_section_name(heading: &str) -> Option<&'static str> {
    let clean = heading.trim();
    for &(canonical, aliases) in CANONICAL_SECTIONS {
        if clean.eq_ignore_ascii_case(canonical)
            || aliases.iter().any(|a| clean.eq_ignore_ascii_case(a))
        {
            return Some(canonical);
        }
    }
    None
}

fn unquote(raw: &str) -> String {
    let t = raw.trim();
    if t.len() >= 2
        && ((t.starts_with('"') && t.ends_with('"')) || (t.starts_with('\'') && t.ends_with('\'')))
    {
        return t[1..t.len() - 1].to_string();
    }
    t.to_string()
}

fn strip_yaml_comment(line: &str) -> &str {
    let mut in_single = false;
    let mut in_double = false;
    let bytes = line.as_bytes();
    for (i, &b) in bytes.iter().enumerate() {
        match b {
            b'\'' if !in_double => in_single = !in_single,
            b'"' if !in_single => in_double = !in_double,
            b'#' if !in_single && !in_double && (i == 0 || bytes[i - 1].is_ascii_whitespace()) => {
                return &line[..i];
            }
            _ => {}
        }
    }
    line
}

fn split_frontmatter(content: &str) -> (Option<&str>, &str) {
    let normalized = content.strip_prefix('\u{feff}').unwrap_or(content);
    let trimmed = normalized.trim_start_matches(['\r', '\n']);
    let Some(rest) = trimmed
        .strip_prefix("---\r\n")
        .or_else(|| trimmed.strip_prefix("---\n"))
    else {
        return (None, normalized);
    };

    if let Some(idx) = rest.find("\n---") {
        let yaml_block = &rest[..idx];
        let after_marker = &rest[idx + 4..];
        let body = after_marker
            .strip_prefix("\r\n")
            .or_else(|| after_marker.strip_prefix('\n'))
            .unwrap_or(after_marker);
        return (Some(yaml_block), body);
    }
    (None, normalized)
}

fn parse_yaml_frontmatter(yaml: &str, out: &mut ParsedDesignMd) {
    #[derive(Clone, Copy, PartialEq, Eq)]
    enum Section {
        None,
        Colors,
        Typography,
        Rounded,
        Spacing,
        Components,
        Unknown,
    }

    let mut current_section = Section::None;
    let mut current_subkey: Option<String> = None;

    for raw_line in yaml.lines() {
        let line = strip_yaml_comment(raw_line).trim_end();
        if line.trim().is_empty() {
            continue;
        }
        let indent = line.chars().take_while(|c| *c == ' ').count();
        let trimmed = line.trim();

        if indent == 0 {
            current_subkey = None;
            let Some((k, v)) = trimmed.split_once(':') else {
                continue;
            };
            let key = k.trim();
            let val = unquote(v);
            match key {
                "version" => {
                    out.version = (!val.is_empty()).then_some(val);
                    current_section = Section::None;
                }
                "name" => {
                    out.name = (!val.is_empty()).then_some(val);
                    current_section = Section::None;
                }
                "description" => {
                    out.description = (!val.is_empty()).then_some(val);
                    current_section = Section::None;
                }
                "colors" => current_section = Section::Colors,
                "typography" => current_section = Section::Typography,
                "rounded" => current_section = Section::Rounded,
                "spacing" => current_section = Section::Spacing,
                "components" => current_section = Section::Components,
                other => {
                    out.unknown_top_keys.push(other.to_string());
                    current_section = Section::Unknown;
                }
            }
            continue;
        }

        if indent <= 2 {
            let Some((k, v)) = trimmed.split_once(':') else {
                continue;
            };
            let key = unquote(k);
            let val = unquote(v);
            match current_section {
                Section::Colors => {
                    if !val.is_empty() {
                        out.colors.insert(key, val);
                    }
                }
                Section::Rounded => {
                    if !val.is_empty() {
                        out.rounded.insert(key, val);
                    }
                }
                Section::Spacing => {
                    if !val.is_empty() {
                        out.spacing.insert(key, val);
                    }
                }
                Section::Typography => {
                    current_subkey = Some(key.clone());
                    out.typography.entry(key).or_default();
                }
                Section::Components => {
                    current_subkey = Some(key.clone());
                    out.components.entry(key).or_default();
                }
                Section::None | Section::Unknown => {}
            }
            continue;
        }

        if let Some(ref sub) = current_subkey
            && let Some((k, v)) = trimmed.split_once(':')
        {
            let prop_key = unquote(k);
            let prop_val = unquote(v);
            match current_section {
                Section::Typography => {
                    if let Some(entry) = out.typography.get_mut(sub) {
                        entry.properties.insert(prop_key, prop_val);
                    }
                }
                Section::Components => {
                    if let Some(entry) = out.components.get_mut(sub) {
                        entry.properties.insert(prop_key, prop_val);
                    }
                }
                _ => {}
            }
        }
    }
}

fn parse_sections(body: &str) -> Vec<DocumentSection> {
    let mut sections: Vec<DocumentSection> = Vec::new();
    let mut current_heading: Option<String> = None;
    let mut buffer = String::new();
    let mut in_fence = false;

    for line in body.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("```") {
            in_fence = !in_fence;
        }
        if !in_fence && let Some(heading) = trimmed.strip_prefix("## ") {
            if let Some(prev) = current_heading.take() {
                sections.push(DocumentSection {
                    canonical: canonical_section_name(&prev).map(str::to_string),
                    heading: prev,
                    content: buffer.trim().to_string(),
                });
                buffer.clear();
            }
            current_heading = Some(heading.trim().to_string());
            continue;
        }
        if current_heading.is_some() {
            if !buffer.is_empty() {
                buffer.push('\n');
            }
            buffer.push_str(line);
        }
    }

    if let Some(last) = current_heading {
        sections.push(DocumentSection {
            canonical: canonical_section_name(&last).map(str::to_string),
            heading: last,
            content: buffer.trim().to_string(),
        });
    }
    sections
}

/// Parse raw `DESIGN.md` Markdown + YAML frontmatter into a structured [`ParsedDesignMd`].
#[must_use]
pub fn parse_design_md(content: &str) -> ParsedDesignMd {
    let (frontmatter, body) = split_frontmatter(content);
    let mut out = ParsedDesignMd {
        has_frontmatter: frontmatter.is_some(),
        ..ParsedDesignMd::default()
    };
    if let Some(yaml) = frontmatter {
        parse_yaml_frontmatter(yaml, &mut out);
    }
    out.sections = parse_sections(body);
    out
}

/// Parse `#RRGGBB` or `#RGB` into `(r, g, b)` bytes.
#[must_use]
pub fn parse_hex_rgb(raw: &str) -> Option<(u8, u8, u8)> {
    let hex = raw.trim().strip_prefix('#')?;
    match hex.len() {
        3 => {
            let mut it = hex.chars();
            let r = u8::from_str_radix(&format!("{0}{0}", it.next()?), 16).ok()?;
            let g = u8::from_str_radix(&format!("{0}{0}", it.next()?), 16).ok()?;
            let b = u8::from_str_radix(&format!("{0}{0}", it.next()?), 16).ok()?;
            Some((r, g, b))
        }
        6 | 8 => {
            let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
            let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
            let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
            Some((r, g, b))
        }
        _ => None,
    }
}

fn srgb_channel_luminance(c: u8) -> f64 {
    let v = f64::from(c) / 255.0;
    if v <= 0.03928 {
        v / 12.92
    } else {
        ((v + 0.055) / 1.055).powf(2.4)
    }
}

/// Compute WCAG 2.1 contrast ratio (`1.0..=21.0`) between two `#RRGGBB` colors.
#[must_use]
pub fn contrast_ratio_hex(a: &str, b: &str) -> Option<f64> {
    let (ar, ag, ab) = parse_hex_rgb(a)?;
    let (br, bg, bb) = parse_hex_rgb(b)?;
    let la = 0.2126 * srgb_channel_luminance(ar)
        + 0.7152 * srgb_channel_luminance(ag)
        + 0.0722 * srgb_channel_luminance(ab);
    let lb = 0.2126 * srgb_channel_luminance(br)
        + 0.7152 * srgb_channel_luminance(bg)
        + 0.0722 * srgb_channel_luminance(bb);
    let (hi, lo) = if la >= lb { (la, lb) } else { (lb, la) };
    Some((hi + 0.05) / (lo + 0.05))
}

fn resolve_token_ref<'a>(parsed: &'a ParsedDesignMd, raw: &'a str) -> Option<&'a str> {
    let t = raw.trim();
    if let Some(inner) = t.strip_prefix('{').and_then(|s| s.strip_suffix('}'))
        && let Some((ns, key)) = inner.split_once('.')
    {
        return match ns {
            "colors" => parsed.colors.get(key).map(String::as_str),
            "rounded" => parsed.rounded.get(key).map(String::as_str),
            "spacing" => parsed.spacing.get(key).map(String::as_str),
            "typography" => parsed.typography.contains_key(key).then_some(t),
            _ => None,
        };
    }
    Some(t)
}

fn validate_component_refs(parsed: &ParsedDesignMd, findings: &mut Vec<LintFinding>) {
    for (comp_name, comp) in &parsed.components {
        for (prop, val) in &comp.properties {
            let trimmed = val.trim();
            if let Some(inner) = trimmed.strip_prefix('{').and_then(|s| s.strip_suffix('}')) {
                let Some((ns, key)) = inner.split_once('.') else {
                    findings.push(LintFinding {
                        rule: "broken-ref".into(),
                        severity: Severity::Error,
                        message: format!(
                            "component '{comp_name}.{prop}' has invalid token reference '{trimmed}'"
                        ),
                        path: Some(format!("components.{comp_name}.{prop}")),
                        suggestion: None,
                    });
                    continue;
                };
                let exists = match ns {
                    "colors" => parsed.colors.contains_key(key),
                    "rounded" => parsed.rounded.contains_key(key),
                    "spacing" => parsed.spacing.contains_key(key),
                    "typography" => parsed.typography.contains_key(key),
                    _ => false,
                };
                if !exists {
                    findings.push(LintFinding {
                        rule: "broken-ref".into(),
                        severity: Severity::Error,
                        message: format!(
                            "component '{comp_name}.{prop}' references missing token '{inner}'"
                        ),
                        path: Some(format!("components.{comp_name}.{prop}")),
                        suggestion: None,
                    });
                }
            }
        }
    }
}

fn is_disallowed_emoji(ch: char) -> bool {
    let cp = ch as u32;
    (0x1F300..=0x1FAFF).contains(&cp)
        || (0x2600..=0x26FF).contains(&cp)
        || (0x2700..=0x27BF).contains(&cp)
}

fn check_no_emoji(content: &str, findings: &mut Vec<LintFinding>) {
    for (line_idx, line) in content.lines().enumerate() {
        if let Some(ch) = line.chars().find(|c| is_disallowed_emoji(*c)) {
            findings.push(LintFinding {
                rule: "no-emoji".into(),
                severity: Severity::Error,
                message: format!(
                    "disallowed emoji U+{:04X} on line {}",
                    ch as u32,
                    line_idx + 1
                ),
                path: Some(format!("line:{}", line_idx + 1)),
                suggestion: Some("Replace emoji with Material Symbols Rounded icons or plain text".into()),
            });
            break;
        }
    }
}

/// Lint a `DESIGN.md` document for structure, token integrity, contrast, and zero-emoji compliance.
#[must_use]
pub fn lint_design_md(content: &str) -> DesignMdLintReport {
    let parsed = parse_design_md(content);
    let mut findings = Vec::new();

    if !parsed.has_frontmatter {
        findings.push(LintFinding {
            rule: "missing-frontmatter".into(),
            severity: Severity::Warning,
            message: "No YAML frontmatter block (`--- ... ---`) found".into(),
            path: None,
            suggestion: Some("Add YAML frontmatter defining colors, typography, rounded, spacing, and components".into()),
        });
    }

    for unknown in &parsed.unknown_top_keys {
        let suggestion = suggest_key(unknown, CANONICAL_TOP_KEYS)
            .map(|s| format!("Did you mean `{s}`?"));
        findings.push(LintFinding {
            rule: "unknown-key".into(),
            severity: Severity::Warning,
            message: format!("Unknown frontmatter key '{unknown}'"),
            path: Some(unknown.clone()),
            suggestion,
        });
    }

    if !parsed.colors.contains_key("primary") {
        findings.push(LintFinding {
            rule: "missing-primary".into(),
            severity: Severity::Error,
            message: "Required color token 'colors.primary' is missing".into(),
            path: Some("colors.primary".into()),
            suggestion: Some("Define `primary: \"#1242FF\"` under `colors:`".into()),
        });
    }

    if parsed.typography.is_empty() {
        findings.push(LintFinding {
            rule: "missing-typography".into(),
            severity: Severity::Warning,
            message: "No typography roles defined under `typography:`".into(),
            path: Some("typography".into()),
            suggestion: None,
        });
    }

    let present_canonical: BTreeSet<&str> = parsed
        .sections
        .iter()
        .filter_map(|s| s.canonical.as_deref())
        .collect();
    for &(canonical, _) in CANONICAL_SECTIONS {
        if !present_canonical.contains(canonical) {
            findings.push(LintFinding {
                rule: "missing-sections".into(),
                severity: Severity::Warning,
                message: format!("Missing recommended Markdown section `## {canonical}`"),
                path: Some(format!("section:{canonical}")),
                suggestion: None,
            });
        }
    }

    let mut last_idx: Option<usize> = None;
    for sec in &parsed.sections {
        if let Some(canon) = sec.canonical.as_deref()
            && let Some(pos) = CANONICAL_SECTIONS.iter().position(|(c, _)| *c == canon)
        {
            if let Some(prev) = last_idx
                && pos < prev
            {
                findings.push(LintFinding {
                    rule: "section-order".into(),
                    severity: Severity::Info,
                    message: format!("Section `## {}` appears out of canonical order", sec.heading),
                    path: Some(format!("section:{}", sec.heading)),
                    suggestion: None,
                });
            }
            last_idx = Some(pos);
        }
    }

    validate_component_refs(&parsed, &mut findings);

    const CONTRAST_PAIRS: &[(&str, &str)] = &[
        ("primary", "on-primary"),
        ("primary-container", "on-primary-container"),
        ("secondary", "on-secondary"),
        ("secondary-container", "on-secondary-container"),
        ("tertiary", "on-tertiary"),
        ("surface", "on-surface"),
        ("background", "on-background"),
        ("error", "on-error"),
        ("dark-primary", "dark-on-primary"),
        ("dark-surface", "dark-on-surface"),
        ("dark-background", "dark-on-background"),
        ("dark-error", "dark-on-error"),
    ];
    for &(bg_key, fg_key) in CONTRAST_PAIRS {
        if let (Some(bg), Some(fg)) = (parsed.colors.get(bg_key), parsed.colors.get(fg_key))
            && let Some(ratio) = contrast_ratio_hex(bg, fg)
            && ratio < 4.5
        {
            findings.push(LintFinding {
                rule: "contrast-ratio".into(),
                severity: Severity::Error,
                message: format!(
                    "Pair colors.{bg_key} ({bg}) / colors.{fg_key} ({fg}) contrast is {ratio:.2}:1 (< 4.50:1 WCAG AA)"
                ),
                path: Some(format!("colors.{fg_key}")),
                suggestion: None,
            });
        }
    }

    for (comp_name, comp) in &parsed.components {
        if let (Some(bg_raw), Some(fg_raw)) = (
            comp.properties.get("backgroundColor"),
            comp.properties.get("textColor"),
        ) && let (Some(bg), Some(fg)) = (
            resolve_token_ref(&parsed, bg_raw),
            resolve_token_ref(&parsed, fg_raw),
        ) && let Some(ratio) = contrast_ratio_hex(bg, fg)
            && ratio < 4.5
        {
            findings.push(LintFinding {
                rule: "contrast-ratio".into(),
                severity: Severity::Error,
                message: format!(
                    "Component '{comp_name}' contrast {bg} vs {fg} is {ratio:.2}:1 (< 4.50:1 WCAG AA)"
                ),
                path: Some(format!("components.{comp_name}")),
                suggestion: None,
            });
        }
    }

    check_no_emoji(content, &mut findings);

    let mut summary = LintSummary::default();
    for f in &findings {
        match f.severity {
            Severity::Error => summary.errors += 1,
            Severity::Warning => summary.warnings += 1,
            Severity::Info => summary.infos += 1,
        }
    }

    let sections = parsed.sections.iter().map(|s| s.heading.clone()).collect();
    DesignMdLintReport {
        ok: summary.errors == 0,
        design_system: parsed,
        findings,
        summary,
        sections,
    }
}

/// Export `DESIGN.md` tokens as CSS Custom Properties, W3C DTCG JSON, Tailwind v4 `@theme`, or JSON.
pub fn export_design_md(content: &str, format: ExportFormat) -> Result<String, String> {
    let parsed = parse_design_md(content);
    match format {
        ExportFormat::CssVars => {
            let mut out = String::from(":root {\n");
            for (k, v) in &parsed.colors {
                out.push_str(&format!("  --md-sys-color-{k}: {v};\n"));
            }
            for (k, v) in &parsed.rounded {
                out.push_str(&format!("  --md-sys-shape-corner-{k}: {v};\n"));
            }
            for (k, v) in &parsed.spacing {
                out.push_str(&format!("  --md-sys-spacing-{k}: {v};\n"));
            }
            out.push_str("}\n");
            Ok(out)
        }
        ExportFormat::CssTailwind => {
            let mut out = String::from("@theme {\n");
            for (k, v) in &parsed.colors {
                out.push_str(&format!("  --color-{k}: {v};\n"));
            }
            for (k, v) in &parsed.rounded {
                out.push_str(&format!("  --radius-{k}: {v};\n"));
            }
            for (k, v) in &parsed.spacing {
                out.push_str(&format!("  --spacing-{k}: {v};\n"));
            }
            out.push_str("}\n");
            Ok(out)
        }
        ExportFormat::Dtcg => {
            let mut colors_map = serde_json::Map::new();
            for (k, v) in &parsed.colors {
                colors_map.insert(
                    k.clone(),
                    serde_json::json!({ "$value": v, "$type": "color" }),
                );
            }
            let mut radius_map = serde_json::Map::new();
            for (k, v) in &parsed.rounded {
                radius_map.insert(
                    k.clone(),
                    serde_json::json!({ "$value": v, "$type": "dimension" }),
                );
            }
            let mut spacing_map = serde_json::Map::new();
            for (k, v) in &parsed.spacing {
                spacing_map.insert(
                    k.clone(),
                    serde_json::json!({ "$value": v, "$type": "dimension" }),
                );
            }
            let root = serde_json::json!({
                "name": parsed.name.unwrap_or_else(|| "Aphrody".into()),
                "version": parsed.version.unwrap_or_else(|| "alpha".into()),
                "color": colors_map,
                "radius": radius_map,
                "spacing": spacing_map,
            });
            serde_json::to_string_pretty(&root).map_err(|e| e.to_string())
        }
        ExportFormat::Json => serde_json::to_string_pretty(&parsed).map_err(|e| e.to_string()),
    }
}

/// Return the canonical `DESIGN.md` format specification as JSON.
#[must_use]
pub fn spec_report() -> serde_json::Value {
    let sections: Vec<serde_json::Value> = CANONICAL_SECTIONS
        .iter()
        .map(|&(name, aliases)| {
            serde_json::json!({
                "canonical": name,
                "aliases": aliases,
            })
        })
        .collect();
    serde_json::json!({
        "ok": true,
        "version": "alpha",
        "top_keys": CANONICAL_TOP_KEYS,
        "sections": sections,
        "recommended_colors": RECOMMENDED_COLORS,
        "export_formats": ["css-vars", "dtcg", "css-tailwind", "json"],
        "subcommands": ["lint", "spec", "export", "layout"],
    })
}

/// Computes a live Taffy viewport + component card layout preview for a parsed `DESIGN.md`.
#[must_use]
pub fn design_layout_report(
    parsed: &ParsedDesignMd,
    viewport_width: f32,
    viewport_height: f32,
) -> serde_json::Value {
    let vp_w = viewport_width.max(320.0);
    let vp_h = viewport_height.max(240.0);

    #[cfg(feature = "layout")]
    {
        use crate::layout::taffy::prelude::*;
        use crate::layout::taffy::{
            WaylandShellMargins, WaylandShellZones, google_design::WindowSizeClass,
        };

        let size_class = WindowSizeClass::from_width(vp_w);
        let nav_width = if size_class.prefers_navigation_rail() {
            80.0
        } else {
            0.0
        };
        let zones = WaylandShellZones::solve(
            Size {
                width: vp_w,
                height: vp_h,
            },
            WaylandShellMargins {
                top: 56.0,
                bottom: 0.0,
                left: nav_width,
                right: 0.0,
            },
        );

        let mut tree: TaffyTree<()> = TaffyTree::new();
        let mut names: Vec<String> = parsed.components.keys().cloned().collect();
        if names.is_empty() {
            names.push("surface-card".to_string());
        }
        let mut child_ids = Vec::with_capacity(names.len());
        for _ in &names {
            let id = tree
                .new_leaf(Style {
                    flex_grow: 1.0,
                    size: Size {
                        width: auto(),
                        height: length(88.0),
                    },
                    ..Style::DEFAULT
                })
                .expect("design_md taffy card leaf");
            child_ids.push(id);
        }
        let gap = size_class.gutter_dp();
        let margin = size_class.margin_dp();
        let cols = if size_class.prefers_navigation_rail() {
            3u16
        } else {
            1u16
        };
        let grid_root = tree
            .new_with_children(
                Style {
                    display: Display::Grid,
                    grid_template_columns: evenly_sized_tracks(cols),
                    gap: Size {
                        width: length(gap),
                        height: length(gap),
                    },
                    padding: Rect {
                        left: length(margin),
                        right: length(margin),
                        top: length(margin),
                        bottom: length(margin),
                    },
                    size: Size {
                        width: length(zones.usable_content.width),
                        height: length(zones.usable_content.height),
                    },
                    ..Style::DEFAULT
                },
                &child_ids,
            )
            .expect("design_md taffy grid root");
        tree.compute_layout(
            grid_root,
            Size {
                width: AvailableSpace::Definite(zones.usable_content.width),
                height: AvailableSpace::Definite(zones.usable_content.height),
            },
        )
        .expect("design_md taffy layout");

        let boxes: Vec<serde_json::Value> = names
            .iter()
            .zip(child_ids.iter())
            .filter_map(|(name, &id)| {
                let l = tree.layout(id).ok()?;
                Some(serde_json::json!({
                    "component": name,
                    "x": zones.usable_content.x + l.location.x,
                    "y": zones.usable_content.y + l.location.y,
                    "width": l.size.width,
                    "height": l.size.height,
                }))
            })
            .collect();

        serde_json::json!({
            "ok": true,
            "name": parsed.name,
            "viewport": { "width": vp_w, "height": vp_h },
            "window_class": format!("{size_class:?}"),
            "grid_columns": size_class.grid_columns(),
            "shell_zones": zones,
            "components": boxes,
        })
    }

    #[cfg(not(feature = "layout"))]
    {
        serde_json::json!({
            "ok": true,
            "name": parsed.name,
            "viewport": { "width": vp_w, "height": vp_h },
            "component_count": parsed.components.len(),
        })
    }
}

fn default_design_md_path(repo_root: &Path) -> PathBuf {
    let candidates = [
        repo_root.join("packages").join("design").join("DESIGN.md"),
        repo_root.join("DESIGN.md"),
    ];
    for p in candidates {
        if p.is_file() {
            return p;
        }
    }
    repo_root.join("packages").join("design").join("DESIGN.md")
}

/// Native CLI entrypoint for `ay design <lint|spec|export>`.
pub fn run_cli(repo_root: &Path, args: &[String]) -> i32 {
    let Some(sub) = args.first().map(String::as_str) else {
        println!(
            "ay design - DESIGN.md validator and token exporter\n\n\
             Usage:\n  ay design lint [path] [--format json|text]\n  \
             ay design spec [--format json|text]\n  \
             ay design export [path] [--format css-vars|dtcg|css-tailwind|json]\n  \
             ay design layout [path] [--width W] [--height H]\n  \
             ay design stitch <args...>   (routed via ai-os)\n  \
             ay design push <args...>     (routed via ai-os)"
        );
        return 0;
    };

    match sub {
        "help" | "--help" | "-h" => {
            run_cli(repo_root, &[]);
            0
        }
        "spec" => {
            let want_json = args.windows(2).any(|w| w[0] == "--format" && w[1] == "json");
            let spec = spec_report();
            if want_json {
                println!("{}", serde_json::to_string_pretty(&spec).unwrap_or_default());
            } else {
                println!("DESIGN.md specification (version alpha)");
                println!("Top keys: {}", CANONICAL_TOP_KEYS.join(", "));
                let names: Vec<&str> = CANONICAL_SECTIONS.iter().map(|(c, _)| *c).collect();
                println!("Sections: {}", names.join(" -> "));
            }
            0
        }
        "lint" => {
            let mut target: Option<PathBuf> = None;
            let mut format = "text";
            let mut i = 1usize;
            while i < args.len() {
                match args[i].as_str() {
                    "--format" | "-f" => {
                        if let Some(v) = args.get(i + 1) {
                            format = v.as_str();
                            i += 2;
                            continue;
                        }
                    }
                    flag if !flag.starts_with('-') && target.is_none() => {
                        let p = PathBuf::from(flag);
                        target = Some(if p.is_absolute() { p } else { repo_root.join(p) });
                    }
                    _ => {}
                }
                i += 1;
            }
            let path = target.unwrap_or_else(|| default_design_md_path(repo_root));
            let Ok(content) = fs::read_to_string(&path) else {
                eprintln!("ay design lint: cannot read {}", path.display());
                return 1;
            };
            let report = lint_design_md(&content);
            if format.eq_ignore_ascii_case("json") {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&report).unwrap_or_default()
                );
            } else {
                println!(
                    "{}: {} error(s), {} warning(s), {} info(s) ({} colors, {} sections)",
                    path.display(),
                    report.summary.errors,
                    report.summary.warnings,
                    report.summary.infos,
                    report.design_system.colors.len(),
                    report.sections.len(),
                );
                for f in &report.findings {
                    println!("  [{:?}] {}: {}", f.severity, f.rule, f.message);
                }
            }
            i32::from(!report.ok)
        }
        "export" => {
            let mut target: Option<PathBuf> = None;
            let mut format = ExportFormat::CssVars;
            let mut i = 1usize;
            while i < args.len() {
                match args[i].as_str() {
                    "--format" | "-f" => {
                        if let Some(v) = args.get(i + 1) {
                            match ExportFormat::parse(v) {
                                Ok(fmt) => format = fmt,
                                Err(err) => {
                                    eprintln!("ay design export: {err}");
                                    return 2;
                                }
                            }
                            i += 2;
                            continue;
                        }
                    }
                    flag if !flag.starts_with('-') && target.is_none() => {
                        let p = PathBuf::from(flag);
                        target = Some(if p.is_absolute() { p } else { repo_root.join(p) });
                    }
                    _ => {}
                }
                i += 1;
            }
            let path = target.unwrap_or_else(|| default_design_md_path(repo_root));
            let Ok(content) = fs::read_to_string(&path) else {
                eprintln!("ay design export: cannot read {}", path.display());
                return 1;
            };
            match export_design_md(&content, format) {
                Ok(out) => {
                    print!("{out}");
                    0
                }
                Err(err) => {
                    eprintln!("ay design export: {err}");
                    1
                }
            }
        }
        "layout" => {
            let mut target: Option<PathBuf> = None;
            let mut width = 1280.0f32;
            let mut height = 720.0f32;
            let mut i = 1usize;
            while i < args.len() {
                match args[i].as_str() {
                    "--width" | "-w" => {
                        if let Some(v) = args.get(i + 1).and_then(|s| s.parse::<f32>().ok()) {
                            width = v;
                            i += 2;
                            continue;
                        }
                    }
                    "--height" | "-H" => {
                        if let Some(v) = args.get(i + 1).and_then(|s| s.parse::<f32>().ok()) {
                            height = v;
                            i += 2;
                            continue;
                        }
                    }
                    flag if !flag.starts_with('-') && target.is_none() => {
                        let p = PathBuf::from(flag);
                        target = Some(if p.is_absolute() { p } else { repo_root.join(p) });
                    }
                    _ => {}
                }
                i += 1;
            }
            let path = target.unwrap_or_else(|| default_design_md_path(repo_root));
            let Ok(content) = fs::read_to_string(&path) else {
                eprintln!("ay design layout: cannot read {}", path.display());
                return 1;
            };
            let report = lint_design_md(&content);
            let layout_json = design_layout_report(&report.design_system, width, height);
            println!(
                "{}",
                serde_json::to_string_pretty(&layout_json).unwrap_or_default()
            );
            0
        }
        other => {
            eprintln!("ay design: unknown subcommand '{other}' (try `ay design --help`)");
            2
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_repo_design_md_lints_cleanly() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .and_then(|p| p.parent())
            .expect("repo root")
            .join("packages")
            .join("design")
            .join("DESIGN.md");
        let raw = fs::read_to_string(&path).expect("packages/design/DESIGN.md");
        let report = lint_design_md(&raw);
        assert!(
            report.ok,
            "packages/design/DESIGN.md had lint errors: {:?}",
            report.findings
        );
        assert_eq!(report.summary.errors, 0);
        assert_eq!(report.sections.len(), 8);
        assert!(report.design_system.colors.contains_key("primary"));
        assert!(report.design_system.components.contains_key("button-filled"));
    }

    #[test]
    fn lint_catches_contrast_broken_ref_and_typos() {
        let doc = "---\nversion: alpha\ncolrs: {}\ncolors:\n  primary: \"#777777\"\n  on-primary: \"#888888\"\ncomponents:\n  bad:\n    backgroundColor: \"{colors.missing}\"\n    textColor: \"{colors.on-primary}\"\n---\n## Overview\ntext\n";
        let report = lint_design_md(doc);
        assert!(!report.ok);
        assert!(report.findings.iter().any(|f| f.rule == "contrast-ratio"));
        assert!(report.findings.iter().any(|f| f.rule == "broken-ref"));
        assert!(
            report
                .findings
                .iter()
                .any(|f| f.rule == "unknown-key" && f.suggestion.as_deref() == Some("Did you mean `colors`?"))
        );
    }

    #[test]
    fn exports_all_formats_and_wcag_ratio() {
        assert!((contrast_ratio_hex("#000000", "#FFFFFF").unwrap() - 21.0).abs() < 0.05);
        let doc = "---\nname: Test\ncolors:\n  primary: \"#1242FF\"\n  on-primary: \"#FFFFFF\"\nrounded:\n  full: 9999px\nspacing:\n  md: 16px\n---\n";
        let css = export_design_md(doc, ExportFormat::CssVars).unwrap();
        assert!(css.contains("--md-sys-color-primary: #1242FF;"));
        let dtcg = export_design_md(doc, ExportFormat::Dtcg).unwrap();
        assert!(dtcg.contains("\"$type\": \"color\""));
        let tw = export_design_md(doc, ExportFormat::CssTailwind).unwrap();
        assert!(tw.contains("@theme"));
        assert!(tw.contains("--color-primary: #1242FF;"));

        let parsed = lint_design_md(doc).design_system;
        let layout_json = design_layout_report(&parsed, 1280.0, 720.0);
        assert_eq!(layout_json["ok"], true);
    }
}
