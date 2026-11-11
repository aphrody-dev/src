# Sovereign Lua 5.2 Engineering & Ecosystem Atlas

This document is the canonical reference for Lua 5.2 integration across the sovereign monorepo (`crates/depot`, `apps/rosegriffon`, `packages/bun-plugins`).

---

## 1. Lua 5.2 Architecture & Specifications

Lua 5.2 (PUC-Rio, release 5.2.4) is the benchmark version for deterministic register-based script execution, chosen in production game engines (such as Level-5 *Lives* in Inazuma Eleven) and high-reliability embedded systems.

### Key Architectural Evolution

1. **`_ENV` Lexical Scope**:
   In Lua 5.1, global variables resided in an environment table associated with the running function or thread via `setfenv`/`getfenv`. In Lua 5.2, `setfenv` and `getfenv` were eliminated. Instead, every chunk is compiled inside an implicit upvalue named `_ENV`. Any reference to a free variable `name` is compiled as `_ENV.name`.

2. **The `goto` and `::label::` Statement**:
   Enables structured state machines and lexically checked jumps without introducing arbitrary spaghetti transitions. A `goto` cannot jump into the scope of a local variable or into another function.

3. **Built-in `bit32` Library**:
   Official 32-bit bitwise library (`band`, `bor`, `bxor`, `bnot`, `lshift`, `rshift`, `arshift`) ensuring cross-platform bitwise parity without external C modules.

4. **Table & Coroutine Improvements**:
   - `table.pack(...)` stores arguments and provides field `n` holding the total parameter count.
   - `table.unpack(t, i, j)` replaced the global `unpack`.
   - `__pairs` and `__ipairs` metamethods for custom table iteration.
   - Coroutine yield through protected calls (`pcall` and `xpcall` can yield in Lua 5.2).

---

## 2. Awesome Lua 5.2 / Luau Sovereign Curated Stack

### Runtimes & Interpreters
- **PUC-Rio Lua 5.2.4**: Canonical ANSI C reference implementation (`lundump.c`, `lvm.c`).
- **mlua (Rust)**: High-performance Rust bindings supporting `features = ["lua52", "vendored"]`.
- **Luau**: Roblox's typed, backward-compatible derivative inheriting Lua 5.2 syntax (`_ENV`, `bit32`) with gradual typing and AOT execution.

### Tooling & Analysis
- **Tree-Sitter Lua**: Incremental polyglot AST parser grammar (`tree-sitter-lua = "0.2.0"` / `"0.5.0"`).
- **Depot RE Engine**: Pure Rust zero-subprocess bytecode disassembler and AST extractor (`depot ast`, `depot re`).
- **Aphrody Nie-Lua**: Production bytecode decoder and menu runtime runner for compiled Level-5 chunks (`apps/rosegriffon/crates/aphrody-nie-lua`).

---

## 3. Lua 5.2 Bytecode Anatomy (40 Opcodes)

Compiled Lua 5.2 chunks carry the `\x1bLua\x52` header. Instructions are 32 bits wide, encoded in one of four modes:
- `ABC`: `opcode (6 bits) | a (8 bits) | c (9 bits) | b (9 bits)`
- `ABx`: `opcode (6 bits) | a (8 bits) | bx (18 bits unsigned)`
- `AsBx`: `opcode (6 bits) | a (8 bits) | sbx (18 bits signed, bias 131,071)`
- `Ax`: `opcode (6 bits) | ax (26 bits unsigned)`

### Complete Opcode Table
| Opcode | Name | Mode | Semantics |
|---|---|---|---|
| 0 | `MOVE` | ABC | `R(A) := R(B)` |
| 1 | `LOADK` | ABx | `R(A) := Kst(Bx)` |
| 2 | `LOADKX` | ABx | `R(A) := Kst(extra arg)` |
| 3 | `LOADBOOL` | ABC | `R(A) := (Bool)B; if (C) pc++` |
| 4 | `LOADNIL` | ABC | `R(A), R(A+1), ..., R(A+B) := nil` |
| 5 | `GETUPVAL` | ABC | `R(A) := UpValue[B]` |
| 6 | `GETTABUP` | ABC | `R(A) := UpValue[B][RK(C)]` (Globals) |
| 7 | `GETTABLE` | ABC | `R(A) := R(B)[RK(C)]` |
| 8 | `SETTABUP` | ABC | `UpValue[A][RK(B)] := RK(C)` (Globals) |
| 9 | `SETUPVAL` | ABC | `UpValue[B] := R(A)` |
| 10 | `SETTABLE` | ABC | `R(A)[RK(B)] := RK(C)` |
| 11 | `NEWTABLE` | ABC | `R(A) := {} (size = B,C)` |
| 12 | `SELF` | ABC | `R(A+1) := R(B); R(A) := R(B)[RK(C)]` |
| 13 | `ADD` | ABC | `R(A) := RK(B) + RK(C)` |
| 14 | `SUB` | ABC | `R(A) := RK(B) - RK(C)` |
| 15 | `MUL` | ABC | `R(A) := RK(B) * RK(C)` |
| 16 | `DIV` | ABC | `R(A) := RK(B) / RK(C)` |
| 17 | `MOD` | ABC | `R(A) := RK(B) % RK(C)` |
| 18 | `POW` | ABC | `R(A) := RK(B) ^ RK(C)` |
| 19 | `UNM` | ABC | `R(A) := -R(B)` |
| 20 | `NOT` | ABC | `R(A) := not R(B)` |
| 21 | `LEN` | ABC | `R(A) := length of R(B)` |
| 22 | `CONCAT` | ABC | `R(A) := R(B).. ... ..R(C)` |
| 23 | `JMP` | AsBx | `pc += sBx; if (A) close_upvalues(A-1)` |
| 24 | `EQ` | ABC | `if ((RK(B) == RK(C)) ~= A) pc++` |
| 25 | `LT` | ABC | `if ((RK(B) <  RK(C)) ~= A) pc++` |
| 26 | `LE` | ABC | `if ((RK(B) <= RK(C)) ~= A) pc++` |
| 27 | `TEST` | ABC | `if not (R(A) <=> C) pc++` |
| 28 | `TESTSET` | ABC | `if (R(B) <=> C) { R(A) := R(B) } else pc++` |
| 29 | `CALL` | ABC | `R(A), ... ,R(A+C-2) := R(A)(R(A+1), ... ,R(A+B-1))` |
| 30 | `TAILCALL` | ABC | `return R(A)(R(A+1), ... ,R(A+B-1))` |
| 31 | `RETURN` | ABC | `return R(A), ... ,R(A+B-2)` |
| 32 | `FORLOOP` | AsBx | `R(A)+=R(A+2); if R(A) <?= R(A+1) { pc+=sBx; R(A+3)=R(A) }` |
| 33 | `FORPREP` | AsBx | `R(A)-=R(A+2); pc+=sBx` |
| 34 | `TFORCALL` | ABC | `R(A+3), ... ,R(A+2+C) := R(A)(R(A+1), R(A+2))` |
| 35 | `TFORLOOP` | AsBx | `if R(A+1) ~= nil { R(A)=R(A+1); pc += sBx }` |
| 36 | `SETLIST` | ABC | `R(A)[(C-1)*FPF+i] := R(A+i), 1 <= i <= B` |
| 37 | `CLOSURE` | ABx | `R(A) := closure(KPROTO[Bx])` |
| 38 | `VARARG` | ABC | `R(A), R(A+1), ..., R(A+B-2) = vararg` |
| 39 | `EXTRAARG` | Ax | `extra (larger) argument for previous opcode` |

---

## 4. Depot CLI Tooling Reference

```bash
# Extract Tree-sitter AST symbols from a Lua file
depot ast path/to/script.lua

# Triage and disassemble a compiled Lua 5.2 bytecode chunk
depot re path/to/script.lua.bin
```

---

## 5. Bun & Next.js Plugin Usage

### 5.1 Bun Plugin
```typescript
import { plugin } from "bun";
import { bunPluginLua } from "@rosegriffon/lua-plugin";

plugin(bunPluginLua());
```

### 5.2 Next.js Plugin
In `next.config.ts`:
```typescript
import { withLua } from "@rosegriffon/lua-plugin";

export default withLua({
  reactStrictMode: true,
});
```

---

## 6. WezTerm Tuning for Lua Gaming & Terminal Applications

WezTerm (`.wezterm.lua`) is a GPU-accelerated terminal emulator configured natively in Lua. By combining WebGPU hardware acceleration and raw keyboard protocols, it delivers sub-millisecond input latency for terminal games and Lua development.

### 6.1 Hardware & Display Directives
- **WebGPU on Discrete GPU**: `config.front_end = "WebGpu"` with `config.webgpu_power_preference = "HighPerformance"` (targets NVIDIA RTX 4070 Ada Lovelace `sm_89`).
- **High-Refresh Display**: `config.max_fps = 144` and `config.animation_fps = 120` bypass the default 60 FPS cap.
- **DWM Composition Bypass**: `config.win32_system_backdrop = "Disable"` prevents Windows Desktop Window Manager composition lag.
- **Custom Block Glyphs**: `config.custom_block_glyphs = true` ensures pixel-perfect rendering of half-block ANSI characters (`U+2580..U+259F`) directly in shader memory.
- **Zero Cursor Redraws**: `config.cursor_blink_rate = 0` eliminates periodic timer interrupts when idle.

### 6.2 Raw Input Protocols for Game Controls
- **Kitty Keyboard Protocol**: `config.enable_kitty_keyboard = true` distinguishes keydown, keyup, and key-repeat events for real-time controls (WASD, arrows, jump).
- **CSI u Key Encoding**: `config.enable_csi_u_key_encoding = true` handles chorded modifiers without ambiguity.
- **Fullscreen Action**: `F11` and `Alt+Enter` trigger `wezterm.action.ToggleFullScreen`.

---

## 7. Lua Game IDE Best Practices & Tooling Stack

### 7.1 Static Typing with LuaCATS & LuaLS
- **Class and Field Contracts**:
  ```lua
  ---@class Player
  ---@field entity Entity
  ---@field speed number
  ---@field health integer
  local Player = {}
  ```
- **Strict Data Schemas**: Protect item, enemy, and level configuration tables with `(exact)`:
  ```lua
  ---@class (exact) WeaponConfig
  ---@field damage number
  ---@field cooldown number
  ---@field projectile_speed number
  ```
- **Engine Stubs & Meta Definitions**:
  Mark definition files with `---@meta` (`types/bevy.d.lua`) to provide IDE autocompletion for host engine reflection without polluting runtime globals.

### 7.2 Tooling Integration
- **Linter**: `selene` for AST-level scope analysis and flagging undeclared variables.
- **Formatter**: `stylua` for zero-configuration, deterministic formatting.
- **Debugger**: Debug Adapter Protocol (DAP) via `local-lua-debugger-vscode` or `mobdebug`.
- **Hot Reload Architecture**: Decouple state from logic: persist entity variables in Rust ECS components or a dedicated `_STATE` table so reloading script files preserves active game sessions.

---

## 8. Bevy Engine Lua Plugin Architecture

### 8.1 Entity-Centric Script Component
Scripts attach directly to Bevy entities as components:
```rust
#[derive(Component)]
pub struct LuaScriptComponent {
    pub script_path: PathBuf,
    pub is_initialized: bool,
    pub reload_generation: u32,
}
```

### 8.2 Reflection Bridge (`bevy_reflect`)
Expose custom game components to Lua without manual FFI bindings:
```rust
#[derive(Component, Reflect, Default)]
#[reflect(Component)]
pub struct Transform2D {
    pub x: f32,
    pub y: f32,
}

// In Bevy App setup:
app.register_type::<Transform2D>();
```

### 8.3 Script Lifecycle Execution
- `on_init(event)`: Called once when the entity is spawned or script is loaded.
- `on_update(event)`: Called every frame in the Bevy update schedule with `delta_time`.
- `on_collision(event)`: Dispatched when physics collision pairs are detected.

