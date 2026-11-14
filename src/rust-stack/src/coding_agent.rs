use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::path::{Component, Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallSpec {
    pub id: String,
    pub name: String,
    pub arguments: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionResult {
    pub tool_call_id: String,
    pub name: String,
    pub ok: bool,
    pub output: String,
}

#[derive(Debug, Clone)]
pub struct WorkspaceGuard {
    root: PathBuf,
}

impl WorkspaceGuard {
    pub fn new(root: impl AsRef<Path>) -> Result<Self, String> {
        let canonical =
            std::fs::canonicalize(root.as_ref()).unwrap_or_else(|_| root.as_ref().to_path_buf());
        if is_forbidden_system_path(&canonical) {
            return Err("refusing to initialize agent in forbidden system directory".to_string());
        }
        Ok(Self { root: canonical })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn resolve_safe_path(&self, candidate: &str) -> Result<PathBuf, String> {
        let trimmed = candidate.trim();
        if trimmed.is_empty() {
            return Err("path must not be empty".to_string());
        }
        let raw = Path::new(trimmed);
        for comp in raw.components() {
            if matches!(comp, Component::ParentDir) {
                // Verify resolved path below still stays inside workspace root
            }
        }

        let joined = if raw.is_absolute() {
            raw.to_path_buf()
        } else {
            self.root.join(raw)
        };

        let normalized = normalize_lexical(&joined);
        if is_forbidden_system_path(&normalized) {
            return Err(
                "blocked by workspace boundary guard: System32 access is forbidden".to_string(),
            );
        }
        if is_secret_env_file(&normalized) {
            return Err(
                "blocked by secret guard: reading or mutating .env files is forbidden".to_string(),
            );
        }

        let root_norm = normalize_lexical(&self.root);
        if !path_starts_with_ci(&normalized, &root_norm) {
            return Err(format!(
                "blocked by workspace boundary guard: '{}' escapes workspace '{}'",
                normalized.display(),
                root_norm.display()
            ));
        }
        Ok(normalized)
    }

    pub fn check_shell_command(&self, cmd: &str) -> Result<(), String> {
        let lower = cmd.to_ascii_lowercase();
        if lower.contains("system32") || lower.contains("syswow64") {
            return Err(
                "blocked by shell guard: System32/SysWOW64 reference forbidden".to_string(),
            );
        }
        if lower.contains(".env") {
            return Err("blocked by shell guard: .env access forbidden".to_string());
        }
        Ok(())
    }
}

fn is_forbidden_system_path(p: &Path) -> bool {
    let s = p.to_string_lossy().replace('/', "\\").to_ascii_lowercase();
    s.contains("\\windows\\system32") || s.contains("\\windows\\syswow64")
}

fn is_secret_env_file(p: &Path) -> bool {
    let Some(name) = p.file_name().and_then(|n| n.to_str()) else {
        return false;
    };
    let lower = name.to_ascii_lowercase();
    lower == ".env" || lower.starts_with(".env.")
}

fn normalize_lexical(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::Prefix(p) => out.push(p.as_os_str()),
            Component::RootDir => out.push(comp.as_os_str()),
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            Component::Normal(seg) => {
                let s = seg.to_string_lossy();
                if let Some(stripped) = s.strip_prefix("\\\\?\\") {
                    out.push(stripped);
                } else {
                    out.push(seg);
                }
            }
        }
    }
    let cleaned = out.to_string_lossy().replace("\\\\?\\", "");
    PathBuf::from(cleaned)
}

fn path_starts_with_ci(path: &Path, base: &Path) -> bool {
    let p = path
        .to_string_lossy()
        .replace('/', "\\")
        .trim_end_matches('\\')
        .to_ascii_lowercase();
    let b = base
        .to_string_lossy()
        .replace('/', "\\")
        .trim_end_matches('\\')
        .to_ascii_lowercase();
    p == b || p.starts_with(&format!("{b}\\"))
}

pub fn openai_tool_definitions() -> Value {
    json!([
        {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read UTF-8 text from a workspace file.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "start_line": { "type": "integer" },
                        "end_line": { "type": "integer" }
                    },
                    "required": ["path"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": "Write UTF-8 text to a workspace file, creating parent directories.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "content": { "type": "string" }
                    },
                    "required": ["path", "content"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "edit_file",
                "description": "Replace exact target text in a workspace file.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "target": { "type": "string" },
                        "replacement": { "type": "string" }
                    },
                    "required": ["path", "target", "replacement"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "grep_search",
                "description": "Search workspace files for a substring pattern.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string" },
                        "path": { "type": "string" }
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "run_shell",
                "description": "Run a guarded shell command inside the workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": { "type": "string" }
                    },
                    "required": ["command"]
                }
            }
        }
    ])
}

pub struct CodingAgent {
    guard: WorkspaceGuard,
    gateway_url: String,
    model: String,
    max_steps: usize,
}

impl CodingAgent {
    pub fn new(
        workspace_root: impl AsRef<Path>,
        gateway_url: impl Into<String>,
        model: impl Into<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            guard: WorkspaceGuard::new(workspace_root)?,
            gateway_url: gateway_url.into(),
            model: model.into(),
            max_steps: 6,
        })
    }

    pub fn execute_tool(&self, call: &ToolCallSpec) -> ToolExecutionResult {
        let outcome = match call.name.as_str() {
            "read_file" => self.tool_read_file(&call.arguments),
            "write_file" => self.tool_write_file(&call.arguments),
            "edit_file" => self.tool_edit_file(&call.arguments),
            "grep_search" => self.tool_grep_search(&call.arguments),
            "run_shell" => self.tool_run_shell(&call.arguments),
            other => Err(format!("unknown tool '{other}'")),
        };

        match outcome {
            Ok(output) => ToolExecutionResult {
                tool_call_id: call.id.clone(),
                name: call.name.clone(),
                ok: true,
                output,
            },
            Err(err) => ToolExecutionResult {
                tool_call_id: call.id.clone(),
                name: call.name.clone(),
                ok: false,
                output: format!("ERROR: {err}"),
            },
        }
    }

    fn tool_read_file(&self, args: &Value) -> Result<String, String> {
        let path_str = args
            .get("path")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'path'".to_string())?;
        let safe = self.guard.resolve_safe_path(path_str)?;
        let content = std::fs::read_to_string(&safe)
            .map_err(|e| format!("failed to read {}: {e}", safe.display()))?;
        let start = args
            .get("start_line")
            .and_then(Value::as_u64)
            .unwrap_or(1)
            .max(1) as usize;
        let lines: Vec<&str> = content.lines().collect();
        let end = args
            .get("end_line")
            .and_then(Value::as_u64)
            .map(|v| v as usize)
            .unwrap_or(lines.len())
            .min(lines.len());

        if start > lines.len() {
            return Ok(String::new());
        }
        let mut out = String::new();
        for (idx, line) in lines[(start - 1)..end].iter().enumerate() {
            out.push_str(&format!("{:>4}: {}\n", start + idx, line));
        }
        Ok(out)
    }

    fn tool_write_file(&self, args: &Value) -> Result<String, String> {
        let path_str = args
            .get("path")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'path'".to_string())?;
        let content = args
            .get("content")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'content'".to_string())?;
        let safe = self.guard.resolve_safe_path(path_str)?;
        if let Some(parent) = safe.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("create_dir_all failed: {e}"))?;
        }
        std::fs::write(&safe, content)
            .map_err(|e| format!("write failed for {}: {e}", safe.display()))?;
        Ok(format!(
            "wrote {} bytes to {}",
            content.len(),
            safe.display()
        ))
    }

    fn tool_edit_file(&self, args: &Value) -> Result<String, String> {
        let path_str = args
            .get("path")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'path'".to_string())?;
        let target = args
            .get("target")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'target'".to_string())?;
        let replacement = args
            .get("replacement")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'replacement'".to_string())?;
        if target.is_empty() {
            return Err("target must not be empty".to_string());
        }
        let safe = self.guard.resolve_safe_path(path_str)?;
        let current = std::fs::read_to_string(&safe)
            .map_err(|e| format!("read failed for {}: {e}", safe.display()))?;
        let count = current.matches(target).count();
        if count == 0 {
            return Err("target string not found in file".to_string());
        }
        let updated = current.replace(target, replacement);
        std::fs::write(&safe, &updated)
            .map_err(|e| format!("write failed for {}: {e}", safe.display()))?;
        Ok(format!(
            "replaced {count} occurrence(s) in {}",
            safe.display()
        ))
    }

    fn tool_grep_search(&self, args: &Value) -> Result<String, String> {
        let query = args
            .get("query")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'query'".to_string())?;
        if query.is_empty() {
            return Err("query must not be empty".to_string());
        }
        let search_root = match args.get("path").and_then(Value::as_str) {
            Some(sub) if !sub.trim().is_empty() => self.guard.resolve_safe_path(sub)?,
            _ => self.guard.root().to_path_buf(),
        };

        let mut hits = Vec::new();
        grep_walk(&search_root, &self.guard, query, &mut hits, 80)?;
        if hits.is_empty() {
            Ok("no matches found".to_string())
        } else {
            Ok(hits.join("\n"))
        }
    }

    fn tool_run_shell(&self, args: &Value) -> Result<String, String> {
        let cmd = args
            .get("command")
            .and_then(Value::as_str)
            .ok_or_else(|| "missing 'command'".to_string())?;
        self.guard.check_shell_command(cmd)?;

        let output = if cfg!(windows) {
            Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", cmd])
                .current_dir(self.guard.root())
                .output()
        } else {
            Command::new("sh")
                .args(["-c", cmd])
                .current_dir(self.guard.root())
                .output()
        }
        .map_err(|e| format!("failed to spawn shell: {e}"))?;

        let mut combined = String::from_utf8_lossy(&output.stdout).into_owned();
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stderr.is_empty() {
            if !combined.ends_with('\n') && !combined.is_empty() {
                combined.push('\n');
            }
            combined.push_str(&stderr);
        }
        Ok(format!(
            "exit_code={}\n{}",
            output.status.code().unwrap_or(-1),
            combined.trim()
        ))
    }

    pub fn run_task(&self, prompt: &str) -> Result<AgentRunReport, String> {
        let mut transcript = Vec::new();
        let mut messages = vec![
            json!({
                "role": "system",
                "content": "You are rsc (rust-stack code), a pure-Rust autonomous coding agent. Use read_file, write_file, edit_file, grep_search, and run_shell deterministically."
            }),
            json!({
                "role": "user",
                "content": prompt
            }),
        ];

        let endpoint = format!(
            "{}/v1/chat/completions",
            self.gateway_url.trim_end_matches('/')
        );

        for step in 0..self.max_steps {
            let payload = json!({
                "model": self.model,
                "messages": messages,
                "tools": openai_tool_definitions(),
                "stream": false
            });

            let response_json = match ureq::post(&endpoint)
                .config()
                .timeout_global(Some(std::time::Duration::from_secs(12)))
                .build()
                .header("Content-Type", "application/json")
                .send_json(payload)
            {
                Ok(resp) => resp.into_body().read_json::<Value>().ok(),
                Err(_) => None,
            };

            let Some(body) = response_json else {
                // Deterministic local offline execution fallback
                let summary = self.offline_deterministic_pass(prompt, &mut transcript);
                return Ok(AgentRunReport {
                    steps: step + 1,
                    model: format!("{} (offline-local-harness)", self.model),
                    tool_results: transcript,
                    final_answer: summary,
                });
            };

            let msg = body
                .pointer("/choices/0/message")
                .cloned()
                .unwrap_or_else(|| json!({"role": "assistant", "content": ""}));

            if let Some(tool_calls) = msg.get("tool_calls").and_then(Value::as_array)
                && !tool_calls.is_empty()
            {
                messages.push(msg.clone());
                for tc in tool_calls {
                    let id = tc
                        .get("id")
                        .and_then(Value::as_str)
                        .unwrap_or("call_0")
                        .to_string();
                    let name = tc
                        .pointer("/function/name")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .to_string();
                    let raw_args = tc
                        .pointer("/function/arguments")
                        .and_then(Value::as_str)
                        .unwrap_or("{}");
                    let parsed_args: Value =
                        serde_json::from_str(raw_args).unwrap_or_else(|_| json!({}));
                    let res = self.execute_tool(&ToolCallSpec {
                        id: id.clone(),
                        name,
                        arguments: parsed_args,
                    });
                    messages.push(json!({
                        "role": "tool",
                        "tool_call_id": id,
                        "content": res.output,
                    }));
                    transcript.push(res);
                }
                continue;
            }

            let answer = msg
                .get("content")
                .and_then(Value::as_str)
                .unwrap_or("Completed.")
                .to_string();
            return Ok(AgentRunReport {
                steps: step + 1,
                model: self.model.clone(),
                tool_results: transcript,
                final_answer: answer,
            });
        }

        Ok(AgentRunReport {
            steps: self.max_steps,
            model: self.model.clone(),
            tool_results: transcript,
            final_answer: "Reached max_steps limit.".to_string(),
        })
    }

    fn offline_deterministic_pass(
        &self,
        prompt: &str,
        transcript: &mut Vec<ToolExecutionResult>,
    ) -> String {
        let token = prompt
            .split_whitespace()
            .find(|w| w.len() >= 4 && w.chars().all(|c| c.is_alphanumeric() || c == '_'))
            .unwrap_or("fn");
        let res = self.execute_tool(&ToolCallSpec {
            id: "call_local_grep".to_string(),
            name: "grep_search".to_string(),
            arguments: json!({ "query": token }),
        });
        let preview_lines = res.output.lines().take(5).collect::<Vec<_>>().join(" | ");
        transcript.push(res);
        format!(
            "[rsc pure-rust harness] workspace={} | scanned token '{}' -> {}",
            self.guard.root().display(),
            token,
            preview_lines
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRunReport {
    pub steps: usize,
    pub model: String,
    pub tool_results: Vec<ToolExecutionResult>,
    pub final_answer: String,
}

fn grep_walk(
    dir: &Path,
    guard: &WorkspaceGuard,
    query: &str,
    hits: &mut Vec<String>,
    limit: usize,
) -> Result<(), String> {
    if hits.len() >= limit {
        return Ok(());
    }
    if dir.is_file() {
        if !is_secret_env_file(dir)
            && let Ok(text) = std::fs::read_to_string(dir)
        {
            for (idx, line) in text.lines().enumerate() {
                if line.contains(query) {
                    let rel = dir.strip_prefix(guard.root()).unwrap_or(dir);
                    hits.push(format!("{}:{}: {}", rel.display(), idx + 1, line.trim()));
                    if hits.len() >= limit {
                        break;
                    }
                }
            }
        }
        return Ok(());
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return Ok(()),
    };
    for entry in entries.flatten() {
        if hits.len() >= limit {
            break;
        }
        let path = entry.path();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str == ".git" || name_str == "target" || name_str == "node_modules" {
            continue;
        }
        if is_secret_env_file(&path) || is_forbidden_system_path(&path) {
            continue;
        }
        if path.is_dir() {
            grep_walk(&path, guard, query, hits, limit)?;
        } else {
            grep_walk(&path, guard, query, hits, limit)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guard_blocks_system32_env_and_escape_and_runs_5_tools() {
        let tmp =
            std::env::temp_dir().join(format!("rust_stack_agent_test_{}", crate::auth::unix_now()));
        std::fs::create_dir_all(&tmp).unwrap();

        let agent = CodingAgent::new(&tmp, "http://127.0.0.1:9", "sovereign/ring3-local").unwrap();

        // Guard checks
        assert!(
            agent
                .guard
                .resolve_safe_path("C:\\Windows\\System32\\cmd.exe")
                .is_err()
        );
        assert!(agent.guard.resolve_safe_path(".env").is_err());
        assert!(
            agent
                .guard
                .resolve_safe_path("..\\..\\outside.txt")
                .is_err()
        );
        assert!(agent.guard.check_shell_command("Get-Content .env").is_err());
        assert!(
            agent
                .guard
                .check_shell_command("dir C:\\Windows\\System32")
                .is_err()
        );

        // 1. write_file
        let w = agent.execute_tool(&ToolCallSpec {
            id: "1".into(),
            name: "write_file".into(),
            arguments: json!({ "path": "src/demo.rs", "content": "pub fn alpha() -> u32 { 41 }\n" }),
        });
        assert!(w.ok, "{}", w.output);

        // 2. edit_file
        let e = agent.execute_tool(&ToolCallSpec {
            id: "2".into(),
            name: "edit_file".into(),
            arguments: json!({ "path": "src/demo.rs", "target": "41", "replacement": "42" }),
        });
        assert!(e.ok, "{}", e.output);

        // 3. read_file
        let r = agent.execute_tool(&ToolCallSpec {
            id: "3".into(),
            name: "read_file".into(),
            arguments: json!({ "path": "src/demo.rs" }),
        });
        assert!(r.ok && r.output.contains("42"));

        // 4. grep_search
        let g = agent.execute_tool(&ToolCallSpec {
            id: "4".into(),
            name: "grep_search".into(),
            arguments: json!({ "query": "alpha" }),
        });
        assert!(g.ok && g.output.contains("demo.rs"));

        // 5. run_shell
        let s = agent.execute_tool(&ToolCallSpec {
            id: "5".into(),
            name: "run_shell".into(),
            arguments: json!({ "command": "Write-Output 'rsc-ok'" }),
        });
        assert!(s.ok && s.output.contains("rsc-ok"));

        let _ = std::fs::remove_dir_all(&tmp);
    }
}
