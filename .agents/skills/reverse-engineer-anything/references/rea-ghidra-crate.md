# In-house Rust Ghidra port (src/re) and MinGW noise stripping

Folded from the former rea-ghidra-sre skill. Use for in-repo native analysis with `ay re`; use the REA MCP workflow in SKILL.md for artifact/runtime evidence.

## Execution Paths

- **Native Rust Ghidra Decompiler & REA (`src/re` (`aphrody-re`) + `packages/core/src/re.ts`)**:
  ```powershell
  ay re --ghidra target/debug/ay.exe
  ```
- **MinGW-w64 CRT Noise Stripping (`aphrody_re::mingw` / `aphrody_ffi.dll` / `ai-os` `core_mingw_audit`)**:
  ```powershell
  ay re <path to aphrody_ffi.dll>
  ```
- **Unified Bun / Rust C-ABI Bridge (`packages/core/src/re.ts`, `src/ffi/src/re.rs`)**:
  Calls `aphrody_abi_version`, `aphrody_ghidra_decompile_json`, `aphrody_re_audit_json`, `aphrody_mingw_audit_json`, and `depot_dotnet_doctor_json` in `aphrody_ffi.dll`.
