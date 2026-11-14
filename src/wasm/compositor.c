#include "wayland_wire.h"

#define WL_MAX_WIDTH       960u
#define WL_MAX_HEIGHT      540u
#define WL_MAX_SURFACES    12u
#define WL_WIRE_LOG_CAP    64u

#define WASM_EXPORT(name) __attribute__((export_name(name)))

typedef struct {
  uint32_t active;
  uint32_t surface_id;
  uint32_t buffer_id;
  uint32_t pool_id;
  uint32_t kind;     /* 0=compositor, 1=terminal, 2=gpu-viewport, 3=inspector */
  uint32_t x;
  uint32_t y;
  uint32_t w;
  uint32_t h;
  uint32_t damage_x;
  uint32_t damage_y;
  uint32_t damage_w;
  uint32_t damage_h;
  uint32_t commits;
  uint32_t accent_rgba;
} wl_surface_state_t;

static uint32_t g_width = 720u;
static uint32_t g_height = 420u;
static uint32_t g_framebuffer[WL_MAX_WIDTH * WL_MAX_HEIGHT];

static wl_surface_state_t g_surfaces[WL_MAX_SURFACES];
static wl_wire_record_t   g_wire_log[WL_WIRE_LOG_CAP];

static uint32_t g_wire_seq = 0u;
static uint32_t g_next_object_id = 10u;
static uint32_t g_focused_surface = 0u;
static uint32_t g_layout_mode = WL_LAYOUT_DWINDLE_MASTER;
static uint32_t g_pointer_x = 360u;
static uint32_t g_pointer_y = 210u;
static uint32_t g_pointer_down = 0u;
static uint32_t g_last_time_ms = 0u;
static uint32_t g_dark_mode = 1u;

/* M3 tokens from packages/design/tokens/tokens.css (seed #135B82, MCU 0.4.0 vibrant; packed ABGR) */
static uint32_t pack_rgba(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  return ((uint32_t)a << 24) | ((uint32_t)b << 16) | ((uint32_t)g << 8) | (uint32_t)r;
}

static uint32_t color_surface(void) {
  return g_dark_mode ? pack_rgba(0x0C, 0x14, 0x1B, 0xFF) : pack_rgba(0xF6, 0xFA, 0xFF, 0xFF);
}

static uint32_t color_surface_container(void) {
  return g_dark_mode ? pack_rgba(0x18, 0x21, 0x27, 0xFF) : pack_rgba(0xE6, 0xEF, 0xF8, 0xFF);
}

static uint32_t color_surface_container_low(void) {
  return g_dark_mode ? pack_rgba(0x14, 0x1D, 0x23, 0xFF) : pack_rgba(0xEC, 0xF5, 0xFE, 0xFF);
}

static uint32_t color_primary(void) {
  return g_dark_mode ? pack_rgba(0x8B, 0xCE, 0xFF, 0xFF) : pack_rgba(0x00, 0x64, 0x92, 0xFF);
}

static uint32_t color_outline(void) {
  return g_dark_mode ? pack_rgba(0x3D, 0x48, 0x51, 0xFF) : pack_rgba(0xBC, 0xC8, 0xD3, 0xFF);
}

static uint32_t color_bolt(void) {
  return pack_rgba(0xD1, 0xD2, 0x93, 0xFF);
}

static uint32_t color_text_muted(void) {
  return g_dark_mode ? pack_rgba(0xBC, 0xC8, 0xD3, 0xFF) : pack_rgba(0x3D, 0x48, 0x51, 0xFF);
}

static void emit_wire(uint32_t dir, uint32_t object_id, uint32_t size_bytes, uint32_t opcode, uint32_t arg0, uint32_t arg1, uint32_t arg2) {
  uint32_t idx = g_wire_seq % WL_WIRE_LOG_CAP;
  g_wire_seq++;
  g_wire_log[idx].seq = g_wire_seq;
  g_wire_log[idx].direction = dir;
  g_wire_log[idx].object_id = object_id;
  g_wire_log[idx].size_opcode = WL_PACK_SIZE_OPCODE(WL_ALIGN4(size_bytes), opcode);
  g_wire_log[idx].arg0 = arg0;
  g_wire_log[idx].arg1 = arg1;
  g_wire_log[idx].arg2 = arg2;
  g_wire_log[idx].timestamp_ms = g_last_time_ms;
}

static void fill_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t rgba) {
  uint32_t x_end = (x + w > g_width) ? g_width : (x + w);
  uint32_t y_end = (y + h > g_height) ? g_height : (y + h);
  for (uint32_t py = y; py < y_end; ++py) {
    uint32_t row = py * g_width;
    for (uint32_t px = x; px < x_end; ++px) {
      g_framebuffer[row + px] = rgba;
    }
  }
}

static void stroke_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t thickness, uint32_t rgba) {
  if (w < thickness * 2u || h < thickness * 2u) return;
  fill_rect(x, y, w, thickness, rgba);
  fill_rect(x, y + h - thickness, w, thickness, rgba);
  fill_rect(x, y, thickness, h, rgba);
  fill_rect(x + w - thickness, y, thickness, h, rgba);
}

static uint32_t count_active_surfaces(void) {
  uint32_t count = 0u;
  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    if (g_surfaces[i].active) count++;
  }
  return count;
}

static void recompute_layout(void) {
  uint32_t active_indices[WL_MAX_SURFACES];
  uint32_t n = 0u;
  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    if (g_surfaces[i].active) {
      active_indices[n++] = i;
    }
  }
  if (n == 0u) return;

  const uint32_t pad = 12u;
  const uint32_t gap = 10u;
  const uint32_t usable_w = (g_width > pad * 2u) ? (g_width - pad * 2u) : g_width;
  const uint32_t usable_h = (g_height > pad * 2u) ? (g_height - pad * 2u) : g_height;

  if (g_layout_mode == WL_LAYOUT_MONOCLE || n == 1u) {
    for (uint32_t k = 0u; k < n; ++k) {
      wl_surface_state_t *s = &g_surfaces[active_indices[k]];
      s->x = pad;
      s->y = pad;
      s->w = usable_w;
      s->h = usable_h;
    }
    return;
  }

  if (g_layout_mode == WL_LAYOUT_DWINDLE_STACK) {
    uint32_t row_h = (usable_h - gap * (n - 1u)) / n;
    for (uint32_t k = 0u; k < n; ++k) {
      wl_surface_state_t *s = &g_surfaces[active_indices[k]];
      s->x = pad;
      s->y = pad + k * (row_h + gap);
      s->w = usable_w;
      s->h = (k + 1u == n) ? (pad + usable_h - s->y) : row_h;
    }
    return;
  }

  /* WL_LAYOUT_DWINDLE_MASTER: left master + right stack */
  uint32_t master_w = (usable_w - gap) * 55u / 100u;
  uint32_t stack_x = pad + master_w + gap;
  uint32_t stack_w = usable_w - master_w - gap;

  wl_surface_state_t *master = &g_surfaces[active_indices[0]];
  master->x = pad;
  master->y = pad;
  master->w = master_w;
  master->h = usable_h;

  uint32_t stack_n = n - 1u;
  uint32_t stack_h = (usable_h - gap * (stack_n - 1u)) / stack_n;
  for (uint32_t k = 1u; k < n; ++k) {
    wl_surface_state_t *s = &g_surfaces[active_indices[k]];
    uint32_t idx = k - 1u;
    s->x = stack_x;
    s->y = pad + idx * (stack_h + gap);
    s->w = stack_w;
    s->h = (k + 1u == n) ? (pad + usable_h - s->y) : stack_h;
  }
}

static void render_surface_content(const wl_surface_state_t *s, uint32_t time_ms) {
  uint32_t is_focused = (s->surface_id == g_focused_surface);
  uint32_t bg = is_focused ? color_surface_container() : color_surface_container_low();
  uint32_t border = is_focused ? color_primary() : color_outline();

  fill_rect(s->x, s->y, s->w, s->h, bg);
  stroke_rect(s->x, s->y, s->w, s->h, is_focused ? 2u : 1u, border);

  /* Titlebar strip */
  uint32_t bar_h = (s->h > 32u) ? 24u : 12u;
  fill_rect(s->x + 2u, s->y + 2u, (s->w > 4u) ? (s->w - 4u) : s->w, bar_h, s->accent_rgba);

  /* Active status indicator dot */
  if (s->w > 24u && bar_h >= 12u) {
    fill_rect(s->x + 10u, s->y + 9u, 8u, 8u, is_focused ? color_bolt() : color_text_muted());
  }

  /* Animated Wayland shm buffer scanline / damage visualizer inside surface */
  if (s->w > 28u && s->h > bar_h + 24u) {
    uint32_t inner_x = s->x + 12u;
    uint32_t inner_y = s->y + bar_h + 12u;
    uint32_t inner_w = s->w - 24u;
    uint32_t inner_h = s->h - bar_h - 24u;

    uint32_t pulse = ((time_ms / 16u) + s->surface_id * 19u) % (inner_w > 8u ? inner_w : 8u);
    uint32_t bar_w = inner_w / 3u;
    if (bar_w < 12u) bar_w = 12u;
    if (pulse + bar_w > inner_w) bar_w = inner_w - pulse;

    /* Simulated terminal/viewport rows */
    uint32_t rows = inner_h / 14u;
    if (rows > 6u) rows = 6u;
    for (uint32_t r = 0u; r < rows; ++r) {
      uint32_t ry = inner_y + r * 14u;
      uint32_t rw = ((inner_w * (40u + ((r * 23u + s->kind * 17u) % 55u))) / 100u);
      fill_rect(inner_x, ry, rw, 6u, (r == 0u && is_focused) ? color_primary() : color_outline());
    }

    /* Live wl_surface.damage_buffer highlight rect */
    if (inner_h > 20u) {
      stroke_rect(inner_x + pulse, inner_y + inner_h - 14u, bar_w, 10u, 1u, color_bolt());
    }
  }
}

WASM_EXPORT("wl_init")
uint32_t wl_init(uint32_t width, uint32_t height) {
  g_width = (width > WL_MAX_WIDTH) ? WL_MAX_WIDTH : (width < 160u ? 160u : width);
  g_height = (height > WL_MAX_HEIGHT) ? WL_MAX_HEIGHT : (height < 120u ? 120u : height);
  g_wire_seq = 0u;
  g_next_object_id = 10u;
  g_focused_surface = 0u;
  g_layout_mode = WL_LAYOUT_DWINDLE_MASTER;

  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    g_surfaces[i].active = 0u;
  }

  /* Initial Wayland handshake aligned with wayland.xml */
  emit_wire(WL_DIR_C2S, WL_DISPLAY_ID, 12u, WL_DISPLAY_GET_REGISTRY, WL_REGISTRY_ID, 0u, 0u);
  emit_wire(WL_DIR_S2C, WL_REGISTRY_ID, 24u, WL_REGISTRY_EVENT_GLOBAL, 1u, 7u, 0u); /* wl_compositor v7 */
  emit_wire(WL_DIR_S2C, WL_REGISTRY_ID, 20u, WL_REGISTRY_EVENT_GLOBAL, 2u, 3u, 0u); /* wl_shm v3 */
  emit_wire(WL_DIR_S2C, WL_REGISTRY_ID, 20u, WL_REGISTRY_EVENT_GLOBAL, 3u, 11u, 0u); /* wl_seat v11 */
  emit_wire(WL_DIR_S2C, WL_SHM_ID, 12u, WL_SHM_EVENT_FORMAT, WL_SHM_FORMAT_ARGB8888, 0u, 0u);
  emit_wire(WL_DIR_S2C, WL_SHM_ID, 12u, WL_SHM_EVENT_FORMAT, WL_SHM_FORMAT_XRGB8888, 0u, 0u);

  return 1u;
}

WASM_EXPORT("wl_create_surface")
uint32_t wl_create_surface(uint32_t kind) {
  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    if (!g_surfaces[i].active) {
      uint32_t sid = g_next_object_id++;
      uint32_t pid = g_next_object_id++;
      uint32_t bid = g_next_object_id++;

      g_surfaces[i].active = 1u;
      g_surfaces[i].surface_id = sid;
      g_surfaces[i].pool_id = pid;
      g_surfaces[i].buffer_id = bid;
      g_surfaces[i].kind = kind & 3u;
      g_surfaces[i].commits = 1u;
      g_surfaces[i].accent_rgba = (kind == 1u)
        ? pack_rgba(0x12, 0x42, 0xFF, 0x38)
        : (kind == 2u ? pack_rgba(0xFF, 0xB3, 0x00, 0x38) : pack_rgba(0x52, 0x5E, 0x92, 0x38));

      emit_wire(WL_DIR_C2S, WL_COMPOSITOR_ID, 12u, WL_COMPOSITOR_CREATE_SURFACE, sid, 0u, 0u);
      emit_wire(WL_DIR_C2S, WL_SHM_ID, 16u, WL_SHM_CREATE_POOL, pid, 65536u, 0u);
      emit_wire(WL_DIR_C2S, pid, 32u, WL_SHM_POOL_CREATE_BUFFER, bid, 320u, 200u);
      emit_wire(WL_DIR_C2S, sid, 20u, WL_SURFACE_ATTACH, bid, 0u, 0u);
      emit_wire(WL_DIR_C2S, sid, 24u, WL_SURFACE_DAMAGE_BUFFER, 0u, 0u, 320u);
      emit_wire(WL_DIR_C2S, sid, 8u, WL_SURFACE_COMMIT, 0u, 0u, 0u);

      g_focused_surface = sid;
      recompute_layout();
      return sid;
    }
  }
  return 0u;
}

WASM_EXPORT("wl_close_surface")
uint32_t wl_close_surface(uint32_t surface_id) {
  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    if (g_surfaces[i].active && g_surfaces[i].surface_id == surface_id) {
      emit_wire(WL_DIR_C2S, surface_id, 8u, WL_SURFACE_DESTROY, 0u, 0u, 0u);
      emit_wire(WL_DIR_C2S, g_surfaces[i].buffer_id, 8u, WL_BUFFER_DESTROY, 0u, 0u, 0u);
      emit_wire(WL_DIR_C2S, g_surfaces[i].pool_id, 8u, WL_SHM_POOL_DESTROY, 0u, 0u, 0u);
      emit_wire(WL_DIR_S2C, WL_DISPLAY_ID, 12u, WL_DISPLAY_EVENT_DELETE_ID, surface_id, 0u, 0u);
      g_surfaces[i].active = 0u;

      if (g_focused_surface == surface_id) {
        g_focused_surface = 0u;
        for (uint32_t j = 0u; j < WL_MAX_SURFACES; ++j) {
          if (g_surfaces[j].active) {
            g_focused_surface = g_surfaces[j].surface_id;
            break;
          }
        }
      }
      recompute_layout();
      return 1u;
    }
  }
  return 0u;
}

WASM_EXPORT("wl_set_layout")
void wl_set_layout(uint32_t layout_mode) {
  g_layout_mode = layout_mode % 3u;
  recompute_layout();
}

WASM_EXPORT("wl_set_dark_mode")
void wl_set_dark_mode(uint32_t dark_mode) {
  g_dark_mode = dark_mode ? 1u : 0u;
}

WASM_EXPORT("wl_pointer_motion")
void wl_pointer_motion(uint32_t x, uint32_t y) {
  g_pointer_x = (x >= g_width) ? (g_width - 1u) : x;
  g_pointer_y = (y >= g_height) ? (g_height - 1u) : y;
  emit_wire(WL_DIR_S2C, WL_SEAT_ID, 20u, WL_POINTER_EVENT_MOTION, g_last_time_ms, g_pointer_x, g_pointer_y);
}

WASM_EXPORT("wl_pointer_button")
uint32_t wl_pointer_button(uint32_t button, uint32_t pressed) {
  g_pointer_down = pressed ? 1u : 0u;
  if (pressed) {
    for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
      wl_surface_state_t *s = &g_surfaces[i];
      if (s->active &&
          g_pointer_x >= s->x && g_pointer_x < s->x + s->w &&
          g_pointer_y >= s->y && g_pointer_y < s->y + s->h) {
        g_focused_surface = s->surface_id;
        s->commits++;
        emit_wire(WL_DIR_S2C, WL_SEAT_ID, 24u, WL_POINTER_EVENT_ENTER, s->surface_id, g_pointer_x, g_pointer_y);
        break;
      }
    }
  }
  emit_wire(WL_DIR_S2C, WL_SEAT_ID, 24u, WL_POINTER_EVENT_BUTTON, button, pressed, g_focused_surface);
  emit_wire(WL_DIR_S2C, WL_SEAT_ID, 8u, WL_POINTER_EVENT_FRAME, 0u, 0u, 0u);
  return g_focused_surface;
}

WASM_EXPORT("wl_key_event")
void wl_key_event(uint32_t keycode, uint32_t pressed) {
  emit_wire(WL_DIR_S2C, WL_SEAT_ID, 24u, WL_KEYBOARD_EVENT_KEY, g_last_time_ms, keycode, pressed);
}

WASM_EXPORT("wl_dispatch_client_wire")
uint32_t wl_dispatch_client_wire(uint32_t object_id, uint32_t opcode, uint32_t arg0, uint32_t arg1) {
  emit_wire(WL_DIR_C2S, object_id, 16u, opcode, arg0, arg1, 0u);
  if (object_id == WL_DISPLAY_ID && opcode == WL_DISPLAY_SYNC) {
    uint32_t cb = arg0 ? arg0 : g_next_object_id++;
    emit_wire(WL_DIR_S2C, cb, 12u, WL_CALLBACK_EVENT_DONE, g_last_time_ms, 0u, 0u);
    return cb;
  }
  return g_wire_seq;
}

WASM_EXPORT("wl_tick")
void wl_tick(uint32_t time_ms) {
  g_last_time_ms = time_ms;
  fill_rect(0u, 0u, g_width, g_height, color_surface());

  for (uint32_t i = 0u; i < WL_MAX_SURFACES; ++i) {
    if (g_surfaces[i].active) {
      if (g_layout_mode == WL_LAYOUT_MONOCLE && g_surfaces[i].surface_id != g_focused_surface) {
        continue;
      }
      render_surface_content(&g_surfaces[i], time_ms);
    }
  }

  /* Wayland pointer cursor crosshair */
  uint32_t cx = (g_pointer_x > 4u) ? (g_pointer_x - 4u) : 0u;
  uint32_t cy = (g_pointer_y > 4u) ? (g_pointer_y - 4u) : 0u;
  fill_rect(cx, cy, 9u, 9u, g_pointer_down ? color_bolt() : color_primary());
}

WASM_EXPORT("wl_framebuffer_ptr")
uint32_t wl_framebuffer_ptr(void) {
  return (uint32_t)(uintptr_t)g_framebuffer;
}

WASM_EXPORT("wl_framebuffer_bytes")
uint32_t wl_framebuffer_bytes(void) {
  return g_width * g_height * 4u;
}

WASM_EXPORT("wl_width")
uint32_t wl_width(void) { return g_width; }

WASM_EXPORT("wl_height")
uint32_t wl_height(void) { return g_height; }

WASM_EXPORT("wl_wire_log_ptr")
uint32_t wl_wire_log_ptr(void) {
  return (uint32_t)(uintptr_t)g_wire_log;
}

WASM_EXPORT("wl_wire_log_cap")
uint32_t wl_wire_log_cap(void) { return WL_WIRE_LOG_CAP; }

WASM_EXPORT("wl_wire_total_messages")
uint32_t wl_wire_total_messages(void) { return g_wire_seq; }

WASM_EXPORT("wl_surface_count")
uint32_t wl_surface_count(void) { return count_active_surfaces(); }

WASM_EXPORT("wl_focused_surface_id")
uint32_t wl_focused_surface_id(void) { return g_focused_surface; }

WASM_EXPORT("wl_layout_mode")
uint32_t wl_layout_mode(void) { return g_layout_mode; }
