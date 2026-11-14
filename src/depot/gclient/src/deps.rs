//! `gclient_eval.Parse`: a DEPS file with standardized `deps`, merged `deps_os` and `hooks_os`.

use crate::eval;
use crate::value::{Dict, Value};
use crate::{Error, Result};

/// `UpdateCondition`: combine `info["condition"]` with `new` using `op` ("and" / "or").
/// An absent condition means true.
pub fn update_condition(info: &mut Dict, op: &str, new: Option<&str>) {
    let cur = info.get_str("condition").map(str::to_string);
    let new = new.filter(|s| !s.is_empty());
    match (cur.as_deref().filter(|s| !s.is_empty()), new) {
        (Some(c), Some(n)) => info.insert("condition", Value::Str(format!("({c}) {op} ({n})"))),
        (c, n) if op == "and" && (c.is_some() || n.is_some()) => info.insert(
            "condition",
            Value::Str(c.or(n).unwrap_or_default().to_string()),
        ),
        (Some(_), None) => {
            info.remove("condition");
        }
        _ => {}
    }
}

/// `gclient_utils.merge_conditions`.
pub fn merge_conditions(conditions: &[Option<&str>]) -> Option<String> {
    let mut out: Option<String> = None;
    for c in conditions.iter().flatten().filter(|c| !c.is_empty()) {
        out = Some(match out {
            None => c.to_string(),
            Some(prev) => format!("({prev}) and ({c})"),
        });
    }
    out
}

/// Expand variable names in keys and turn bare URL strings into `{url, dep_type}` dicts.
fn standardize(deps: &Dict, vars: &Dict) -> Result<Dict> {
    let mut out = Dict::new();
    for (name, info) in deps.iter() {
        let name = eval::expand_vars(name, vars)?;
        let info = match info {
            Value::Dict(d) => {
                let mut d = d.clone();
                if !d.contains_key("dep_type") {
                    let t = if d.contains_key("packages") {
                        "cipd"
                    } else if d.contains_key("bucket") {
                        "gcs"
                    } else {
                        "git"
                    };
                    d.insert("dep_type", Value::Str(t.into()));
                }
                Value::Dict(d)
            }
            Value::None => {
                let mut d = Dict::new();
                d.insert("url", Value::None);
                d.insert("dep_type", Value::Str("git".into()));
                Value::Dict(d)
            }
            other => {
                let mut d = Dict::new();
                d.insert("url", other.clone());
                d.insert("dep_type", Value::Str("git".into()));
                Value::Dict(d)
            }
        };
        out.insert(name, info);
    }
    Ok(out)
}

/// Parse a DEPS file the way `Dependency.ParseDepsFile` does.
pub fn parse(
    content: &str,
    filename: &str,
    vars_override: Option<&Dict>,
    builtin_vars: Option<&Dict>,
) -> Result<Dict> {
    let mut scope = eval::exec(content, filename, vars_override, builtin_vars)?;
    let vars = scope
        .get("vars")
        .and_then(Value::as_dict)
        .cloned()
        .unwrap_or_default();

    if let Some(Value::Dict(deps)) = scope.get("deps") {
        let std = standardize(deps, &vars)?;
        scope.insert("deps", Value::Dict(std));
    }

    if let Some(Value::Dict(deps_os)) = scope.remove("deps_os") {
        let mut deps = scope
            .get("deps")
            .and_then(Value::as_dict)
            .cloned()
            .unwrap_or_default();
        for (os_name, os_deps) in deps_os.iter() {
            let os_deps = standardize(
                os_deps
                    .as_dict()
                    .ok_or_else(|| Error::new("deps_os entries must be dicts"))?,
                &vars,
            )?;
            let os_condition = format!(
                "checkout_{}",
                if os_name == "unix" { "linux" } else { os_name }
            );
            for (dep_name, info) in os_deps.iter() {
                let mut info = info.as_dict().cloned().unwrap_or_default();
                if matches!(info.get("url"), Some(Value::None) | None) {
                    continue;
                }
                update_condition(&mut info, "and", Some(&os_condition));
                if let Some(existing) = deps.get(dep_name).and_then(Value::as_dict) {
                    if existing.get("url") != info.get("url") {
                        return Err(Error::new(format!(
                            "Value from deps_os ({os_name}; {dep_name}) conflicts with existing deps entry"
                        )));
                    }
                    let prev = existing.get_str("condition").map(str::to_string);
                    update_condition(&mut info, "or", prev.as_deref());
                }
                deps.insert(dep_name.clone(), Value::Dict(info));
            }
        }
        scope.insert("deps", Value::Dict(deps));
    }

    if let Some(Value::Dict(hooks_os)) = scope.remove("hooks_os") {
        let mut hooks = scope
            .get("hooks")
            .and_then(Value::as_seq)
            .map(<[Value]>::to_vec)
            .unwrap_or_default();
        for (os_name, os_hooks) in hooks_os.iter() {
            for h in os_hooks.as_seq().unwrap_or_default() {
                let mut h = h.as_dict().cloned().unwrap_or_default();
                update_condition(&mut h, "and", Some(&format!("checkout_{os_name}")));
                hooks.push(Value::Dict(h));
            }
        }
        scope.insert("hooks", Value::List(hooks));
    }
    Ok(scope)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conditions_combine_like_upstream() {
        let mut d = Dict::new();
        update_condition(&mut d, "and", Some("a"));
        assert_eq!(d.get_str("condition"), Some("a"));
        update_condition(&mut d, "and", Some("b"));
        assert_eq!(d.get_str("condition"), Some("(a) and (b)"));
        update_condition(&mut d, "or", None);
        assert_eq!(d.get_str("condition"), None);
        assert_eq!(
            merge_conditions(&[None, Some("x"), Some("y")]).as_deref(),
            Some("(x) and (y)")
        );
    }

    #[test]
    fn deps_os_becomes_conditional() {
        let c = "deps = {'a': 'u@1'}\ndeps_os = {'win': {'b': 'v@2'}, 'unix': {'a': 'u@1'}}\nhooks_os = {'mac': [{'action': ['x']}]}\n";
        let s = parse(c, "DEPS", None, None).unwrap();
        let deps = s.get("deps").unwrap().as_dict().unwrap();
        assert_eq!(
            deps.get("b")
                .unwrap()
                .as_dict()
                .unwrap()
                .get_str("condition"),
            Some("checkout_win")
        );
        // `a` is unconditional in deps, so `checkout_linux or <none>` drops the condition.
        assert_eq!(
            deps.get("a")
                .unwrap()
                .as_dict()
                .unwrap()
                .get_str("condition"),
            None
        );
        let hooks = s.get("hooks").unwrap().as_seq().unwrap();
        assert_eq!(
            hooks[0].as_dict().unwrap().get_str("condition"),
            Some("checkout_mac")
        );
    }
}
