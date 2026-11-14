//! Reads the catalogs shared with `@aphrody/i18n` (`packages/i18n/locales/*.json`).
//! Same message subset: `{name}`, `{n, number}`, `{n, plural, =0 {} one {} other {}}` with `#`,
//! `{g, select, ...}`, apostrophe quoting. Plural rules are the CLDR ones for the shipped
//! locales (en, es: one = 1; fr: one = 0 or 1; zh-CN, ja: other). `#` and `number` print the
//! integer without grouping (the TypeScript side uses Intl.NumberFormat; keep shared test
//! values below 1000).

use std::collections::HashMap;
use std::sync::OnceLock;

pub const SOURCE_LOCALE: &str = "en";
pub const LOCALES: [&str; 5] = ["en", "fr", "zh-CN", "ja", "es"];

const RAW: [(&str, &str); 5] = [
    ("en", include_str!("../../../packages/i18n/locales/en.json")),
    ("fr", include_str!("../../../packages/i18n/locales/fr.json")),
    (
        "zh-CN",
        include_str!("../../../packages/i18n/locales/zh-CN.json"),
    ),
    ("ja", include_str!("../../../packages/i18n/locales/ja.json")),
    ("es", include_str!("../../../packages/i18n/locales/es.json")),
];

pub type Catalog = HashMap<String, String>;

pub fn catalogs() -> &'static HashMap<&'static str, Catalog> {
    static C: OnceLock<HashMap<&'static str, Catalog>> = OnceLock::new();
    C.get_or_init(|| {
        RAW.iter()
            .map(|(l, raw)| {
                (
                    *l,
                    serde_json::from_str(raw).expect("catalog JSON is valid"),
                )
            })
            .collect()
    })
}

#[derive(Debug, Clone, PartialEq)]
pub enum Arg {
    Str(String),
    Num(f64),
}

impl From<&str> for Arg {
    fn from(v: &str) -> Self {
        Arg::Str(v.to_owned())
    }
}
impl From<i64> for Arg {
    fn from(v: i64) -> Self {
        Arg::Num(v as f64)
    }
}
impl From<f64> for Arg {
    fn from(v: f64) -> Self {
        Arg::Num(v)
    }
}

pub type Args<'a> = &'a [(&'a str, Arg)];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyntaxError(pub String);

impl std::fmt::Display for SyntaxError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "message syntax: {}", self.0)
    }
}
impl std::error::Error for SyntaxError {}

#[derive(Debug, Clone)]
enum Node {
    Text(String),
    Arg {
        name: String,
        number: bool,
    },
    Pound,
    Plural {
        name: String,
        cases: Vec<(String, Vec<Node>)>,
    },
    Select {
        name: String,
        cases: Vec<(String, Vec<Node>)>,
    },
}

struct Parser {
    s: Vec<char>,
    i: usize,
}

impl Parser {
    fn err<T>(&self, m: &str) -> Result<T, SyntaxError> {
        Err(SyntaxError(format!("{m} at {}", self.i)))
    }
    fn peek(&self, off: usize) -> Option<char> {
        self.s.get(self.i + off).copied()
    }
    fn ws(&mut self) {
        while self.peek(0).is_some_and(char::is_whitespace) {
            self.i += 1;
        }
    }
    fn ident(&mut self) -> Result<String, SyntaxError> {
        self.ws();
        let start = self.i;
        while self
            .peek(0)
            .is_some_and(|c| !c.is_whitespace() && !matches!(c, ',' | '{' | '}'))
        {
            self.i += 1;
        }
        if start == self.i {
            return self.err("expected identifier");
        }
        Ok(self.s[start..self.i].iter().collect())
    }

    fn nodes(&mut self, nested: bool, in_plural: bool) -> Result<Vec<Node>, SyntaxError> {
        let mut out = Vec::new();
        let mut text = String::new();
        while let Some(c) = self.peek(0) {
            match c {
                '\'' => match self.peek(1) {
                    Some('\'') => {
                        text.push('\'');
                        self.i += 2;
                    }
                    Some('{' | '}') => {
                        self.i += 1;
                        while let Some(q) = self.peek(0) {
                            if q == '\'' {
                                if self.peek(1) == Some('\'') {
                                    text.push('\'');
                                    self.i += 2;
                                    continue;
                                }
                                self.i += 1;
                                break;
                            }
                            text.push(q);
                            self.i += 1;
                        }
                    }
                    _ => {
                        text.push(c);
                        self.i += 1;
                    }
                },
                '{' => {
                    if !text.is_empty() {
                        out.push(Node::Text(std::mem::take(&mut text)));
                    }
                    out.push(self.argument()?);
                }
                '}' => {
                    if nested {
                        break;
                    }
                    return self.err("unmatched }");
                }
                '#' if in_plural => {
                    if !text.is_empty() {
                        out.push(Node::Text(std::mem::take(&mut text)));
                    }
                    out.push(Node::Pound);
                    self.i += 1;
                }
                _ => {
                    text.push(c);
                    self.i += 1;
                }
            }
        }
        if !text.is_empty() {
            out.push(Node::Text(text));
        }
        Ok(out)
    }

    fn argument(&mut self) -> Result<Node, SyntaxError> {
        self.i += 1;
        let name = self.ident()?;
        self.ws();
        match self.peek(0) {
            Some('}') => {
                self.i += 1;
                return Ok(Node::Arg {
                    name,
                    number: false,
                });
            }
            Some(',') => self.i += 1,
            _ => return self.err("expected , or }"),
        }
        let kind = self.ident()?;
        self.ws();
        if kind == "number" {
            if self.peek(0) != Some('}') {
                return self.err("expected }");
            }
            self.i += 1;
            return Ok(Node::Arg { name, number: true });
        }
        if kind != "plural" && kind != "select" {
            return self.err(&format!("unsupported type {kind}"));
        }
        if self.peek(0) != Some(',') {
            return self.err("expected ,");
        }
        self.i += 1;
        let mut cases = Vec::new();
        loop {
            self.ws();
            match self.peek(0) {
                Some('}') => {
                    self.i += 1;
                    break;
                }
                None => return self.err("unterminated argument"),
                _ => {}
            }
            let key = self.ident()?;
            self.ws();
            if self.peek(0) != Some('{') {
                return self.err("expected {");
            }
            self.i += 1;
            let body = self.nodes(true, kind == "plural")?;
            if self.peek(0) != Some('}') {
                return self.err("unterminated case");
            }
            self.i += 1;
            cases.push((key, body));
        }
        if !cases.iter().any(|(k, _)| k == "other") {
            return self.err(&format!("{kind} requires an other case"));
        }
        Ok(if kind == "plural" {
            Node::Plural { name, cases }
        } else {
            Node::Select { name, cases }
        })
    }
}

fn parse(src: &str) -> Result<Vec<Node>, SyntaxError> {
    let mut p = Parser {
        s: src.chars().collect(),
        i: 0,
    };
    let n = p.nodes(false, false)?;
    if p.i < p.s.len() {
        return p.err("unexpected }");
    }
    Ok(n)
}

/// CLDR plural category for integer-valued `n` in the shipped locales.
pub fn plural_category(n: f64, locale: &str) -> &'static str {
    let lang = locale.split('-').next().unwrap_or_default();
    let int = n.fract() == 0.0;
    match lang {
        "en" | "es" if int && n == 1.0 => "one",
        "fr" if (0.0..2.0).contains(&n) => "one",
        _ => "other",
    }
}

fn num_text(v: f64) -> String {
    if v.fract() == 0.0 {
        format!("{}", v as i64)
    } else {
        v.to_string()
    }
}

fn arg<'a>(args: Args<'a>, name: &str) -> Option<&'a Arg> {
    args.iter().find(|(k, _)| *k == name).map(|(_, v)| v)
}

fn render(nodes: &[Node], locale: &str, args: Args<'_>, pound: Option<f64>, out: &mut String) {
    for n in nodes {
        match n {
            Node::Text(t) => out.push_str(t),
            Node::Pound => match pound {
                Some(p) => out.push_str(&num_text(p)),
                None => out.push('#'),
            },
            Node::Arg { name, number } => match arg(args, name) {
                None => out.push_str(&format!("{{{name}}}")),
                Some(Arg::Num(v)) if *number => out.push_str(&num_text(*v)),
                Some(Arg::Num(v)) => out.push_str(&num_text(*v)),
                Some(Arg::Str(s)) => out.push_str(s),
            },
            Node::Plural { name, cases } => {
                let v = match arg(args, name) {
                    Some(Arg::Num(v)) => *v,
                    Some(Arg::Str(s)) => match s.parse::<f64>() {
                        Ok(v) => v,
                        Err(_) => {
                            out.push_str(&format!("{{{name}}}"));
                            continue;
                        }
                    },
                    None => {
                        out.push_str(&format!("{{{name}}}"));
                        continue;
                    }
                };
                let exact = format!("={}", num_text(v));
                let cat = plural_category(v, locale);
                let branch = find(cases, &exact)
                    .or_else(|| find(cases, cat))
                    .or_else(|| find(cases, "other"));
                if let Some(b) = branch {
                    render(b, locale, args, Some(v), out);
                }
            }
            Node::Select { name, cases } => {
                let v = match arg(args, name) {
                    Some(Arg::Str(s)) => s.clone(),
                    Some(Arg::Num(v)) => num_text(*v),
                    None => "undefined".to_owned(),
                };
                if let Some(b) = find(cases, &v).or_else(|| find(cases, "other")) {
                    render(b, locale, args, pound, out);
                }
            }
        }
    }
}

fn find<'a>(cases: &'a [(String, Vec<Node>)], key: &str) -> Option<&'a Vec<Node>> {
    cases.iter().find(|(k, _)| k == key).map(|(_, v)| v)
}

/// Format one message for `locale`.
pub fn format_message(src: &str, locale: &str, args: Args<'_>) -> Result<String, SyntaxError> {
    let nodes = parse(src)?;
    let mut out = String::new();
    render(&nodes, locale, args, None, &mut out);
    Ok(out)
}

/// Closest supported locale for one tag: exact, then same language.
pub fn match_locale<'a>(tag: &str, supported: &[&'a str]) -> Option<&'a str> {
    let norm = tag.replace('_', "-");
    let norm = norm
        .split(['.', '@'])
        .next()
        .unwrap_or_default()
        .to_ascii_lowercase();
    if let Some(s) = supported.iter().find(|s| s.eq_ignore_ascii_case(&norm)) {
        return Some(s);
    }
    let base = norm.split('-').next().unwrap_or_default();
    supported
        .iter()
        .find(|s| s.eq_ignore_ascii_case(base))
        .or_else(|| {
            supported.iter().find(|s| {
                s.split('-')
                    .next()
                    .is_some_and(|b| b.eq_ignore_ascii_case(base))
            })
        })
        .copied()
}

/// Tags of an Accept-Language header ordered by q (stable on ties); q=0 dropped.
pub fn parse_accept_language(header: &str) -> Vec<String> {
    let mut v: Vec<(f64, usize, String)> = header
        .split(',')
        .enumerate()
        .filter_map(|(i, part)| {
            let mut it = part.trim().split(';');
            let tag = it.next()?.trim();
            let q = it
                .filter_map(|p| {
                    p.trim()
                        .strip_prefix("q=")
                        .or_else(|| p.trim().strip_prefix("Q="))
                })
                .find_map(|x| x.trim().parse::<f64>().ok())
                .unwrap_or(1.0);
            (!tag.is_empty() && q > 0.0).then(|| (q, i, tag.to_owned()))
        })
        .collect();
    v.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap().then(a.1.cmp(&b.1)));
    v.into_iter().map(|e| e.2).collect()
}

/// Pick a shipped locale from an Accept-Language header; falls back to `en`.
pub fn negotiate(accept_language: Option<&str>) -> &'static str {
    let Some(h) = accept_language else {
        return SOURCE_LOCALE;
    };
    for tag in parse_accept_language(h) {
        if tag == "*" {
            return SOURCE_LOCALE;
        }
        if let Some(m) = match_locale(&tag, &LOCALES) {
            return m;
        }
    }
    SOURCE_LOCALE
}

/// Translator bound to a locale, with fallback to the base language, then en, then the key.
#[derive(Debug, Clone)]
pub struct I18n {
    locale: &'static str,
}

impl I18n {
    pub fn new(requested: &str) -> Self {
        Self {
            locale: match_locale(requested, &LOCALES).unwrap_or(SOURCE_LOCALE),
        }
    }

    pub fn from_accept_language(header: Option<&str>) -> Self {
        Self {
            locale: negotiate(header),
        }
    }

    pub fn locale(&self) -> &'static str {
        self.locale
    }

    pub fn t(&self, key: &str) -> String {
        self.t_args(key, &[])
    }

    pub fn t_args(&self, key: &str, args: Args<'_>) -> String {
        let all = catalogs();
        for l in [self.locale, SOURCE_LOCALE] {
            if let Some(text) = all.get(l).and_then(|c| c.get(key)) {
                return format_message(text, l, args).unwrap_or_else(|_| key.to_owned());
            }
        }
        key.to_owned()
    }
}
