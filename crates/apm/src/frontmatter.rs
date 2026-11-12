//! Markdown frontmatter split/emit, mirroring python-frontmatter as wrapped by
//! `apm_cli/utils/yaml_io.py` (`loads_frontmatter`, `frontmatter.dumps`).

use anyhow::Result;
use indexmap::IndexMap;

use crate::yaml::DumpOptions;
use crate::yaml::Value;
use crate::yaml::{self};

/// A parsed Markdown document.
#[derive(Debug, Clone, Default)]
pub struct Post {
    pub metadata: IndexMap<String, Value>,
    /// Body as python-frontmatter returns it (leading whitespace after the fence consumed).
    pub content: String,
    /// Body starting right after the closing fence's line break (`preserve_body=True`).
    pub raw_body: String,
    pub has_frontmatter: bool,
}

fn is_fence(line: &str) -> bool {
    let t = line.trim_end();
    t.len() >= 3 && t.bytes().all(|b| b == b'-')
}

/// Parse `text`. Malformed YAML inside the fence is an error (fail-closed upstream).
pub fn loads(text: &str) -> Result<Post> {
    let text = text.strip_prefix('\u{feff}').unwrap_or(text);
    let mut lines = text.split_inclusive('\n');
    let first = lines.next().unwrap_or("");
    if !is_fence(first) {
        return Ok(Post {
            content: text.to_owned(),
            raw_body: text.to_owned(),
            ..Post::default()
        });
    }
    let mut offset = first.len();
    let fm_start = offset;
    for line in lines {
        if is_fence(line) {
            let fm = &text[fm_start..offset];
            let body_start = offset + line.len();
            let raw_body = text[body_start..].to_owned();
            let metadata = match yaml::parse(fm)? {
                Value::Map(m) => m,
                _ => IndexMap::new(),
            };
            let content = raw_body.trim_start().to_owned();
            return Ok(Post {
                metadata,
                content,
                raw_body,
                has_frontmatter: true,
            });
        }
        offset += line.len();
    }
    Ok(Post {
        content: text.to_owned(),
        raw_body: text.to_owned(),
        ..Post::default()
    })
}

/// `frontmatter.dumps(post)`: `---\n<yaml sort_keys>\n---\n\n<content>` stripped.
pub fn dumps(metadata: &IndexMap<String, Value>, content: &str) -> String {
    let meta = yaml::dump(
        &Value::Map(metadata.clone()),
        DumpOptions {
            sort_keys: true,
            allow_unicode: true,
            width: 80,
        },
    );
    let meta = if metadata.is_empty() {
        "{}".to_owned()
    } else {
        meta.trim().to_owned()
    };
    format!("---\n{meta}\n---\n\n{content}\n").trim().to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_and_preserve_body() {
        let p = loads("---\napplyTo: '**/*.py'\n---\n\n# Body\n").unwrap();
        assert!(p.has_frontmatter);
        assert_eq!(p.metadata["applyTo"], Value::str("**/*.py"));
        assert_eq!(p.raw_body, "\n# Body\n");
        assert_eq!(p.content, "# Body\n");
        let none = loads("# Just text\n").unwrap();
        assert!(!none.has_frontmatter && none.metadata.is_empty());
    }

    #[test]
    fn dumps_sorts_keys() {
        let mut m = IndexMap::new();
        m.insert("model".into(), Value::str("x"));
        m.insert("description".into(), Value::str("d"));
        assert_eq!(
            dumps(&m, "Body\n"),
            "---\ndescription: d\nmodel: x\n---\n\nBody"
        );
    }
}
