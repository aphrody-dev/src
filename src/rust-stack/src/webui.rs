use crate::auth::unix_now;
use crate::shadcn_rs::{ThemeMode, UiPrimitive, Variant, theme_css_tokens};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSummary {
    pub id: String,
    pub title: String,
    pub model: String,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredMessage {
    pub id: i64,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub model: String,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateConversationRequest {
    pub title: String,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppendMessageRequest {
    pub role: String,
    pub content: String,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptTemplate {
    pub id: &'static str,
    pub title: &'static str,
    pub system_prompt: &'static str,
    pub starter: &'static str,
}

pub const PROMPT_LIBRARY: &[PromptTemplate] = &[
    PromptTemplate {
        id: "rust-systems",
        title: "Rust 2024 Systems Architect",
        system_prompt: "You write zero-bloat, cache-friendly Rust 2024 with flat structs and explicit error handling.",
        starter: "Design a lock-free ring buffer with C-ABI FFI exports.",
    },
    PromptTemplate {
        id: "ffi-audit",
        title: "C-ABI & Bun FFI Auditor",
        system_prompt: "Audit extern \"C\" functions for pointer alignment, slice bounds, and panic safety.",
        starter: "Review rs_auth_issue_jwt and rs_blake3_hex for zero-copy safety.",
    },
    PromptTemplate {
        id: "sql-wal",
        title: "SQLite WAL Query Optimizer",
        system_prompt: "Optimize embedded SQLite schemas for sub-millisecond reads and strict foreign keys.",
        starter: "Analyze covering indexes for OAuth 2.1 PKCE token rotation.",
    },
    PromptTemplate {
        id: "wgsl-kernel",
        title: "WebGPU Compute Shader Tuning",
        system_prompt: "Write high-occupancy WGSL compute kernels for quantized matrix-vector multiplication.",
        starter: "Write a 256-thread workgroup Q4_0 matvec WGSL kernel.",
    },
];

#[derive(Clone)]
pub struct WebUiStore {
    db: Arc<Mutex<Connection>>,
}

impl WebUiStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, String> {
        if let Some(parent) = path.as_ref().parent()
            && !parent.as_os_str().is_empty()
        {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("failed to create webui db dir: {e}"))?;
        }
        let conn = Connection::open(path.as_ref())
            .map_err(|e| format!("failed to open webui sqlite db: {e}"))?;
        Self::from_connection(conn)
    }

    pub fn open_in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory()
            .map_err(|e| format!("failed to open in-memory webui db: {e}"))?;
        Self::from_connection(conn)
    }

    fn from_connection(conn: Connection) -> Result<Self, String> {
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;

             CREATE TABLE IF NOT EXISTS webui_conversations (
                 id TEXT PRIMARY KEY,
                 title TEXT NOT NULL,
                 model TEXT NOT NULL,
                 updated_at INTEGER NOT NULL
             );

             CREATE TABLE IF NOT EXISTS webui_messages (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 conversation_id TEXT NOT NULL,
                 role TEXT NOT NULL,
                 content TEXT NOT NULL,
                 model TEXT NOT NULL,
                 created_at INTEGER NOT NULL,
                 FOREIGN KEY(conversation_id) REFERENCES webui_conversations(id) ON DELETE CASCADE
             );",
        )
        .map_err(|e| format!("failed to init webui schema: {e}"))?;
        Ok(Self {
            db: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn create_conversation(
        &self,
        title: &str,
        model: Option<&str>,
    ) -> Result<ConversationSummary, String> {
        let now = unix_now();
        let hash = blake3::hash(format!("{title}:{now}").as_bytes()).to_hex();
        let id = format!("conv_{}", &hash[..12]);
        let clean_title = if title.trim().is_empty() {
            "New Aphrody Session"
        } else {
            title.trim()
        };
        let clean_model = model.unwrap_or("sovereign/ring3-local");

        let db = self.db.lock().map_err(|_| "webui db poisoned".to_string())?;
        db.execute(
            "INSERT INTO webui_conversations (id, title, model, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, clean_title, clean_model, now as i64],
        )
        .map_err(|e| format!("failed to insert conversation: {e}"))?;

        Ok(ConversationSummary {
            id,
            title: clean_title.to_string(),
            model: clean_model.to_string(),
            updated_at: now,
        })
    }

    pub fn list_conversations(&self) -> Result<Vec<ConversationSummary>, String> {
        let db = self.db.lock().map_err(|_| "webui db poisoned".to_string())?;
        let mut stmt = db
            .prepare(
                "SELECT id, title, model, updated_at FROM webui_conversations ORDER BY updated_at DESC LIMIT 50",
            )
            .map_err(|e| format!("prepare conversations failed: {e}"))?;
        let rows = stmt
            .query_map([], |r| {
                Ok(ConversationSummary {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    model: r.get(2)?,
                    updated_at: r.get::<_, i64>(3)? as u64,
                })
            })
            .map_err(|e| format!("query conversations failed: {e}"))?;

        let mut out = Vec::new();
        for item in rows {
            out.push(item.map_err(|e| format!("row decode failed: {e}"))?);
        }
        Ok(out)
    }

    pub fn append_message(
        &self,
        conversation_id: &str,
        role: &str,
        content: &str,
        model: &str,
    ) -> Result<StoredMessage, String> {
        let now = unix_now();
        let db = self.db.lock().map_err(|_| "webui db poisoned".to_string())?;
        db.execute(
            "INSERT OR IGNORE INTO webui_conversations (id, title, model, updated_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                conversation_id,
                content.chars().take(42).collect::<String>(),
                model,
                now as i64
            ],
        )
        .map_err(|e| format!("ensure conversation failed: {e}"))?;

        db.execute(
            "INSERT INTO webui_messages (conversation_id, role, content, model, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![conversation_id, role, content, model, now as i64],
        )
        .map_err(|e| format!("insert message failed: {e}"))?;
        let id = db.last_insert_rowid();

        db.execute(
            "UPDATE webui_conversations SET updated_at = ?1, model = ?2 WHERE id = ?3",
            params![now as i64, model, conversation_id],
        )
        .map_err(|e| format!("update conversation timestamp failed: {e}"))?;

        Ok(StoredMessage {
            id,
            conversation_id: conversation_id.to_string(),
            role: role.to_string(),
            content: content.to_string(),
            model: model.to_string(),
            created_at: now,
        })
    }

    pub fn list_messages(&self, conversation_id: &str) -> Result<Vec<StoredMessage>, String> {
        let db = self.db.lock().map_err(|_| "webui db poisoned".to_string())?;
        let mut stmt = db
            .prepare(
                "SELECT id, conversation_id, role, content, model, created_at
                 FROM webui_messages WHERE conversation_id = ?1 ORDER BY id ASC",
            )
            .map_err(|e| format!("prepare messages failed: {e}"))?;
        let rows = stmt
            .query_map(params![conversation_id], |r| {
                Ok(StoredMessage {
                    id: r.get(0)?,
                    conversation_id: r.get(1)?,
                    role: r.get(2)?,
                    content: r.get(3)?,
                    model: r.get(4)?,
                    created_at: r.get::<_, i64>(5)? as u64,
                })
            })
            .map_err(|e| format!("query messages failed: {e}"))?;
        let mut out = Vec::new();
        for item in rows {
            out.push(item.map_err(|e| format!("decode message failed: {e}"))?);
        }
        Ok(out)
    }
}

pub fn render_workspace_html() -> String {
    let m3_css = crate::shadcn_rs::aphrody_m3_brand_css();
    let css = theme_css_tokens(ThemeMode::AphrodyDark);
    let badge_html = UiPrimitive::Badge {
        label: "PURE RUST 2024".to_string(),
        variant: Variant::Success,
    }
    .render_html();
    let new_chat_btn = UiPrimitive::Button {
        id: "btn-new-chat".to_string(),
        label: "New Session".to_string(),
        variant: Variant::Secondary,
        disabled: false,
    }
    .render_html();
    let send_btn = UiPrimitive::Button {
        id: "btn-send".to_string(),
        label: "Stream SSE".to_string(),
        variant: Variant::Primary,
        disabled: false,
    }
    .render_html();
    let status_card = UiPrimitive::Card {
        title: "Aphrody Inference Router".to_string(),
        subtitle: Some("ring3 :8787 | ai-os :4318 | triad :4319 | ollama :11434".to_string()),
        body: "Blake3 prompt cache + SQLite WAL history + Better-Auth IAM active.".to_string(),
        footer: Some("Zero Node.js / Zero Python runtime dependencies".to_string()),
    }
    .render_html();

    let mut prompt_buttons = String::new();
    for p in PROMPT_LIBRARY {
        prompt_buttons.push_str(&format!(
            r#"<button type="button" class="rs-btn rs-variant-outline" style="justify-content:flex-start;text-align:left;width:100%;" data-starter="{starter}">{title}</button>"#,
            starter = crate::shadcn_rs::escape_html(p.starter),
            title = crate::shadcn_rs::escape_html(p.title),
        ));
    }

    format!(
        r#"<!DOCTYPE html>
<html lang="en" data-theme="aphrody-dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>rust-stack | Aphrody AI Workspace</title>
  <style>
{m3_css}
{css}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--rs-bg);
      color: var(--rs-fg);
      font-family: var(--rs-font-sans);
      display: grid;
      grid-template-columns: 280px 1fr;
      height: 100vh;
      overflow: hidden;
    }}
    .rail {{
      background: var(--rs-surface-1);
      border-right: 1px solid var(--rs-border);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }}
    .main {{
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 100vh;
      overflow: hidden;
    }}
    .topbar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      border-bottom: 1px solid var(--rs-border);
      background: var(--rs-surface-1);
    }}
    .chat-log {{
      padding: 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}
    .msg {{
      padding: 12px 14px;
      border-radius: var(--rs-radius-md);
      border: 1px solid var(--rs-border);
      max-width: 860px;
      line-height: 1.55;
      font-size: 0.9rem;
      white-space: pre-wrap;
    }}
    .msg-user {{ background: var(--rs-surface-2); align-self: flex-end; }}
    .msg-assistant {{ background: var(--rs-surface-1); align-self: flex-start; }}
    .composer {{
      padding: 12px 18px;
      border-top: 1px solid var(--rs-border);
      background: var(--rs-surface-1);
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
    }}
    select.rs-select {{
      background: var(--rs-surface-2);
      color: var(--rs-fg);
      border: 1px solid var(--rs-border);
      border-radius: var(--rs-radius-sm);
      padding: 6px 10px;
      font-size: 0.84rem;
    }}
    .conv-list {{ display: flex; flex-direction: column; gap: 4px; }}
    .conv-item {{
      padding: 7px 9px;
      border-radius: var(--rs-radius-sm);
      font-size: 0.82rem;
      color: var(--rs-fg-muted);
      cursor: pointer;
      border: 1px solid transparent;
      text-align: left;
      background: transparent;
    }}
    .conv-item:hover, .conv-item[data-active="true"] {{
      background: var(--rs-surface-2);
      color: var(--rs-fg);
      border-color: var(--rs-border);
    }}
  </style>
</head>
<body>
  <aside class="rail">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <strong style="font-size:1.02rem;letter-spacing:-0.02em;">rust-stack</strong>
      {badge_html}
    </div>
    {new_chat_btn}
    <div>
      <div style="font-size:0.74rem;color:var(--rs-fg-muted);margin-bottom:6px;text-transform:uppercase;">WebGPU Capability</div>
      <div id="webgpu-probe" class="rs-terminal" style="font-size:0.74rem;padding:8px;">Probing navigator.gpu...</div>
    </div>
    <div>
      <div style="font-size:0.74rem;color:var(--rs-fg-muted);margin-bottom:6px;text-transform:uppercase;">Prompt Library</div>
      <div style="display:flex;flex-direction:column;gap:6px;">{prompt_buttons}</div>
    </div>
    <div style="flex:1;">
      <div style="font-size:0.74rem;color:var(--rs-fg-muted);margin-bottom:6px;text-transform:uppercase;">SQLite WAL History</div>
      <div id="conv-list" class="conv-list"></div>
    </div>
  </aside>
  <main class="main">
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <label for="model-select" style="font-size:0.82rem;color:var(--rs-fg-muted);">Model</label>
        <select id="model-select" class="rs-select">
          <option value="sovereign/ring3-local">sovereign/ring3-local (:8787)</option>
          <option value="sovereign/ai-os">sovereign/ai-os (:4318)</option>
          <option value="sovereign/triad">sovereign/triad (:4319)</option>
          <option value="ollama/qwen2.5-coder:7b">ollama/qwen2.5-coder:7b (:11434)</option>
          <option value="anthropic/claude-sonnet-4-5">anthropic/claude-sonnet-4-5</option>
          <option value="gemini/gemini-2.5-pro">gemini/gemini-2.5-pro</option>
          <option value="openai/gpt-4.1">openai/gpt-4.1</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:0.78rem;color:var(--rs-fg-muted);">
        <a href="/v1/models" style="color:var(--rs-fg-muted);">/v1/models</a>
        <a href="/api/ui/components" style="color:var(--rs-fg-muted);">/api/ui/components</a>
        <a href="/api/auth/jwks" style="color:var(--rs-fg-muted);">/api/auth/jwks</a>
      </div>
    </header>
    <section id="chat-log" class="chat-log">
      {status_card}
    </section>
    <form id="chat-form" class="composer">
      <input id="chat-input" class="rs-input" type="text" placeholder="Send message to /v1/chat/completions (SSE streaming)..." autocomplete="off" />
      {send_btn}
    </form>
  </main>
  <script>
    let activeConvId = null;
    const probeEl = document.getElementById('webgpu-probe');
    (async () => {{
      if (!navigator.gpu) {{
        probeEl.textContent = 'WebGPU: unavailable (CPU AVX2 / Gateway SSE active)';
        return;
      }}
      try {{
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {{
          probeEl.textContent = 'WebGPU: no adapter found';
          return;
        }}
        const info = adapter.info || {{}};
        probeEl.textContent = 'WebGPU READY: ' + (info.vendor || 'GPU') + ' ' + (info.architecture || '') + ' | maxBuffer=' + adapter.limits.maxBufferSize;
      }} catch (e) {{
        probeEl.textContent = 'WebGPU probe error: ' + e.message;
      }}
    }})();

    async function refreshConversations() {{
      const res = await fetch('/api/webui/conversations');
      if (!res.ok) return;
      const list = await res.json();
      const root = document.getElementById('conv-list');
      root.innerHTML = '';
      for (const c of list) {{
        const btn = document.createElement('button');
        btn.className = 'conv-item';
        btn.dataset.active = String(c.id === activeConvId);
        btn.textContent = c.title;
        btn.onclick = () => loadConversation(c.id);
        root.appendChild(btn);
      }}
    }}

    async function loadConversation(id) {{
      activeConvId = id;
      const res = await fetch('/api/webui/conversations/' + encodeURIComponent(id));
      if (!res.ok) return;
      const msgs = await res.json();
      const log = document.getElementById('chat-log');
      log.innerHTML = '';
      for (const m of msgs) {{
        appendBubble(m.role, m.content);
      }}
      refreshConversations();
    }}

    function appendBubble(role, text) {{
      const log = document.getElementById('chat-log');
      const div = document.createElement('div');
      div.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-assistant');
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }}

    document.getElementById('btn-new-chat').onclick = async () => {{
      const model = document.getElementById('model-select').value;
      const res = await fetch('/api/webui/conversations', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ title: 'Session ' + new Date().toLocaleTimeString(), model }})
      }});
      if (res.ok) {{
        const conv = await res.json();
        await loadConversation(conv.id);
      }}
    }};

    for (const btn of document.querySelectorAll('[data-starter]')) {{
      btn.addEventListener('click', () => {{
        const input = document.getElementById('chat-input');
        input.value = btn.dataset.starter;
        input.focus();
      }});
    }}

    document.getElementById('chat-form').onsubmit = async (ev) => {{
      ev.preventDefault();
      const input = document.getElementById('chat-input');
      const prompt = input.value.trim();
      if (!prompt) return;
      input.value = '';
      const model = document.getElementById('model-select').value;

      if (!activeConvId) {{
        const cRes = await fetch('/api/webui/conversations', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ title: prompt.slice(0, 36), model }})
        }});
        if (cRes.ok) {{
          const c = await cRes.json();
          activeConvId = c.id;
        }}
      }}

      appendBubble('user', prompt);
      if (activeConvId) {{
        fetch('/api/webui/conversations/' + encodeURIComponent(activeConvId) + '/messages', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ role: 'user', content: prompt, model }})
        }});
      }}

      const assistantEl = appendBubble('assistant', '');
      const resp = await fetch('/v1/chat/completions', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{
          model,
          stream: true,
          messages: [{{ role: 'user', content: prompt }}]
        }})
      }});

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let full = '';
      while (true) {{
        const {{ value, done }} = await reader.read();
        if (done) break;
        buf += dec.decode(value, {{ stream: true }});
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {{
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {{
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            full += delta;
            assistantEl.textContent = full;
          }} catch (_) {{}}
        }}
      }}

      if (activeConvId && full) {{
        await fetch('/api/webui/conversations/' + encodeURIComponent(activeConvId) + '/messages', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ role: 'assistant', content: full, model }})
        }});
        refreshConversations();
      }}
    }};

    refreshConversations();
  </script>
</body>
</html>"#
    )
}

/// Renders any shared canonical UI page through `aphrody-ui::fusion` for fullstack SSR/TUI/WebGPU/GPUI delivery.
pub fn render_fusion_fullstack_page(
    page: aphrody_ui::fusion::CanonicalPage,
    preset: aphrody_ui::fusion::FusionThemePreset,
    dark: bool,
    target: aphrody_ui::fusion::RenderTarget,
) -> Result<aphrody_ui::fusion::RenderedFrame, String> {
    aphrody_ui::fusion::render_page_to_target(page, preset, dark, target, None, None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sqlite_history_and_ssr_workspace() {
        let store = WebUiStore::open_in_memory().unwrap();
        let conv = store
            .create_conversation("Kernel Audit", Some("sovereign/ring3-local"))
            .unwrap();
        store
            .append_message(&conv.id, "user", "Check ABI layout", "sovereign/ring3-local")
            .unwrap();
        store
            .append_message(
                &conv.id,
                "assistant",
                "ABI v1 verified.",
                "sovereign/ring3-local",
            )
            .unwrap();

        let msgs = store.list_messages(&conv.id).unwrap();
        assert_eq!(msgs.len(), 2);
        let html = render_workspace_html();
        assert!(html.contains("navigator.gpu"));
        assert!(html.contains("/v1/chat/completions"));

        let ssr = render_fusion_fullstack_page(
            aphrody_ui::fusion::CanonicalPage::WaylandBrowserCompositor,
            aphrody_ui::fusion::FusionThemePreset::Hyprland,
            true,
            aphrody_ui::fusion::RenderTarget::WebWasmSsr,
        )
        .unwrap();
        assert!(ssr.payload.contains("<!doctype html>"));
        assert_eq!(ssr.vitals.horizontal_overflow_px, 0.0);
    }
}
