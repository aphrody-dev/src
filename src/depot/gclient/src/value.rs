//! Values produced by evaluating DEPS and `.gclient` files.
//!
//! The model follows `gclient_eval.py`: Python literals (`None`, booleans, integers, strings,
//! lists, tuples, dicts) plus `Str()` constants, which are strings that are never treated as
//! conditions.

use std::fmt;

/// An evaluated DEPS value.
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    None,
    Bool(bool),
    Int(i64),
    Str(String),
    /// `Str('...')`: a string constant that conditions compare literally instead of evaluating.
    ConstStr(String),
    List(Vec<Value>),
    Tuple(Vec<Value>),
    Dict(Dict),
}

impl Value {
    /// The string payload of `Str` and `ConstStr`.
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Value::Str(s) | Value::ConstStr(s) => Some(s),
            _ => None,
        }
    }

    pub fn as_dict(&self) -> Option<&Dict> {
        match self {
            Value::Dict(d) => Some(d),
            _ => None,
        }
    }

    pub fn as_dict_mut(&mut self) -> Option<&mut Dict> {
        match self {
            Value::Dict(d) => Some(d),
            _ => None,
        }
    }

    /// Elements of a list or tuple.
    pub fn as_seq(&self) -> Option<&[Value]> {
        match self {
            Value::List(v) | Value::Tuple(v) => Some(v),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            Value::Bool(b) => Some(*b),
            _ => None,
        }
    }

    /// Python `str(value)` / `format(value)`, used by `{var}` expansion and `%` formatting.
    pub fn to_py_str(&self) -> String {
        match self {
            Value::Str(s) | Value::ConstStr(s) => s.clone(),
            other => other.to_string(),
        }
    }

    /// Python truthiness.
    pub fn truthy(&self) -> bool {
        match self {
            Value::None => false,
            Value::Bool(b) => *b,
            Value::Int(i) => *i != 0,
            Value::Str(s) | Value::ConstStr(s) => !s.is_empty(),
            Value::List(v) | Value::Tuple(v) => !v.is_empty(),
            Value::Dict(d) => !d.is_empty(),
        }
    }

    /// Python `==`: `Str()` constants compare equal to plain strings, `True == 1`.
    pub fn py_eq(&self, other: &Value) -> bool {
        match (self, other) {
            (a, b) if a.as_str().is_some() && b.as_str().is_some() => a.as_str() == b.as_str(),
            (Value::Bool(a), Value::Int(b)) | (Value::Int(b), Value::Bool(a)) => {
                i64::from(*a) == *b
            }
            (Value::List(a), Value::List(b)) | (Value::Tuple(a), Value::Tuple(b)) => {
                a.len() == b.len() && a.iter().zip(b).all(|(x, y)| x.py_eq(y))
            }
            (a, b) => a == b,
        }
    }
}

/// Python `repr()`, close enough for diagnostics and `revinfo` of non-string values.
impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::None => f.write_str("None"),
            Value::Bool(true) => f.write_str("True"),
            Value::Bool(false) => f.write_str("False"),
            Value::Int(i) => write!(f, "{i}"),
            Value::Str(s) => write!(f, "{}", py_repr_str(s)),
            Value::ConstStr(s) => write!(f, "Str({})", py_repr_str(s)),
            Value::List(v) => {
                f.write_str("[")?;
                for (i, x) in v.iter().enumerate() {
                    if i > 0 {
                        f.write_str(", ")?;
                    }
                    write!(f, "{x}")?;
                }
                f.write_str("]")
            }
            Value::Tuple(v) => {
                f.write_str("(")?;
                for (i, x) in v.iter().enumerate() {
                    if i > 0 {
                        f.write_str(", ")?;
                    }
                    write!(f, "{x}")?;
                }
                if v.len() == 1 {
                    f.write_str(",")?;
                }
                f.write_str(")")
            }
            Value::Dict(d) => {
                f.write_str("{")?;
                for (i, (k, v)) in d.iter().enumerate() {
                    if i > 0 {
                        f.write_str(", ")?;
                    }
                    write!(f, "{}: {v}", py_repr_str(k))?;
                }
                f.write_str("}")
            }
        }
    }
}

/// Python `repr()` of a string: single quotes unless the string holds a single quote only.
pub fn py_repr_str(s: &str) -> String {
    let quote = if s.contains('\'') && !s.contains('"') {
        '"'
    } else {
        '\''
    };
    let mut out = String::with_capacity(s.len() + 2);
    out.push(quote);
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c == quote => {
                out.push('\\');
                out.push(c);
            }
            c => out.push(c),
        }
    }
    out.push(quote);
    out
}

/// An insertion-ordered dict with string keys (DEPS keys are always strings).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Dict(Vec<(String, Value)>);

impl Dict {
    pub fn new() -> Self {
        Self(Vec::new())
    }

    pub fn get(&self, key: &str) -> Option<&Value> {
        self.0.iter().find(|(k, _)| k == key).map(|(_, v)| v)
    }

    pub fn get_mut(&mut self, key: &str) -> Option<&mut Value> {
        self.0.iter_mut().find(|(k, _)| k == key).map(|(_, v)| v)
    }

    pub fn contains_key(&self, key: &str) -> bool {
        self.get(key).is_some()
    }

    /// Insert or replace, keeping the original position of an existing key.
    pub fn insert(&mut self, key: impl Into<String>, value: Value) {
        let key = key.into();
        match self.get_mut(&key) {
            Some(slot) => *slot = value,
            None => self.0.push((key, value)),
        }
    }

    pub fn remove(&mut self, key: &str) -> Option<Value> {
        let idx = self.0.iter().position(|(k, _)| k == key)?;
        Some(self.0.remove(idx).1)
    }

    pub fn iter(&self) -> impl Iterator<Item = (&String, &Value)> {
        self.0.iter().map(|(k, v)| (k, v))
    }

    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.0.iter().map(|(k, _)| k)
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// `dict.update()`.
    pub fn update(&mut self, other: &Dict) {
        for (k, v) in other.iter() {
            self.insert(k.clone(), v.clone());
        }
    }

    pub fn get_str(&self, key: &str) -> Option<&str> {
        self.get(key).and_then(Value::as_str)
    }
}

impl FromIterator<(String, Value)> for Dict {
    fn from_iter<I: IntoIterator<Item = (String, Value)>>(iter: I) -> Self {
        let mut d = Dict::new();
        for (k, v) in iter {
            d.insert(k, v);
        }
        d
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repr_matches_python() {
        assert_eq!(Value::Str("a'b".into()).to_string(), "\"a'b\"");
        assert_eq!(Value::Tuple(vec![Value::Int(1)]).to_string(), "(1,)");
        assert_eq!(Value::ConstStr("x".into()).to_string(), "Str('x')");
        assert_eq!(Value::Bool(true).to_py_str(), "True");
    }

    #[test]
    fn const_strings_equal_plain_strings() {
        assert!(Value::ConstStr("a".into()).py_eq(&Value::Str("a".into())));
        assert!(!Value::Bool(false).py_eq(&Value::Str("False".into())));
    }
}
