//! Browser application: canvas + WebGPU frame loop, input, OPFS-backed state,
//! optional relay client, and WebMCP registration.

use crate::gpu::Renderer;
use crate::opfs::OpfsStorage;
use crate::scene::{pack_uniforms, to_bytes};
use aphrody_core::fluid::{Replica, SequencedOp};
use aphrody_core::layout::{LayoutKind, Rect};
use aphrody_core::state::{AppState, builtin_registry};
use aphrody_core::store::{MemStorage, Storage};
use aphrody_core::webmcp::ToolRegistry;
use js_sys::{Function, Object, Promise, Reflect};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use web_sys::{Document, Element, EventSource, HtmlCanvasElement, KeyboardEvent, MessageEvent, PointerEvent, Window};

const SHADER: &str = include_str!("../shaders/mica.wgsl");

struct App {
    state: AppState,
    renderer: Option<Renderer>,
    canvas: HtmlCanvasElement,
    hud: Option<Element>,
    hover: Option<u32>,
    storage_kind: &'static str,
    boots: u64,
    relay: bool,
    notes: String,
}

thread_local! {
    static APP: RefCell<Option<App>> = const { RefCell::new(None) };
    static REGISTRY: ToolRegistry<AppState> = builtin_registry();
}

fn window() -> Window {
    web_sys::window().expect("window")
}

fn set_status(doc: &Document, text: &str) {
    if let Some(el) = doc.get_element_by_id("hud") {
        el.set_text_content(Some(text));
    }
}

fn with_app<R>(f: impl FnOnce(&mut App) -> R) -> Option<R> {
    APP.with(|a| a.borrow_mut().as_mut().map(f))
}

fn hud_text(app: &mut App) -> String {
    let ws = app.state.wm.active;
    let layout = app.state.wm.workspaces[ws].layout.name();
    format!(
        "workspace {} | layout {} | windows {} | clicks {} | seq {} | storage {} | boots {} | relay {} {}",
        ws + 1,
        layout,
        app.state.wm.workspaces[ws].windows.len(),
        app.state.replica.counter("clicks"),
        app.state.replica.last_seq(),
        app.app_storage(),
        app.boots,
        if app.relay { "connected" } else { "off" },
        app.notes
    )
}

impl App {
    fn app_storage(&self) -> &'static str {
        self.storage_kind
    }

    fn persist_layout(&mut self) {
        let name = self.state.wm.workspaces[self.state.wm.active].layout.name();
        if self.state.vfs.write("/state/layout", name.as_bytes()).is_ok() {
            let _ = self.state.vfs.checkpoint();
        }
    }

    fn click(&mut self) {
        let op = self.state.replica.counter_add("clicks", 1);
        if self.relay {
            post_op(&op);
        } else {
            let _ = self.state.commit(op);
        }
    }
}

fn post_op(op: &aphrody_core::fluid::Op) {
    let init = web_sys::RequestInit::new();
    init.set_method("POST");
    init.set_body(&JsValue::from_str(&serde_json::to_string(op).unwrap_or_default()));
    let _ = window().fetch_with_str_and_init("/ops", &init);
}

fn random_client_id() -> u64 {
    (js_sys::Math::random() * 9_007_199_254_740_991.0) as u64 + 2
}

#[wasm_bindgen(start)]
pub fn start() {
    std::panic::set_hook(Box::new(|info| web_sys::console::error_1(&JsValue::from_str(&info.to_string()))));
    spawn_local(async {
        if let Err(e) = run().await {
            set_status(&window().document().expect("document"), &format!("aphrody: {e}"));
        }
    });
}

async fn run() -> Result<(), String> {
    let win = window();
    let doc = win.document().ok_or("no document")?;
    let canvas: HtmlCanvasElement = doc
        .get_element_by_id("gpu")
        .ok_or("missing #gpu canvas")?
        .dyn_into()
        .map_err(|_| "#gpu is not a canvas")?;
    let hud = doc.get_element_by_id("hud");

    let dpr = win.device_pixel_ratio().max(1.0);
    let (w, h) = ((canvas.client_width().max(320) as f64 * dpr) as u32, (canvas.client_height().max(240) as f64 * dpr) as u32);
    canvas.set_width(w);
    canvas.set_height(h);
    let output = Rect::new(0.0, 0.0, w as f32, h as f32);

    let (storage, storage_kind): (Box<dyn Storage>, &'static str) = match OpfsStorage::open().await {
        Ok(s) => (Box::new(s), "opfs"),
        Err(_) => (Box::new(MemStorage::new()), "memory"),
    };
    let mut state = AppState::new(output, storage)?;
    state.replica = Replica::new(random_client_id());
    state.wm.gap = (12.0 * dpr) as f32;

    // Boot counter proves OPFS persistence across reloads.
    let boots = state.vfs.read("/boot/count").ok().and_then(|b| String::from_utf8(b).ok()).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0) + 1;
    let _ = state.vfs.write("/boot/count", boots.to_string().as_bytes());
    if let Some(k) = state.vfs.read("/state/layout").ok().and_then(|b| String::from_utf8(b).ok()).and_then(|s| LayoutKind::parse(&s)) {
        state.wm.set_layout(k);
    }
    for (t, a) in [("Terminal", "org.aphrody.term"), ("Files", "org.aphrody.files"), ("Editor", "org.aphrody.edit")] {
        state.wm.add_window(t, a);
    }
    let _ = state.vfs.checkpoint();

    let renderer = match Renderer::new(&canvas, SHADER).await {
        Ok(r) => Some(r),
        Err(e) => {
            set_status(&doc, &format!("WebGPU unavailable: {e}"));
            None
        }
    };
    let app = App { state, renderer, canvas: canvas.clone(), hud, hover: None, storage_kind, boots, relay: false, notes: String::new() };
    APP.with(|a| *a.borrow_mut() = Some(app));

    register_webmcp();
    install_input(&canvas);
    connect_relay();
    start_frame_loop();
    Ok(())
}

fn install_input(canvas: &HtmlCanvasElement) {
    let down = Closure::<dyn FnMut(PointerEvent)>::new(|e: PointerEvent| {
        with_app(|app| {
            let dpr = window().device_pixel_ratio().max(1.0) as f32;
            let r = app.canvas.get_bounding_client_rect();
            let (x, y) = ((e.client_x() as f64 - r.left()) as f32 * dpr, (e.client_y() as f64 - r.top()) as f32 * dpr);
            if let Some(id) = app.state.wm.window_at(x, y) {
                app.state.wm.focus_window(id);
            }
            app.click();
        });
    });
    let _ = canvas.add_event_listener_with_callback("pointerdown", down.as_ref().unchecked_ref());
    down.forget();

    let mv = Closure::<dyn FnMut(PointerEvent)>::new(|e: PointerEvent| {
        with_app(|app| {
            let dpr = window().device_pixel_ratio().max(1.0) as f32;
            let r = app.canvas.get_bounding_client_rect();
            let (x, y) = ((e.client_x() as f64 - r.left()) as f32 * dpr, (e.client_y() as f64 - r.top()) as f32 * dpr);
            app.hover = app.state.wm.window_at(x, y);
        });
    });
    let _ = canvas.add_event_listener_with_callback("pointermove", mv.as_ref().unchecked_ref());
    mv.forget();

    let key = Closure::<dyn FnMut(KeyboardEvent)>::new(|e: KeyboardEvent| {
        with_app(|app| {
            let wm = &mut app.state.wm;
            match e.key().as_str() {
                "n" => {
                    let n = wm.window_count() + 1;
                    wm.add_window(&format!("Window {n}"), "org.aphrody.app");
                }
                "w" => {
                    if let Some(f) = wm.workspaces[wm.active].focused {
                        wm.remove_window(f);
                    }
                }
                "ArrowRight" | "ArrowDown" | "Tab" => wm.focus_next(),
                "ArrowLeft" | "ArrowUp" => wm.focus_prev(),
                "l" => {
                    wm.cycle_layout();
                    app.persist_layout();
                }
                " " => app.click(),
                k if k.len() == 1 && k.as_bytes()[0].is_ascii_digit() && k != "0" => {
                    let i = (k.as_bytes()[0] - b'1') as usize;
                    wm.switch_workspace(i);
                }
                _ => return,
            }
            e.prevent_default();
        });
    });
    let _ = window().add_event_listener_with_callback("keydown", key.as_ref().unchecked_ref());
    key.forget();
}

fn connect_relay() {
    let proto = window().location().protocol().unwrap_or_default();
    if proto != "http:" && proto != "https:" {
        return;
    }
    let Ok(es) = EventSource::new("/events") else { return };
    let onopen = Closure::<dyn FnMut()>::new(|| {
        with_app(|a| a.relay = true);
    });
    es.set_onopen(Some(onopen.as_ref().unchecked_ref()));
    onopen.forget();
    let onerr = Closure::<dyn FnMut()>::new(|| {
        with_app(|a| a.relay = false);
    });
    es.set_onerror(Some(onerr.as_ref().unchecked_ref()));
    onerr.forget();
    let onmsg = Closure::<dyn FnMut(MessageEvent)>::new(|m: MessageEvent| {
        let Some(text) = m.data().as_string() else { return };
        let Ok(sop) = serde_json::from_str::<SequencedOp>(&text) else { return };
        with_app(|a| {
            if sop.seq > a.state.replica.last_seq() {
                if let Err(e) = a.state.replica.process(&sop) {
                    a.notes = format!("(relay: {e})");
                }
            }
        });
    });
    es.set_onmessage(Some(onmsg.as_ref().unchecked_ref()));
    onmsg.forget();
}

fn start_frame_loop() {
    let f: Rc<RefCell<Option<Closure<dyn FnMut(f64)>>>> = Rc::new(RefCell::new(None));
    let g = f.clone();
    *g.borrow_mut() = Some(Closure::<dyn FnMut(f64)>::new(move |t: f64| {
        with_app(|app| frame(app, t));
        if let Some(cb) = f.borrow().as_ref() {
            let _ = window().request_animation_frame(cb.as_ref().unchecked_ref());
        }
    }));
    if let Some(cb) = g.borrow().as_ref() {
        let _ = window().request_animation_frame(cb.as_ref().unchecked_ref());
    }
}

fn frame(app: &mut App, t_ms: f64) {
    let win = window();
    let dpr = win.device_pixel_ratio().max(1.0);
    let (w, h) = ((app.canvas.client_width().max(1) as f64 * dpr) as u32, (app.canvas.client_height().max(1) as f64 * dpr) as u32);
    if app.canvas.width() != w || app.canvas.height() != h {
        app.canvas.set_width(w);
        app.canvas.set_height(h);
        app.state.wm.resize_output(Rect::new(0.0, 0.0, w as f32, h as f32));
    }
    let placed = app.state.wm.arrange();
    let hover = app.hover.and_then(|id| placed.iter().position(|p| p.id == id));
    if let Some(r) = &app.renderer {
        let u = pack_uniforms((w as f32, h as f32), (t_ms / 1000.0) as f32, dpr as f32, hover, &placed);
        if let Err(e) = r.render(&to_bytes(&u)) {
            app.notes = format!("(render: {e})");
        }
    }
    let text = hud_text(app);
    if let Some(el) = &app.hud {
        if el.text_content().as_deref() != Some(text.as_str()) {
            el.set_text_content(Some(&text));
        }
    }
}

// ----------------------------------------------------------------- WebMCP

fn call_tool(name: &str, args_json: &str) -> Result<String, String> {
    let args: serde_json::Value = serde_json::from_str(args_json).map_err(|e| e.to_string())?;
    with_app(|app| REGISTRY.with(|r| r.call(&mut app.state, name, &args)))
        .ok_or("application not started")?
        .map(|v| v.to_string())
        .map_err(|e| e.message)
}

/// JSON array of tool descriptors (same shape as `/.well-known/webmcp.json`).
#[wasm_bindgen]
pub fn mcp_tools() -> String {
    REGISTRY.with(|r| r.list_json().to_string())
}

/// Invoke a tool with JSON arguments; returns JSON text or throws.
#[wasm_bindgen]
pub fn mcp_call(name: &str, args_json: &str) -> Result<String, JsValue> {
    call_tool(name, args_json).map_err(|e| JsValue::from_str(&e))
}

/// Handle one MCP JSON-RPC request body.
#[wasm_bindgen]
pub fn mcp_jsonrpc(body: &str) -> Option<String> {
    with_app(|app| REGISTRY.with(|r| r.handle_jsonrpc(&mut app.state, body, "aphrody-app", aphrody_core::VERSION))).flatten()
}

fn register_webmcp() {
    let nav = window().navigator();
    let mc = Reflect::get(&nav, &"modelContext".into()).unwrap_or(JsValue::UNDEFINED);
    let note = |s: &str| {
        with_app(|a| a.notes = s.to_string());
    };
    if mc.is_undefined() || mc.is_null() {
        note("| webmcp: navigator.modelContext absent");
        return;
    }
    let register = Reflect::get(&mc, &"registerTool".into()).ok().filter(|f| f.is_function());
    let Some(register) = register.map(|f| f.unchecked_into::<Function>()) else {
        note("| webmcp: registerTool absent");
        return;
    };
    let tools: serde_json::Value = serde_json::from_str(&mcp_tools()).unwrap_or_default();
    let mut ok = 0;
    for t in tools.as_array().cloned().unwrap_or_default() {
        let name = t["name"].as_str().unwrap_or_default().to_string();
        let obj = Object::new();
        let _ = Reflect::set(&obj, &"name".into(), &name.clone().into());
        let _ = Reflect::set(&obj, &"description".into(), &t["description"].as_str().unwrap_or_default().into());
        let schema = js_sys::JSON::parse(&t["inputSchema"].to_string()).unwrap_or(JsValue::UNDEFINED);
        let _ = Reflect::set(&obj, &"inputSchema".into(), &schema);
        let tool_name = name.clone();
        let exec = Closure::<dyn FnMut(JsValue) -> Promise<JsValue>>::new(move |input: JsValue| {
            let args = js_sys::JSON::stringify(&input).ok().and_then(|s| s.as_string()).unwrap_or_else(|| "{}".into());
            let (text, is_error) = match call_tool(&tool_name, &args) {
                Ok(t) => (t, false),
                Err(e) => (e, true),
            };
            let item = Object::new();
            let _ = Reflect::set(&item, &"type".into(), &"text".into());
            let _ = Reflect::set(&item, &"text".into(), &text.into());
            let res = Object::new();
            let _ = Reflect::set(&res, &"content".into(), &js_sys::Array::of1(&item));
            let _ = Reflect::set(&res, &"isError".into(), &is_error.into());
            Promise::resolve(&res).unchecked_into::<Promise<JsValue>>()
        });
        let _ = Reflect::set(&obj, &"execute".into(), exec.as_ref());
        exec.forget();
        if register.call1(&mc, &obj).is_ok() {
            ok += 1;
        }
    }
    note(&format!("| webmcp: {ok} tools"));
}
