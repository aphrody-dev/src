---
name: rea-ghidra-sre
description: Pure-Rust Ghidra SRE + REA + mingw-w64-rea fork clean-room reverse-engineering suite (PE/ELF/Mach-O loader, MinGW CRT noise stripper, automated PE64 proxy/hook DLL builder, iced-x86 CFG, P-Code lifter, Pseudo-C decompiler).
---

# `rea-ghidra` + `mingw-w64-rea` Pure-Rust Reverse Engineering & Automation Skill

Activate this skill when inspecting native binaries (`.exe`, `.dll`, `.so`, `.dylib`, `.node`), stripping MinGW-w64 CRT startup/pseudo-reloc noise, synthesizing instrumented PE64 proxy/hook DLLs, or lifting Ghidra P-Code & Pseudo-C.

## Execution Paths
- **Native Rust Ghidra Decompiler (`< 5ms`)**:
  ```powershell
  n2b ghidra C:\Users\aphro\.local\bin\n2b.exe --max-functions 8 --json
  ```
- **Sovereign `mingw-w64-rea` Fork (`sovereign-rea-opt`) Automation**:
  ```powershell
  n2b mingw doctor
  n2b mingw audit --binary C:\Users\aphro\.local\bin\n2b_ffi.dll
  n2b mingw proxy-dll --binary C:\src\third_party\n2b\migrations\ue58-sovereign\rust-kernel\target\release\ue58_rust_kernel.dll
  ```
- **MCP Server (`sovereign-n2b-rea-ghidra`, 8 tools)**:
  Exposes `rea_ghidra_decompile`, `rea_mingw_optimize`, `n2b_dotnet_interop`, `n2b_scan_monorepo`, `n2b_search_ripgrep`, `n2b_polyglot_ast`, `n2b_migrate_project`, and `n2b_llvm_ir_analyze` (`bun run C:/src/third_party/n2b/src/mcp.ts`).
