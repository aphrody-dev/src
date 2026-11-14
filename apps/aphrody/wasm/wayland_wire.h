#ifndef APHRODY_WAYLAND_WIRE_H
#define APHRODY_WAYLAND_WIRE_H

typedef unsigned char      uint8_t;
typedef signed int         int32_t;
typedef unsigned int       uint32_t;
typedef unsigned int       uintptr_t;
typedef unsigned long long uint64_t;
typedef unsigned long      size_t;

#define WL_ALIGN4(n) (((n) + 3u) & ~3u)
#define WL_PACK_SIZE_OPCODE(size_bytes, opcode) \
  ((((uint32_t)(size_bytes) & 0xFFFFu) << 16) | ((uint32_t)(opcode) & 0xFFFFu))

/* Core object IDs and protocol opcodes aligned with third_party/wayland/protocol/wayland.xml */
enum {
  WL_DISPLAY_ID = 1u,
  WL_REGISTRY_ID = 2u,
  WL_COMPOSITOR_ID = 3u,
  WL_SHM_ID = 4u,
  WL_SEAT_ID = 5u,
  WL_OUTPUT_ID = 6u,
  WL_SUBCOMPOSITOR_ID = 7u
};

/* wl_display (v1) */
enum {
  WL_DISPLAY_SYNC = 0u,
  WL_DISPLAY_GET_REGISTRY = 1u,
  WL_DISPLAY_EVENT_ERROR = 0u,
  WL_DISPLAY_EVENT_DELETE_ID = 1u
};

/* wl_registry (v1) */
enum {
  WL_REGISTRY_BIND = 0u,
  WL_REGISTRY_EVENT_GLOBAL = 0u,
  WL_REGISTRY_EVENT_GLOBAL_REMOVE = 1u
};

/* wl_callback (v1) */
enum {
  WL_CALLBACK_EVENT_DONE = 0u
};

/* wl_compositor (v7) */
enum {
  WL_COMPOSITOR_CREATE_SURFACE = 0u,
  WL_COMPOSITOR_CREATE_REGION = 1u
};

/* wl_shm (v3) */
enum {
  WL_SHM_CREATE_POOL = 0u,
  WL_SHM_EVENT_FORMAT = 0u,
  WL_SHM_FORMAT_ARGB8888 = 0u,
  WL_SHM_FORMAT_XRGB8888 = 1u
};

/* wl_shm_pool (v3) */
enum {
  WL_SHM_POOL_CREATE_BUFFER = 0u,
  WL_SHM_POOL_DESTROY = 1u,
  WL_SHM_POOL_RESIZE = 2u
};

/* wl_buffer (v1) */
enum {
  WL_BUFFER_DESTROY = 0u,
  WL_BUFFER_EVENT_RELEASE = 0u
};

/* wl_surface (v7) */
enum {
  WL_SURFACE_DESTROY = 0u,
  WL_SURFACE_ATTACH = 1u,
  WL_SURFACE_DAMAGE = 2u,
  WL_SURFACE_FRAME = 3u,
  WL_SURFACE_SET_OPAQUE_REGION = 4u,
  WL_SURFACE_SET_INPUT_REGION = 5u,
  WL_SURFACE_COMMIT = 6u,
  WL_SURFACE_DAMAGE_BUFFER = 9u
};

/* wl_seat (v11) */
enum {
  WL_SEAT_GET_POINTER = 0u,
  WL_SEAT_GET_KEYBOARD = 1u,
  WL_SEAT_GET_TOUCH = 2u,
  WL_SEAT_CAP_POINTER = 1u,
  WL_SEAT_CAP_KEYBOARD = 2u
};

/* wl_pointer (v11) */
enum {
  WL_POINTER_EVENT_ENTER = 0u,
  WL_POINTER_EVENT_LEAVE = 1u,
  WL_POINTER_EVENT_MOTION = 2u,
  WL_POINTER_EVENT_BUTTON = 3u,
  WL_POINTER_EVENT_FRAME = 5u
};

/* wl_keyboard (v11) */
enum {
  WL_KEYBOARD_EVENT_KEY = 3u,
  WL_KEYBOARD_EVENT_MODIFIERS = 4u
};

/* Layout modes aligned with figma-mockup.json WaylandSurfaceSlot variants */
enum {
  WL_LAYOUT_DWINDLE_MASTER = 0u,
  WL_LAYOUT_DWINDLE_STACK  = 1u,
  WL_LAYOUT_MONOCLE        = 2u
};

/* Wire message direction */
enum {
  WL_DIR_C2S = 0u, /* client -> server request */
  WL_DIR_S2C = 1u  /* server -> client event */
};

typedef struct {
  uint32_t seq;
  uint32_t direction;
  uint32_t object_id;
  uint32_t size_opcode;
  uint32_t arg0;
  uint32_t arg1;
  uint32_t arg2;
  uint32_t timestamp_ms;
} wl_wire_record_t;

#endif /* APHRODY_WAYLAND_WIRE_H */
