//! `gclient_eval.EvaluateCondition`: boolean conditions such as
//! `checkout_win and host_cpu == "x64"`.
//!
//! Names resolve to variables; a variable holding a plain string is itself evaluated as a
//! condition (with cycle detection), a `Str()` constant is used literally, and unknown names
//! evaluate to their own spelling.

use crate::value::{Dict, Value};
use crate::{Error, Result};
use ruff_python_ast::{BoolOp, CmpOp, Expr, UnaryOp};

pub fn evaluate(condition: &str, vars: &Dict) -> Result<Value> {
    evaluate_with(condition, vars, &mut Vec::new())
}

/// Evaluate and require a boolean result.
pub fn evaluate_bool(condition: &str, vars: &Dict) -> Result<bool> {
    match evaluate(condition, vars)? {
        Value::Bool(b) => Ok(b),
        other => Err(Error::new(format!(
            "condition {condition:?} evaluated to non-boolean {other}"
        ))),
    }
}

fn evaluate_with(condition: &str, vars: &Dict, seen: &mut Vec<String>) -> Result<Value> {
    let parsed = ruff_python_parser::parse_expression(condition)
        .map_err(|e| Error::new(format!("invalid condition {condition:?}: {e}")))?;
    let expr = parsed.into_expr();
    convert(&expr, condition, vars, seen, false)
}

fn convert(
    node: &Expr,
    cond: &str,
    vars: &Dict,
    seen: &mut Vec<String>,
    allow_tuple: bool,
) -> Result<Value> {
    let bad = |msg: String| Error::new(format!("{msg} (inside {cond:?})"));
    match node {
        Expr::StringLiteral(s) => Ok(Value::Str(s.value.to_str().to_string())),
        Expr::Tuple(t) if allow_tuple => t
            .elts
            .iter()
            .map(|e| convert(e, cond, vars, seen, false))
            .collect::<Result<_>>()
            .map(Value::Tuple),
        Expr::Name(n) => {
            let id = n.id.as_str();
            if seen.iter().any(|s| s == id) {
                return Err(bad(format!("invalid cyclic reference to '{id}'")));
            }
            match id {
                "None" => return Ok(Value::None),
                "True" => return Ok(Value::Bool(true)),
                "False" => return Ok(Value::Bool(false)),
                _ => {}
            }
            match vars.get(id) {
                Some(Value::Str(s)) => {
                    seen.push(id.to_string());
                    let r = evaluate_with(s, vars, seen);
                    seen.pop();
                    r
                }
                Some(other) => Ok(other.clone()),
                None => Ok(Value::Str(id.to_string())),
            }
        }
        Expr::BooleanLiteral(b) => Ok(Value::Bool(b.value)),
        Expr::NoneLiteral(_) => Ok(Value::None),
        Expr::BoolOp(b) => {
            // Python evaluates every operand (any()/all() over a list), so errors surface even
            // when the result is already known.
            let word = if b.op == BoolOp::Or { "or" } else { "and" };
            let mut values = Vec::with_capacity(b.values.len());
            for v in &b.values {
                match convert(v, cond, vars, seen, false)? {
                    Value::Bool(x) => values.push(x),
                    other => return Err(bad(format!("invalid \"{word}\" operand {other}"))),
                }
            }
            Ok(Value::Bool(if b.op == BoolOp::Or {
                values.iter().any(|x| *x)
            } else {
                values.iter().all(|x| *x)
            }))
        }
        Expr::UnaryOp(u) if u.op == UnaryOp::Not => {
            match convert(&u.operand, cond, vars, seen, false)? {
                Value::Bool(x) => Ok(Value::Bool(!x)),
                other => Err(bad(format!("invalid \"not\" operand {other}"))),
            }
        }
        Expr::Compare(c) => {
            if c.ops.len() != 1 || c.operands.len() != 2 {
                return Err(bad("invalid compare: exactly 1 operator required".into()));
            }
            let op = c.ops[0];
            let left = convert(&c.operands[0], cond, vars, seen, false)?;
            let right = convert(&c.operands[1], cond, vars, seen, op == CmpOp::In)?;
            match op {
                CmpOp::Eq => Ok(Value::Bool(left.py_eq(&right))),
                CmpOp::NotEq => Ok(Value::Bool(!left.py_eq(&right))),
                CmpOp::In => match &right {
                    Value::Tuple(items) | Value::List(items) => {
                        Ok(Value::Bool(items.iter().any(|i| i.py_eq(&left))))
                    }
                    Value::Str(s) | Value::ConstStr(s) => match left.as_str() {
                        Some(l) => Ok(Value::Bool(s.contains(l))),
                        None => Err(bad(format!(
                            "'in <string>' requires string as left operand, not {left}"
                        ))),
                    },
                    other => Err(bad(format!("argument of type {other} is not iterable"))),
                },
                other => Err(bad(format!("unexpected operator: {}", other.as_str()))),
            }
        }
        other => Err(bad(format!(
            "unexpected AST node {:?}",
            std::mem::discriminant(other)
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vars() -> Dict {
        [
            ("checkout_win", Value::Bool(true)),
            ("checkout_linux", Value::Bool(false)),
            ("host_os", Value::Str("win".into())),
            (
                "derived",
                Value::Str("checkout_win and not checkout_linux".into()),
            ),
            ("literal", Value::ConstStr("checkout_linux".into())),
            ("loop_a", Value::Str("loop_b".into())),
            ("loop_b", Value::Str("loop_a".into())),
        ]
        .into_iter()
        .map(|(k, v)| (k.to_string(), v))
        .collect()
    }

    #[test]
    fn upstream_semantics() {
        let v = vars();
        assert!(evaluate_bool("checkout_win and host_os == \"win\"", &v).unwrap());
        assert!(!evaluate_bool("checkout_linux or host_os != 'win'", &v).unwrap());
        assert!(evaluate_bool("derived", &v).unwrap());
        assert!(evaluate_bool("host_os in ('mac', 'win')", &v).unwrap());
        assert!(evaluate_bool("literal == 'checkout_linux'", &v).unwrap());
        // Unknown names are strings, so `and` over them is an error, as upstream.
        assert!(evaluate("checkout_win and unknown_thing", &v).is_err());
        assert!(evaluate("loop_a", &v).is_err());
        assert!(evaluate("checkout_win or __import__('os')", &v).is_err());
    }
}
