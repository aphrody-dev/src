//! WebMCP tool registry with typed schemas.
//!
//! Tools are described with a small typed [`Schema`] that renders to JSON
//! Schema and validates call arguments. The registry is generic over a context
//! type `C` (the application state) and also speaks MCP-style JSON-RPC 2.0 so
//! that the same tools are reachable from `navigator.modelContext` in the
//! browser and from `/mcp` on the native host.

use serde_json::{Map, Value, json};

#[derive(Clone, Debug, PartialEq)]
pub struct Field {
    pub name: String,
    pub schema: Schema,
    pub required: bool,
    pub description: String,
}

impl Field {
    pub fn req(name: &str, schema: Schema, description: &str) -> Field {
        Field { name: name.into(), schema, required: true, description: description.into() }
    }
    pub fn opt(name: &str, schema: Schema, description: &str) -> Field {
        Field { name: name.into(), schema, required: false, description: description.into() }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Schema {
    String { max_len: Option<usize>, one_of: Option<Vec<String>> },
    Integer { min: Option<i64>, max: Option<i64> },
    Number,
    Boolean,
    Array(Box<Schema>),
    Object(Vec<Field>),
}

impl Schema {
    pub fn string() -> Schema {
        Schema::String { max_len: Some(65536), one_of: None }
    }
    pub fn one_of(values: &[&str]) -> Schema {
        Schema::String { max_len: None, one_of: Some(values.iter().map(|s| s.to_string()).collect()) }
    }
    pub fn integer(min: i64, max: i64) -> Schema {
        Schema::Integer { min: Some(min), max: Some(max) }
    }
    pub fn object(fields: Vec<Field>) -> Schema {
        Schema::Object(fields)
    }
    pub fn empty_object() -> Schema {
        Schema::Object(Vec::new())
    }

    pub fn to_json(&self) -> Value {
        match self {
            Schema::String { max_len, one_of } => {
                let mut m = Map::new();
                m.insert("type".into(), json!("string"));
                if let Some(n) = max_len {
                    m.insert("maxLength".into(), json!(n));
                }
                if let Some(v) = one_of {
                    m.insert("enum".into(), json!(v));
                }
                Value::Object(m)
            }
            Schema::Integer { min, max } => {
                let mut m = Map::new();
                m.insert("type".into(), json!("integer"));
                if let Some(n) = min {
                    m.insert("minimum".into(), json!(n));
                }
                if let Some(n) = max {
                    m.insert("maximum".into(), json!(n));
                }
                Value::Object(m)
            }
            Schema::Number => json!({"type": "number"}),
            Schema::Boolean => json!({"type": "boolean"}),
            Schema::Array(inner) => json!({"type": "array", "items": inner.to_json()}),
            Schema::Object(fields) => {
                let mut props = Map::new();
                for f in fields {
                    let mut p = f.schema.to_json();
                    if let Value::Object(m) = &mut p {
                        if !f.description.is_empty() {
                            m.insert("description".into(), json!(f.description));
                        }
                    }
                    props.insert(f.name.clone(), p);
                }
                let required: Vec<&str> = fields.iter().filter(|f| f.required).map(|f| f.name.as_str()).collect();
                json!({"type": "object", "properties": props, "required": required, "additionalProperties": false})
            }
        }
    }

    pub fn validate(&self, v: &Value) -> Result<(), String> {
        self.validate_at(v, "$")
    }

    fn validate_at(&self, v: &Value, path: &str) -> Result<(), String> {
        match self {
            Schema::String { max_len, one_of } => {
                let s = v.as_str().ok_or_else(|| format!("{path}: expected string"))?;
                if max_len.is_some_and(|m| s.chars().count() > m) {
                    return Err(format!("{path}: string too long"));
                }
                if one_of.as_ref().is_some_and(|o| !o.iter().any(|x| x == s)) {
                    return Err(format!("{path}: not one of the allowed values"));
                }
                Ok(())
            }
            Schema::Integer { min, max } => {
                let n = v.as_i64().ok_or_else(|| format!("{path}: expected integer"))?;
                if min.is_some_and(|m| n < m) || max.is_some_and(|m| n > m) {
                    return Err(format!("{path}: integer out of range"));
                }
                Ok(())
            }
            Schema::Number => v.is_number().then_some(()).ok_or_else(|| format!("{path}: expected number")),
            Schema::Boolean => v.is_boolean().then_some(()).ok_or_else(|| format!("{path}: expected boolean")),
            Schema::Array(inner) => {
                let a = v.as_array().ok_or_else(|| format!("{path}: expected array"))?;
                a.iter().enumerate().try_for_each(|(i, x)| inner.validate_at(x, &format!("{path}[{i}]")))
            }
            Schema::Object(fields) => {
                let o = v.as_object().ok_or_else(|| format!("{path}: expected object"))?;
                for f in fields {
                    match o.get(&f.name) {
                        Some(x) => f.schema.validate_at(x, &format!("{path}.{}", f.name))?,
                        None if f.required => return Err(format!("{path}: missing required field {}", f.name)),
                        None => {}
                    }
                }
                if let Some(k) = o.keys().find(|k| !fields.iter().any(|f| &f.name == *k)) {
                    return Err(format!("{path}: unknown field {k}"));
                }
                Ok(())
            }
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct ToolError {
    pub code: i32,
    pub message: String,
}

impl ToolError {
    pub fn new(code: i32, message: impl Into<String>) -> Self {
        ToolError { code, message: message.into() }
    }
}

impl core::fmt::Display for ToolError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "{} ({})", self.message, self.code)
    }
}

impl std::error::Error for ToolError {}

pub type Handler<C> = fn(&mut C, &Value) -> Result<Value, ToolError>;

pub struct Tool<C> {
    pub name: String,
    pub description: String,
    pub input: Schema,
    pub read_only: bool,
    pub handler: Handler<C>,
}

pub struct ToolRegistry<C> {
    tools: Vec<Tool<C>>,
}

impl<C> Default for ToolRegistry<C> {
    fn default() -> Self {
        ToolRegistry { tools: Vec::new() }
    }
}

pub const PROTOCOL_VERSION: &str = "2025-06-18";

impl<C> ToolRegistry<C> {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, name: &str, description: &str, input: Schema, read_only: bool, handler: Handler<C>) {
        assert!(
            !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'),
            "invalid tool name {name}"
        );
        assert!(!self.tools.iter().any(|t| t.name == name), "duplicate tool {name}");
        self.tools.push(Tool { name: name.into(), description: description.into(), input, read_only, handler });
    }

    pub fn len(&self) -> usize {
        self.tools.len()
    }
    pub fn is_empty(&self) -> bool {
        self.tools.is_empty()
    }
    pub fn names(&self) -> Vec<&str> {
        self.tools.iter().map(|t| t.name.as_str()).collect()
    }

    /// Tool descriptors in the WebMCP / MCP `tools/list` shape.
    pub fn list_json(&self) -> Value {
        Value::Array(
            self.tools
                .iter()
                .map(|t| {
                    json!({
                        "name": t.name,
                        "description": t.description,
                        "inputSchema": t.input.to_json(),
                        "annotations": {"readOnlyHint": t.read_only},
                    })
                })
                .collect(),
        )
    }

    pub fn call(&self, ctx: &mut C, name: &str, args: &Value) -> Result<Value, ToolError> {
        let tool = self.tools.iter().find(|t| t.name == name).ok_or_else(|| ToolError::new(-32602, format!("unknown tool {name}")))?;
        let args = if args.is_null() { json!({}) } else { args.clone() };
        tool.input.validate(&args).map_err(|m| ToolError::new(-32602, m))?;
        (tool.handler)(ctx, &args)
    }

    /// Contents of `/.well-known/webmcp.json`.
    pub fn well_known(&self, name: &str, description: &str, endpoint: &str) -> Value {
        json!({
            "name": name,
            "description": description,
            "protocolVersion": PROTOCOL_VERSION,
            "endpoint": endpoint,
            "transport": "http-json-rpc",
            "browser": {"api": "navigator.modelContext", "method": "registerTool"},
            "tools": self.list_json(),
        })
    }

    /// Handle one JSON-RPC 2.0 request body. Returns `None` for notifications.
    pub fn handle_jsonrpc(&self, ctx: &mut C, body: &str, server_name: &str, server_version: &str) -> Option<String> {
        let req: Value = match serde_json::from_str(body) {
            Ok(v) => v,
            Err(_) => return Some(rpc_err(Value::Null, -32700, "parse error").to_string()),
        };
        let id = req.get("id").cloned();
        let method = req.get("method").and_then(Value::as_str).unwrap_or("");
        if req.get("jsonrpc").and_then(Value::as_str) != Some("2.0") || method.is_empty() {
            return Some(rpc_err(id.unwrap_or(Value::Null), -32600, "invalid request").to_string());
        }
        let params = req.get("params").cloned().unwrap_or(Value::Null);
        let result: Result<Value, ToolError> = match method {
            "initialize" => Ok(json!({
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": false}},
                "serverInfo": {"name": server_name, "version": server_version},
            })),
            "ping" => Ok(json!({})),
            "tools/list" => Ok(json!({"tools": self.list_json()})),
            "tools/call" => {
                let name = params.get("name").and_then(Value::as_str).unwrap_or("");
                let args = params.get("arguments").cloned().unwrap_or(Value::Null);
                match self.call(ctx, name, &args) {
                    Ok(v) => Ok(json!({
                        "content": [{"type": "text", "text": v.to_string()}],
                        "structuredContent": v,
                        "isError": false,
                    })),
                    Err(e) if e.code == -32602 => Err(e),
                    Err(e) => Ok(json!({"content": [{"type": "text", "text": e.message}], "isError": true})),
                }
            }
            m if m.starts_with("notifications/") => return None,
            _ => Err(ToolError::new(-32601, "method not found")),
        };
        id.as_ref()?;
        let id = id.unwrap_or(Value::Null);
        Some(match result {
            Ok(r) => json!({"jsonrpc": "2.0", "id": id, "result": r}).to_string(),
            Err(e) => rpc_err(id, e.code, &e.message).to_string(),
        })
    }
}

fn rpc_err(id: Value, code: i32, message: &str) -> Value {
    json!({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}})
}

#[cfg(test)]
mod tests {
    use super::*;

    fn registry() -> ToolRegistry<i64> {
        let mut r = ToolRegistry::new();
        r.register(
            "add",
            "Add to the context counter",
            Schema::object(vec![
                Field::req("n", Schema::integer(-100, 100), "amount"),
                Field::opt("mode", Schema::one_of(&["fast", "slow"]), "mode"),
            ]),
            false,
            |c, a| {
                *c += a["n"].as_i64().unwrap();
                Ok(json!({"value": *c}))
            },
        );
        r.register("fail", "always fails", Schema::empty_object(), true, |_, _| Err(ToolError::new(1, "boom")));
        r
    }

    #[test]
    fn schema_validation() {
        let r = registry();
        let mut c = 0i64;
        assert_eq!(r.call(&mut c, "add", &json!({"n": 5})).unwrap(), json!({"value": 5}));
        for bad in [json!({}), json!({"n": "x"}), json!({"n": 1000}), json!({"n": 1, "mode": "x"}), json!({"n": 1, "z": 1}), json!([1])] {
            assert_eq!(r.call(&mut c, "add", &bad).unwrap_err().code, -32602, "{bad}");
        }
        assert_eq!(c, 5);
        assert_eq!(r.call(&mut c, "nope", &json!({})).unwrap_err().code, -32602);
    }

    #[test]
    fn json_schema_output() {
        let r = registry();
        let l = r.list_json();
        assert_eq!(l[0]["inputSchema"]["required"], json!(["n"]));
        assert_eq!(l[0]["inputSchema"]["properties"]["n"]["maximum"], json!(100));
        assert_eq!(l[0]["inputSchema"]["properties"]["mode"]["enum"], json!(["fast", "slow"]));
        assert_eq!(l[1]["annotations"]["readOnlyHint"], json!(true));
    }

    #[test]
    fn jsonrpc_flow() {
        let r = registry();
        let mut c = 0i64;
        let mut rpc = |b: &str| r.handle_jsonrpc(&mut c, b, "t", "0").map(|s| serde_json::from_str::<Value>(&s).unwrap());
        let init = rpc(r#"{"jsonrpc":"2.0","id":1,"method":"initialize"}"#).unwrap();
        assert_eq!(init["result"]["protocolVersion"], json!(PROTOCOL_VERSION));
        assert!(rpc(r#"{"jsonrpc":"2.0","method":"notifications/initialized"}"#).is_none());
        let list = rpc(r#"{"jsonrpc":"2.0","id":2,"method":"tools/list"}"#).unwrap();
        assert_eq!(list["result"]["tools"].as_array().unwrap().len(), 2);
        let call = rpc(r#"{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add","arguments":{"n":7}}}"#).unwrap();
        assert_eq!(call["result"]["structuredContent"]["value"], json!(7));
        let fail = rpc(r#"{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"fail"}}"#).unwrap();
        assert_eq!(fail["result"]["isError"], json!(true));
        let inv = rpc(r#"{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"add","arguments":{}}}"#).unwrap();
        assert_eq!(inv["error"]["code"], json!(-32602));
        assert_eq!(rpc("{nope").unwrap()["error"]["code"], json!(-32700));
        assert_eq!(rpc(r#"{"jsonrpc":"2.0","id":6,"method":"zzz"}"#).unwrap()["error"]["code"], json!(-32601));
        assert_eq!(rpc(r#"{"id":7}"#).unwrap()["error"]["code"], json!(-32600));
    }

    #[test]
    #[should_panic(expected = "duplicate tool")]
    fn duplicate_names_rejected() {
        let mut r = registry();
        r.register("add", "", Schema::empty_object(), true, |_, _| Ok(json!(null)));
    }
}
