# Chromium Upstream vs Bun Full-Stack Rust Integration Spec

## Overview
This specification details the architectural blueprint for natively integrating the missing Chromium Web Platform APIs directly into the Full-Rust Bun engine (`C:\src\third_party\bun`), moving from preload polyfills to zero-overhead native Rust built-ins.

---

## 1. MIME System Integration (`src/http_types`)
- **Target Files**:
  - `src/http_types/mime_type_list.txt`
  - `src/http_types/MimeType.rs`
  - `src/http_types/mime_type_list.generate.ts`
- **Modifications**:
  1. Append `image/jxl`, `text/wgsl`, `application/vnd.bun.aot`, `audio/opus` to `mime_type_list.txt`.
  2. Execute `bun src/http_types/mime_type_list.generate.ts` to update `mime_type_list_sorted.rs`.
  3. Wire extensions in `MimeType::from_extension` in `MimeType.rs`.

---

## 2. Prioritized Task Scheduling (`scheduler`) in JavaScriptCore
- **Target Files**:
  - `src/bun.js/bindings/webcore/JSScheduler.cpp` / `JSScheduler.h`
  - `src/js/bun/scheduler.ts`
- **Rust Integration**:
  - Utilize `bun_core` event loop priority queues:
    - User-blocking: Microtask queue level 0
    - User-visible: Macrotask queue level 1
    - Background: Idle callback queue level 2
  - Connect with `TaskController` and `TaskSignal` AbortSignal hooks.

---

## 3. Web Locks API (`navigator.locks`)
- **Target Files**:
  - `src/bun.js/bindings/webcore/JSLockManager.cpp`
  - `src/bun.js/modules/WebLocks.zig` / Rust equivalent
- **Rust Integration**:
  - Implement an in-memory lock table per process with:
    - `RwLock<HashMap<String, Vec<LockGrant>>>`
    - Fair FIFO scheduling for `exclusive` and `shared` modes.
    - Support for `ifAvailable` non-blocking trial and `steal` preemption.

---

## 4. CacheStorage API backed by `bun:sqlite`
- **Target Files**:
  - `src/bun.js/api/cache_storage.rs`
- **Rust Integration**:
  - Map `globalThis.caches` directly to Bun's native SQLite C-bindings.
  - Implement streaming body transfer directly from `Blob` / `ArrayBuffer` to SQLite BLOB columns.

---

## 5. RFC 8484 DNS-over-HTTPS (DoH) & HTTPS RR Type 65
- **Target Files**:
  - `src/dns/doh.rs`
  - `src/http/alpn.rs`
- **Rust Integration**:
  - Integrate RFC 8484 wire query generator in `cares_sys` or Bun's Rust network client.
  - Parse Type 65 HTTPS Resource Records during DNS resolution to dynamically populate ALPN (`h3`, `h2`) hints before TCP/QUIC handshake.
