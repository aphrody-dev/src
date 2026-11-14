const WASM_URL = "/wayland.wasm";

const LAYOUT_NAMES = ["DwindleMaster", "DwindleStack", "Monocle"];

const OBJECT_NAMES = new Map([
  [1, "wl_display"],
  [2, "wl_registry"],
  [3, "wl_compositor"],
  [4, "wl_shm"],
  [5, "wl_seat"],
  [6, "wl_output"],
  [7, "wl_subcompositor"],
]);

function decodeOpcode(dir, objectId, opcode) {
  if (objectId === 1) {
    if (dir === 0) return opcode === 0 ? "sync" : "get_registry";
    return opcode === 0 ? "error" : "delete_id";
  }
  if (objectId === 2) {
    return dir === 0 ? "bind" : opcode === 0 ? "global" : "global_remove";
  }
  if (objectId === 3) return opcode === 0 ? "create_surface" : "create_region";
  if (objectId === 4) return dir === 0 ? "create_pool" : "format";
  if (objectId === 5) {
    if (dir === 0) return opcode === 0 ? "get_pointer" : "get_keyboard";
    const ev = ["enter", "leave", "motion", "button", "axis", "frame"];
    return ev[opcode] ?? `event_${opcode}`;
  }
  if (dir === 0) {
    const req = {
      0: "destroy",
      1: "attach",
      2: "damage",
      3: "frame",
      6: "commit",
      9: "damage_buffer",
    };
    return req[opcode] ?? `req_${opcode}`;
  }
  return opcode === 0 ? "done" : `ev_${opcode}`;
}

async function loadWaylandWasm() {
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      const { instance } = await WebAssembly.instantiateStreaming(
        fetch(WASM_URL),
        {},
      );
      return instance;
    } catch {
      // Fallback when local server lacks application/wasm MIME type
    }
  }
  const resp = await fetch(WASM_URL);
  const bytes = await resp.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  return instance;
}

async function main() {
  const canvas = document.getElementById("wl-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const statusEl = document.getElementById("wl-status");
  const wireBody = document.getElementById("wl-wire-body");
  const announceEl = document.getElementById("wl-announce");

  const instance = await loadWaylandWasm();
  const ex = instance.exports;

  const w = canvas.width;
  const h = canvas.height;
  ex.wl_init(w, h);

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  ex.wl_set_dark_mode(darkQuery.matches ? 1 : 0);
  darkQuery.addEventListener("change", (e) =>
    ex.wl_set_dark_mode(e.matches ? 1 : 0),
  );

  // Spawn initial surfaces aligned with Figma 2xsZi5wLPAYLGNCLZ2ZJUv
  ex.wl_create_surface(1);
  ex.wl_create_surface(2);
  ex.wl_create_surface(0);

  let nextKind = 1;
  let lastWireSeq = -1;

  function updateWireLog() {
    const total = ex.wl_wire_total_messages();
    if (total === lastWireSeq) return;
    lastWireSeq = total;

    const ptr = ex.wl_wire_log_ptr();
    const cap = ex.wl_wire_log_cap();
    const view = new Uint32Array(ex.memory.buffer, ptr, cap * 8);

    const rows = [];
    const count = Math.min(total, cap);
    for (let i = 0; i < count; i++) {
      const seq = total - i;
      const slot = (seq - 1) % cap;
      const base = slot * 8;
      const dir = view[base + 1];
      const objId = view[base + 2];
      const sizeOp = view[base + 3];
      const size = sizeOp >>> 16;
      const op = sizeOp & 0xffff;
      const arg0 = view[base + 4];
      const arg1 = view[base + 5];
      const objName = OBJECT_NAMES.get(objId) ?? `wl_obj#${objId}`;
      const opName = decodeOpcode(dir, objId, op);
      rows.push(
        `<tr><td>${seq}</td><td>${dir === 0 ? "C-&gt;S" : "S-&gt;C"}</td><td>${objName}</td><td>${opName}</td><td>${size}B</td><td>${arg0}, ${arg1}</td></tr>`,
      );
      if (rows.length >= 12) break;
    }
    wireBody.innerHTML = rows.join("");
  }

  function updateStatus() {
    const surfaces = ex.wl_surface_count();
    const focused = ex.wl_focused_surface_id();
    const msgs = ex.wl_wire_total_messages();
    const layout = LAYOUT_NAMES[ex.wl_layout_mode()] ?? "DwindleMaster";
    statusEl.textContent = `surfaces: ${surfaces} | focus: wl_surface#${focused} | layout: ${layout} | wire msgs: ${msgs}`;
  }

  function renderFrame(now) {
    ex.wl_tick(now >>> 0);
    const ptr = ex.wl_framebuffer_ptr();
    const bytes = ex.wl_framebuffer_bytes();
    const pixels = new Uint8ClampedArray(ex.memory.buffer, ptr, bytes);
    const img = new ImageData(pixels, ex.wl_width(), ex.wl_height());
    ctx.putImageData(img, 0, 0);
    updateStatus();
    updateWireLog();
    requestAnimationFrame(renderFrame);
  }

  function canvasCoords(ev) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return [
      Math.max(
        0,
        Math.min(canvas.width - 1, Math.round((ev.clientX - rect.left) * sx)),
      ),
      Math.max(
        0,
        Math.min(canvas.height - 1, Math.round((ev.clientY - rect.top) * sy)),
      ),
    ];
  }

  canvas.addEventListener("pointermove", (ev) => {
    const [x, y] = canvasCoords(ev);
    ex.wl_pointer_motion(x, y);
  });

  canvas.addEventListener("pointerdown", (ev) => {
    const [x, y] = canvasCoords(ev);
    ex.wl_pointer_motion(x, y);
    const focused = ex.wl_pointer_button(ev.button, 1);
    announceEl.textContent = `Focused wl_surface#${focused}`;
  });

  canvas.addEventListener("pointerup", (ev) => {
    ex.wl_pointer_button(ev.button, 0);
  });

  canvas.addEventListener("keydown", (ev) => {
    ex.wl_key_event(ev.keyCode || 0, 1);
    if (ev.key === "1") ex.wl_set_layout(0);
    else if (ev.key === "2") ex.wl_set_layout(1);
    else if (ev.key === "3") ex.wl_set_layout(2);
    else if (ev.key.toLowerCase() === "n") ex.wl_create_surface(nextKind++ % 3);
    else if (ev.key.toLowerCase() === "w") {
      const f = ex.wl_focused_surface_id();
      if (f) ex.wl_close_surface(f);
    }
  });

  document.getElementById("btn-new-surface").addEventListener("click", () => {
    const sid = ex.wl_create_surface(nextKind++ % 3);
    announceEl.textContent = sid
      ? `Created wl_surface#${sid}`
      : "Surface limit reached";
  });

  document.getElementById("btn-close-surface").addEventListener("click", () => {
    const focused = ex.wl_focused_surface_id();
    if (focused) {
      ex.wl_close_surface(focused);
      announceEl.textContent = `Destroyed wl_surface#${focused}`;
    }
  });

  document.getElementById("btn-sync").addEventListener("click", () => {
    const cb = ex.wl_dispatch_client_wire(1, 0, 0, 0);
    announceEl.textContent = `wl_display.sync -> wl_callback#${cb}.done`;
  });

  document.querySelectorAll("[data-layout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = Number(btn.getAttribute("data-layout"));
      ex.wl_set_layout(mode);
      announceEl.textContent = `Layout switched to ${LAYOUT_NAMES[mode]}`;
    });
  });

  requestAnimationFrame(renderFrame);
}

main().catch((err) => {
  const statusEl = document.getElementById("wl-status");
  if (statusEl) statusEl.textContent = `Wasm init failed: ${err.message}`;
});
