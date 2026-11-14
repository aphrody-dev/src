---
name: lua52-engineering
description: End-to-end Lua 5.2 engineering reference covering PUC-Rio Lua 5.2.4 specifications, _ENV lexical scoping, bytecode structure, 40 opcodes, mlua Rust integration, Tree-sitter AST queries, REA disassembly, and Bun/Next.js plugins.
---

# Lua 5.2 Sovereign Engineering Reference

This skill guides development, reverse-engineering, AST analysis, and runtime embedding for **Lua 5.2.4 (PUC-Rio)** across the sovereign monorepo (`crates/depot`, `apps/rosegriffon`, `packages/bun-plugins`).

---

## 1. Lua 5.2 Language Architecture & Core Differences

Lua 5.2 represents the pinnacle of clean, register-based VM design with several pivotal advancements over Lua 5.1:

### 1.1 `_ENV` Lexical Scoping (Replaced `setfenv`/`getfenv`)

In Lua 5.2, global variables are no longer kept in a global environment table attached to the function/thread. Instead:

- Every chunk is compiled inside an implicit outer local variable named `_ENV`.
- Any free variable `x` is syntactic sugar for `_ENV.x`.
- Modules sandbox their code purely with lexical scoping:
  ```lua
  local _ENV = { print = print, math = math }
  -- Free variables now resolve strictly within this sandbox
  ```
- Functions `setfenv` and `getfenv` are completely removed.

### 1.2 `goto` and `::label::`

- Unconditional jump statement `goto label` jumping to `::label::`.
- Lexically scoped: cannot jump into the scope of a local variable or into another function.

### 1.3 Standard `bit32` Library

- Built-in 32-bit bitwise library: `bit32.band`, `bit32.bor`, `bit32.bxor`, `bit32.bnot`, `bit32.lshift`, `bit32.rshift`, `bit32.arshift`.

### 1.4 Table Utilities

- `table.pack(...)`: Returns a table with arguments and a field `n` holding the argument count (preserving `nil`s).
- `table.unpack(t, i, j)`: Replaced global `unpack()`.
- Metamethods `__pairs` and `__ipairs` allow overriding iteration.
- `rawlen(v)`: Returns length of string or table without triggering `__len`.

---

## 2. Lua 5.2 Bytecode Specification

Compiled Lua 5.2 chunks (`luac -o chunk.luac` or `.lua.bin`) follow the exact layout specified in `lundump.c`:

### 2.1 Chunk Header Layout

| Field                 | Size    | Description                                            |
| --------------------- | ------- | ------------------------------------------------------ |
| `signature`           | 4 bytes | `\x1bLua` (`0x1B 0x4C 0x75 0x61`)                      |
| `version`             | 1 byte  | `0x52` (Lua 5.2)                                       |
| `format`              | 1 byte  | `0x00` (Official format)                               |
| `luac_data`           | 6 bytes | `\x19\x93\r\n\x1a\n` (Endianness and conversion check) |
| `sizeof(int)`         | 1 byte  | Typically 4                                            |
| `sizeof(size_t)`      | 1 byte  | 4 (32-bit) or 8 (64-bit)                               |
| `sizeof(Instruction)` | 1 byte  | 4 (32-bit instruction word)                            |
| `sizeof(lua_Number)`  | 1 byte  | 8 (IEEE 754 double)                                    |
| `integral_flag`       | 1 byte  | 0 (floating point numbers)                             |

### 2.2 The 40 Lua 5.2 Opcodes

All instructions are 32 bits wide with 6-bit opcode:

- `MOVE` (0): Copy register to register.
- `LOADK` (1): Load constant from constant pool into register.
- `LOADKX` (2): Load constant indexed by following `EXTRAARG` instruction.
- `LOADBOOL` (3): Load boolean with optional skip.
- `LOADNIL` (4): Set range of registers to nil.
- `GETUPVAL` (5): Read upvalue into register.
- `GETTABUP` (6): `R(A) := Upvalue[B][RK(C)]` (Primary global lookup mechanism).
- `GETTABLE` (7): `R(A) := R(B)[RK(C)]`.
- `SETTABUP` (8): `Upvalue[A][RK(B)] := RK(C)` (Primary global write mechanism).
- `SETUPVAL` (9): `Upvalue[B] := R(A)`.
- `SETTABLE` (10): `R(A)[RK(B)] := RK(C)`.
- `NEWTABLE` (11): Allocate table with array and hash sizes.
- `SELF` (12): Method lookup: `R(A+1) := R(B); R(A) := R(B)[RK(C)]`.
- `ADD`..`POW` (13..18): Arithmetic operations: `R(A) := RK(B) op RK(C)`.
- `UNM`, `NOT`, `LEN` (19..21): Unary minus, logical not, table length.
- `CONCAT` (22): Concatenate contiguous registers `R(B)..R(C)`.
- `JMP` (23): Unconditional jump with signed offset `sBx`.
- `EQ`, `LT`, `LE` (24..26): Comparisons with conditional jump.
- `TEST`, `TESTSET` (27..28): Conditional register assignment.
- `CALL` (29): Function call `R(A)(R(A+1)..R(A+B-1))`.
- `TAILCALL` (30): Tail-call optimization.
- `RETURN` (31): Return results `R(A)..R(A+B-2)`.
- `FORLOOP`, `FORPREP` (32..33): Numeric for loops.
- `TFORCALL`, `TFORLOOP` (34..35): Generic iterator for loops.
- `SETLIST` (36): Populate array table with register slice.
- `CLOSURE` (37): Instantiate prototype closure.
- `VARARG` (38): Load variable arguments into registers.
- `EXTRAARG` (39): Extra 26-bit operand for `LOADKX` or `SETLIST`.

---

## 3. Rust Integration (`crates/depot` & `aphrody-nie-lua`)

### 3.1 MLua with Lua 5.2 Vendored

In `Cargo.toml`:

```toml
mlua = { version = "0.11", features = ["lua52", "vendored"] }
```

Creating a sandboxed runtime:

```rust
use mlua::Lua;

pub fn create_lua52_vm() -> Result<Lua, mlua::Error> {
    let lua = Lua::new();
    lua.load(r#"
        local bit32 = require("bit32")
        function hash(x) return bit32.bxor(x, 42) end
    "#).exec()?;
    Ok(lua)
}
```

### 3.2 Depot REA Bytecode Disassembler

Using `depot re <file.lua.bin>`:

- Parses header, endianness, types.
- Traverses prototype hierarchy.
- Resolves constant pool and upvalues.
- Outputs human-readable instruction listings with RK operand resolution.

---

## 4. Bun and Next.js Lua Plugins

### 4.1 Bun Plugin (`bun-plugin-lua`)

Enables importing `.lua` files directly in Bun applications:

```ts
import { plugin } from "bun";
import { runLua52 } from "@rosegriffon/lua-plugin";

plugin({
  name: "bun-plugin-lua",
  setup(build) {
    build.onLoad({ filter: /\.lua$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      return {
        contents: `export default ${JSON.stringify(source)};`,
        loader: "js",
      };
    });
  },
});
```

### 4.2 Next.js Plugin (`withLua`)

In `next.config.ts`:

```ts
import { withLua } from "@rosegriffon/lua-plugin";

const nextConfig = withLua({
  reactStrictMode: true,
});

export default nextConfig;
```

---

## 5. WezTerm Tuning for Lua Games & Terminal Applications

WezTerm (`.wezterm.lua`) is the premier GPU-accelerated terminal emulator configured via Lua. For low-latency terminal games and TUI development:

### 5.1 Hardware & Rendering Directives

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder and wezterm.config_builder() or {}

-- WebGPU Backend on Discrete High-Performance GPU (NVIDIA RTX 4070 Ada Lovelace)
config.front_end = 'WebGpu'
config.webgpu_power_preference = 'HighPerformance'
config.prefer_egl = true

-- Refresh Rates: Bypass 60 FPS Cap for Fluid 144Hz Animation
config.max_fps = 144
config.animation_fps = 120

-- Zero DWM Composition Latency
config.win32_system_backdrop = 'Disable'

-- Pixel-Perfect Block Elements for ANSI & Half-Block Retro Rendering
config.custom_block_glyphs = true

-- Eliminate Unnecessary Timer Redraws
config.cursor_blink_rate = 0
```

### 5.2 Input Latency & Raw Keyboard Protocols

Terminal games require real-time input distinction (keydown vs keyup, WASD directions, chorded modifiers):

```lua
-- Kitty Keyboard Protocol: Distinguishes press, release, and repeat states
config.enable_kitty_keyboard = true
config.enable_csi_u_key_encoding = true

-- Fullscreen Toggle for Immersive Gaming
config.keys = {
  { key = 'F11', action = wezterm.action.ToggleFullScreen },
}
```

---

## 6. Lua Game IDE Best Practices & Tooling Stack

### 6.1 Static Typing with LuaCATS & LuaLS (`lua-language-server`)

Dynamic Lua scripts in game engines require robust static typing without compilation overhead:

- **Classes and Fields**:
  ```lua
  ---@class Player
  ---@field entity Entity
  ---@field speed number
  ---@field health integer
  local Player = {}
  ```
- **Exact Configuration Tables**: Catch typo bugs in weapon and level configurations using `(exact)`:
  ```lua
  ---@class (exact) ItemConfig
  ---@field id string
  ---@field damage number
  ---@field cooldown number
  ```
- **Engine Stubs & Meta Definitions**:
  Create `types/bevy.d.lua` marked with `---@meta` to declare game engine global namespaces and reflection types so LuaLS provides accurate autocomplete without declaring runtime logic.

### 6.2 Linter, Formatter & Debugger Stack

- **Formatter**: `StyLua` (Rust-based opinionated formatter).
- **Linter**: `Selene` (Rust-based AST linter enforcing strict scoping rules and flagging accidental globals).
- **Debugger**: VSCode / OpenCode / Neovim DAP with `local-lua-debugger-vscode` or `mobdebug`.

### 6.3 State-Decoupled Hot Reload Architecture

When live-reloading Lua game scripts, avoid losing current world or player state:

- Store persistent gameplay variables (health, position, inventory) in engine ECS components or a dedicated `_STATE` table.
- Use Lua closures strictly for behavioral logic, state machine transitions, and event reactions.

---

## 7. Bevy Lua Engine Architecture (`bevy_mod_scripting` / `mlua`)

### 7.1 Entity-Centric Script Component Pattern

Attach scripts directly to Bevy entities as components:

```rust
#[derive(Component)]
pub struct LuaScriptComponent {
    pub script_path: PathBuf,
    pub is_initialized: bool,
}
```

### 7.2 Reflection Bridge (`bevy_reflect`)

Expose custom game components to Lua without manual FFI boilerplate:

```rust
#[derive(Component, Reflect, Default)]
#[reflect(Component)]
pub struct Transform2D {
    pub x: f32,
    pub y: f32,
}

// In Bevy App registration:
app.register_type::<Transform2D>();
```

### 7.3 Event-Driven Lifecycle Hooks

Lua scripts react to engine callbacks:

```lua
function on_init(ctx)
  print("Entity initialized:", ctx.entity_id)
end

function on_update(ctx)
  local transform = BevyWorld.get_component(ctx.entity_id, "Transform2D")
  if transform then
    transform.x = transform.x + (10.0 * ctx.delta_time)
  end
end
```
