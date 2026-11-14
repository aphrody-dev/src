// SPDX-License-Identifier: Apache-2.0 OR MIT
//! `n2b-dotnet`: Full Pure-Rust + Bun v1.4.4 rewrite of `microsoft/node-api-dotnet`.
//!
//! Replaces Node-API (`napi_env`, `napi_value`, `JSValueScope`, V8 handle scopes, `.node` C++ shims)
//! with three zero-overhead native subsystems:
//! 1. **`hostfxr` In-Process CoreCLR 10/11 Host (`host.rs`)**:
//!    Loads `hostfxr.dll` (`libhostfxr.so` / `libhostfxr.dylib`) directly in-process via `windows-sys`,
//!    initializes `.runtimeconfig.json` contexts (`Success` / `Success_HostAlreadyInitialized` /
//!    `Success_DifferentRuntimeProperties`), resolves `hdt_load_assembly_and_get_function_pointer`,
//!    and binds `[UnmanagedCallersOnly]` C-ABI entry points (`UNMANAGEDCALLERSONLY_METHOD`) with
//!    zero GC handle pinning or Node-API boxing.
//! 2. **Pure-Rust `NodeApi.Generator` Replacement (`bindgen.rs`)**:
//!    Parses C# source files (`[JSExport]`, `[UnmanagedCallersOnly]`, `public static` / `public class` /
//!    `struct` / `enum`) via `tree-sitter-c-sharp` (`n2b-polyglot`) and deterministically emits:
//!    - `.g.cs` zero-GC `[UnmanagedCallersOnly(EntryPoint = ...)]` C-ABI wrappers + UTF-8 JSON envelope
//!      & bidirectional JS/Rust callback trampolines (`delegate* unmanaged[Cdecl]<...>`).
//!    - `.rs` safe Rust `#[repr(C)]` + `zerocopy` + `CoreClrHost` bindings.
//!    - `.ts` & `.d.ts` Bun v1.4.4 `bun:ffi` zero-copy module replacing `node-api-dotnet`.

#![forbid(unsafe_op_in_unsafe_fn)]

pub mod bindgen;
pub mod host;

pub use bindgen::{
    CsExportedMethod, CsExportedParam, CsExportedType, DotNetBindgenBundle,
    generate_dotnet_rust_bun_bindings, parse_csharp_jsexports,
};
pub use host::{
    CoreClrHost, DotNetDoctorReport, DotNetInvokeReport, probe_dotnet_environment,
};
