//! Minimal YAML document model with PyYAML-compatible loading and dumping.
//!
//! Upstream APM reads with `yaml.safe_load` (YAML 1.1 implicit resolvers) and
//! writes with `yaml.safe_dump(default_flow_style=False, sort_keys=False,
//! allow_unicode=True)`. This module reproduces both so lockfiles written here
//! are byte-identical to the Python ones. Parsing uses `saphyr-parser` events;
//! scalar resolution follows `PyYAML`'s `Resolver` (1.1 bool/int/float/null),
//! and anchors/aliases are rejected (spec req-mf-020).

use anyhow::Result;
use anyhow::anyhow;
use anyhow::bail;
use indexmap::IndexMap;
use saphyr_parser::Event;
use saphyr_parser::Parser;
use saphyr_parser::ScalarStyle;

/// A YAML value. Mapping keys are strings (APM documents only use string keys).
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    Int(i64),
    Float(f64),
    Str(String),
    /// A YAML 1.1 timestamp kept verbatim (`PyYAML` loads these as dates).
    Timestamp(String),
    Seq(Vec<Value>),
    Map(IndexMap<String, Value>),
}

impl Value {
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Self::Str(s) | Self::Timestamp(s) => Some(s),
            _ => None,
        }
    }
    pub fn as_map(&self) -> Option<&IndexMap<String, Value>> {
        match self {
            Self::Map(m) => Some(m),
            _ => None,
        }
    }
    pub fn as_seq(&self) -> Option<&[Value]> {
        match self {
            Self::Seq(s) => Some(s),
            _ => None,
        }
    }
    pub fn get(&self, key: &str) -> Option<&Value> {
        self.as_map().and_then(|m| m.get(key))
    }
    pub fn str(s: impl Into<String>) -> Self {
        Self::Str(s.into())
    }
    /// Python-style `str(value)` for scalars.
    pub fn to_plain_string(&self) -> Option<String> {
        match self {
            Self::Str(s) | Self::Timestamp(s) => Some(s.clone()),
            Self::Int(i) => Some(i.to_string()),
            Self::Float(f) => Some(float_repr(*f)),
            Self::Bool(b) => Some(if *b { "True" } else { "False" }.to_owned()),
            _ => None,
        }
    }
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/// Parse the first YAML document. Empty input yields `Value::Null`.
pub fn parse(text: &str) -> Result<Value> {
    enum Frame {
        Seq(Vec<Value>),
        Map(IndexMap<String, Value>, Option<String>),
    }
    let mut stack: Vec<Frame> = Vec::new();
    let mut root: Option<Value> = None;
    let mut parser = Parser::new_from_str(text);
    let mut in_doc = false;
    let push = |stack: &mut Vec<Frame>, root: &mut Option<Value>, v: Value| -> Result<()> {
        match stack.last_mut() {
            None => *root = Some(v),
            Some(Frame::Seq(items)) => items.push(v),
            Some(Frame::Map(map, key)) => match key.take() {
                None => {
                    let k = match v {
                        Value::Seq(_) | Value::Map(_) => {
                            bail!("complex mapping keys are not supported")
                        }
                        Value::Null => "null".to_owned(),
                        Value::Bool(b) => b.to_string(),
                        other => other.to_plain_string().unwrap_or_default(),
                    };
                    *key = Some(k);
                }
                Some(k) => {
                    map.insert(k, v);
                }
            },
        }
        Ok(())
    };
    while let Some(ev) = parser.next_event() {
        let (ev, span) = ev.map_err(|e| anyhow!("YAML parse error: {e}"))?;
        match ev {
            Event::DocumentStart(_) => {
                if root.is_some() {
                    break;
                }
                in_doc = true;
            }
            Event::DocumentEnd => {
                if in_doc && root.is_some() {
                    break;
                }
            }
            Event::Alias(_) => bail!(
                "YAML aliases are not allowed (line {}): APM manifests use the YAML safe subset",
                span.start.line()
            ),
            Event::Scalar(text, style, anchor, tag) => {
                if anchor != 0 {
                    bail!("YAML anchors are not allowed (line {})", span.start.line());
                }
                let forced_str = tag.as_ref().is_some_and(|t| t.suffix == "str");
                let v = if style == ScalarStyle::Plain && !forced_str {
                    resolve_plain(&text)
                } else {
                    Value::Str(text.into_owned())
                };
                push(&mut stack, &mut root, v)?;
            }
            Event::SequenceStart(anchor, _) => {
                if anchor != 0 {
                    bail!("YAML anchors are not allowed (line {})", span.start.line());
                }
                stack.push(Frame::Seq(Vec::new()));
            }
            Event::MappingStart(anchor, _) => {
                if anchor != 0 {
                    bail!("YAML anchors are not allowed (line {})", span.start.line());
                }
                stack.push(Frame::Map(IndexMap::new(), None));
            }
            Event::SequenceEnd => {
                let Some(Frame::Seq(items)) = stack.pop() else {
                    bail!("unbalanced sequence")
                };
                push(&mut stack, &mut root, Value::Seq(items))?;
            }
            Event::MappingEnd => {
                let Some(Frame::Map(map, _)) = stack.pop() else {
                    bail!("unbalanced mapping")
                };
                push(&mut stack, &mut root, Value::Map(map))?;
            }
            Event::StreamEnd => break,
            _ => {}
        }
    }
    Ok(root.unwrap_or(Value::Null))
}

fn resolve_plain(s: &str) -> Value {
    if is_null(s) {
        return Value::Null;
    }
    if let Some(b) = bool_value(s) {
        return Value::Bool(b);
    }
    if is_int(s)
        && let Some(i) = int_value(s)
    {
        return Value::Int(i);
    }
    if is_float(s) {
        return Value::Float(float_value(s));
    }
    if is_timestamp(s) {
        return Value::Timestamp(s.to_owned());
    }
    Value::Str(s.to_owned())
}

fn is_null(s: &str) -> bool {
    matches!(s, "" | "~" | "null" | "Null" | "NULL")
}

fn bool_value(s: &str) -> Option<bool> {
    match s {
        "yes" | "Yes" | "YES" | "true" | "True" | "TRUE" | "on" | "On" | "ON" => Some(true),
        "no" | "No" | "NO" | "false" | "False" | "FALSE" | "off" | "Off" | "OFF" => Some(false),
        _ => None,
    }
}

fn strip_sign(s: &str) -> (bool, &str) {
    match s.as_bytes().first() {
        Some(b'-') => (true, &s[1..]),
        Some(b'+') => (false, &s[1..]),
        _ => (false, s),
    }
}

fn all_of(s: &str, f: impl Fn(u8) -> bool) -> bool {
    !s.is_empty() && s.bytes().all(f)
}

/// `[0-5]?[0-9]` sexagesimal segments after the first `:`.
fn sexagesimal_tail(parts: &[&str]) -> bool {
    !parts.is_empty()
        && parts.iter().all(|p| {
            let b = p.as_bytes();
            match b.len() {
                1 => b[0].is_ascii_digit(),
                2 => (b'0'..=b'5').contains(&b[0]) && b[1].is_ascii_digit(),
                _ => false,
            }
        })
}

fn is_int(s: &str) -> bool {
    let (_, u) = strip_sign(s);
    if let Some(r) = u.strip_prefix("0b") {
        return all_of(r, |c| c == b'0' || c == b'1' || c == b'_');
    }
    if let Some(r) = u.strip_prefix("0x") {
        return all_of(r, |c| c.is_ascii_hexdigit() || c == b'_');
    }
    if let Some(r) = u.strip_prefix('0')
        && !r.is_empty()
    {
        return all_of(r, |c| (b'0'..=b'7').contains(&c) || c == b'_');
    }
    if u == "0" {
        return true;
    }
    let parts: Vec<&str> = u.split(':').collect();
    let head = parts[0];
    let head_ok = head
        .as_bytes()
        .first()
        .is_some_and(|c| (b'1'..=b'9').contains(c))
        && head.bytes().all(|c| c.is_ascii_digit() || c == b'_');
    if parts.len() == 1 {
        head_ok
    } else {
        head_ok && sexagesimal_tail(&parts[1..])
    }
}

fn int_value(s: &str) -> Option<i64> {
    let (neg, u) = strip_sign(s);
    let u = u.replace('_', "");
    let v = if let Some(r) = u.strip_prefix("0b") {
        i64::from_str_radix(r, 2).ok()?
    } else if let Some(r) = u.strip_prefix("0x") {
        i64::from_str_radix(r, 16).ok()?
    } else if u.len() > 1 && u.starts_with('0') {
        i64::from_str_radix(&u[1..], 8).ok()?
    } else if u.contains(':') {
        u.split(':')
            .try_fold(0i64, |acc, p| Some(acc * 60 + p.parse::<i64>().ok()?))?
    } else {
        u.parse().ok()?
    };
    Some(if neg { -v } else { v })
}

fn exp_ok(e: &str) -> bool {
    // [eE][-+][0-9]+
    let b = e.as_bytes();
    b.len() >= 3
        && (b[0] == b'e' || b[0] == b'E')
        && (b[1] == b'-' || b[1] == b'+')
        && b[2..].iter().all(u8::is_ascii_digit)
}

fn mantissa_exp(r: &str) -> bool {
    // [0-9_]*([eE][-+][0-9]+)?
    match r.find(['e', 'E']) {
        Some(i) => r[..i].bytes().all(|c| c.is_ascii_digit() || c == b'_') && exp_ok(&r[i..]),
        None => r.bytes().all(|c| c.is_ascii_digit() || c == b'_'),
    }
}

fn is_float(s: &str) -> bool {
    if matches!(s, ".nan" | ".NaN" | ".NAN") {
        return true;
    }
    if let Some(r) = s.strip_prefix('.') {
        return !r.is_empty() && r.as_bytes()[0] != b'e' && r.as_bytes()[0] != b'E' && {
            let digits_end = r.find(['e', 'E']).unwrap_or(r.len());
            digits_end > 0 && mantissa_exp(r)
        };
    }
    let (_, u) = strip_sign(s);
    if matches!(u, ".inf" | ".Inf" | ".INF") {
        return true;
    }
    if !u.as_bytes().first().is_some_and(u8::is_ascii_digit) {
        return false;
    }
    let Some(dot) = u.find('.') else { return false };
    let head = &u[..dot];
    let tail = &u[dot + 1..];
    let parts: Vec<&str> = head.split(':').collect();
    if !parts[0].bytes().all(|c| c.is_ascii_digit() || c == b'_') {
        return false;
    }
    if parts.len() > 1 {
        return sexagesimal_tail(&parts[1..])
            && tail.bytes().all(|c| c.is_ascii_digit() || c == b'_');
    }
    mantissa_exp(tail)
}

fn float_value(s: &str) -> f64 {
    let (neg, u) = strip_sign(s);
    let sign = if neg { -1.0 } else { 1.0 };
    match u.to_ascii_lowercase().as_str() {
        ".inf" => return sign * f64::INFINITY,
        ".nan" => return f64::NAN,
        _ => {}
    }
    let u = u.replace('_', "");
    if u.contains(':') {
        let mut acc = 0.0;
        for p in u.split(':') {
            acc = acc * 60.0 + p.parse::<f64>().unwrap_or(0.0);
        }
        return sign * acc;
    }
    sign * u.parse::<f64>().unwrap_or(0.0)
}

fn is_timestamp(s: &str) -> bool {
    let b = s.as_bytes();
    let digits =
        |r: std::ops::Range<usize>| r.clone().all(|i| b.get(i).is_some_and(u8::is_ascii_digit));
    if b.len() == 10
        && digits(0..4)
        && b[4] == b'-'
        && digits(5..7)
        && b[7] == b'-'
        && digits(8..10)
    {
        return true;
    }
    // [0-9]{4}-[0-9]{1,2}-[0-9]{1,2}([Tt]|[ \t]+)[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]*)?([ \t]*(Z|[-+][0-9]{1,2}(:[0-9]{2})?))?
    let mut i = 0;
    let take_digits = |i: &mut usize, min: usize, max: usize| -> bool {
        let start = *i;
        while *i < b.len() && b[*i].is_ascii_digit() && *i - start < max {
            *i += 1;
        }
        *i - start >= min
    };
    let take = |i: &mut usize, c: u8| -> bool {
        if b.get(*i) == Some(&c) {
            *i += 1;
            true
        } else {
            false
        }
    };
    if !(take_digits(&mut i, 4, 4)
        && take(&mut i, b'-')
        && take_digits(&mut i, 1, 2)
        && take(&mut i, b'-')
        && take_digits(&mut i, 1, 2))
    {
        return false;
    }
    if take(&mut i, b'T') || take(&mut i, b't') {
    } else {
        let start = i;
        while i < b.len() && (b[i] == b' ' || b[i] == b'\t') {
            i += 1;
        }
        if i == start {
            return false;
        }
    }
    if !(take_digits(&mut i, 1, 2)
        && take(&mut i, b':')
        && take_digits(&mut i, 2, 2)
        && take(&mut i, b':')
        && take_digits(&mut i, 2, 2))
    {
        return false;
    }
    if take(&mut i, b'.') {
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
    }
    while i < b.len() && (b[i] == b' ' || b[i] == b'\t') {
        i += 1;
    }
    if i == b.len() {
        return true;
    }
    if take(&mut i, b'Z') {
        return i == b.len();
    }
    if take(&mut i, b'-') || take(&mut i, b'+') {
        if !take_digits(&mut i, 1, 2) {
            return false;
        }
        if take(&mut i, b':') && !take_digits(&mut i, 2, 2) {
            return false;
        }
        return i == b.len();
    }
    false
}

/// True when a plain rendering of `s` would load back as something other than a string.
fn resolves_non_str(s: &str) -> bool {
    is_null(s)
        || bool_value(s).is_some()
        || is_int(s)
        || is_float(s)
        || is_timestamp(s)
        || s == "="
        || s == "<<"
}

// ---------------------------------------------------------------------------
// Dumping
// ---------------------------------------------------------------------------

/// Options mirroring the `yaml.safe_dump` keyword arguments APM uses.
#[derive(Debug, Clone, Copy)]
pub struct DumpOptions {
    pub sort_keys: bool,
    pub allow_unicode: bool,
    pub width: usize,
}

impl Default for DumpOptions {
    /// `yaml_to_str` defaults: `sort_keys=False, allow_unicode=True`, width 80.
    fn default() -> Self {
        Self {
            sort_keys: false,
            allow_unicode: true,
            width: 80,
        }
    }
}

/// Serialize like `yaml.safe_dump(value, default_flow_style=False, ...)`.
pub fn dump(value: &Value, opts: DumpOptions) -> String {
    let mut e = Emitter {
        out: String::new(),
        column: 0,
        whitespace: true,
        indention: true,
        opts,
    };
    match value {
        Value::Map(m) if !m.is_empty() => e.block_map(m, 0),
        Value::Seq(s) if !s.is_empty() => e.block_seq(s, 0, false),
        other => {
            e.node_inline(other, 0, false);
            if !matches!(other, Value::Map(_) | Value::Seq(_)) {
                e.write_indent(0);
                e.raw("...");
            }
        }
    }
    e.out.push('\n');
    e.out
}

/// `dump` with upstream `yaml_to_str` defaults.
pub fn to_string(value: &Value) -> String {
    dump(value, DumpOptions::default())
}

struct Emitter {
    out: String,
    column: usize,
    whitespace: bool,
    indention: bool,
    opts: DumpOptions,
}

#[derive(Default)]
struct Analysis {
    empty: bool,
    multiline: bool,
    allow_flow_plain: bool,
    allow_block_plain: bool,
    allow_single_quoted: bool,
}

const BREAKS: [char; 4] = ['\n', '\u{85}', '\u{2028}', '\u{2029}'];

fn is_ws_or_end(c: Option<char>) -> bool {
    matches!(
        c,
        None | Some('\0' | ' ' | '\t' | '\r' | '\n' | '\u{85}' | '\u{2028}' | '\u{2029}')
    )
}

fn analyze(scalar: &str, allow_unicode: bool) -> Analysis {
    if scalar.is_empty() {
        return Analysis {
            empty: true,
            multiline: false,
            allow_flow_plain: false,
            allow_block_plain: true,
            allow_single_quoted: true,
        };
    }
    let chars: Vec<char> = scalar.chars().collect();
    let n = chars.len();
    let mut block_ind = false;
    let mut flow_ind = false;
    let mut line_breaks = false;
    let mut special = false;
    let (mut leading_space, mut leading_break, mut trailing_space, mut trailing_break) =
        (false, false, false, false);
    let (mut break_space, mut space_break) = (false, false);
    if scalar.starts_with("---") || scalar.starts_with("...") {
        block_ind = true;
        flow_ind = true;
    }
    let mut preceded_ws = true;
    let mut followed_ws = n == 1 || is_ws_or_end(chars.get(1).copied());
    let (mut prev_space, mut prev_break) = (false, false);
    for (index, &ch) in chars.iter().enumerate() {
        if index == 0 {
            if "#,[]{}&*!|>'\"%@`".contains(ch) {
                flow_ind = true;
                block_ind = true;
            }
            if ch == '?' || ch == ':' {
                flow_ind = true;
                if followed_ws {
                    block_ind = true;
                }
            }
            if ch == '-' && followed_ws {
                flow_ind = true;
                block_ind = true;
            }
        } else {
            if ",?[]{}".contains(ch) {
                flow_ind = true;
            }
            if ch == ':' {
                flow_ind = true;
                if followed_ws {
                    block_ind = true;
                }
            }
            if ch == '#' && preceded_ws {
                flow_ind = true;
                block_ind = true;
            }
        }
        if BREAKS.contains(&ch) {
            line_breaks = true;
        }
        if !(ch == '\n' || ('\x20'..='\x7e').contains(&ch)) {
            let printable_unicode = (ch == '\u{85}'
                || ('\u{a0}'..='\u{d7ff}').contains(&ch)
                || ('\u{e000}'..='\u{fffd}').contains(&ch)
                || ('\u{10000}'..'\u{10ffff}').contains(&ch))
                && ch != '\u{feff}';
            if !(printable_unicode && allow_unicode) {
                special = true;
            }
        }
        if ch == ' ' {
            if index == 0 {
                leading_space = true;
            }
            if index == n - 1 {
                trailing_space = true;
            }
            if prev_break {
                break_space = true;
            }
            prev_space = true;
            prev_break = false;
        } else if BREAKS.contains(&ch) {
            if index == 0 {
                leading_break = true;
            }
            if index == n - 1 {
                trailing_break = true;
            }
            if prev_space {
                space_break = true;
            }
            prev_space = false;
            prev_break = true;
        } else {
            prev_space = false;
            prev_break = false;
        }
        preceded_ws = is_ws_or_end(Some(ch));
        followed_ws = index + 2 >= n || is_ws_or_end(chars.get(index + 2).copied());
    }
    let mut a = Analysis {
        empty: false,
        multiline: line_breaks,
        allow_flow_plain: true,
        allow_block_plain: true,
        allow_single_quoted: true,
    };
    if leading_space || leading_break || trailing_space || trailing_break {
        a.allow_flow_plain = false;
        a.allow_block_plain = false;
    }
    if break_space {
        a.allow_flow_plain = false;
        a.allow_block_plain = false;
        a.allow_single_quoted = false;
    }
    if space_break || special {
        a.allow_flow_plain = false;
        a.allow_block_plain = false;
        a.allow_single_quoted = false;
    }
    if line_breaks {
        a.allow_flow_plain = false;
        a.allow_block_plain = false;
    }
    if flow_ind {
        a.allow_flow_plain = false;
    }
    if block_ind {
        a.allow_block_plain = false;
    }
    a
}

#[derive(Clone, Copy, PartialEq)]
enum Style {
    Plain,
    Single,
    Double,
}

pub(crate) fn float_repr(f: f64) -> String {
    if f.is_nan() {
        return ".nan".into();
    }
    if f.is_infinite() {
        return if f > 0.0 {
            ".inf".into()
        } else {
            "-.inf".into()
        };
    }
    // Python repr: scientific when exponent < -4 or >= 16.
    let abs = f.abs();
    if abs != 0.0 && !(1e-4..1e16).contains(&abs) {
        let s = format!("{f:e}"); // e.g. 1e16, 1.5e-5
        let (m, e) = s.split_once('e').unwrap_or((&s, "0"));
        let m = if m.contains('.') {
            m.to_owned()
        } else {
            format!("{m}.0")
        };
        let exp: i32 = e.parse().unwrap_or(0);
        return format!("{m}e{}{:02}", if exp < 0 { '-' } else { '+' }, exp.abs());
    }
    let s = format!("{f:?}");
    s.to_lowercase()
}

impl Emitter {
    fn raw(&mut self, s: &str) {
        self.out.push_str(s);
        self.column += s.chars().count();
    }

    fn write_indicator(&mut self, ind: &str, need_ws: bool, whitespace: bool, indention: bool) {
        if !(self.whitespace || !need_ws) {
            self.out.push(' ');
            self.column += 1;
        }
        self.raw(ind);
        self.whitespace = whitespace;
        self.indention = self.indention && indention;
    }

    fn line_break(&mut self) {
        self.out.push('\n');
        self.whitespace = true;
        self.indention = true;
        self.column = 0;
    }

    fn write_indent(&mut self, indent: usize) {
        if !self.indention || self.column > indent || (self.column == indent && !self.whitespace) {
            self.line_break();
        }
        if self.column < indent {
            self.whitespace = true;
            let pad = " ".repeat(indent - self.column);
            self.out.push_str(&pad);
            self.column = indent;
        }
    }

    fn block_map(&mut self, m: &IndexMap<String, Value>, indent: usize) {
        let mut entries: Vec<(&String, &Value)> = m.iter().collect();
        if self.opts.sort_keys {
            entries.sort_by(|a, b| a.0.cmp(b.0));
        }
        for (k, v) in entries {
            // `check_simple_key`: len("!!str") + len(key) < 128, non-empty, single line.
            let simple = k.chars().count() + 5 < 128 && !k.is_empty() && !k.contains(BREAKS);
            self.write_indent(indent);
            if simple {
                self.scalar_str(k, indent + 2, true);
                self.write_indicator(":", false, false, false);
            } else {
                self.write_indicator("?", true, false, true);
                self.scalar_str(k, indent + 2, false);
                self.write_indent(indent);
                self.write_indicator(":", true, false, true);
            }
            self.node_inline(v, indent, true);
        }
    }

    fn block_seq(&mut self, s: &[Value], indent: usize, _indentless: bool) {
        for item in s {
            self.write_indent(indent);
            self.write_indicator("-", true, false, true);
            self.node_inline(item, indent, false);
        }
    }

    /// Emit a node that follows `key:` (`mapping_value`) or `-` at container `indent`.
    fn node_inline(&mut self, v: &Value, indent: usize, mapping_value: bool) {
        match v {
            Value::Map(m) if !m.is_empty() => self.block_map(m, indent + 2),
            Value::Seq(s) if !s.is_empty() => {
                let indentless = mapping_value && !self.indention;
                let inner = if indentless { indent } else { indent + 2 };
                self.block_seq(s, inner, indentless);
            }
            Value::Map(_) => {
                self.write_indicator("{", true, true, false);
                self.write_indicator("}", false, false, false);
            }
            Value::Seq(_) => {
                self.write_indicator("[", true, true, false);
                self.write_indicator("]", false, false, false);
            }
            Value::Null => self.plain("null", indent + 2, true),
            Value::Bool(b) => self.plain(if *b { "true" } else { "false" }, indent + 2, true),
            Value::Int(i) => self.plain(&i.to_string(), indent + 2, true),
            Value::Float(f) => self.plain(&float_repr(*f), indent + 2, true),
            Value::Timestamp(t) => self.plain(t, indent + 2, true),
            Value::Str(s) => self.scalar_str(s, indent + 2, false),
        }
    }

    fn scalar_str(&mut self, s: &str, indent: usize, simple_key: bool) {
        let a = analyze(s, self.opts.allow_unicode);
        let implicit = !resolves_non_str(s);
        let mut style = Style::Double;
        if implicit && !(simple_key && (a.empty || a.multiline)) && a.allow_block_plain {
            style = Style::Plain;
        } else if a.allow_single_quoted && !(simple_key && a.multiline) {
            style = Style::Single;
        }
        let split = !simple_key;
        match style {
            Style::Plain => self.plain(s, indent, split),
            Style::Single => self.single_quoted(s, indent, split),
            Style::Double => self.double_quoted(s, indent, split),
        }
    }

    fn plain(&mut self, text: &str, indent: usize, split: bool) {
        if text.is_empty() {
            return;
        }
        if !self.whitespace {
            self.out.push(' ');
            self.column += 1;
        }
        self.whitespace = false;
        self.indention = false;
        let chars: Vec<char> = text.chars().collect();
        let (mut spaces, mut start) = (false, 0usize);
        for end in 0..=chars.len() {
            let ch = chars.get(end).copied();
            if spaces {
                if ch != Some(' ') {
                    if start + 1 == end && self.column > self.opts.width && split {
                        self.write_indent(indent);
                        self.whitespace = false;
                        self.indention = false;
                    } else {
                        let data: String = chars[start..end].iter().collect();
                        self.raw(&data);
                    }
                    start = end;
                }
            } else if ch.is_none() || ch == Some(' ') {
                let data: String = chars[start..end].iter().collect();
                self.raw(&data);
                start = end;
            }
            if let Some(c) = ch {
                spaces = c == ' ';
            }
        }
    }

    fn single_quoted(&mut self, text: &str, indent: usize, split: bool) {
        self.write_indicator("'", true, false, false);
        let chars: Vec<char> = text.chars().collect();
        let n = chars.len();
        let (mut spaces, mut breaks, mut start) = (false, false, 0usize);
        for end in 0..=n {
            let ch = chars.get(end).copied();
            if spaces {
                if ch != Some(' ') {
                    if start + 1 == end
                        && self.column > self.opts.width
                        && split
                        && start != 0
                        && end != n
                    {
                        self.write_indent(indent);
                    } else {
                        let data: String = chars[start..end].iter().collect();
                        self.raw(&data);
                    }
                    start = end;
                }
            } else if breaks {
                if ch.is_none_or(|c| !BREAKS.contains(&c)) {
                    if chars[start] == '\n' {
                        self.line_break();
                    }
                    for &br in &chars[start..end] {
                        if br == '\n' {
                            self.line_break();
                        } else {
                            self.out.push(br);
                            self.whitespace = true;
                            self.indention = true;
                            self.column = 0;
                        }
                    }
                    self.write_indent(indent);
                    start = end;
                }
            } else if (ch.is_none()
                || ch.is_some_and(|c| c == ' ' || c == '\'' || BREAKS.contains(&c)))
                && start < end
            {
                let data: String = chars[start..end].iter().collect();
                self.raw(&data);
                start = end;
            }
            if ch == Some('\'') {
                self.raw("''");
                start = end + 1;
            }
            if let Some(c) = ch {
                spaces = c == ' ';
                breaks = BREAKS.contains(&c);
            }
        }
        self.write_indicator("'", false, false, false);
    }

    fn double_quoted(&mut self, text: &str, indent: usize, split: bool) {
        self.write_indicator("\"", true, false, false);
        let chars: Vec<char> = text.chars().collect();
        let n = chars.len();
        let mut start = 0usize;
        let allow_unicode = self.opts.allow_unicode;
        for end in 0..=n {
            let ch = chars.get(end).copied();
            let needs_escape = |c: char| {
                "\"\\\u{85}\u{2028}\u{2029}\u{feff}".contains(c)
                    || !(('\x20'..='\x7e').contains(&c)
                        || (allow_unicode
                            && (('\u{a0}'..='\u{d7ff}').contains(&c)
                                || ('\u{e000}'..='\u{fffd}').contains(&c))))
            };
            if ch.is_none_or(needs_escape) {
                if start < end {
                    let data: String = chars[start..end].iter().collect();
                    self.raw(&data);
                    start = end;
                }
                if let Some(c) = ch {
                    let data = match c {
                        '\0' => "\\0".to_owned(),
                        '\x07' => "\\a".to_owned(),
                        '\x08' => "\\b".to_owned(),
                        '\x09' => "\\t".to_owned(),
                        '\x0a' => "\\n".to_owned(),
                        '\x0b' => "\\v".to_owned(),
                        '\x0c' => "\\f".to_owned(),
                        '\x0d' => "\\r".to_owned(),
                        '\x1b' => "\\e".to_owned(),
                        '"' => "\\\"".to_owned(),
                        '\\' => "\\\\".to_owned(),
                        '\u{85}' => "\\N".to_owned(),
                        '\u{a0}' => "\\_".to_owned(),
                        '\u{2028}' => "\\L".to_owned(),
                        '\u{2029}' => "\\P".to_owned(),
                        c if (c as u32) <= 0xff => format!("\\x{:02X}", c as u32),
                        c if (c as u32) <= 0xffff => format!("\\u{:04X}", c as u32),
                        c => format!("\\U{:08X}", c as u32),
                    };
                    self.raw(&data);
                    start = end + 1;
                }
            }
            if end > 0
                && end + 1 < n
                && (ch == Some(' ') || start >= end)
                && self.column + end.saturating_sub(start) > self.opts.width
                && split
            {
                let mut data: String = chars[start.min(end)..end].iter().collect();
                data.push('\\');
                if start < end {
                    start = end;
                }
                self.raw(&data);
                self.write_indent(indent);
                self.whitespace = false;
                self.indention = false;
                if chars.get(start) == Some(&' ') {
                    self.raw("\\");
                }
            }
        }
        self.write_indicator("\"", false, false, false);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rt(s: &str) -> String {
        to_string(&parse(s).unwrap())
    }

    #[test]
    fn quoting_matches_pyyaml() {
        assert_eq!(rt("a: '1'\n"), "a: '1'\n");
        assert_eq!(rt("a: 0.1.0\n"), "a: 0.1.0\n");
        assert_eq!(rt("a: 'yes'\n"), "a: 'yes'\n");
        assert_eq!(rt("a: ''\n"), "a: ''\n");
        assert_eq!(rt("a: 'x: y'\n"), "a: 'x: y'\n");
        assert_eq!(rt("a: \"tab\\there\"\n"), "a: \"tab\\there\"\n");
        assert_eq!(rt("a: []\nb: {}\nc: null\n"), "a: []\nb: {}\nc: null\n");
        assert_eq!(rt("a:\n- x\n- y: 1\n  z: 2\n"), "a:\n- x\n- y: 1\n  z: 2\n");
        assert_eq!(rt("- - a\n"), "- - a\n");
        assert_eq!(rt("a: 0.1\n"), "a: 0.1\n");
        assert_eq!(rt("a: '2026-05-10'\n"), "a: '2026-05-10'\n");
    }

    #[test]
    fn long_plain_scalar_wraps_at_80() {
        let long = "word ".repeat(30);
        let v = Value::Map(IndexMap::from([(
            "k".to_owned(),
            Value::Str(long.trim().to_owned()),
        )]));
        let out = to_string(&v);
        assert!(out.lines().count() > 1);
        assert_eq!(parse(&out).unwrap(), v);
    }

    #[test]
    fn anchors_rejected() {
        assert!(parse("a: &x 1\nb: *x\n").is_err());
    }
}
