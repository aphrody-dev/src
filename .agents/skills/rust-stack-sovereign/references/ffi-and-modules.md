# `rust_stack_ffi.dll` C-ABI Export Table

Located at `C:\Users\aphro\.local\bin\rust_stack_ffi.dll` (compiled with `opt-level = 3`, `lto = "fat"`, `codegen-units = 1`, `panic = "abort"`).

| Exported Symbol | Signature | Purpose |
| :--- | :--- | :--- |
| `rs_abi_version` | `() -> u32` | Returns ABI contract version (`1`) |
| `rs_blake3_hex` | `(ptr: *const u8, len: usize, out: *mut u8, out_cap: usize) -> i32` | Writes 64-byte lowercase hex Blake3 digest (~228 ns/call) |
| `rs_auth_issue_jwt` | `(sub: *const u8, sub_len: usize, secret: *const u8, sec_len: usize, ttl_secs: u64, out: *mut u8, out_cap: usize) -> i32` | Issues signed HMAC-SHA256 JWT |
| `rs_auth_verify_jwt` | `(tok: *const u8, tok_len: usize, secret: *const u8, sec_len: usize) -> i32` | Constant-time signature + expiry verification (`1` valid, `0` invalid) |
| `rs_ui_render_card` | `(title: *const u8, t_len: usize, body: *const u8, b_len: usize, out: *mut u8, out_cap: usize) -> i32` | Renders HTML-escaped `shadcn_rs` SSR card |
