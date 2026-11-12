//! Server-side session model for a small subset of the Wayland protocol:
//! wl_display, wl_registry, wl_callback, wl_compositor, wl_surface,
//! xdg_wm_base, xdg_surface and xdg_toplevel.
//!
//! This is a simulation of the protocol state machine on top of the binary wire
//! framing in [`crate::wire`]. It speaks no sockets and passes no file
//! descriptors, so it cannot host real Wayland clients; it exists so that the
//! window-management policy can be driven and tested by protocol traffic.

use crate::wire::{Arg, Message, WireError, next_frame, decode_args};
use crate::wm::{WindowId, WindowManager};
use std::collections::BTreeMap;

pub const DISPLAY_ID: u32 = 1;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Interface {
    Display,
    Registry,
    Callback,
    Compositor,
    XdgWmBase,
    Surface,
    XdgSurface,
    XdgToplevel,
}

impl Interface {
    pub fn name(&self) -> &'static str {
        match self {
            Interface::Display => "wl_display",
            Interface::Registry => "wl_registry",
            Interface::Callback => "wl_callback",
            Interface::Compositor => "wl_compositor",
            Interface::XdgWmBase => "xdg_wm_base",
            Interface::Surface => "wl_surface",
            Interface::XdgSurface => "xdg_surface",
            Interface::XdgToplevel => "xdg_toplevel",
        }
    }
}

pub const GLOBALS: [(u32, Interface, u32); 2] = [(1, Interface::Compositor, 6), (2, Interface::XdgWmBase, 5)];

/// wl_display.error codes.
pub const ERR_INVALID_OBJECT: u32 = 0;
pub const ERR_INVALID_METHOD: u32 = 1;
pub const ERR_IMPLEMENTATION: u32 = 3;

/// xdg_toplevel state values.
pub const STATE_ACTIVATED: u32 = 4;

#[derive(Default)]
struct XdgSurface {
    surface: u32,
    toplevel: Option<u32>,
    configure_serial: u32,
    acked: bool,
}

#[derive(Default)]
struct Toplevel {
    xdg_surface: u32,
    title: String,
    app_id: String,
    window: Option<WindowId>,
}

pub struct Session {
    objects: BTreeMap<u32, Interface>,
    xdg_surfaces: BTreeMap<u32, XdgSurface>,
    toplevels: BTreeMap<u32, Toplevel>,
    /// wl_surface id -> xdg_surface id
    surface_role: BTreeMap<u32, u32>,
    serial: u32,
    out: Vec<u8>,
}

impl Default for Session {
    fn default() -> Self {
        Self::new()
    }
}

fn signature(iface: Interface, opcode: u16) -> Option<&'static str> {
    Some(match (iface, opcode) {
        (Interface::Display, 0) => "n",
        (Interface::Display, 1) => "n",
        (Interface::Registry, 0) => "usun",
        (Interface::Compositor, 0) => "n",
        (Interface::Surface, 0 | 6) => "",
        (Interface::Surface, 1) => "oii",
        (Interface::Surface, 2 | 9) => "iiii",
        (Interface::Surface, 3) => "n",
        (Interface::Surface, 4 | 5) => "o",
        (Interface::Surface, 7 | 8) => "i",
        (Interface::XdgWmBase, 0) => "",
        (Interface::XdgWmBase, 2) => "no",
        (Interface::XdgWmBase, 3) => "u",
        (Interface::XdgSurface, 0 | 1) if opcode == 0 => "",
        (Interface::XdgSurface, 1) => "n",
        (Interface::XdgSurface, 3) => "iiii",
        (Interface::XdgSurface, 4) => "u",
        (Interface::XdgToplevel, 0 | 9 | 10 | 12 | 13) => "",
        (Interface::XdgToplevel, 2 | 3) => "s",
        (Interface::XdgToplevel, 7 | 8) => "ii",
        (Interface::XdgToplevel, 5) => "ou",
        (Interface::XdgToplevel, 6) => "ouu",
        (Interface::XdgToplevel, 11) => "o",
        _ => return None,
    })
}

impl Session {
    pub fn new() -> Self {
        let mut objects = BTreeMap::new();
        objects.insert(DISPLAY_ID, Interface::Display);
        Session {
            objects,
            xdg_surfaces: BTreeMap::new(),
            toplevels: BTreeMap::new(),
            surface_role: BTreeMap::new(),
            serial: 0,
            out: Vec::new(),
        }
    }

    pub fn object_interface(&self, id: u32) -> Option<Interface> {
        self.objects.get(&id).copied()
    }

    fn emit(&mut self, object_id: u32, opcode: u16, args: Vec<Arg>) {
        // Server events here are always small; encoding cannot overflow.
        let _ = Message::new(object_id, opcode, args).encode_into(&mut self.out);
    }

    fn next_serial(&mut self) -> u32 {
        self.serial += 1;
        self.serial
    }

    fn protocol_error(&mut self, object: u32, code: u32, msg: &str) {
        self.emit(DISPLAY_ID, 0, vec![Arg::Object(object), Arg::Uint(code), Arg::Str(msg.to_string())]);
    }

    fn new_object(&mut self, id: u32, iface: Interface) -> bool {
        if id == 0 || self.objects.contains_key(&id) {
            self.protocol_error(DISPLAY_ID, ERR_INVALID_OBJECT, "new_id already in use");
            return false;
        }
        self.objects.insert(id, iface);
        true
    }

    /// Feed client bytes (a whole number of frames expected; a trailing partial
    /// frame is an error) and return the server's event bytes.
    pub fn feed(&mut self, wm: &mut WindowManager, mut bytes: &[u8]) -> Result<Vec<u8>, WireError> {
        while !bytes.is_empty() {
            let Some((h, payload)) = next_frame(bytes)? else { return Err(WireError::Truncated) };
            let consumed = h.size as usize;
            let Some(&iface) = self.objects.get(&h.object_id) else {
                self.protocol_error(h.object_id, ERR_INVALID_OBJECT, "unknown object");
                bytes = &bytes[consumed..];
                continue;
            };
            let Some(sig) = signature(iface, h.opcode) else {
                self.protocol_error(h.object_id, ERR_INVALID_METHOD, "invalid method");
                bytes = &bytes[consumed..];
                continue;
            };
            let args = decode_args(payload, sig)?;
            self.dispatch(wm, h.object_id, iface, h.opcode, &args);
            bytes = &bytes[consumed..];
        }
        Ok(core::mem::take(&mut self.out))
    }

    fn dispatch(&mut self, wm: &mut WindowManager, id: u32, iface: Interface, op: u16, a: &[Arg]) {
        match (iface, op) {
            (Interface::Display, 0) => {
                if let Arg::NewId(cb) = a[0] {
                    if self.new_object(cb, Interface::Callback) {
                        let serial = self.next_serial();
                        self.emit(cb, 0, vec![Arg::Uint(serial)]);
                        self.emit(DISPLAY_ID, 1, vec![Arg::Uint(cb)]);
                        self.objects.remove(&cb);
                    }
                }
            }
            (Interface::Display, 1) => {
                if let Arg::NewId(reg) = a[0] {
                    if self.new_object(reg, Interface::Registry) {
                        for (name, iface, version) in GLOBALS {
                            self.emit(
                                reg,
                                0,
                                vec![Arg::Uint(name), Arg::Str(iface.name().to_string()), Arg::Uint(version)],
                            );
                        }
                    }
                }
            }
            (Interface::Registry, 0) => {
                let (Arg::Uint(name), Arg::Str(iname), Arg::Uint(_ver), Arg::NewId(nid)) =
                    (&a[0], &a[1], &a[2], &a[3])
                else {
                    return;
                };
                match GLOBALS.iter().find(|(n, i, _)| n == name && i.name() == iname) {
                    Some((_, i, _)) => {
                        self.new_object(*nid, *i);
                    }
                    None => self.protocol_error(id, ERR_INVALID_OBJECT, "no such global"),
                }
            }
            (Interface::Compositor, 0) => {
                if let Arg::NewId(s) = a[0] {
                    self.new_object(s, Interface::Surface);
                }
            }
            (Interface::Surface, 0) => {
                if let Some(xs) = self.surface_role.remove(&id) {
                    self.destroy_xdg_surface(wm, xs);
                }
                self.objects.remove(&id);
            }
            (Interface::Surface, 3) => {
                if let Arg::NewId(cb) = a[0] {
                    if self.new_object(cb, Interface::Callback) {
                        let t = self.next_serial();
                        self.emit(cb, 0, vec![Arg::Uint(t)]);
                        self.emit(DISPLAY_ID, 1, vec![Arg::Uint(cb)]);
                        self.objects.remove(&cb);
                    }
                }
            }
            (Interface::Surface, 6) => self.commit(wm, id),
            (Interface::Surface, _) => {}
            (Interface::XdgWmBase, 0) => {
                self.objects.remove(&id);
            }
            (Interface::XdgWmBase, 2) => {
                if let (Arg::NewId(xs), Arg::Object(surface)) = (&a[0], &a[1]) {
                    if self.objects.get(surface) != Some(&Interface::Surface) {
                        self.protocol_error(id, ERR_INVALID_OBJECT, "not a wl_surface");
                    } else if self.new_object(*xs, Interface::XdgSurface) {
                        self.xdg_surfaces.insert(*xs, XdgSurface { surface: *surface, ..Default::default() });
                        self.surface_role.insert(*surface, *xs);
                    }
                }
            }
            (Interface::XdgWmBase, _) => {}
            (Interface::XdgSurface, 0) => {
                self.destroy_xdg_surface(wm, id);
            }
            (Interface::XdgSurface, 1) => {
                if let Arg::NewId(tl) = a[0] {
                    if self.new_object(tl, Interface::XdgToplevel) {
                        self.toplevels.insert(tl, Toplevel { xdg_surface: id, ..Default::default() });
                        let serial = self.next_serial();
                        if let Some(xs) = self.xdg_surfaces.get_mut(&id) {
                            xs.toplevel = Some(tl);
                            xs.configure_serial = serial;
                        }
                        self.emit(tl, 0, vec![Arg::Int(0), Arg::Int(0), Arg::Array(Vec::new())]);
                        self.emit(id, 0, vec![Arg::Uint(serial)]);
                    }
                }
            }
            (Interface::XdgSurface, 4) => {
                if let (Arg::Uint(serial), Some(xs)) = (&a[0], self.xdg_surfaces.get_mut(&id)) {
                    if *serial == xs.configure_serial {
                        xs.acked = true;
                    }
                }
            }
            (Interface::XdgSurface, _) => {}
            (Interface::XdgToplevel, 0) => {
                if let Some(tl) = self.toplevels.remove(&id) {
                    if let Some(w) = tl.window {
                        wm.remove_window(w);
                    }
                    if let Some(xs) = self.xdg_surfaces.get_mut(&tl.xdg_surface) {
                        xs.toplevel = None;
                        xs.acked = false;
                    }
                }
                self.objects.remove(&id);
            }
            (Interface::XdgToplevel, 2) => {
                if let (Arg::Str(t), Some(tl)) = (&a[0], self.toplevels.get_mut(&id)) {
                    tl.title = t.clone();
                    if let Some(w) = tl.window {
                        wm.set_title(w, t);
                    }
                }
            }
            (Interface::XdgToplevel, 3) => {
                if let (Arg::Str(t), Some(tl)) = (&a[0], self.toplevels.get_mut(&id)) {
                    tl.app_id = t.clone();
                    if let Some(w) = tl.window {
                        wm.set_app_id(w, t);
                    }
                }
            }
            _ => {}
        }
    }

    fn destroy_xdg_surface(&mut self, wm: &mut WindowManager, xs_id: u32) {
        if let Some(xs) = self.xdg_surfaces.remove(&xs_id) {
            if let Some(tl_id) = xs.toplevel {
                if let Some(tl) = self.toplevels.remove(&tl_id) {
                    if let Some(w) = tl.window {
                        wm.remove_window(w);
                    }
                }
                self.objects.remove(&tl_id);
            }
            self.surface_role.remove(&xs.surface);
        }
        self.objects.remove(&xs_id);
    }

    /// First commit after ack_configure maps the toplevel into the WM and sends
    /// the real size via xdg_toplevel.configure + xdg_surface.configure.
    fn commit(&mut self, wm: &mut WindowManager, surface: u32) {
        let Some(&xs_id) = self.surface_role.get(&surface) else { return };
        let Some(xs) = self.xdg_surfaces.get(&xs_id) else { return };
        let (Some(tl_id), true) = (xs.toplevel, xs.acked) else { return };
        let Some(tl) = self.toplevels.get_mut(&tl_id) else { return };
        if tl.window.is_some() {
            return;
        }
        let title = if tl.title.is_empty() { "untitled".to_string() } else { tl.title.clone() };
        let wid = wm.add_window(&title, &tl.app_id);
        tl.window = Some(wid);
        let rect = wm.rect_of(wid).unwrap_or_default();
        let serial = self.next_serial();
        if let Some(xs) = self.xdg_surfaces.get_mut(&xs_id) {
            xs.configure_serial = serial;
            xs.acked = false;
        }
        let states = STATE_ACTIVATED.to_le_bytes().to_vec();
        self.emit(tl_id, 0, vec![Arg::Int(rect.w as i32), Arg::Int(rect.h as i32), Arg::Array(states)]);
        self.emit(xs_id, 0, vec![Arg::Uint(serial)]);
    }

    /// Compositor-initiated close request (xdg_toplevel.close event).
    pub fn request_close(&mut self, window: WindowId) -> Option<Vec<u8>> {
        let tl = self.toplevels.iter().find(|(_, t)| t.window == Some(window)).map(|(id, _)| *id)?;
        self.emit(tl, 1, vec![]);
        Some(core::mem::take(&mut self.out))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout::Rect;

    fn req(id: u32, op: u16, args: Vec<Arg>) -> Vec<u8> {
        Message::new(id, op, args).encode().unwrap()
    }

    fn events(mut bytes: &[u8], sigs: &dyn Fn(u32, u16) -> &'static str) -> Vec<Message> {
        let mut v = Vec::new();
        while !bytes.is_empty() {
            let (m, n) = {
                let h = crate::wire::Header::parse(bytes).unwrap();
                Message::decode(bytes, sigs(h.object_id, h.opcode)).unwrap()
            };
            v.push(m);
            bytes = &bytes[n..];
        }
        v
    }

    #[test]
    fn registry_and_toplevel_handshake_maps_a_window() {
        let mut wm = WindowManager::new(Rect::new(0.0, 0.0, 1280.0, 720.0), 2);
        let mut s = Session::new();
        // get_registry(new_id=2)
        let out = s.feed(&mut wm, &req(1, 1, vec![Arg::NewId(2)])).unwrap();
        let ev = events(&out, &|_, _| "usu");
        assert_eq!(ev.len(), 2);
        assert_eq!(ev[0].args[1], Arg::Str("wl_compositor".into()));
        // bind compositor=3, wm_base=4
        let mut b = req(2, 0, vec![Arg::Uint(1), Arg::Str("wl_compositor".into()), Arg::Uint(6), Arg::NewId(3)]);
        b.extend(req(2, 0, vec![Arg::Uint(2), Arg::Str("xdg_wm_base".into()), Arg::Uint(5), Arg::NewId(4)]));
        assert!(s.feed(&mut wm, &b).unwrap().is_empty());
        assert_eq!(s.object_interface(4), Some(Interface::XdgWmBase));
        // surface=5, xdg_surface=6, toplevel=7
        let mut b = req(3, 0, vec![Arg::NewId(5)]);
        b.extend(req(4, 2, vec![Arg::NewId(6), Arg::Object(5)]));
        b.extend(req(6, 1, vec![Arg::NewId(7)]));
        b.extend(req(7, 2, vec![Arg::Str("Terminal".into())]));
        b.extend(req(7, 3, vec![Arg::Str("org.aphrody.term".into())]));
        let out = s.feed(&mut wm, &b).unwrap();
        // initial toplevel.configure + xdg_surface.configure
        let ev = events(&out, &|o, _| if o == 7 { "iia" } else { "u" });
        assert_eq!(ev.len(), 2);
        let Arg::Uint(serial) = ev[1].args[0] else { panic!() };
        assert_eq!(wm.window_count(), 0, "not mapped before ack + commit");
        let mut b = req(6, 4, vec![Arg::Uint(serial)]);
        b.extend(req(5, 6, vec![]));
        let out = s.feed(&mut wm, &b).unwrap();
        assert_eq!(wm.window_count(), 1);
        let ev = events(&out, &|o, _| if o == 7 { "iia" } else { "u" });
        assert_eq!(ev.len(), 2);
        assert_eq!(ev[0].object_id, 7);
        assert_eq!(ev[0].args[2], Arg::Array(vec![4, 0, 0, 0]));
        let w = wm.arrange()[0].clone();
        assert_eq!(w.title, "Terminal");
        assert_eq!(w.app_id, "org.aphrody.term");
        assert_eq!(ev[0].args[0], Arg::Int(w.rect.w as i32));
        // destroying the toplevel unmaps
        s.feed(&mut wm, &req(7, 0, vec![])).unwrap();
        assert_eq!(wm.window_count(), 0);
    }

    #[test]
    fn sync_fires_done_and_delete_id() {
        let mut wm = WindowManager::new(Rect::new(0.0, 0.0, 800.0, 600.0), 1);
        let mut s = Session::new();
        let out = s.feed(&mut wm, &req(1, 0, vec![Arg::NewId(9)])).unwrap();
        let ev = events(&out, &|_, _| "u");
        assert_eq!((ev[0].object_id, ev[0].opcode), (9, 0));
        assert_eq!((ev[1].object_id, ev[1].opcode, &ev[1].args[0]), (1, 1, &Arg::Uint(9)));
    }

    #[test]
    fn protocol_errors_are_reported() {
        let mut wm = WindowManager::new(Rect::new(0.0, 0.0, 800.0, 600.0), 1);
        let mut s = Session::new();
        let out = s.feed(&mut wm, &req(42, 0, vec![])).unwrap();
        let ev = events(&out, &|_, _| "ous");
        assert_eq!((ev[0].object_id, ev[0].opcode), (1, 0));
        assert_eq!(ev[0].args[0], Arg::Object(42));
        let out = s.feed(&mut wm, &req(1, 77, vec![])).unwrap();
        assert_eq!(events(&out, &|_, _| "ous")[0].args[1], Arg::Uint(ERR_INVALID_METHOD));
        assert!(s.feed(&mut wm, &[1, 0, 0, 0, 0, 0]).is_err());
    }
}
