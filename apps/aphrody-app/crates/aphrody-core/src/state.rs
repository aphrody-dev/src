//! Shared application state and the built-in WebMCP tool set.

use crate::fluid::{Replica, Sequencer};
use crate::layout::{LayoutKind, Rect};
use crate::store::{MemStorage, Node, Storage, Vfs};
use crate::webmcp::{Field, Schema, ToolError, ToolRegistry};
use crate::wm::WindowManager;
use serde_json::{Value, json};

pub struct AppState {
    pub wm: WindowManager,
    pub vfs: Vfs<Box<dyn Storage>>,
    /// Loopback ordering service for standalone use (browser without a relay).
    pub sequencer: Sequencer,
    pub replica: Replica,
}

impl AppState {
    pub fn new(output: Rect, storage: Box<dyn Storage>) -> Result<Self, String> {
        let vfs = Vfs::open(storage).map_err(|e| e.to_string())?;
        Ok(AppState { wm: WindowManager::new(output, 4), vfs, sequencer: Sequencer::new(), replica: Replica::new(1) })
    }

    pub fn in_memory(output: Rect) -> Self {
        Self::new(output, Box::new(MemStorage::new())).expect("memory storage opens")
    }

    /// Submit a locally created op to the loopback sequencer and apply the ack.
    pub fn commit(&mut self, op: crate::fluid::Op) -> Result<u64, String> {
        let s = self.sequencer.submit(op).map_err(|e| e.to_string())?;
        self.replica.process(&s).map_err(|e| e.to_string())?;
        Ok(s.seq)
    }

    pub fn windows_json(&mut self) -> Value {
        let placed = self.wm.arrange();
        json!({
            "workspace": self.wm.active,
            "layout": self.wm.workspaces[self.wm.active].layout.name(),
            "output": self.wm.output,
            "windows": placed,
        })
    }
}

fn err(m: impl Into<String>) -> ToolError {
    ToolError::new(1, m)
}

/// Build the registry exposed through WebMCP in the browser and `/mcp` natively.
pub fn builtin_registry() -> ToolRegistry<AppState> {
    let mut r: ToolRegistry<AppState> = ToolRegistry::new();
    let layouts: Vec<&str> = LayoutKind::ALL.iter().map(|k| k.name()).collect();

    r.register("aphrody_windows_list", "List windows on the active workspace with their computed rectangles.", Schema::empty_object(), true, |s, _| {
        Ok(s.windows_json())
    });
    r.register(
        "aphrody_window_open",
        "Open a new window on the active workspace.",
        Schema::object(vec![
            Field::req("title", Schema::string(), "window title"),
            Field::opt("app_id", Schema::string(), "application id"),
        ]),
        false,
        |s, a| {
            let id = s.wm.add_window(a["title"].as_str().unwrap_or("untitled"), a.get("app_id").and_then(Value::as_str).unwrap_or("org.aphrody.app"));
            Ok(json!({"id": id}))
        },
    );
    r.register(
        "aphrody_window_focus",
        "Focus a window by id (switches workspace if needed).",
        Schema::object(vec![Field::req("id", Schema::integer(1, i64::from(u32::MAX)), "window id")]),
        false,
        |s, a| {
            let id = a["id"].as_u64().unwrap_or(0) as u32;
            if s.wm.focus_window(id) { Ok(json!({"focused": id})) } else { Err(err("no such window")) }
        },
    );
    r.register(
        "aphrody_window_close",
        "Close a window by id.",
        Schema::object(vec![Field::req("id", Schema::integer(1, i64::from(u32::MAX)), "window id")]),
        false,
        |s, a| {
            let id = a["id"].as_u64().unwrap_or(0) as u32;
            if s.wm.remove_window(id) { Ok(json!({"closed": id})) } else { Err(err("no such window")) }
        },
    );
    r.register(
        "aphrody_workspace_switch",
        "Switch to a workspace (0-based index).",
        Schema::object(vec![Field::req("index", Schema::integer(0, 63), "workspace index")]),
        false,
        |s, a| {
            let i = a["index"].as_u64().unwrap_or(0) as usize;
            if s.wm.switch_workspace(i) { Ok(json!({"active": i})) } else { Err(err("workspace out of range")) }
        },
    );
    let layout_schema = Schema::object(vec![Field::req("layout", Schema::one_of(&layouts), "layout algorithm")]);
    r.register("aphrody_layout_set", "Set the layout of the active workspace.", layout_schema, false, |s, a| {
        let k = LayoutKind::parse(a["layout"].as_str().unwrap_or("")).ok_or_else(|| err("unknown layout"))?;
        s.wm.set_layout(k);
        Ok(json!({"layout": k.name()}))
    });
    r.register(
        "aphrody_fs_write",
        "Write a UTF-8 text file into the content-addressed VFS.",
        Schema::object(vec![Field::req("path", Schema::string(), "absolute path"), Field::req("text", Schema::string(), "file contents")]),
        false,
        |s, a| {
            let root = s.vfs.write(a["path"].as_str().unwrap_or(""), a["text"].as_str().unwrap_or("").as_bytes()).map_err(|e| err(e.to_string()))?;
            Ok(json!({"root": root.to_hex()}))
        },
    );
    r.register(
        "aphrody_fs_read",
        "Read a UTF-8 text file from the VFS.",
        Schema::object(vec![Field::req("path", Schema::string(), "absolute path")]),
        true,
        |s, a| {
            let b = s.vfs.read(a["path"].as_str().unwrap_or("")).map_err(|e| err(e.to_string()))?;
            Ok(json!({"text": String::from_utf8_lossy(&b)}))
        },
    );
    r.register(
        "aphrody_fs_list",
        "List a VFS directory.",
        Schema::object(vec![Field::req("path", Schema::string(), "absolute directory path")]),
        true,
        |s, a| {
            let path = a["path"].as_str().unwrap_or("/");
            let kind = s.vfs.stat(path).map_err(|e| err(e.to_string()))?;
            if !matches!(kind, Some(Node::Dir)) {
                return Err(err("not a directory"));
            }
            Ok(json!({"entries": s.vfs.list(path).map_err(|e| err(e.to_string()))?}))
        },
    );
    r.register(
        "aphrody_counter_add",
        "Add to the shared counter 'clicks' through the sequenced-op engine.",
        Schema::object(vec![Field::req("delta", Schema::integer(-1_000_000, 1_000_000), "amount")]),
        false,
        |s, a| {
            let op = s.replica.counter_add("clicks", a["delta"].as_i64().unwrap_or(0));
            let seq = s.commit(op).map_err(err)?;
            Ok(json!({"value": s.replica.counter("clicks"), "seq": seq}))
        },
    );
    r.register("aphrody_doc_snapshot", "Snapshot of all shared data structures.", Schema::empty_object(), true, |s, _| Ok(s.replica.snapshot()));
    r
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builtin_tools_drive_state() {
        let reg = builtin_registry();
        let mut s = AppState::in_memory(Rect::new(0.0, 0.0, 1000.0, 600.0));
        let id = reg.call(&mut s, "aphrody_window_open", &json!({"title": "A"})).unwrap()["id"].as_u64().unwrap();
        reg.call(&mut s, "aphrody_window_open", &json!({"title": "B", "app_id": "x"})).unwrap();
        reg.call(&mut s, "aphrody_layout_set", &json!({"layout": "cosmic_grid"})).unwrap();
        let l = reg.call(&mut s, "aphrody_windows_list", &json!({})).unwrap();
        assert_eq!(l["windows"].as_array().unwrap().len(), 2);
        assert_eq!(l["layout"], "cosmic_grid");
        assert!(reg.call(&mut s, "aphrody_layout_set", &json!({"layout": "bogus"})).is_err());
        reg.call(&mut s, "aphrody_window_close", &json!({"id": id})).unwrap();
        assert!(reg.call(&mut s, "aphrody_window_close", &json!({"id": id})).is_err());
        reg.call(&mut s, "aphrody_fs_write", &json!({"path": "/n/a.txt", "text": "hi"})).unwrap();
        assert_eq!(reg.call(&mut s, "aphrody_fs_read", &json!({"path": "/n/a.txt"})).unwrap()["text"], "hi");
        assert_eq!(reg.call(&mut s, "aphrody_fs_list", &json!({"path": "/n"})).unwrap()["entries"][0]["name"], "a.txt");
        reg.call(&mut s, "aphrody_counter_add", &json!({"delta": 3})).unwrap();
        let v = reg.call(&mut s, "aphrody_counter_add", &json!({"delta": 4})).unwrap();
        assert_eq!(v["value"], 7);
        assert_eq!(reg.call(&mut s, "aphrody_doc_snapshot", &json!({})).unwrap()["counters"]["clicks"], 7);
    }
}
